// ─────────────────────────────────────────────────────────────────────────
//  04 · timing and OnStarting — SOLUTION                  ★★★ stretch
//  concepts: Response.OnStarting · headers vs body ordering
//  run: dotnet run 04-timing-and-onstarting.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `OnStarting` is the answer to "I need to set a header based on something
//  I only learn late". The callback is registered on the way IN, and the
//  server invokes it immediately before flushing the header block — after
//  the endpoint has run and set the status code, but before any body bytes
//  leave. That is the only window where both facts are available.
//
//  Writing `ctx.Response.Headers[...] = ...` after `await next(ctx)` instead
//  is the bug this exercise exists to inoculate against. It looks right, and
//  it works in exactly one case — when the handler wrote no body at all —
//  so it passes a casual smoke test and then silently drops the header in
//  production, where responses have bodies.
//
//  The 404 test matters because no endpoint ran at all. Middleware sits
//  outside routing, so it still sees the request and the generated response;
//  anything you attach at the endpoint level (an endpoint filter, module 13)
//  would not have fired.
//
//  The duration measured is time-to-first-byte, not total time, because
//  OnStarting fires before the body is written. For a big streamed response
//  those differ a lot — worth knowing which number you are reporting.
//
//  The slow/fast assertion compares the two rather than checking against a
//  fixed millisecond threshold. Wall-clock assertions on a shared CI machine
//  are how you get a test suite nobody trusts.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Diagnostics;
using System.Globalization;

void BuildPipeline(WebApplication app, List<int> completed)
{
    app.Use(async (ctx, next) =>
    {
        var stopwatch = Stopwatch.StartNew();

        // Registered NOW, invoked by the server just before the headers go
        // out — which is after the endpoint ran and before any body bytes.
        ctx.Response.OnStarting(() =>
        {
            var ms = stopwatch.Elapsed.TotalMilliseconds;
            ctx.Response.Headers["Server-Timing"] =
                "app;dur=" + ms.ToString("F2", CultureInfo.InvariantCulture);
            ctx.Response.Headers["X-Handled"] = "yes";
            return Task.CompletedTask;
        });

        await next(ctx);

        // Runs after the response is done — fine for counters and logging,
        // useless for headers.
        completed.Add(ctx.Response.StatusCode);
    });

    app.MapGet("/fast", () => "fast");
    app.MapGet("/slow", async () =>
    {
        await Task.Delay(30);
        return "slow";
    });
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
    => double.Parse(header.Split("dur=")[1], CultureInfo.InvariantCulture);
