// ─────────────────────────────────────────────────────────────────────────
//  02 · background services                               ★★★ stretch
//  concepts: BackgroundService · graceful shutdown · scopes in a singleton
//  run: dotnet run 02-background-services.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A `BackgroundService` runs alongside your web app: a queue consumer, a
//  cleanup job, a poller. Three things decide whether it behaves in
//  production:
//
//  **It is a SINGLETON.** So it cannot inject a scoped service — that is the
//  captive dependency from module 12/01. Inject `IServiceScopeFactory` and
//  create a scope per unit of work instead.
//
//  **The token is a shutdown signal.** `ExecuteAsync(CancellationToken)`
//  fires when the host is stopping. Ignore it and the host waits (5 seconds
//  by default) and then kills you mid-work.
//
//  **An unhandled exception stops the host.** Since .NET 6 a
//  `BackgroundService` that throws takes the whole application down. That is
//  usually right — a dead worker pretending to be alive is worse — but it
//  means the loop body needs its own try/catch if one bad item should not be
//  fatal.
//
//  hint: catch OperationCanceledException around the whole loop, and catch
//        per-item failures INSIDE it — they mean different things
#:project ../../_lib/Check/Check.csproj
#:package Microsoft.Extensions.Hosting@10.0.11

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

// ──────────────────────────── tests ──────────────────────────────────────

Test("the worker processes queued items", async () =>
{
    var done = new List<string>();
    var worker = new Worker(new Queue<string>(["a", "b", "c"]), done, []);

    await Run(worker, () => done.Count == 3);

    Eq(done, new[] { "a", "b", "c" });
});

Test("stopping cancels the loop promptly", async () =>
{
    var done = new List<string>();
    var worker = new Worker(BigQueue(), done, []);

    await Run(worker, () => done.Count > 0);

    var atStop = done.Count;
    await Sleep(60);

    Eq(done.Count, atStop);          // nothing processed after the stop
    Ok(atStop < 10_000, "it should not have drained the whole queue");
});

Test("cancellation is not reported as a failure", async () =>
{
    // Shutdown is normal. It must not land in the error log.
    var queue = BigQueue();
    var errors = new List<string>();
    var worker = new Worker(queue, [], errors);

    await Run(worker, () => queue.Count < 10_000);

    Eq(errors, new List<string>());
});

Test("one bad item does not kill the worker", async () =>
{
    var done = new List<string>();
    var errors = new List<string>();
    var worker = new Worker(new Queue<string>(["a", "POISON", "c"]), done, errors);

    await Run(worker, () => done.Count == 2);

    Eq(done, new[] { "a", "c" });     // it carried on past the bad one
    Eq(errors.Count, 1);
    Ok(errors[0].Contains("POISON"));
});

Test("a singleton worker resolves a SCOPED service per item", async () =>
{
    // The captive-dependency fix: a scope per unit of work.
    IServiceCollection services = new ServiceCollection();
    services.AddScoped<Handler>();
    using var provider = services.BuildServiceProvider();

    var seen = new List<int>();
    var worker = new ScopedWorker(provider.GetRequiredService<IServiceScopeFactory>(),
                                  new Queue<string>(["a", "b", "c"]), seen);

    await Run(worker, () => seen.Count == 3);

    // Each item got a FRESH handler, so each reports 1.
    Eq(seen, new[] { 1, 1, 1 });
});

// ──────────────────────────── helpers ────────────────────────────────────

Queue<string> BigQueue()
    => new(Enumerable.Range(0, 10_000).Select(n => n.ToString()));

// Start, wait for the condition (or give up), stop — then SURFACE any
// failure the worker hit. BackgroundService captures exceptions into its
// ExecuteTask, so without this a broken worker looks like an empty result.
async Task Run(BackgroundService worker, Func<bool> until)
{
    await worker.StartAsync(CancellationToken.None);

    for (var i = 0; i < 200 && !until(); i++) await Task.Delay(10);

    await worker.StopAsync(CancellationToken.None);

    if (worker.ExecuteTask is { IsFaulted: true } faulted) await faulted;
}

// ──────────────────────────── types ──────────────────────────────────────

// Drains `queue`, appending each item to `done`. An item equal to "POISON"
// throws; record the message in `errors` and keep going. Stop promptly when
// the token fires, and do NOT record cancellation as an error.
public class Worker(Queue<string> queue, List<string> done, List<string> errors)
    : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
        => throw new NotImplementedException();
}

// Scoped: a new one per scope.
public class Handler
{
    private int _count;
    public int Handle() => ++_count;
}

// Resolves a fresh Handler per item from its own scope.
public class ScopedWorker(IServiceScopeFactory scopes, Queue<string> queue, List<int> seen)
    : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
        => throw new NotImplementedException();
}
