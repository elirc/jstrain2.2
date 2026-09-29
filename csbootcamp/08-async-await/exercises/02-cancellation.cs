// ─────────────────────────────────────────────────────────────────────────
//  02 · cancellation                                      ★★☆ core
//  concepts: CancellationToken · cooperative cancellation · linked sources
//  run: dotnet run 02-cancellation.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Cancellation in .NET is COOPERATIVE. Nothing kills your thread — a token
//  is flipped, and code that bothers to look stops. Code that never checks
//  runs to completion no matter who cancelled what.
//
//  So a `CancellationToken` parameter you accept and ignore is a lie in your
//  signature. Three ways to honour one:
//
//      token.ThrowIfCancellationRequested();     // between units of work
//      await Task.Delay(ms, token);              // pass it down
//      if (token.IsCancellationRequested) …      // check without throwing
//
//  ASP.NET Core hands every endpoint a token that fires when the client
//  disconnects. Pass it to EF, to HttpClient, to your loops — otherwise you
//  finish computing a response for a browser tab that closed a minute ago.
//
//  Build four things, and make the tests tell you which ones actually stop.
//
//  hint: cancelling throws `OperationCanceledException` (or its subclass
//        `TaskCanceledException`) — catch the base one
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Process each item, checking the token BETWEEN items. Returns what it
// finished; throws OperationCanceledException if cancelled.
async Task<List<string>> ProcessAll(string[] items, List<string> done,
                                    CancellationToken token)
{
    throw new NotImplementedException();
}

// Same, but never throws: returns however many items it completed before
// the token was cancelled.
async Task<List<string>> ProcessWhatYouCan(string[] items, List<string> done,
                                           CancellationToken token)
{
    throw new NotImplementedException();
}

// Run `work`, but give up after `timeoutMs` even if the caller's token has
// not fired. The caller's token must ALSO still cancel it.
async Task<string> WithTimeout(Func<CancellationToken, Task<string>> work,
                               int timeoutMs, CancellationToken token)
{
    throw new NotImplementedException();
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

    Eq(done, new List<string>());   // nothing ran
});

Test("cancelling partway stops the remaining work", async () =>
{
    using var cts = new CancellationTokenSource();
    var done = new List<string>();

    var running = ProcessAll(["a", "b", "c", "d"], done, cts.Token);
    await Sleep(45);      // let a couple through
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

    var result = await running;                    // no exception
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
