// ─────────────────────────────────────────────────────────────────────────
//  04 · scopes and disposal — SOLUTION                    ★★☆ core
//  concepts: who disposes what · the transient-disposable leak
//  run: dotnet run 04-scopes-and-disposal.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  The container disposes what it created, when the thing that created it
//  goes away:
//
//      Transient  disposed with the scope that resolved it
//      Scoped     disposed when the scope is disposed
//      Singleton  disposed when the ROOT provider is disposed
//
//  Read the first line again. A transient `IDisposable` resolved from the
//  **root** provider is held by the root for the lifetime of the process —
//  the container has to keep a reference so it can dispose it eventually, and
//  "eventually" is shutdown. Resolve one per request from the root and you
//  have a memory leak that looks exactly like a slow one.
//
//  In ASP.NET Core every request already runs in a scope, so this is mostly a
//  problem in background services, startup code and tests — anywhere you
//  reach for `provider.GetRequiredService<T>()` directly.
//
//  The other rule: **an instance YOU created and registered is not disposed
//  by the container.** `AddSingleton(new Thing())` means you own its
//  lifetime, which is easy to forget and occasionally what you want.
//
//  Walkthrough:
//  Three short methods; the content is entirely in what the eight tests
//  demonstrate about ownership.
//
//  **The container disposes what it created, when its owner ends.** A scope
//  is an object with a lifetime, and disposing it disposes everything the
//  scope resolved — which is why `UseInScope` uses `using var scope` and the
//  instance comes back already disposed. In ASP.NET Core the framework
//  creates and disposes that scope around each request, which is where
//  "scoped means per request" actually comes from. It is not a special rule;
//  it is one scope per request.
//
//  **The transient-from-root case is the leak worth remembering.** A
//  transient `IDisposable` resolved from the root provider is held by the
//  root — the container must keep a reference so it can dispose it
//  eventually, and for the root, eventually is process shutdown. The seventh
//  test shows it: nothing is disposed until `provider.Dispose()`.
//
//  Resolve one of those per request and you have a list that grows forever.
//  It looks like a memory leak, it is a memory leak, and the registration
//  reads as completely ordinary. Where it actually bites: background
//  services, startup code, tests, and anywhere someone injected
//  `IServiceProvider` and called `GetRequiredService` on it.
//
//  The defence is `ValidateScopes` (exercise 06) plus not resolving from the
//  root at all — take a `Func<T>` or an `IServiceScopeFactory` and make a
//  scope.
//
//  **An instance you construct is yours.** `AddSingleton(new Thing())` hands
//  the container an object it did not create, so it does not dispose it — the
//  last test. That is occasionally exactly what you want (a shared client you
//  manage yourself) and occasionally a leak you will not find, because the
//  registration looks identical to `AddSingleton<Thing>()`, which the
//  container DOES dispose.
//
//  **Two scopes, two instances; one scope, one instance.** Worth stating
//  plainly because "scoped" is often described as "per request" and then
//  quietly assumed to mean "per resolve". It does not: within a scope you get
//  the same object however many times you ask.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;

// Build a provider with Tracker registered as a singleton (so every service
// can record what happened to it), plus the three lifetimes below.
ServiceProvider BuildProvider(Tracker tracker)
{
    var services = new ServiceCollection();

    // An instance WE made: the container will not dispose it (and Tracker
    // is not disposable anyway).
    services.AddSingleton(tracker);

    services.AddSingleton<SingletonThing>();
    services.AddScoped<ScopedThing>();
    services.AddTransient<TransientThing>();

    return services.BuildServiceProvider();
}

// Resolve a ScopedThing inside a scope, then dispose the scope. Return the
// instance so the caller can check it.
ScopedThing UseInScope(ServiceProvider provider)
{
    // The scope is the owner. Disposing it disposes what it resolved —
    // which is exactly what ASP.NET Core does around each request.
    using var scope = provider.CreateScope();

    return scope.ServiceProvider.GetRequiredService<ScopedThing>();
}

// Resolve TWO ScopedThings from the SAME scope. Return both.
(ScopedThing First, ScopedThing Second) TwiceInOneScope(ServiceProvider provider)
{
    using var scope = provider.CreateScope();

    // Scoped means once per SCOPE, not once per resolve.
    return (scope.ServiceProvider.GetRequiredService<ScopedThing>(),
            scope.ServiceProvider.GetRequiredService<ScopedThing>());
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a scoped service is disposed when its scope ends", () =>
{
    var tracker = new Tracker();
    using var provider = BuildProvider(tracker);

    var thing = UseInScope(provider);

    Ok(thing.Disposed, "the scope should have disposed it");
});

Test("one instance per scope, however many times you ask", () =>
{
    var tracker = new Tracker();
    using var provider = BuildProvider(tracker);

    var (first, second) = TwiceInOneScope(provider);

    Ok(ReferenceEquals(first, second), "scoped means once per scope");
});

Test("two scopes get two instances", () =>
{
    var tracker = new Tracker();
    using var provider = BuildProvider(tracker);

    var first = UseInScope(provider);
    var second = UseInScope(provider);

    Ok(!ReferenceEquals(first, second));
    Eq(tracker.Disposals.Count(name => name == "scoped"), 2);
});

Test("a singleton survives every scope", () =>
{
    var tracker = new Tracker();
    using var provider = BuildProvider(tracker);

    SingletonThing first, second;

    using (var scope = provider.CreateScope())
        first = scope.ServiceProvider.GetRequiredService<SingletonThing>();

    using (var scope = provider.CreateScope())
        second = scope.ServiceProvider.GetRequiredService<SingletonThing>();

    Ok(ReferenceEquals(first, second));
    Ok(!first.Disposed, "a singleton outlives the scopes that used it");
});

Test("the singleton is disposed with the root provider", () =>
{
    var tracker = new Tracker();
    var provider = BuildProvider(tracker);
    var singleton = provider.GetRequiredService<SingletonThing>();

    provider.Dispose();

    Ok(singleton.Disposed);
    Eq(tracker.Disposals.Last(), "singleton");
});

Test("a transient resolved from a SCOPE dies with the scope", () =>
{
    var tracker = new Tracker();
    using var provider = BuildProvider(tracker);

    TransientThing thing;

    using (var scope = provider.CreateScope())
        thing = scope.ServiceProvider.GetRequiredService<TransientThing>();

    Ok(thing.Disposed);
});

Test("a transient resolved from the ROOT lives until shutdown", () =>
{
    // The leak. The root has to keep a reference so it can dispose the
    // instance eventually — and "eventually" is process shutdown.
    var tracker = new Tracker();
    var provider = BuildProvider(tracker);

    var thing = provider.GetRequiredService<TransientThing>();

    Ok(!thing.Disposed, "nothing has ended yet, so nothing was disposed");

    provider.Dispose();

    Ok(thing.Disposed, "...and only now, at shutdown");
});

Test("an instance you construct yourself is yours to dispose", () =>
{
    // AddSingleton(new Thing()) hands the container an object it did not
    // create — so it does not dispose it either.
    var tracker = new Tracker();
    var mine = new SingletonThing(tracker);

    var services = new ServiceCollection();
    services.AddSingleton(mine);

    var provider = services.BuildServiceProvider();
    provider.Dispose();

    Ok(!mine.Disposed, "the container did not create it and will not dispose it");
});

// ──────────────────────────── types ──────────────────────────────────────

public sealed class Tracker
{
    public List<string> Disposals { get; } = [];
}

public sealed class SingletonThing(Tracker tracker) : IDisposable
{
    public bool Disposed { get; private set; }

    public void Dispose()
    {
        Disposed = true;
        tracker.Disposals.Add("singleton");
    }
}

public sealed class ScopedThing(Tracker tracker) : IDisposable
{
    public bool Disposed { get; private set; }

    public void Dispose()
    {
        Disposed = true;
        tracker.Disposals.Add("scoped");
    }
}

public sealed class TransientThing(Tracker tracker) : IDisposable
{
    public bool Disposed { get; private set; }

    public void Dispose()
    {
        Disposed = true;
        tracker.Disposals.Add("transient");
    }
}
