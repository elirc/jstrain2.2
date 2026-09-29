// ─────────────────────────────────────────────────────────────────────────
//  03 · [ApiController] conventions                       ★★☆ core
//  concepts: automatic 400 · ModelState · ProblemDetails
//  run: dotnet run 03-apicontroller-conventions.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `[ApiController]` is not decoration. It switches on a set of behaviours
//  that change how the action is called and what happens when input is bad:
//
//    · complex parameters are inferred as [FromBody] without the attribute
//    · DataAnnotations validation runs BEFORE your action
//    · if validation fails, a 400 with an RFC 7807 ProblemDetails body is
//      returned and YOUR ACTION NEVER RUNS
//    · attribute routing becomes required (no conventional routes)
//
//  That third point is the one to internalise: with [ApiController] you do
//  not write `if (!ModelState.IsValid) return BadRequest(ModelState);` — it
//  already happened. Without it, that check is mandatory and forgetting it
//  means invalid data reaches your database.
//
//  Two controllers are provided so you can compare. Implement both Create
//  actions:
//
//      StrictController   has [ApiController] → validation is automatic
//      LooseController    has none            → you must check ModelState
//
//  Both must return "ok" on success, and 400 on invalid input.
//
//  hint: in the loose one, `ModelState.IsValid` is false when annotations
//        failed; `ValidationProblem()` renders the same body the strict one
//        produces automatically
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System.ComponentModel.DataAnnotations;

void AddServices(WebApplicationBuilder builder) => builder.Services.AddControllers();
void MapRoutes(WebApplication app) => app.MapControllers();

// ──────────────────────────── tests ──────────────────────────────────────

Test("valid input reaches the strict action", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await app.PostJson("/api/strict", new { name = "ada", age = 36 });

    Eq((int)response.StatusCode, 200);
    Eq(await response.Content.ReadAsStringAsync(), "ok");
});

Test("[ApiController] rejects invalid input with 400 automatically", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await app.PostJson("/api/strict", new { name = "", age = 36 });

    Eq((int)response.StatusCode, 400);
});

Test("the automatic 400 body is RFC 7807 ProblemDetails", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await app.PostJson("/api/strict", new { name = "", age = 36 });
    var body = await response.Content.ReadAsStringAsync();

    Ok(body.Contains("\"errors\""));
    Ok(body.Contains("Name"));
    Eq(response.Content.Headers.ContentType?.MediaType, "application/problem+json");
});

Test("range violations are caught too", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await app.PostJson("/api/strict", new { name = "ada", age = 999 });

    Eq((int)response.StatusCode, 400);
});

Test("the loose controller must check ModelState itself", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await app.PostJson("/api/loose", new { name = "", age = 36 });

    // Same outcome — but only because the action checked.
    Eq((int)response.StatusCode, 400);
});

Test("the loose controller still accepts valid input", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await app.PostJson("/api/loose", new { name = "ada", age = 36 });

    Eq((int)response.StatusCode, 200);
    Eq(await response.Content.ReadAsStringAsync(), "ok");
});

// ──────────────────────────── types ──────────────────────────────────────

public class Person
{
    [Required]
    [MinLength(2)]
    public string Name { get; set; } = "";

    [Range(0, 130)]
    public int Age { get; set; }
}

[ApiController]
[Route("api/strict")]
public class StrictController : ControllerBase
{
    // Validation already ran. If it failed, you are not here.
    [HttpPost]
    public ActionResult<string> Create(Person person) => throw new NotImplementedException();
}

[Route("api/loose")]
public class LooseController : ControllerBase
{
    // No [ApiController]: the body source and the validation check are
    // both your job.
    [HttpPost]
    public ActionResult<string> Create([FromBody] Person person)
        => throw new NotImplementedException();
}
