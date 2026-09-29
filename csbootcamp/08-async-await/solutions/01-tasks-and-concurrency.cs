// ─────────────────────────────────────────────────────────────────────────
//  01 · tasks and concurrency — SOLUTION                  ★★☆ core
//  concepts: Task · await · sequential vs concurrent · WhenAll
//  run: dotnet run 01-tasks-and-concurrency.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The two methods differ by where the `await` sits, and that is the entire
//  lesson.
//
//  In `FetchSequential`, `await api.GetAsync(key)` is *inside* the loop, so
//  each iteration starts a request and then stops until it comes back. One
//  request is ever in flight — which `MaxConcurrent == 1` proves without any
//  reliance on the clock.
//
//  In `FetchConcurrent`, the loop only *calls* the method. Calling an async
//  method starts it running up to its first real suspension; the returned
//  `Task` is a handle to work already underway. So by the time the loop ends,
//  all three are in flight, and `Task.WhenAll` is just the collection point.
//  `MaxConcurrent == 3`.
//
//  `Task.WhenAll` on `Task<T>[]` gives you `Task<T[]>` **in the order you
//  passed the tasks**, not completion order. The "slow" test pins that down:
//  the slowest request still appears first in the results. That ordering
//  guarantee is why you rarely need a dictionary to reassemble responses.
//
//  `Task.WhenAny` returns the first task to *complete* — note it returns the
//  TASK, not the value, so you await it a second time to get the result. The
//  losers keep running: nothing cancels them, and if one later throws, that
//  exception is unobserved. In real code you would pass a
//  `CancellationToken` and cancel the stragglers (exercise 03).
//
//  The timing test compares the two measurements against each other rather
//  than against a fixed threshold. A test that asserts "under 100ms" passes
//  on your laptop and fails on a loaded CI box; a test that asserts
//  "concurrent < sequential" is measuring the thing you actually care about.
//  (This whole file's approach is why `MaxConcurrent` exists at all — the
//  structural assertion is the reliable one, and the timing test is a
//  sanity check on top.)
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Diagnostics;

async Task<List<string>> FetchSequential(FakeApi api, params string[] keys)
{
    var results = new List<string>();
    foreach (var key in keys)
        results.Add(await api.GetAsync(key));   // await INSIDE the loop
    return results;
}

async Task<List<string>> FetchConcurrent(FakeApi api, params string[] keys)
{
    // Calling starts the work; the loop never suspends.
    var tasks = keys.Select(api.GetAsync).ToArray();

    // Results come back in argument order, not completion order.
    var results = await Task.WhenAll(tasks);
    return [.. results];
}

async Task<string> FetchFastest(FakeApi api, params string[] keys)
{
    var tasks = keys.Select(api.GetAsync).ToArray();

    // WhenAny hands back the TASK that finished first…
    var winner = await Task.WhenAny(tasks);
    // …so await it again for its value. The losers keep running.
    return await winner;
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("sequential returns every result, in order", async () =>
{
    var api = new FakeApi();
    Eq(await FetchSequential(api, "a", "b", "c"), new[] { "a!", "b!", "c!" });
});

Test("concurrent returns the same results, in the same order", async () =>
{
    var api = new FakeApi();
    Eq(await FetchConcurrent(api, "a", "b", "c"), new[] { "a!", "b!", "c!" });
});

Test("order follows the ARGUMENTS, not completion order", async () =>
{
    var api = new FakeApi();
    api.DelayFor["slow"] = 60;

    Eq(await FetchConcurrent(api, "slow", "a"), new[] { "slow!", "a!" });
});

Test("sequential really is sequential — one in flight at a time", async () =>
{
    var api = new FakeApi();
    await FetchSequential(api, "a", "b", "c");

    Eq(api.MaxConcurrent, 1);
});

Test("concurrent really is concurrent — all in flight together", async () =>
{
    var api = new FakeApi();
    await FetchConcurrent(api, "a", "b", "c");

    Eq(api.MaxConcurrent, 3);
});

Test("concurrent is faster than sequential for the same work", async () =>
{
    var sequentialApi = new FakeApi();
    var concurrentApi = new FakeApi();

    var clock = Stopwatch.StartNew();
    await FetchSequential(sequentialApi, "a", "b", "c");
    var sequential = clock.ElapsedMilliseconds;

    clock.Restart();
    await FetchConcurrent(concurrentApi, "a", "b", "c");
    var concurrent = clock.ElapsedMilliseconds;

    Ok(concurrent < sequential, $"concurrent {concurrent}ms vs sequential {sequential}ms");
});

Test("both approaches call the service the same number of times", async () =>
{
    var api = new FakeApi();
    await FetchSequential(api, "a", "b");
    await FetchConcurrent(api, "a", "b");

    Eq(api.CallCount, 4);
});

Test("fastest returns the quickest answer", async () =>
{
    var api = new FakeApi();
    api.DelayFor["slow"] = 120;

    Eq(await FetchFastest(api, "slow", "quick"), "quick!");
});

Test("an empty key list is handled, not crashed", async () =>
{
    var api = new FakeApi();
    Eq(await FetchSequential(api), new List<string>());
    Eq(await FetchConcurrent(api), new List<string>());
});

// ──────────────────────────── types ──────────────────────────────────────

public class FakeApi
{
    private int _inFlight;
    private readonly object _gate = new();

    public int CallCount { get; private set; }
    public int MaxConcurrent { get; private set; }
    public Dictionary<string, int> DelayFor { get; } = [];

    public async Task<string> GetAsync(string key)
    {
        lock (_gate)
        {
            CallCount++;
            _inFlight++;
            MaxConcurrent = Math.Max(MaxConcurrent, _inFlight);
        }

        try
        {
            await Task.Delay(DelayFor.GetValueOrDefault(key, 30));
            return key + "!";
        }
        finally
        {
            lock (_gate) _inFlight--;
        }
    }
}
