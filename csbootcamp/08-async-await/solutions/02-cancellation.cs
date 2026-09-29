// ─────────────────────────────────────────────────────────────────────────
//  02 · cancellation — SOLUTION                           ★★☆ core
//  concepts: CancellationToken · cooperative cancellation · linked sources
//  run: dotnet run 02-cancellation.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `ThrowIfCancellationRequested()` at the top of each iteration is the whole
//  of `ProcessAll`. Cancellation is cooperative — there is no thread abort —
//  so the check has to be somewhere the loop actually reaches. Put it only
//  before the loop and a cancel mid-run does nothing; a token you accept and
//  never inspect is a lie in your signature.
//
//  Note the delay also takes the token: `Task.Delay(ms, token)`. That is what
//  makes cancellation *prompt* rather than "at the end of the current 20ms
//  nap". Pass the token to everything that accepts one — EF's
//  `ToListAsync(ct)`, `HttpClient.SendAsync(…, ct)`, `Task.Delay(ms, ct)` —
//  and cancellation propagates the whole way down for free.
//
//  `ProcessWhatYouCan` shows the other style: check `IsCancellationRequested`
//  and `break`. Neither is more correct — they answer different questions.
//  Throwing says "this operation did not happen"; returning partial results
//  says "here is what I managed". A cancelled HTTP request wants the first;
//  a batch job draining a queue on shutdown wants the second. The one thing
//  you must not do is *silently* return partial results the caller believes
//  are complete.
//
//  `WithTimeout` is the exercise's payoff and the reason
//  `CreateLinkedTokenSource` exists. You need a token that fires when
//  **either** the caller cancels **or** the timeout elapses. Linking gives
//  you exactly that, and `CancelAfter` arms the clock. Passing `linked.Token`
//  into the work is what makes the last test pass: the work is *told* to
//  stop, rather than being abandoned while it carries on burning a
//  connection in the background.
//
//  The `using` on the linked source matters — it registers a timer and a
//  callback on the parent token, and not disposing it leaks both. That leak
//  is invisible until you do it per request.
//
//  `TaskCanceledException` derives from `OperationCanceledException`, so
//  catching the base one covers both. Catching only `TaskCanceledException`
//  misses `ThrowIfCancellationRequested`.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

async Task<List<string>> ProcessAll(string[] items, List<string> done,
                                    CancellationToken token)
{
    var results = new List<string>();
    foreach (var item in items)
    {
        // Inside the loop — otherwise a mid-run cancel changes nothing.
        token.ThrowIfCancellationRequested();

        await Task.Delay(20, token);   // pass it down for promptness
        done.Add(item);
        results.Add(item);
    }
    return results;
}

async Task<List<string>> ProcessWhatYouCan(string[] items, List<string> done,
                                           CancellationToken token)
{
    var results = new List<string>();
    foreach (var item in items)
    {
        if (token.IsCancellationRequested) break;   // stop, don't throw

        try
        {
            await Task.Delay(20, token);
        }
        catch (OperationCanceledException)
        {
            break;   // cancelled mid-delay: keep what we have
        }

        done.Add(item);
        results.Add(item);
    }
    return results;
}

async Task<string> WithTimeout(Func<CancellationToken, Task<string>> work,
                               int timeoutMs, CancellationToken token)
{
    // Fires if EITHER the caller cancels or the clock runs out.
    using var linked = CancellationTokenSource.CreateLinkedTokenSource(token);
    linked.CancelAfter(timeoutMs);

    // Hand the linked token to the work so it is told to stop, not abandoned.
    return await work(linked.Token);
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("an uncancelled run completes everything", async () =>
{
    var done = new List<string>();
    var result = await ProcessAll(["a", "b", "c"], done, CancellationToken.None);

    Eq(result, new[] { "a", "b", "c" });
    Eq(done, new[] { "a", "b", "c" });
});

Test("cancelling before the start throws immediately", async () =>
{
    using var cts = new CancellationTokenSource();
    cts.Cancel();

    var done = new List<string>();
    await ThrowsAsync<OperationCanceledException>(
        () => ProcessAll(["a", "b"], done, cts.Token));

    Eq(done, new List<string>());
});

Test("cancelling partway stops the remaining work", async () =>
{
    using var cts = new CancellationTokenSource();
    var done = new List<string>();

    var running = ProcessAll(["a", "b", "c", "d"], done, cts.Token);
    await Sleep(45);
    await cts.CancelAsync();

    await ThrowsAsync<OperationCanceledException>(() => running);
    Ok(done.Count is > 0 and < 4, $"expected a partial run, got {done.Count}");
});

Test("ProcessWhatYouCan returns partial results instead of throwing", async () =>
{
    using var cts = new CancellationTokenSource();
    var done = new List<string>();

    var running = ProcessWhatYouCan(["a", "b", "c", "d"], done, cts.Token);
    await Sleep(45);
    await cts.CancelAsync();

    var result = await running;
    Ok(result.Count is > 0 and < 4, $"expected partial, got {result.Count}");
    Eq(result, done);
});

Test("ProcessWhatYouCan with no cancellation does all of it", async () =>
{
    var done = new List<string>();
    Eq(await ProcessWhatYouCan(["a", "b"], done, CancellationToken.None),
       new[] { "a", "b" });
});

Test("work that finishes inside the timeout returns normally", async () =>
{
    var result = await WithTimeout(
        async ct => { await Task.Delay(10, ct); return "done"; },
        timeoutMs: 500, CancellationToken.None);

    Eq(result, "done");
});

Test("work that overruns the timeout is cancelled", async () =>
{
    await ThrowsAsync<OperationCanceledException>(() => WithTimeout(
        async ct => { await Task.Delay(5000, ct); return "done"; },
        timeoutMs: 40, CancellationToken.None));
});

Test("the caller's token cancels it too, before the timeout", async () =>
{
    using var cts = new CancellationTokenSource();
    var running = WithTimeout(
        async ct => { await Task.Delay(5000, ct); return "done"; },
        timeoutMs: 10_000, cts.Token);

    await Sleep(30);
    await cts.CancelAsync();

    await ThrowsAsync<OperationCanceledException>(() => running);
});

Test("the work is actually told to stop — its own token fires", async () =>
{
    var innerSawCancellation = false;

    await ThrowsAsync<OperationCanceledException>(() => WithTimeout(
        async ct =>
        {
            try { await Task.Delay(5000, ct); }
            catch (OperationCanceledException) { innerSawCancellation = true; throw; }
            return "done";
        },
        timeoutMs: 40, CancellationToken.None));

    Ok(innerSawCancellation, "the timeout must reach the work, not just abandon it");
});
