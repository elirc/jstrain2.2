// ─────────────────────────────────────────────────────────────────────────
//  02 · background services — SOLUTION                    ★★★ stretch
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
//  Walkthrough:
//  Two try/catches at two different levels, and the levels are the lesson.
//
//  The **outer** catch is for `OperationCanceledException` around the whole
//  loop. Shutdown is a normal event, not a failure — logging it as an error
//  means every clean deploy produces a scary log line and people learn to
//  ignore the error log. The test asserting `errors` is empty after a stop is
//  there for exactly that.
//
//  The **inner** catch is per item. One poisoned message should not take the
//  worker down; it should be recorded and skipped. Without it, the exception
//  escapes `ExecuteAsync` and — since .NET 6 — **stops the entire host**.
//  That default is right (a dead worker pretending to be alive is worse than
//  a crash) but it makes the inner catch mandatory for any loop over
//  untrusted work.
//
//  `stoppingToken.ThrowIfCancellationRequested()` at the top of each
//  iteration is what makes the stop *prompt*. The second test queues ten
//  thousand items and asserts the worker stopped well short of draining
//  them — a loop that only checks the token before starting would run to
//  completion while the host waits, then gets killed at the shutdown timeout
//  (5 seconds by default) mid-item.
//
//  `ScopedWorker` is the captive-dependency fix from module 12/01 in its
//  natural habitat. A `BackgroundService` is a **singleton**, so it cannot
//  take a scoped `Handler` — or a `DbContext` — in its constructor. It
//  injects `IServiceScopeFactory` and creates a scope **per unit of work**,
//  which is the background-job equivalent of a scope per HTTP request. The
//  test proves it: each item sees a fresh `Handler` reporting 1, rather than
//  one shared handler counting 1, 2, 3.
//
//  Note `Task.Yield()` at the top of `ExecuteAsync`. Everything before the
//  first `await` runs **synchronously inside `StartAsync`**, so a long
//  synchronous prologue delays application startup. Yielding immediately
//  returns control to the host and lets the rest run in the background.
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
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Return to the host immediately; the rest runs in the background.
        await Task.Yield();

        try
        {
            while (queue.Count > 0)
            {
                // Checked EVERY iteration, so a stop is prompt.
                stoppingToken.ThrowIfCancellationRequested();

                var item = queue.Dequeue();
                try
                {
                    if (item == "POISON")
                        throw new InvalidOperationException($"cannot handle {item}");

                    done.Add(item);
                }
                catch (Exception e)
                {
                    // Per-item failure: record and carry on. Without this the
                    // exception escapes and stops the whole host.
                    errors.Add(e.Message);
                }

                await Task.Delay(1, stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            // Shutdown is normal. NOT an error.
        }
    }
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
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();

        try
        {
            while (queue.Count > 0)
            {
                stoppingToken.ThrowIfCancellationRequested();
                queue.Dequeue();

                // A scope PER UNIT OF WORK — the background-job equivalent of
                // a scope per HTTP request. This is how a singleton uses a
                // scoped service without capturing it.
                using var scope = scopes.CreateScope();
                var handler = scope.ServiceProvider.GetRequiredService<Handler>();
                seen.Add(handler.Handle());

                await Task.Delay(1, stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
        }
    }
}
