// ─────────────────────────────────────────────────────────────────────────
//  04 · action filters — SOLUTION                         ★★☆ core
//  concepts: IAsyncActionFilter · short-circuit · filter order
//  run: dotnet run 04-action-filters.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `OnActionExecutionAsync` has the same in/next/out shape as middleware,
//  and the same rule: everything before `await next()` runs on the way in,
//  everything after on the way out. What differs is the context object —
//  you get the action's name and its BOUND ARGUMENTS, which raw middleware
//  cannot see because binding has not happened yet at that layer.
//
//  RejectZeroFilter short-circuits by assigning `context.Result` and simply
//  returning. Assigning the Result is what tells MVC "this is the response";
//  the action is skipped and the result is executed as if the action had
//  returned it. Note it must not call `next()` afterwards — doing both runs
//  the action anyway and then throws when two results compete.
//
//  The two ordering tests are the payoff. Even when the inner filter
//  short-circuits, `Get:in` and `Get:out` both appear: AuditFilter's
//  `await next()` still returns normally, carrying the short-circuited
//  result. Filters nest like middleware, so an outer filter always gets its
//  outbound half — which is exactly why logging and auditing belong in the
//  outermost filter, where nothing can skip them.
//
//  `Order` makes the nesting explicit. Filters with the same Order fall back
//  to scope precedence (global → controller → action), which is fine until
//  someone adds a third filter and the behaviour quietly changes. Spelling
//  it out costs nothing.
//
//  `[ServiceFilter]` resolves the filter FROM DI, which is what lets
//  AuditFilter take a constructor dependency. Plain `[TypeFilter]` or a
//  bare attribute filter cannot — a filter that needs services almost always
//  wants ServiceFilter.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

var log = new List<string>();

void AddServices(WebApplicationBuilder builder)
{
    builder.Services.AddSingleton(log);
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
    public async Task OnActionExecutionAsync(ActionExecutingContext context,
                                             ActionExecutionDelegate next)
    {
        var action = context.ActionDescriptor.RouteValues["action"];

        log.Add($"{action}:in");
        await next();                    // runs the inner filters + action
        log.Add($"{action}:out");        // reached even on a short-circuit
    }
}

public class RejectZeroFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context,
                                             ActionExecutionDelegate next)
    {
        if (context.ActionArguments.TryGetValue("id", out var value) && value is 0)
        {
            // Assigning Result IS the short-circuit. Do not call next().
            context.Result = new BadRequestResult();
            return;
        }

        await next();
    }
}

[ApiController]
[Route("api/widgets")]
public class WidgetsController(List<string> log) : ControllerBase
{
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
