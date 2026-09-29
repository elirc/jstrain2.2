// ─────────────────────────────────────────────────────────────────────────
//  02 · binding sources — SOLUTION                        ★★☆ core
//  concepts: [FromRoute] [FromQuery] [FromBody] [FromHeader] [FromForm]
//  run: dotnet run 02-binding-sources.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The bodies are one-liners; the attributes are the content.
//
//  `Monthly` needs no attributes at all: `year` and `month` match route
//  placeholders, and `format` matches nothing so it falls through to the
//  query string, defaulting when absent. Inference handles the common case,
//  which is why most controller actions carry no binding attributes.
//
//  `Tenant` needs `[FromHeader(Name = "X-Tenant")]` because HTTP header
//  names are not valid C# identifiers — you cannot write a parameter called
//  `X-Tenant`. Whenever the wire name and the code name differ, the
//  attribute is how you bridge them.
//
//  The 400 on a missing header comes from `[ApiController]`, not from your
//  code. That attribute makes binding failures automatic 400s with a
//  ProblemDetails body; without it, `tenant` would arrive null and you would
//  be checking by hand in every action. Exercise 03 goes into what else it
//  turns on.
//
//  `[FromBody]` may appear at most once per action, and that is a startup
//  error rather than a runtime one — a body is a single forward-only stream,
//  so it cannot be deserialised twice. If you need two things from a body,
//  they belong in one DTO.
//
//  `[FromForm]` matters because form posts are a completely different wire
//  format from JSON. Note that mixing `[FromForm]` and `[FromBody]` in one
//  action is likewise impossible, for the same one-stream reason.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

void AddServices(WebApplicationBuilder builder) => builder.Services.AddControllers();
void MapRoutes(WebApplication app) => app.MapControllers();

// ──────────────────────────── tests ──────────────────────────────────────

Test("route and query bind together", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetBody("/api/reports/2026/03?format=csv"), "2026-03:csv");
});

Test("an omitted query parameter falls back to its default", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetBody("/api/reports/2026/03"), "2026-03:json");
});

Test("a header binds by its wire name, not the parameter name", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);

    var request = new HttpRequestMessage(HttpMethod.Get, "/api/reports/tenant");
    request.Headers.Add("X-Tenant", "acme");
    var response = await app.Send(request);

    Eq(await response.Content.ReadAsStringAsync(), "acme");
});

Test("a missing required header is a 400", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetStatus("/api/reports/tenant"), 400);
});

Test("a JSON body binds to a record", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await app.PostJson("/api/reports", new { name = "Q1" });

    Eq((int)response.StatusCode, 200);
    Eq(await response.Content.ReadAsStringAsync(), "created Q1");
});

Test("a form field binds with [FromForm]", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await app.PostForm("/api/reports/form", ("name", "Q2"));

    Eq(await response.Content.ReadAsStringAsync(), "form Q2");
});

// ──────────────────────────── types ──────────────────────────────────────

public record CreateReport(string Name);

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    // No attributes needed: year/month match the template, format falls
    // through to the query string.
    [HttpGet("{year:int}/{month}")]
    public ActionResult<string> Monthly(int year, string month, string format = "json")
        => $"{year}-{month}:{format}";

    // The wire name isn't a legal identifier, so it must be spelled out.
    [HttpGet("tenant")]
    public ActionResult<string> Tenant([FromHeader(Name = "X-Tenant")] string tenant)
        => tenant;

    [HttpPost]
    public ActionResult<string> Create([FromBody] CreateReport input)
        => $"created {input.Name}";

    [HttpPost("form")]
    public ActionResult<string> CreateFromForm([FromForm] string name)
        => $"form {name}";
}
