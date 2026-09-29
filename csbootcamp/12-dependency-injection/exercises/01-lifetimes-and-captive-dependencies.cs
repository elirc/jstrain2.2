// ─────────────────────────────────────────────────────────────────────────
//  01 · lifetimes and captive dependencies                ★★☆ core
//  concepts: singleton/scoped/transient · the captive dependency bug
//  run: dotnet run 01-lifetimes-and-captive-dependencies.cs
// ─────────────────────────────────────────────────────────────────────────
//
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
    throw new NotImplementedException();
}

// Build a provider where Report (SINGLETON) depends on Counter (SCOPED).
// That is the captive dependency.
ServiceProvider BuildCaptive(bool validateScopes)
{
    throw new NotImplementedException();
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
