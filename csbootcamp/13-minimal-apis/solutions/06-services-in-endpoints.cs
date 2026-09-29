// ─────────────────────────────────────────────────────────────────────────
//  06 · services in endpoints — SOLUTION                  ★★☆ core
//  concepts: DI registration · singleton vs scoped · injected handlers
//  run: dotnet run 06-services-in-endpoints.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Registration is three lines and the whole lesson is in the results.
//
//  The singleton counts 1, 2, 3 across requests because there is exactly one
//  instance for the app's lifetime. That is fine for a stateless helper or a
//  cache — and catastrophic for anything holding per-user state, which is the
//  bug this exercise is really vaccinating against. If `SingletonCounter`
//  held a "current user", every request would see the last one's.
//
//  The scoped service answers 1 every time because each request gets a fresh
//  DI scope, and the instance dies with it. That is why `DbContext` is
//  scoped: it is a unit of work for one request, holding change tracking
//  that must not leak into the next.
//
//  `/twice` is the test that distinguishes scoped from transient, and it is
//  the one worth remembering. Resolving `ScopedCounter` twice in a single
//  request returns the SAME object, so the counter reads 1 then 2. Resolve a
//  transient twice and you would get 1 and 1 — two objects. "Per request" and
//  "per resolution" only look alike until you ask twice.
//
//  The endpoint parameters are not annotated. ASP.NET Core knows
//  `SingletonCounter` is a service and not a query parameter because it is
//  registered in the container; had it not been registered, the framework
//  would have tried to bind it from the request and failed at startup. That
//  failure is a feature: it catches a missing registration at boot rather
//  than on the first request in production.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

void AddServices(WebApplicationBuilder builder)
{
    builder.Services.AddSingleton<SingletonCounter>();
    builder.Services.AddScoped<ScopedCounter>();
    builder.Services.AddTransient<TransientCounter>();
}

void MapRoutes(WebApplication app)
{
    app.MapGet("/singleton", (SingletonCounter c) => c.Next().ToString());
    app.MapGet("/scoped", (ScopedCounter c) => c.Next().ToString());
    app.MapGet("/transient", (TransientCounter c) => c.Next().ToString());

    // Resolve a SECOND instance from the same request scope. Because the
    // registration is scoped, this is the very same object as `first`.
    app.MapGet("/twice", (ScopedCounter first, HttpContext ctx) =>
    {
        var again = ctx.RequestServices.GetRequiredService<ScopedCounter>();
        return $"{first.Next()},{again.Next()}";
    });
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a singleton keeps counting across requests", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetBody("/singleton"), "1");
    Eq(await app.GetBody("/singleton"), "2");
    Eq(await app.GetBody("/singleton"), "3");
});

Test("a scoped service is fresh for each request", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetBody("/scoped"), "1");
    Eq(await app.GetBody("/scoped"), "1");
});

Test("a transient service is fresh every resolution", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetBody("/transient"), "1");
    Eq(await app.GetBody("/transient"), "1");
});

Test("two resolutions of a scoped service in ONE request are the same object", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetBody("/twice"), "1,2");
});

Test("the singleton and the scoped service are different objects", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    await app.GetBody("/singleton");
    await app.GetBody("/singleton");
    Eq(await app.GetBody("/scoped"), "1");
});

// ──────────────────────────── types ──────────────────────────────────────

sealed class SingletonCounter : Counter;
sealed class ScopedCounter : Counter;
sealed class TransientCounter : Counter;

abstract class Counter
{
    private int _count;
    public int Next() => ++_count;
}
