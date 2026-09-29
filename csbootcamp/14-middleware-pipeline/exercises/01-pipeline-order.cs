// ─────────────────────────────────────────────────────────────────────────
//  01 · pipeline order                                    ★☆☆ warm-up
//  concepts: app.Use · next() · the onion model
//  run: dotnet run 01-pipeline-order.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  The ASP.NET Core pipeline is an onion, not a queue. Each middleware runs
//  code on the way IN, calls next(), then runs code on the way OUT — so the
//  first one registered is the outermost, and its "after" code runs LAST.
//
//      app.Use(A) ; app.Use(B) ; endpoint
//
//      A-in → B-in → endpoint → B-out → A-out
//
//  That reversal is the single most useful thing to know about middleware,
//  and the source of most ordering bugs: anything that needs to see the
//  final response (timing, logging, compression) has to be registered EARLY,
//  because early means outermost.
//
//  Append to the shared `log` list so the order is visible, and build a
//  pipeline whose trace is exactly:
//
//      ["a-in", "b-in", "handler", "b-out", "a-out"]
//
//  hint: `await next(ctx)` in the middle; whatever you write after it runs
//        on the way back out
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Register two middlewares ("a" and "b") and a GET / handler, each appending
// its own marks to `log` as described above.
void BuildPipeline(WebApplication app, List<string> log)
{
    throw new NotImplementedException();
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
