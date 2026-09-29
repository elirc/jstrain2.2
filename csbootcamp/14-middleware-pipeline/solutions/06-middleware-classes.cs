// ─────────────────────────────────────────────────────────────────────────
//  06 · middleware classes — SOLUTION                     ★★☆ core
//  concepts: conventional middleware · UseMiddleware · DI in Invoke
//  run: dotnet run 06-middleware-classes.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `UseMiddleware<RateLimitMiddleware>(3)` constructs the class once, passing
//  the RequestDelegate first and then any extra arguments you supply. The
//  object is then reused for every request for the life of the app.
//
//  That single-construction fact drives the whole design:
//
//    · `next` and `max` are constructor parameters because they never change.
//    · `RequestCounter` arrives as an InvokeAsync PARAMETER, resolved per
//      request from the request's DI scope. Put a scoped service — a
//      DbContext, say — in the constructor instead and you capture the very
//      first request's instance and hand it to every subsequent request,
//      which produces disposed-object exceptions under load and, worse,
//      cross-request data bleed before that. This is one of the top ASP.NET
//      Core production bugs, and the class shape is what makes it avoidable.
//
//  `RequestCounter` here is a singleton, so it needs a lock: middleware runs
//  concurrently on many threads, and `Dictionary` is not thread-safe. Two
//  requests incrementing at once without the lock can lose an increment or
//  corrupt the internal buckets. (`ConcurrentDictionary` with `AddOrUpdate`
//  is the idiomatic alternative.) Anything you register as a singleton has
//  to be thread-safe — that is the price of the lifetime.
//
//  The limiter short-circuits by writing and not calling next, which is the
//  same mechanism as exercise 02, just wearing a class.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;

void AddServices(WebApplicationBuilder builder)
{
    builder.Services.AddSingleton<RequestCounter>();
}

void BuildPipeline(WebApplication app)
{
    // The 3 is passed to the constructor after the RequestDelegate.
    app.UseMiddleware<RateLimitMiddleware>(3);
    app.MapGet("/", () => "ok");
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("requests under the limit pass through", async () =>
{
    await using var app = await Web.Serve(AddServices, BuildPipeline);
    Eq(await app.GetStatus("/"), 200);
    Eq(await app.GetBody("/"), "ok");
});

Test("the limit allows exactly `max` requests", async () =>
{
    await using var app = await Web.Serve(AddServices, BuildPipeline);
    Eq(await app.GetStatus("/"), 200);
    Eq(await app.GetStatus("/"), 200);
    Eq(await app.GetStatus("/"), 200);
});

Test("the next request over the limit is 429", async () =>
{
    await using var app = await Web.Serve(AddServices, BuildPipeline);
    for (var i = 0; i < 3; i++) await app.GetStatus("/");

    Eq(await app.GetStatus("/"), 429);
});

Test("a rejected request never reaches the handler", async () =>
{
    await using var app = await Web.Serve(AddServices, BuildPipeline);
    for (var i = 0; i < 3; i++) await app.GetStatus("/");

    Eq(await app.GetBody("/"), "rate limited");
});

Test("the counter service is shared across requests, as a singleton must be", async () =>
{
    await using var app = await Web.Serve(AddServices, BuildPipeline);
    for (var i = 0; i < 5; i++) await app.GetStatus("/");

    Eq(await app.GetStatus("/"), 429);
});

// ──────────────────────────── types ──────────────────────────────────────

sealed class RequestCounter
{
    private readonly Dictionary<string, int> _counts = [];

    // A singleton is touched by many threads at once; Dictionary is not
    // thread-safe, so the lock is mandatory, not defensive.
    public int Increment(string key)
    {
        lock (_counts)
        {
            _counts.TryGetValue(key, out var current);
            return _counts[key] = current + 1;
        }
    }
}

sealed class RateLimitMiddleware(RequestDelegate next, int max)
{
    // ctx and `counter` are per REQUEST; `next` and `max` are per APP.
    public async Task InvokeAsync(HttpContext ctx, RequestCounter counter)
    {
        var client = ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        if (counter.Increment(client) > max)
        {
            ctx.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            await ctx.Response.WriteAsync("rate limited");
            return;                          // short-circuit
        }

        await next(ctx);
    }
}
