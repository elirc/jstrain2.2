// ─────────────────────────────────────────────────────────────────────────
//  01 · lifetimes and captive dependencies — SOLUTION      ★★☆ core
//  concepts: singleton/scoped/transient · the captive dependency bug
//  run: dotnet run 01-lifetimes-and-captive-dependencies.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The last two tests are the module. Together they say: **the bug is
//  invisible in Production configuration and obvious in Development one.**
//
//  With `validateScopes: true`, `BuildServiceProvider` walks the graph at
//  startup and refuses to construct a singleton that depends on a scoped
//  service — you get an exception naming both, before a single request is
//  served. That validation is on by default in the Development environment.
//
//  With it off — which is the default in Production — the same graph builds
//  fine. The singleton resolves the scoped `Counter` once, from whichever
//  scope happened to be first, and keeps it forever. The final test shows the
//  consequence: two different scopes, and `b.Count()` returns 2 instead of 1,
//  because both are sharing one captive `Counter`.
//
//  Note the exception type: `ValidateOnBuild` checks the entire graph and
//  reports every fault together, so it throws an `AggregateException` whose
//  inner exceptions name each bad registration. `ValidateScopes` alone would
//  throw a plain `InvalidOperationException`, but only when the service is
//  first resolved — at startup is strictly better.
//
//  Now replace `Counter` with a `DbContext` and "scope" with "HTTP request",
//  and you have the real incident: a singleton service holding one request's
//  DbContext, serving every user, throwing `ObjectDisposedException` under
//  load — or worse, not throwing, and returning one customer's data to
//  another.
//
//  The rules that fall out:
//
//    · a service may depend on its OWN lifetime or LONGER, never shorter
//    · singleton → singleton only
//    · scoped → scoped or singleton
//    · transient → anything
//
//  When a singleton genuinely needs per-request work, inject
//  `IServiceScopeFactory` and create a scope per unit of work (exercise 03),
//  rather than capturing the service itself.
//
//  The "resolving scoped from the root provider is refused" test is the same
//  protection from the other direction, and it is why module 17's seeding
//  code has to call `app.Services.CreateScope()` — the framework is stopping
//  you from silently promoting a scoped service to a singleton.
//  Module 13/06 proved the three lifetimes over HTTP. This is the failure
//  mode they produce when you combine them wrongly.
//
//  A CAPTIVE DEPENDENCY is a short-lived service trapped inside a
//  longer-lived one. Inject a `Scoped` service into a `Singleton` and the
//  singleton keeps the FIRST request's instance forever — every later request
//  silently uses stale, disposed, or another user's state.
//
//  It is the single most damaging DI mistake, and it does not reproduce with
//  one user on localhost.
//
//  .NET catches it for you, but only if you ask:
//
//      new ServiceProviderOptions { ValidateScopes = true }
//
//  which is ON by default in the Development environment and OFF in
//  Production. So the bug ships.
//
//  Build the provider factories and prove all of it.
//
//  hint: `services.BuildServiceProvider(validateScopes: true)` and
//        `provider.CreateScope()` are the two calls you need
#:project ../../_lib/Check/Check.csproj
#:package Microsoft.Extensions.DependencyInjection@10.0.11

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;

// Build a provider with Counter registered under the given lifetime.
// `validateScopes` controls whether captive dependencies are detected.
ServiceProvider Build(ServiceLifetime lifetime, bool validateScopes = true)
{
    // Typed as the INTERFACE: ServiceCollection also picks up an unrelated
    // MVC `Add` extension, and the interface's own Add is what we want.
    IServiceCollection services = new ServiceCollection();
    services.Add(new ServiceDescriptor(typeof(Counter), typeof(Counter), lifetime));

    return services.BuildServiceProvider(new ServiceProviderOptions
    {
        ValidateScopes = validateScopes,
        ValidateOnBuild = validateScopes,   // check the whole graph at startup
    });
}

// Build a provider where Report (SINGLETON) depends on Counter (SCOPED).
// That is the captive dependency.
ServiceProvider BuildCaptive(bool validateScopes)
{
    var services = new ServiceCollection();
    services.AddScoped<Counter>();      // short-lived…
    services.AddSingleton<Report>();    // …captured by a long-lived one

    return services.BuildServiceProvider(new ServiceProviderOptions
    {
        ValidateScopes = validateScopes,
        ValidateOnBuild = validateScopes,
    });
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a singleton is one instance for the whole provider", () =>
{
    using var provider = Build(ServiceLifetime.Singleton);

    using var scopeA = provider.CreateScope();
    using var scopeB = provider.CreateScope();

    var a = scopeA.ServiceProvider.GetRequiredService<Counter>();
    var b = scopeB.ServiceProvider.GetRequiredService<Counter>();

    Ok(ReferenceEquals(a, b));
});

Test("a scoped service is one instance per scope", () =>
{
    using var provider = Build(ServiceLifetime.Scoped);

    using var scope = provider.CreateScope();
    var first = scope.ServiceProvider.GetRequiredService<Counter>();
    var again = scope.ServiceProvider.GetRequiredService<Counter>();

    Ok(ReferenceEquals(first, again), "same scope must give the same object");
});

Test("two scopes get different scoped instances", () =>
{
    using var provider = Build(ServiceLifetime.Scoped);

    using var scopeA = provider.CreateScope();
    using var scopeB = provider.CreateScope();

    Ok(!ReferenceEquals(
        scopeA.ServiceProvider.GetRequiredService<Counter>(),
        scopeB.ServiceProvider.GetRequiredService<Counter>()));
});

Test("a transient is a new instance every single time", () =>
{
    using var provider = Build(ServiceLifetime.Transient);
    using var scope = provider.CreateScope();

    Ok(!ReferenceEquals(
        scope.ServiceProvider.GetRequiredService<Counter>(),
        scope.ServiceProvider.GetRequiredService<Counter>()));
});

Test("resolving a scoped service from the ROOT provider is refused", () =>
{
    // This is what stops you accidentally making it a singleton.
    using var provider = Build(ServiceLifetime.Scoped);

    Throws<InvalidOperationException>(() => provider.GetRequiredService<Counter>());
});

Test("validation catches the captive dependency at BUILD time", () =>
{
    // ValidateOnBuild inspects the WHOLE graph and reports every problem at
    // once, so the failures arrive wrapped in an AggregateException.
    var error = Throws<AggregateException>(() => BuildCaptive(validateScopes: true));

    var detail = string.Join(" | ", error.InnerExceptions.Select(e => e.Message));
    Ok(detail.Contains("Counter"),
       "expected the message to name the captive service, got: " + detail);
});

Test("without validation it builds happily — and is broken", () =>
{
    // The production default. No error, and a latent bug.
    using var provider = BuildCaptive(validateScopes: false);
    using var scope = provider.CreateScope();

    var report = scope.ServiceProvider.GetRequiredService<Report>();
    Eq(report.Count(), 1);
});

Test("the captive singleton hands every scope the SAME scoped instance", () =>
{
    using var provider = BuildCaptive(validateScopes: false);

    using var scopeA = provider.CreateScope();
    using var scopeB = provider.CreateScope();

    var a = scopeA.ServiceProvider.GetRequiredService<Report>();
    var b = scopeB.ServiceProvider.GetRequiredService<Report>();

    a.Count();                       // 1
    // Different scope, but the singleton captured the FIRST scope's Counter.
    Eq(b.Count(), 2);                // should have been 1
});

// ──────────────────────────── types ──────────────────────────────────────

public class Counter
{
    private int _count;
    public int Next() => ++_count;
}

// A singleton that (wrongly) depends on a scoped Counter.
public class Report(Counter counter)
{
    public int Count() => counter.Next();
}
