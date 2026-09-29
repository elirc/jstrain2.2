// ─────────────────────────────────────────────────────────────────────────
//  04 · scopes and disposal                               ★★☆ core
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
//  hint: `provider.CreateScope()` is itself disposable, and disposing it is
//        what disposes everything scoped inside it
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;

// Build a provider with Tracker registered as a singleton (so every service
// can record what happened to it), plus the three lifetimes below.
ServiceProvider BuildProvider(Tracker tracker)
{
    throw new NotImplementedException();
}

// Resolve a ScopedThing inside a scope, then dispose the scope. Return the
// instance so the caller can check it.
ScopedThing UseInScope(ServiceProvider provider)
{
    throw new NotImplementedException();
}

// Resolve TWO ScopedThings from the SAME scope. Return both.
(ScopedThing First, ScopedThing Second) TwiceInOneScope(ServiceProvider provider)
{
    throw new NotImplementedException();
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
