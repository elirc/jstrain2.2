// ─────────────────────────────────────────────────────────────────────────
//  04 · validation over HTTP — SOLUTION                   ★★★ stretch
//  concepts: endpoint filters · ValidationProblemDetails · error shape
//  run: dotnet run 04-validation-over-http.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The last test is the one to sit with. `/raw` has the same `CreateUser`
//  parameter, the same attributes, and accepts `email: "nope"` with a **200**.
//  Minimal APIs do not validate anything. `[Required]` on a minimal-API DTO
//  is a comment until something runs `Validator` over it — which is exactly
//  the trap module 15/03 showed from the other direction, where removing
//  `[ApiController]` silently disabled validation for controllers.
//
//  The filter is the fix, and writing it generically (`ValidationFilter<T>`)
//  means one implementation covers every DTO. `context.Arguments` holds the
//  already-bound parameters, so the filter can find the `T` without knowing
//  the handler's signature.
//
//  Two details make it behave like the framework:
//
//    · **`validateAllProperties: true`** — otherwise only `[Required]` runs
//      and `[EmailAddress]` / `[Range]` are skipped (exercise 01).
//    · **Group errors by member name into `Dictionary<string, string[]>`**
//      and hand that to `Results.ValidationProblem`. That produces the exact
//      `ValidationProblemDetails` shape — `application/problem+json`, a
//      `title`, a `status`, and an `errors` object keyed by property — that
//      `[ApiController]` produces automatically. One error shape across your
//      whole API means clients write one error handler; two shapes means
//      every consumer has a bug waiting.
//
//  Short-circuiting is the same mechanism as module 13/05: **return without
//  awaiting `next`** and the handler never runs. The "never reaches the
//  endpoint" test checks that rather than trusting the status code.
//
//  Note `[property: Required]` on the record parameters. Without the
//  `property:` target the attribute lands on the constructor *parameter*,
//  where `Validator` cannot see it — a silent no-op that looks completely
//  correct. It is one of the sharper edges of using positional records as
//  DTOs.
//
//  In a real app, `Microsoft.AspNetCore.Http.Validation` (.NET 10) can wire
//  much of this up for you with `AddValidation()`. This is the mechanism
//  underneath, and it is worth having built once.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.ComponentModel.DataAnnotations;

void MapRoutes(WebApplication app)
{
    var users = app.MapGroup("/users");
    users.AddEndpointFilter<ValidationFilter<CreateUser>>();

    users.MapPost("/", (CreateUser input) => Results.Created($"/users/{input.Email}", input));
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a valid body reaches the endpoint", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.PostJson("/users",
        new { email = "ada@example.com", displayName = "Ada", age = 36 });

    Eq((int)response.StatusCode, 201);
});

Test("an invalid body is rejected with 400", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.PostJson("/users",
        new { email = "nope", displayName = "Ada", age = 36 });

    Eq((int)response.StatusCode, 400);
});

Test("the error body is problem+json", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.PostJson("/users",
        new { email = "nope", displayName = "Ada", age = 36 });

    Eq(response.Content.Headers.ContentType?.MediaType, "application/problem+json");
});

Test("errors are keyed by property name", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.PostJson("/users",
        new { email = "nope", displayName = "Ada", age = 36 });
    var body = await response.Content.ReadAsStringAsync();

    Ok(body.Contains("\"errors\""));
    Ok(body.Contains("\"Email\""));
    Ok(body.Contains("Email must be a valid address"));
});

Test("every failing field is reported, not just the first", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.PostJson("/users",
        new { email = "nope", displayName = "", age = 200 });
    var body = await response.Content.ReadAsStringAsync();

    Ok(body.Contains("\"Email\""));
    Ok(body.Contains("\"DisplayName\""));
    Ok(body.Contains("\"Age\""));
});

Test("a rejected request never reaches the endpoint", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.PostJson("/users",
        new { email = "nope", displayName = "Ada", age = 36 });

    Ok(!(await response.Content.ReadAsStringAsync()).Contains("Created"));
});

Test("the filter covers endpoints added after it", async () =>
{
    await using var app = await Web.Serve(app =>
    {
        var users = app.MapGroup("/users");
        users.AddEndpointFilter<ValidationFilter<CreateUser>>();
        users.MapPost("/", (CreateUser input) => Results.Ok(input));
        users.MapPost("/bulk", (CreateUser input) => Results.Ok(input));
    });

    Eq((int)(await app.PostJson("/users/bulk",
        new { email = "nope", displayName = "Ada", age = 36 })).StatusCode, 400);
});

Test("an endpoint outside the group is unaffected", async () =>
{
    await using var app = await Web.Serve(app =>
    {
        var users = app.MapGroup("/users");
        users.AddEndpointFilter<ValidationFilter<CreateUser>>();
        users.MapPost("/", (CreateUser input) => Results.Ok(input));

        app.MapPost("/raw", (CreateUser input) => Results.Ok("unvalidated"));
    });

    Eq((int)(await app.PostJson("/raw",
        new { email = "nope", displayName = "", age = 200 })).StatusCode, 200);
});

// ──────────────────────────── types ──────────────────────────────────────

// `property:` is mandatory — without it the attribute lands on the
// constructor parameter, where Validator cannot see it.
public record CreateUser(
    [property: Required, EmailAddress(ErrorMessage = "Email must be a valid address")]
    string Email,

    [property: Required, MinLength(1)]
    string DisplayName,

    [property: Range(13, 130)]
    int Age);

public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        // The arguments are already bound by the time a filter runs.
        var model = context.Arguments.OfType<T>().FirstOrDefault();
        if (model is null) return await next(context);

        var results = new List<ValidationResult>();
        Validator.TryValidateObject(
            model, new ValidationContext(model), results, validateAllProperties: true);

        if (results.Count == 0) return await next(context);

        // Group by field so one property with two broken rules reports both.
        var errors = results
            .SelectMany(r => r.MemberNames.DefaultIfEmpty(""),
                        (r, member) => (Member: member, r.ErrorMessage))
            .GroupBy(e => e.Member)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage ?? "Invalid").ToArray());

        // Short-circuit: no next(), so the handler never runs. This produces
        // the same ValidationProblemDetails shape [ApiController] does.
        return Results.ValidationProblem(errors);
    }
}
