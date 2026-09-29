// ─────────────────────────────────────────────────────────────────────────
//  01 · tasks and concurrency                             ★★☆ core
//  concepts: Task · await · sequential vs concurrent · WhenAll
//  run: dotnet run 01-tasks-and-concurrency.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `await` does not mean "run in the background". It means "start this, and
//  suspend me until it finishes". So this is SEQUENTIAL:
//
//      var a = await FetchAsync("a");   // waits
//      var b = await FetchAsync("b");   // only starts now
//
//  and this is CONCURRENT:
//
//      var ta = FetchAsync("a");        // started
//      var tb = FetchAsync("b");        // started, both in flight
//      await Task.WhenAll(ta, tb);
//
//  The difference is where you put the `await`. Calling the method starts
//  the work; awaiting it is when you stop and collect. Three sequential
//  100ms calls take 300ms; three concurrent ones take 100ms — and the code
//  looks nearly identical, which is why this is worth drilling.
//
//  Implement three fetchers over the same fake service.
//
//  hint: `Task.WhenAll(tasks)` on `Task<T>` returns `Task<T[]>`, with the
//        results in the order you passed the tasks — not completion order
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Diagnostics;

// Await each key in turn. Slow on purpose — this is the baseline.
async Task<List<string>> FetchSequential(FakeApi api, params string[] keys)
{
    throw new NotImplementedException();
}

// Start every request, then wait for all of them. Results in the SAME order
// as `keys`, regardless of which finished first.
async Task<List<string>> FetchConcurrent(FakeApi api, params string[] keys)
{
    throw new NotImplementedException();
}

// Return whichever key answers FIRST. The others keep running; ignore them.
async Task<string> FetchFastest(FakeApi api, params string[] keys)
{
    throw new NotImplementedException();
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
    // "slow" takes longest but must still come back first in the list.
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

    // Assert the ORDERING, never an exact millisecond count.
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

// A stand-in for a network call. Records how many requests were in flight
// at once, which is how the tests tell sequential from concurrent without
// depending on the clock.
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
