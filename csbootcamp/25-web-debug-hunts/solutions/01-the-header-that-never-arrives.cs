// ─────────────────────────────────────────────────────────────────────────
//  01 · the header that never arrives — SOLUTION          ★★☆ hunt
//  concepts: middleware ordering · response lifecycle
//  run: dotnet run 01-the-header-that-never-arrives.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  **Bug class: writing a response header after the response has started.**
//
//  HTTP sends the header block BEFORE the body. Once the endpoint writes one
//  byte of body, the headers have been flushed and are effectively read-only
//  — assigning to them afterwards is silently dropped.
//
//  The middleware sets its headers AFTER `await next(ctx)`, which is after
//  the endpoint ran and wrote its JSON. So the assignment does nothing.
//
//  The reason this survives review is the health check. `/health` returns
//  `204 No Content` — **no body**, so nothing was flushed, so the headers are
//  still open and the assignment works. The developer tests the health
//  endpoint, sees the header, and ships. Every endpoint that returns data is
//  silently missing it.
//
//  The fix is `Response.OnStarting`: register a callback that runs at the
//  last moment before the headers go out — after the endpoint has run and
//  set the status, before any body bytes leave. That is the only window
//  where both facts are available.
//
//  Note what the timing now measures: **time to first byte**, not total
//  request time, because `OnStarting` fires before the body is written. For
//  a large streamed response those differ a lot, and it is worth knowing
//  which number you are publishing.
//
//  How to recognise it: any `ctx.Response.Headers[...] = ...` that appears
//  after `await next(ctx)`. Same for `ctx.Response.StatusCode` — which is
//  why an exception handler must check `Response.HasStarted` before trying
//  to turn a half-sent 200 into a 500 (module 14/03).
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Diagnostics;

void BuildPipeline(WebApplication app)
{
    app.Use(async (ctx, next) =>
    {
        var clock = Stopwatch.StartNew();
        var requestId = Guid.NewGuid().ToString("N")[..8];

        // Registered NOW, invoked by the server at the last moment BEFORE
        // the header block is flushed — after the endpoint ran, before any
        // body bytes leave. Setting these after `next` is too late: the
        // headers are already on the wire for any response with a body.
        ctx.Response.OnStarting(() =>
        {
            ctx.Response.Headers["X-Request-Id"] = requestId;
            ctx.Response.Headers["Server-Timing"] = $"app;dur={clock.ElapsedMilliseconds}";
            return Task.CompletedTask;
        });

        await next(ctx);
    });

    app.MapGet("/health", () => Results.NoContent());
    app.MapGet("/items", () => new[] { "widget", "gadget" });
    app.MapGet("/items/{id:int}", (int id) => new { id, name = "widget" });
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("the health check gets the headers", async () =>
{
    await using var app = await Web.Serve(BuildPipeline);
    var response = await app.Client.GetAsync("/health");

    Ok(response.Headers.Contains("X-Request-Id"));
});

Test("a JSON list response gets X-Request-Id", async () =>
{
    await using var app = await Web.Serve(BuildPipeline);
    var response = await app.Client.GetAsync("/items");

    Ok(response.Headers.Contains("X-Request-Id"),
       "the header is missing on a response that has a body");
});

Test("a JSON list response gets Server-Timing", async () =>
{
    await using var app = await Web.Serve(BuildPipeline);
    var response = await app.Client.GetAsync("/items");

    Ok(response.Headers.Contains("Server-Timing"));
});

Test("a single-item response gets the headers too", async () =>
{
    await using var app = await Web.Serve(BuildPipeline);
    var response = await app.Client.GetAsync("/items/1");

    Ok(response.Headers.Contains("X-Request-Id"));
});

Test("a 404 gets the headers", async () =>
{
    await using var app = await Web.Serve(BuildPipeline);
    var response = await app.Client.GetAsync("/nope");

    Ok(response.Headers.Contains("X-Request-Id"));
});

Test("the body is still correct", async () =>
{
    await using var app = await Web.Serve(BuildPipeline);
    Eq(await app.GetBody("/items"), "[\"widget\",\"gadget\"]");
});

Test("each request gets a DIFFERENT id", async () =>
{
    await using var app = await Web.Serve(BuildPipeline);

    var first = (await app.Client.GetAsync("/items")).Headers.GetValues("X-Request-Id").First();
    var second = (await app.Client.GetAsync("/items")).Headers.GetValues("X-Request-Id").First();

    Ok(first != second);
});
