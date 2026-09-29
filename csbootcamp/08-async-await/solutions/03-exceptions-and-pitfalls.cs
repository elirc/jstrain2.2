// ─────────────────────────────────────────────────────────────────────────
//  03 · exceptions and pitfalls — SOLUTION                 ★★★ stretch
//  concepts: async void · WhenAll aggregation · fire-and-forget
//  run: dotnet run 03-exceptions-and-pitfalls.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  One sentence explains all three: **an async method's exception is stored
//  on its Task, and `await` is what takes it back out.**
//
//  `RunAllCollectingErrors` exists because of a genuinely surprising default:
//  `Task.WhenAll` waits for every task and captures every exception, but
//  `await`ing it rethrows only the **first**. The others are still there — on
//  `whenAll.Exception.InnerExceptions` — and if you only log what you caught,
//  the rest are silently gone. Catching and then re-reading the *task's*
//  exception is how you get all of them. That is why the test asserts a count
//  of 2 rather than just "it threw".
//
//  Note the "does not stop the others" test. WhenAll does not short-circuit:
//  every task runs to completion regardless of the failures. That is usually
//  what you want and occasionally a surprise — if the first failure makes the
//  rest pointless, you need a `CancellationToken` (exercise 02), not WhenAll.
//
//  `RunAllSettled` is the "tell me everything, decide later" shape —
//  JavaScript's `Promise.allSettled`. Each task is wrapped so it cannot
//  throw, so the aggregate never throws either. Note `Ok` preserves argument
//  order: `WhenAll` results come back in the order you passed them, so the
//  successes stay aligned with their inputs.
//
//  `FireAndForget` is the only responsible way to start work you will not
//  await. `_ = work()` alone is *not* enough: if it faults, nothing observes
//  the task and the failure vanishes. The `ContinueWith` (or an async local
//  with a try/catch) is what routes it somewhere a human will see. The
//  synchronous-throw test matters because not every failure happens after an
//  await — `work()` itself can throw before returning a Task at all, which
//  a bare `_ = work();` would let escape.
//
//  And `async void`: there is no Task, so there is nowhere to put the
//  exception. It goes to the thread pool and terminates the process. The
//  caller's `try/catch` cannot help, because the method returned the moment
//  it hit its first `await`. Use it for event handlers and nothing else.
//  An async method's exception is stored ON ITS TASK. `await` is what takes
//  it back out and rethrows it. Everything in this file follows from that one
//  sentence.
//
//      · no await  → the exception sits in a Task nobody looks at
//      · async void → THERE IS NO TASK. The exception is raised on the
//        thread pool and, in a real app, takes the process down. `try/catch`
//        around the CALL cannot see it, because the call already returned.
//      · Task.WhenAll → every task's exception is captured, but `await`
//        rethrows only the FIRST. The rest are on the Task's
//        AggregateException, and quietly missing from your log.
//
//  `async void` is legal for exactly one reason: event handlers, which have
//  to match `void`-returning delegates. Everywhere else it is a bug.
//
//  Implement three helpers that get this right.
//
//  hint: `Task.WhenAll(...)` — to reach every exception, catch, then inspect
//        the *task's* `.Exception.InnerExceptions`, not the caught one
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

async Task RunAllCollectingErrors(params Func<Task>[] work)
{
    var tasks = work.Select(w => Run(w)).ToArray();
    var all = Task.WhenAll(tasks);

    try
    {
        await all;
    }
    catch (Exception)
    {
        // `await` rethrew only the FIRST. The task holds them all.
        throw all.Exception ?? throw new InvalidOperationException("no exception");
    }

    // A local wrapper so a synchronous throw also becomes a faulted Task.
    static async Task Run(Func<Task> w) => await w();
}

async Task<(List<string> Ok, List<string> Errors)> RunAllSettled(
    params Func<Task<string>>[] work)
{
    // Wrap each one so it cannot throw; then WhenAll cannot either.
    var outcomes = await Task.WhenAll(work.Select(Settle));

    return (
        [.. outcomes.Where(o => o.Error is null).Select(o => o.Value!)],
        [.. outcomes.Where(o => o.Error is not null).Select(o => o.Error!)]);

    static async Task<(string? Value, string? Error)> Settle(Func<Task<string>> w)
    {
        try { return (await w(), null); }
        catch (Exception e) { return (null, e.Message); }
    }
}

void FireAndForget(Func<Task> work, Action<Exception> onError)
{
    // `_ = work();` would start it AND lose any failure. The discard below
    // is on an async local that owns the try/catch — including around the
    // call itself, since work() can throw before returning a Task.
    _ = Observe();

    async Task Observe()
    {
        try { await work(); }
        catch (Exception e) { onError(e); }
    }
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("all succeeding means no throw", async () =>
    await RunAllCollectingErrors(
        () => Task.CompletedTask,
        () => Task.CompletedTask));

Test("one failure is reported", async () =>
{
    var error = await ThrowsAsync<AggregateException>(() => RunAllCollectingErrors(
        () => Task.CompletedTask,
        () => throw new InvalidOperationException("boom")));

    Eq(error.InnerExceptions.Count, 1);
    Eq(error.InnerExceptions[0].Message, "boom");
});

Test("EVERY failure is reported, not just the first", async () =>
{
    // await on WhenAll rethrows only the first — this must not.
    var error = await ThrowsAsync<AggregateException>(() => RunAllCollectingErrors(
        () => throw new InvalidOperationException("first"),
        () => Task.CompletedTask,
        () => throw new InvalidOperationException("second")));

    Eq(error.InnerExceptions.Count, 2);
    Eq(error.InnerExceptions.Select(e => e.Message).OrderBy(m => m),
       new[] { "first", "second" });
});

Test("failing work does not stop the others from running", async () =>
{
    var ran = new List<string>();

    await ThrowsAsync<AggregateException>(() => RunAllCollectingErrors(
        () => throw new InvalidOperationException("boom"),
        async () => { await Task.Delay(10); lock (ran) ran.Add("b"); },
        async () => { await Task.Delay(10); lock (ran) ran.Add("c"); }));

    Eq(ran.Count, 2);
});

Test("settled separates successes from failures", async () =>
{
    var (ok, errors) = await RunAllSettled(
        () => Task.FromResult("a"),
        () => throw new InvalidOperationException("bad"),
        () => Task.FromResult("c"));

    Eq(ok, new[] { "a", "c" });
    Eq(errors, new[] { "bad" });
});

Test("settled never throws, even when everything fails", async () =>
{
    var (ok, errors) = await RunAllSettled(
        () => throw new InvalidOperationException("x"),
        () => throw new InvalidOperationException("y"));

    Eq(ok, new List<string>());
    Eq(errors.OrderBy(e => e), new[] { "x", "y" });
});

Test("settled with no work is empty, not a crash", async () =>
{
    var (ok, errors) = await RunAllSettled();
    Eq(ok, new List<string>());
    Eq(errors, new List<string>());
});

Test("fire-and-forget returns before the work finishes", () =>
{
    var finished = false;
    FireAndForget(async () => { await Task.Delay(80); finished = true; }, _ => { });

    Eq(finished, false);   // we did not wait
});

Test("a fire-and-forget failure reaches onError instead of vanishing", async () =>
{
    Exception? seen = null;
    FireAndForget(() => throw new InvalidOperationException("background boom"),
                  e => seen = e);

    await Sleep(60);
    NotNull(seen);
    Eq(seen!.Message, "background boom");
});

Test("a synchronous throw inside the work is caught too", async () =>
{
    // Not every failure happens after an await.
    Exception? seen = null;
    FireAndForget(() => throw new ArgumentException("immediate"), e => seen = e);

    await Sleep(60);
    Eq(seen?.Message, "immediate");
});

Test("an un-awaited Task hides its exception until you await it", async () =>
{
    // The root cause behind every pitfall in this file: the exception is
    // STORED ON THE TASK. Nothing surfaces it until someone awaits.
    var task = Failing();
    await Sleep(20);

    Ok(task.IsFaulted, "the task failed, silently");
    await ThrowsAsync<InvalidOperationException>(() => task);

    static async Task Failing()
    {
        await Task.Yield();
        throw new InvalidOperationException("stored on the task");
    }
});

// NOTE on `async void`: it has no Task at all, so there is nowhere to store
// the exception — it is raised on the thread pool and TAKES THE PROCESS
// DOWN. That is not demonstrated here for the obvious reason that it would
// kill this test run. Use `async Task` everywhere except an event handler.
