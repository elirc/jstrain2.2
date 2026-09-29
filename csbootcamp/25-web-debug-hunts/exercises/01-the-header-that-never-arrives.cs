// ─────────────────────────────────────────────────────────────────────────
//  01 · the header that never arrives                     ★★☆ hunt
//  concepts: middleware ordering · response lifecycle
//  run: dotnet run 01-the-header-that-never-arrives.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  THIS FILE SHIPS BROKEN. The tests are red on the first run, by design.
//
//  Timing middleware should stamp every response with `Server-Timing` and
//  `X-Request-Id`. It works perfectly on the health check and never appears
//  on any endpoint that returns data — which is, of course, all of them.
//
//  Nothing throws. Nothing is logged. The header is simply absent.
//
//  Find the bug and make the smallest fix.
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

        await next(ctx);

        ctx.Response.Headers["X-Request-Id"] = requestId;
        ctx.Response.Headers["Server-Timing"] = $"app;dur={clock.ElapsedMilliseconds}";
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
