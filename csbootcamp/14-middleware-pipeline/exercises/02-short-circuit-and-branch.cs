// ─────────────────────────────────────────────────────────────────────────
//  02 · short-circuiting and branching                    ★★☆ core
//  concepts: not calling next · UseWhen · MapWhen · Run
//  run: dotnet run 02-short-circuit-and-branch.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A middleware that does NOT call next() ends the request there. That is
//  how auth, rate limiting and maintenance modes work — and it is the whole
//  mechanism, there is nothing else to it.
//
//  Three ways to branch:
//
//      app.Use      always runs; you decide whether to call next
//      app.UseWhen  runs a sub-pipeline when a predicate matches, then
//                   REJOINS the main pipeline
//      app.MapWhen  runs a sub-pipeline when a predicate matches and never
//                   rejoins — the branch is terminal
//
//  Build a pipeline that:
//    · returns 503 with body "maintenance" for ANY path while `underMaintenance`
//      is true, without reaching the handler
//    · otherwise adds an "X-Traced: yes" header for paths starting /api
//      (via UseWhen — the request must still reach its endpoint)
//    · serves GET /api/items → "items" and GET /health → "healthy"
//
//  hint: to write a body and stop, set ctx.Response.StatusCode then
//        `await ctx.Response.WriteAsync(...)` and simply do not call next
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// `underMaintenance` is read per request, so a test can flip it after the
// server is already running.
void BuildPipeline(WebApplication app, Func<bool> underMaintenance)
{
    throw new NotImplementedException();
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
    // The branch added a header AND the handler produced its body.
    Eq(await app.GetBody("/api/items"), "items");
});
