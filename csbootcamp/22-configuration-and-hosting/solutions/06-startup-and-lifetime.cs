// ─────────────────────────────────────────────────────────────────────────
//  06 · startup and lifetime — SOLUTION                   ★★★ stretch
//  concepts: IHostedService order · a failing start · stop order
//  run: dotnet run 06-startup-and-lifetime.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A host is a list of `IHostedService`s and two rules about them:
//
//      StartAsync   runs in REGISTRATION order, one at a time, AWAITED
//      StopAsync    runs in REVERSE order, so dependencies outlive dependents
//
//  Both matter. Because `StartAsync` is awaited, slow startup work delays
//  readiness — which is right for a cache warm (capstone 23/03) and wrong for
//  a poll loop, and is exactly why `BackgroundService.ExecuteAsync` is
//  started and *not* awaited.
//
//  Because `StopAsync` is reversed, the service registered first is stopped
//  last. Register the thing others depend on first and shutdown works the way
//  you would draw it.
//
//  **A throwing `StartAsync` aborts the startup sequence**, and the exception
//  propagates out of `host.StartAsync()`. Nothing after the failure starts.
//
//  What the host does NOT do is unwind: the services that already started
//  keep running until somebody stops them. `host.Run()` and `RunAsync()`
//  handle that for you; a bare `StartAsync()` does not, which is why anything
//  that starts a host by hand needs a `try`/`finally` or a `using`.
//
//  `IHostApplicationLifetime` gives you the events around all this —
//  `ApplicationStarted`, `ApplicationStopping`, `ApplicationStopped` — plus
//  `StopApplication()` for a component that decides it is done.
//
//  Walkthrough:
//  Two short methods. The content is the ordering guarantees, and they matter
//  more than they look.
//
//  **Start in registration order, awaited one at a time.** The third test
//  proves the "awaited" half: `Slow` takes 80ms and `Second` does not start
//  until it is finished. That is what makes `IHostedService.StartAsync` the
//  right place for a cache warm (capstone 23/03) — the host will not accept a
//  request until it has completed — and the wrong place for a poll loop,
//  which would never return and would hang startup forever.
//
//  `BackgroundService.ExecuteAsync` exists for the second case: the base
//  class starts it and does NOT await it, so the host carries on. If you have
//  ever wondered why there are two abstractions, that is the whole
//  difference.
//
//  **Stop in reverse order.** Register the thing others depend on first and
//  it is torn down last, which is almost always what you want: the message
//  publisher stops before the connection it publishes through. Nothing
//  enforces that you got the order right — the host just reverses whatever
//  you gave it — so registration order is a design decision, not a formality.
//
//  **A failing StartAsync aborts the sequence — and does not clean up.** The
//  fifth and sixth tests pin both halves, and the second half is the one
//  worth knowing: `Second` never starts, and `First` is left RUNNING. The
//  host does not unwind on your behalf.
//
//  `host.Run()` and `RunAsync()` wrap start/stop in a try/finally and do
//  handle it, which is why you almost never see this in an application's
//  `Program.cs`. You see it in tests, in tools, and anywhere someone called
//  `StartAsync()` directly — and the symptom is a background service still
//  writing to a database after startup "failed".
//
//  The behaviour you want overall is still the loud one: a service that
//  cannot reach its database should take the process down, so the
//  orchestrator does not route traffic and the previous version keeps
//  serving. Compare the alternative people write by accident — catch, log,
//  carry on — where the process starts, reports healthy, and serves requests
//  against a component that is not there.
//
//  **`IHostApplicationLifetime` is the event surface** — `ApplicationStarted`,
//  `ApplicationStopping`, `ApplicationStopped`, and `StopApplication()` for a
//  component that decides it is finished. The `ApplicationStopping` token is
//  what you pass into anything that should abandon its work during a
//  shutdown; it is cancelled before `StopAsync` runs, so a request in flight
//  gets a chance to notice.
//
//  **`Host.CreateApplicationBuilder()`** is the non-web host: configuration,
//  logging, DI and hosted services, with no Kestrel. It is what a worker
//  service uses, and it is the smallest thing that can run an
//  `IHostedService`.
//
//  One detail in `BuildHost`: the services are registered as
//  `AddSingleton(typeof(IHostedService), type)` rather than
//  `AddHostedService<T>()`, because the type is only known at run time here.
//  `AddHostedService<T>` uses `TryAddEnumerable` under the hood, which
//  de-duplicates by implementation type — worth knowing, because calling it
//  twice for the same type deliberately registers it once.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

// Build a host with the given hosted services registered IN ORDER, sharing
// one Log singleton.
IHost BuildHost(Log log, params Type[] hostedServices)
{
    var builder = Host.CreateApplicationBuilder();

    builder.Services.AddSingleton(log);

    // Registration ORDER is start order, and reverse stop order.
    foreach (var type in hostedServices)
        builder.Services.AddSingleton(typeof(IHostedService), type);

    return builder.Build();
}

// Start it, then stop it.
async Task RunAndStop(IHost host)
{
    await host.StartAsync();
    await host.StopAsync();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("services start in registration order", async () =>
{
    var log = new Log();
    using var host = BuildHost(log, typeof(First), typeof(Second));

    await host.StartAsync();

    Eq(log.Entries, new[] { "First:start", "Second:start" });

    await host.StopAsync();
});

Test("...and stop in REVERSE order", async () =>
{
    var log = new Log();
    using var host = BuildHost(log, typeof(First), typeof(Second));

    await RunAndStop(host);

    Eq(log.Entries, new[]
    {
        "First:start", "Second:start", "Second:stop", "First:stop",
    });
});

Test("StartAsync is AWAITED, so slow work delays readiness", async () =>
{
    // Slow registers itself only after a delay. If StartAsync were fire-and
    // -forget, Second would start first.
    var log = new Log();
    using var host = BuildHost(log, typeof(Slow), typeof(Second));

    await host.StartAsync();

    Eq(log.Entries, new[] { "Slow:start", "Second:start" });

    await host.StopAsync();
});

Test("a failing StartAsync stops the host from starting", async () =>
{
    var log = new Log();
    using var host = BuildHost(log, typeof(First), typeof(Broken), typeof(Second));

    await ThrowsAsync<InvalidOperationException>(() => host.StartAsync());
});

Test("...and nothing after the failure starts", async () =>
{
    var log = new Log();
    using var host = BuildHost(log, typeof(First), typeof(Broken), typeof(Second));

    await ThrowsAsync<InvalidOperationException>(() => host.StartAsync());

    Ok(log.Entries.Contains("First:start"));
    Ok(!log.Entries.Contains("Second:start"), "the sequence aborted at Broken");
});

Test("...but the host does NOT unwind what already started", async () =>
{
    // First is still running. StartAsync threw and left it there — stopping
    // it is the caller's job, which is what Run()/RunAsync() do for you and
    // a bare StartAsync() does not.
    var log = new Log();
    using var host = BuildHost(log, typeof(First), typeof(Broken));

    await ThrowsAsync<InvalidOperationException>(() => host.StartAsync());

    Ok(!log.Entries.Contains("First:stop"), string.Join(",", log.Entries));

    await host.StopAsync();

    Ok(log.Entries.Contains("First:stop"), string.Join(",", log.Entries));
});

Test("stopping a host that never started is harmless", async () =>
{
    var log = new Log();
    using var host = BuildHost(log, typeof(First));

    await host.StopAsync();

    Eq(log.Entries, Array.Empty<string>());
});

Test("the lifetime token is cancelled on shutdown", async () =>
{
    var log = new Log();
    using var host = BuildHost(log, typeof(First));
    var lifetime = host.Services.GetRequiredService<IHostApplicationLifetime>();

    var stopping = new TaskCompletionSource();
    lifetime.ApplicationStopping.Register(() => stopping.TrySetResult());

    await RunAndStop(host);

    await stopping.Task.WaitAsync(TimeSpan.FromSeconds(5));
});

Test("everything shares one Log because it is a singleton", async () =>
{
    var log = new Log();
    using var host = BuildHost(log, typeof(First), typeof(Second));

    await RunAndStop(host);

    Eq(log.Entries.Count, 4);
});

// ──────────────────────────── types ──────────────────────────────────────

public sealed class Log
{
    private readonly object _gate = new();

    public List<string> Entries { get; } = [];

    public void Add(string entry)
    {
        lock (_gate) Entries.Add(entry);
    }
}

public sealed class First(Log log) : IHostedService
{
    public Task StartAsync(CancellationToken token)
    {
        log.Add("First:start");

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken token)
    {
        log.Add("First:stop");

        return Task.CompletedTask;
    }
}

public sealed class Second(Log log) : IHostedService
{
    public Task StartAsync(CancellationToken token)
    {
        log.Add("Second:start");

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken token)
    {
        log.Add("Second:stop");

        return Task.CompletedTask;
    }
}

// Takes its time, and only logs when it is genuinely done.
public sealed class Slow(Log log) : IHostedService
{
    public async Task StartAsync(CancellationToken token)
    {
        await Task.Delay(80, token);
        log.Add("Slow:start");
    }

    public Task StopAsync(CancellationToken token)
    {
        log.Add("Slow:stop");

        return Task.CompletedTask;
    }
}

public sealed class Broken(Log log) : IHostedService
{
    public Task StartAsync(CancellationToken token)
    {
        log.Add("Broken:start");

        throw new InvalidOperationException("cannot reach the database");
    }

    public Task StopAsync(CancellationToken token) => Task.CompletedTask;
}
