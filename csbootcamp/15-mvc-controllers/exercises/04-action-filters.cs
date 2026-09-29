// ─────────────────────────────────────────────────────────────────────────
//  04 · action filters                                    ★★☆ core
//  concepts: IAsyncActionFilter · short-circuit · filter order
//  run: dotnet run 04-action-filters.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A filter is middleware that knows about MVC. Where middleware sees a raw
//  HttpContext, a filter sees the ACTION: which one is about to run, its
//  bound arguments, and the result it produced. That is what makes filters
//  the right place for cross-cutting concerns that need those facts —
//  auditing which action ran, validating a bound argument, caching a result.
//
//      public async Task OnActionExecutionAsync(
//          ActionExecutingContext ctx, ActionExecutionDelegate next)
//      {
//          // before: ctx.ActionArguments holds the bound parameters
//          var executed = await next();          // runs the action
//          // after: executed.Result holds what it returned
//      }
//
//  Setting `ctx.Result` BEFORE calling next() short-circuits: the action
//  never runs. Not calling next() at all does the same.
//
//  Build two filters:
//
//    · AuditFilter    appends "<ActionName>:in" and "<ActionName>:out" to a
//                     shared log, around every action
//    · RejectZeroFilter  if a bound argument named "id" is 0, short-circuit
//                     with BadRequest and DO NOT run the action
//
//  hint: ctx.ActionDescriptor.RouteValues["action"] is the action's name;
//        ctx.ActionArguments is a dictionary of the bound parameters
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

// The log every AuditFilter instance writes to, registered in DI.
var log = new List<string>();

void AddServices(WebApplicationBuilder builder)
{
    builder.Services.AddSingleton(log);
    // [ServiceFilter] resolves the filter from DI, so it must be registered.
    builder.Services.AddScoped<AuditFilter>();
    builder.Services.AddScoped<RejectZeroFilter>();
    builder.Services.AddControllers();
}

void MapRoutes(WebApplication app) => app.MapControllers();

// ──────────────────────────── tests ──────────────────────────────────────

Test("the action runs normally with filters attached", async () =>
{
    log.Clear();
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetBody("/api/widgets/5"), "widget 5");
});

Test("the audit filter records entry and exit around the action", async () =>
{
    log.Clear();
    await using var app = await Web.Serve(AddServices, MapRoutes);
    await app.GetBody("/api/widgets/5");

    // The action body ran between the filter's two halves.
    Eq(log, new[] { "Get:in", "Get:body", "Get:out" });
});

Test("a rejected argument short-circuits with 400", async () =>
{
    log.Clear();
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetStatus("/api/widgets/0"), 400);
});

Test("a short-circuited action never runs", async () =>
{
    log.Clear();
    await using var app = await Web.Serve(AddServices, MapRoutes);
    await app.GetStatus("/api/widgets/0");

    // The audit filter still wrapped the call, but the body was skipped.
    Ok(!log.Contains("Get:body"));
});

Test("the outer filter still sees the short-circuited request", async () =>
{
    log.Clear();
    await using var app = await Web.Serve(AddServices, MapRoutes);
    await app.GetStatus("/api/widgets/0");

    Eq(log, new[] { "Get:in", "Get:out" });
});

Test("filters apply per action, so the unfiltered action is untouched", async () =>
{
    log.Clear();
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetBody("/api/widgets/plain"), "plain");
    Eq(log, Array.Empty<string>());
});

// ──────────────────────────── types ──────────────────────────────────────

public class AuditFilter(List<string> log) : IAsyncActionFilter
{
    public Task OnActionExecutionAsync(ActionExecutingContext context,
                                       ActionExecutionDelegate next)
        => throw new NotImplementedException();
}

public class RejectZeroFilter : IAsyncActionFilter
{
    public Task OnActionExecutionAsync(ActionExecutingContext context,
                                       ActionExecutionDelegate next)
        => throw new NotImplementedException();
}

[ApiController]
[Route("api/widgets")]
public class WidgetsController(List<string> log) : ControllerBase
{
    // AuditFilter is registered first, so it is the OUTER of the two.
    [HttpGet("{id:int}")]
    [ServiceFilter(typeof(AuditFilter), Order = 1)]
    [ServiceFilter(typeof(RejectZeroFilter), Order = 2)]
    public ActionResult<string> Get(int id)
    {
        log.Add("Get:body");
        return $"widget {id}";
    }

    [HttpGet("plain")]
    public ActionResult<string> Plain() => "plain";
}
