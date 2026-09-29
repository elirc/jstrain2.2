// ─────────────────────────────────────────────────────────────────────────
//  04 · validation over HTTP                              ★★★ stretch
//  concepts: endpoint filters · ValidationProblemDetails · error shape
//  run: dotnet run 04-validation-over-http.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Controllers get automatic validation from `[ApiController]` (module 15).
//  **Minimal APIs do not.** A record DTO with `[Required]` all over it is
//  deserialised and handed to your endpoint unvalidated — the attributes are
//  documentation until something runs them.
//
//  So you write the filter once and apply it to a group:
//
//      group.AddEndpointFilter<ValidationFilter<CreateUser>>();
//
//  And it must produce the SAME error shape ASP.NET Core produces elsewhere,
//  or clients need two error handlers:
//
//      400, content-type application/problem+json
//      { "title": "One or more validation errors occurred.",
//        "status": 400,
//        "errors": { "Email": ["Email must be a valid address"] } }
//
//  `Results.ValidationProblem(errors)` builds exactly that from a
//  `Dictionary<string, string[]>`.
//
//  Build the filter and wire it up:
//
//      POST /users   valid   → 201
//      POST /users   invalid → 400 + ValidationProblemDetails
//
//  hint: an endpoint filter can read the bound arguments —
//        `context.Arguments.OfType<T>().FirstOrDefault()`
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

    // The 201 body would have echoed the DTO.
    Ok(!(await response.Content.ReadAsStringAsync()).Contains("Created"));
});

Test("the filter covers endpoints added after it", async () =>
{
    await using var app = await Web.Serve(app =>
    {
        var users = app.MapGroup("/users");
        users.AddEndpointFilter<ValidationFilter<CreateUser>>();
        users.MapPost("/", (CreateUser input) => Results.Ok(input));
        users.MapPost("/bulk", (CreateUser input) => Results.Ok(input));   // added later
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

    // Deliberately unguarded — proof that nothing validates by default.
    Eq((int)(await app.PostJson("/raw",
        new { email = "nope", displayName = "", age = 200 })).StatusCode, 200);
});

// ──────────────────────────── types ──────────────────────────────────────

public record CreateUser(
    [property: Required, EmailAddress(ErrorMessage = "Email must be a valid address")]
    string Email,

    [property: Required, MinLength(1)]
    string DisplayName,

    [property: Range(13, 130)]
    int Age);

// Runs DataAnnotations on the bound argument of type T and short-circuits
// with a ValidationProblemDetails 400 if anything fails.
public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context, EndpointFilterDelegate next)
        => throw new NotImplementedException();
}
