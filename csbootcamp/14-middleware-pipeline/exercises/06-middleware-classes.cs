// ─────────────────────────────────────────────────────────────────────────
//  06 · middleware classes                                ★★☆ core
//  concepts: conventional middleware · UseMiddleware · DI in Invoke
//  run: dotnet run 06-middleware-classes.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Inline lambdas stop scaling around the third middleware. The conventional
//  form is a class:
//
//      public class ThingMiddleware(RequestDelegate next) {
//          public async Task InvokeAsync(HttpContext ctx) {
//              …
//              await next(ctx);
//          }
//      }
//      app.UseMiddleware<ThingMiddleware>();
//
//  Two rules that surprise people, and both are consequences of the same
//  fact — the class is constructed ONCE, at startup, and reused for every
//  request:
//
//    1. Constructor injection gets you SINGLETON services only. Injecting a
//       scoped service there captures one request's instance forever.
//    2. Scoped services are injected as extra parameters on InvokeAsync,
//       which IS per-request. That is where a DbContext belongs.
//
//  Build a rate limiter as a class: at most `max` requests per client ip,
//  returning 429 beyond that. Take the limit from constructor options and
//  the per-request counter service from InvokeAsync.
//
//  hint: `UseMiddleware<T>(args)` passes extra constructor arguments after
//        the RequestDelegate
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;

void AddServices(WebApplicationBuilder builder)
{
    builder.Services.AddSingleton<RequestCounter>();
}

// Register RateLimitMiddleware with a limit of 3, then GET / → "ok".
void BuildPipeline(WebApplication app)
{
    throw new NotImplementedException();
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

    // 5 requests were counted even though the middleware object is reused.
    Eq(await app.GetStatus("/"), 429);
});

// ──────────────────────────── types ──────────────────────────────────────

// Shared, thread-safe request tally. Registered as a singleton.
sealed class RequestCounter
{
    private readonly Dictionary<string, int> _counts = [];

    public int Increment(string key)
    {
        lock (_counts)
        {
            _counts.TryGetValue(key, out var current);
            return _counts[key] = current + 1;
        }
    }
}

// Constructed ONCE at startup. `next` and `max` are constructor state;
// the per-request service arrives on InvokeAsync.
sealed class RateLimitMiddleware(RequestDelegate next, int max)
{
    public async Task InvokeAsync(HttpContext ctx, RequestCounter counter)
    {
        throw new NotImplementedException();
    }
}
