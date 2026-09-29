// ─────────────────────────────────────────────────────────────────────────
//  03 · [ApiController] conventions — SOLUTION            ★★☆ core
//  concepts: automatic 400 · ModelState · ProblemDetails
//  run: dotnet run 03-apicontroller-conventions.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  StrictController's body is `=> "ok";` and that is the entire point. With
//  `[ApiController]`, the model has already been validated by a filter that
//  runs before the action. If the annotations failed, the pipeline
//  short-circuited with a 400 and the method was never entered — so there is
//  nothing to check and no defensive code to write.
//
//  LooseController shows the cost of leaving the attribute off. `[FromBody]`
//  has to be explicit, and `ModelState.IsValid` has to be tested by hand.
//  Forget that `if` and the action runs with `Name = ""` and `Age = 999`,
//  because DataAnnotations only RECORD failures in ModelState — they never
//  stop anything on their own. That is the bug: validation attributes that
//  look like they are protecting you while nothing enforces them.
//
//  `ValidationProblem()` renders the same RFC 7807 body that
//  `[ApiController]` generates automatically: content type
//  `application/problem+json`, and an `errors` object keyed by property
//  name. Matching that shape matters — one error format across an API means
//  clients write one error handler.
//
//  Worth knowing you can turn the automatic 400 off
//  (`SuppressModelStateInvalidFilter = true`) when you want to customise the
//  response, and that doing so silently returns you to the loose controller's
//  obligations.
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
    // Invalid input never reaches this line — the filter already 400'd.
    [HttpPost]
    public ActionResult<string> Create(Person person) => "ok";
}

[Route("api/loose")]
public class LooseController : ControllerBase
{
    [HttpPost]
    public ActionResult<string> Create([FromBody] Person person)
    {
        // Annotations only RECORD failures; without this check the action
        // would happily proceed with Name = "".
        if (!ModelState.IsValid) return ValidationProblem();
        return "ok";
    }
}
