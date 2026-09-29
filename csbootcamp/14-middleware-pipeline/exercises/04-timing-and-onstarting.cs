// ─────────────────────────────────────────────────────────────────────────
//  04 · timing and OnStarting                             ★★★ stretch
//  concepts: Response.OnStarting · headers vs body ordering
//  run: dotnet run 04-timing-and-onstarting.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  You want a `Server-Timing` header saying how long the request took. The
//  obvious code does not work:
//
//      var sw = Stopwatch.StartNew();
//      await next(ctx);
//      ctx.Response.Headers["Server-Timing"] = …;   // TOO LATE
//
//  By the time next() returns, the handler has usually written the body,
//  which flushed the headers. Headers are sent BEFORE the body — that is
//  HTTP, not a framework quirk — so once one byte of body is out, the header
//  block is immutable. Assigning to it is silently ignored, or throws.
//
//  The fix is `Response.OnStarting(callback)`: it registers work to run at
//  the last possible moment BEFORE the headers go out. The stopwatch is
//  still running, but you get the duration up to the point the response
//  begins, which is what you actually want to measure.
//
//  Build middleware that:
//    · sets "Server-Timing" to "app;dur=<ms>" on every response
//    · sets "X-Handled: yes" on every response, including 404s
//    · counts completed requests in `completed` AFTER next() returns
//
//  hint: ctx.Response.OnStarting(() => { …; return Task.CompletedTask; })
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Diagnostics;

// Endpoints to add after your middleware:
//   GET /fast  → "fast"
//   GET /slow  → awaits ~30ms, then "slow"
void BuildPipeline(WebApplication app, List<int> completed)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("the timing header is present on a normal response", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, []));
    var response = await app.Client.GetAsync("/fast");

    Ok(response.Headers.Contains("Server-Timing"));
    Ok(response.Headers.GetValues("Server-Timing").First().StartsWith("app;dur="));
});

Test("the body still arrives intact", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, []));
    Eq(await app.GetBody("/fast"), "fast");
});

Test("a slower endpoint reports a larger duration", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, []));

    var fast = await app.Client.GetAsync("/fast");
    var slow = await app.Client.GetAsync("/slow");

    var fastMs = ParseMs(fast.Headers.GetValues("Server-Timing").First());
    var slowMs = ParseMs(slow.Headers.GetValues("Server-Timing").First());

    // Generous: we assert the ordering, never an exact millisecond count.
    Ok(slowMs > fastMs, $"expected slow ({slowMs}) > fast ({fastMs})");
});

Test("headers are added even to a 404, which no endpoint produced", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, []));
    var response = await app.Client.GetAsync("/no-such-path");

    Eq((int)response.StatusCode, 404);
    Eq(response.Headers.GetValues("X-Handled").First(), "yes");
});

Test("the after-next code still runs", async () =>
{
    var completed = new List<int>();
    await using var app = await Web.Serve(a => BuildPipeline(a, completed));

    await app.GetBody("/fast");
    await app.GetBody("/slow");

    Eq(completed.Count, 2);
});

// ──────────────────────────── helpers ────────────────────────────────────

static double ParseMs(string header)
    => double.Parse(header.Split("dur=")[1], System.Globalization.CultureInfo.InvariantCulture);
