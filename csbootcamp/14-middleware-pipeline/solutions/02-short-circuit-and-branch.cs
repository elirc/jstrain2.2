// ─────────────────────────────────────────────────────────────────────────
//  02 · short-circuiting and branching — SOLUTION         ★★☆ core
//  concepts: not calling next · UseWhen · MapWhen · Run
//  run: dotnet run 02-short-circuit-and-branch.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The maintenance gate is registered FIRST, because short-circuiting only
//  works from outside: a middleware can stop what is nested within it, never
//  what wraps it. Registered last, it would run after routing had already
//  chosen an endpoint, and after any middleware that had begun writing.
//
//  Short-circuiting is literally "return without awaiting next(ctx)". There
//  is no Stop() call and no special return value — the request simply
//  unwinds back out through the middlewares that already ran.
//
//  `underMaintenance` is a Func<bool>, not a bool, and the fourth test is
//  why. Capturing a bool would read it once at startup and freeze it;
//  invoking a delegate reads it per request. The same distinction bites with
//  configuration: capture `config["X"]` at startup and you have pinned the
//  value forever, which is what IOptionsMonitor exists to avoid.
//
//  The X-Traced header is set BEFORE `await next(ctx)`, and that is not a
//  style choice. Once any middleware or the endpoint starts writing the
//  body, the response headers have been flushed and are read-only —
//  assigning to them after next() throws or is silently dropped. Anything
//  that must appear in the headers has to be decided on the way IN.
//
//  UseWhen rejoins the main pipeline after its branch, so /api/items still
//  reaches its endpoint. MapWhen would NOT rejoin: the branch would be
//  terminal, the endpoint would never run, and the body would be empty —
//  which is exactly the bug people hit when they reach for the wrong one.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void BuildPipeline(WebApplication app, Func<bool> underMaintenance)
{
    // Outermost: nothing below runs while the flag is set.
    app.Use(async (ctx, next) =>
    {
        if (underMaintenance())          // invoked per request, not captured
        {
            ctx.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            await ctx.Response.WriteAsync("maintenance");
            return;                      // no next() → the request ends here
        }
        await next(ctx);
    });

    // A side branch that rejoins: the endpoint still runs afterwards.
    app.UseWhen(
        ctx => ctx.Request.Path.StartsWithSegments("/api"),
        branch => branch.Use(async (ctx, next) =>
        {
            // Set headers on the way IN — after next() the response has
            // usually started and the headers are read-only.
            ctx.Response.Headers["X-Traced"] = "yes";
            await next(ctx);
        }));

    app.MapGet("/api/items", () => "items");
    app.MapGet("/health", () => "healthy");
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("normal traffic reaches the endpoints", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, () => false));
    Eq(await app.GetBody("/api/items"), "items");
    Eq(await app.GetBody("/health"), "healthy");
});

Test("maintenance mode short-circuits with 503", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, () => true));
    var response = await app.Client.GetAsync("/api/items");

    Eq((int)response.StatusCode, 503);
    Eq(await response.Content.ReadAsStringAsync(), "maintenance");
});

Test("maintenance mode covers every path, mapped or not", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, () => true));
    Eq(await app.GetStatus("/health"), 503);
    Eq(await app.GetStatus("/not-a-route"), 503);
});

Test("the flag is read per request, not captured once at startup", async () =>
{
    var down = false;
    await using var app = await Web.Serve(a => BuildPipeline(a, () => down));

    Eq(await app.GetStatus("/health"), 200);
    down = true;
    Eq(await app.GetStatus("/health"), 503);
});

Test("UseWhen adds the header only on the matching branch", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, () => false));

    var api = await app.Client.GetAsync("/api/items");
    Eq(api.Headers.GetValues("X-Traced").First(), "yes");

    var health = await app.Client.GetAsync("/health");
    Ok(!health.Headers.Contains("X-Traced"));
});

Test("UseWhen rejoins the pipeline, so the endpoint still runs", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, () => false));
    Eq(await app.GetBody("/api/items"), "items");
});
