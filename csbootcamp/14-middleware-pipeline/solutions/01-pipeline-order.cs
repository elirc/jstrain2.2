// ─────────────────────────────────────────────────────────────────────────
//  01 · pipeline order — SOLUTION                         ★☆☆ warm-up
//  concepts: app.Use · next() · the onion model
//  run: dotnet run 01-pipeline-order.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Each `app.Use` gets `(ctx, next)`. Everything before `await next(ctx)`
//  happens on the way in; everything after happens on the way out. The
//  await matters: forget it and the outbound code runs before the rest of
//  the pipeline has finished, which produces timings of zero and logs that
//  report a status code nobody has set yet.
//
//  Registration order is nesting order. "a" is registered first, so it
//  wraps "b", so `a-out` is last. Read it as literal nesting:
//
//      a { b { handler } }
//
//  This is why `UseExceptionHandler` goes at the very top of a real
//  pipeline — only the outermost middleware can catch what the inner ones
//  throw — and why `UseAuthentication` must come before `UseAuthorization`,
//  which must come before the endpoints that depend on them.
//
//  The last test is a reminder that a middleware delegate is registered once
//  but INVOKED per request. Anything you want to keep across requests has to
//  live outside the delegate (here, the captured `log`); anything per-request
//  belongs in a local or in `HttpContext.Items`.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void BuildPipeline(WebApplication app, List<string> log)
{
    // Registered first → outermost → its "out" line runs last.
    app.Use(async (ctx, next) =>
    {
        log.Add("a-in");
        await next(ctx);
        log.Add("a-out");
    });

    app.Use(async (ctx, next) =>
    {
        log.Add("b-in");
        await next(ctx);
        log.Add("b-out");
    });

    app.MapGet("/", () =>
    {
        log.Add("handler");
        return "ok";
    });
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("the handler runs and returns ok", async () =>
{
    var log = new List<string>();
    await using var app = await Web.Serve(a => BuildPipeline(a, log));
    Eq(await app.GetBody("/"), "ok");
});

Test("middleware wraps the handler in registration order", async () =>
{
    var log = new List<string>();
    await using var app = await Web.Serve(a => BuildPipeline(a, log));
    await app.GetBody("/");

    Eq(log, new[] { "a-in", "b-in", "handler", "b-out", "a-out" });
});

Test("the FIRST registered middleware is the outermost", async () =>
{
    var log = new List<string>();
    await using var app = await Web.Serve(a => BuildPipeline(a, log));
    await app.GetBody("/");

    Eq(log[0], "a-in");
    Eq(log[^1], "a-out");
});

Test("the inbound half runs before the handler", async () =>
{
    var log = new List<string>();
    await using var app = await Web.Serve(a => BuildPipeline(a, log));
    await app.GetBody("/");

    Ok(log.IndexOf("b-in") < log.IndexOf("handler"));
});

Test("the outbound half runs after the handler", async () =>
{
    var log = new List<string>();
    await using var app = await Web.Serve(a => BuildPipeline(a, log));
    await app.GetBody("/");

    Ok(log.IndexOf("handler") < log.IndexOf("b-out"));
});

Test("every request walks the whole onion again", async () =>
{
    var log = new List<string>();
    await using var app = await Web.Serve(a => BuildPipeline(a, log));
    await app.GetBody("/");
    await app.GetBody("/");

    Eq(log.Count(e => e == "a-in"), 2);
    Eq(log.Count(e => e == "a-out"), 2);
});
