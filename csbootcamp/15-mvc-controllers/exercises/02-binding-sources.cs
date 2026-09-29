// ─────────────────────────────────────────────────────────────────────────
//  02 · binding sources                                   ★★☆ core
//  concepts: [FromRoute] [FromQuery] [FromBody] [FromHeader] [FromForm]
//  run: dotnet run 02-binding-sources.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Controllers infer binding sources the same way minimal APIs do, but you
//  can — and sometimes must — say it explicitly:
//
//      [FromRoute]   a {placeholder} in the template
//      [FromQuery]   ?key=value
//      [FromBody]    the request body, deserialised (at most ONE per action)
//      [FromHeader]  a request header
//      [FromForm]    an application/x-www-form-urlencoded field
//      [FromServices] resolved from DI
//
//  You need the attribute when the name differs from the parameter
//  (`[FromHeader(Name = "X-Tenant")] string tenant`), when the inference
//  would guess wrong, or simply to make the contract obvious to a reader.
//
//  Implement the four actions on ReportsController so that:
//
//      GET  /api/reports/2026/03?format=csv     → "2026-03:csv"
//      GET  /api/reports/tenant   X-Tenant: acme → "acme"
//      POST /api/reports          {"name":"Q1"}  → "created Q1"
//      POST /api/reports/form     name=Q2        → "form Q2"
//
//  hint: only one parameter may be [FromBody]; a second one is a startup
//        error, not a runtime one
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
    // → "{year}-{month}:{format}", format defaulting to "json"
    [HttpGet("{year:int}/{month}")]
    public ActionResult<string> Monthly(int year, string month, string format = "json")
        => throw new NotImplementedException();

    // Reads the X-Tenant header into a parameter called `tenant`.
    [HttpGet("tenant")]
    public ActionResult<string> Tenant([FromHeader(Name = "X-Tenant")] string tenant)
        => throw new NotImplementedException();

    // → "created {Name}"
    [HttpPost]
    public ActionResult<string> Create([FromBody] CreateReport input)
        => throw new NotImplementedException();

    // → "form {name}"
    [HttpPost("form")]
    public ActionResult<string> CreateFromForm([FromForm] string name)
        => throw new NotImplementedException();
}
