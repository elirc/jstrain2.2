// ─────────────────────────────────────────────────────────────────────────
//  06 · services in endpoints                             ★★☆ core
//  concepts: DI registration · singleton vs scoped · injected handlers
//  run: dotnet run 06-services-in-endpoints.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Handlers get their dependencies the same way controllers do: declare the
//  parameter, and the DI container supplies it. Anything registered in
//  `builder.Services` is injectable; the framework tells services apart from
//  route/query parameters by whether the type is registered.
//
//  The three lifetimes, and what they mean per HTTP request:
//
//      Singleton  one instance for the whole application
//      Scoped     one instance per request (the default for EF DbContext)
//      Transient  a new instance every time it is asked for
//
//  Getting these wrong is the single most common ASP.NET Core production bug
//  — a singleton that caches per-user state serves one user's data to
//  everyone. Prove the differences here, where it is cheap.
//
//  Register the three counters and wire four endpoints:
//
//      GET /singleton   → the singleton's Next()
//      GET /scoped      → the scoped instance's Next()
//      GET /transient   → the transient instance's Next()
//      GET /twice       → "a,b" from TWO scoped instances resolved in one
//                          request — they must be the SAME object
//
//  hint: `Web.Serve` takes a services callback as its second argument;
//        resolve a second instance with ctx.RequestServices.GetRequiredService
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

void AddServices(WebApplicationBuilder builder)
{
    throw new NotImplementedException();
}

void MapRoutes(WebApplication app)
{
    throw new NotImplementedException();
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
    // Same instance → the counter continues: 1 then 2.
    Eq(await app.GetBody("/twice"), "1,2");
});

Test("the singleton and the scoped service are different objects", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    await app.GetBody("/singleton");
    await app.GetBody("/singleton");
    // The scoped counter is untouched by the singleton's traffic.
    Eq(await app.GetBody("/scoped"), "1");
});

// ──────────────────────────── types ──────────────────────────────────────

// One counter class, registered three times with three lifetimes.
sealed class SingletonCounter : Counter;
sealed class ScopedCounter : Counter;
sealed class TransientCounter : Counter;

abstract class Counter
{
    private int _count;
    public int Next() => ++_count;
}
