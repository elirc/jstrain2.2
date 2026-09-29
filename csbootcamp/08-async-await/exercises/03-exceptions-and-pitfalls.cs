// ─────────────────────────────────────────────────────────────────────────
//  03 · exceptions and pitfalls                           ★★★ stretch
//  concepts: async void · WhenAll aggregation · fire-and-forget
//  run: dotnet run 03-exceptions-and-pitfalls.cs
// ─────────────────────────────────────────────────────────────────────────
//
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

// Run all of them concurrently. If any fail, throw an AggregateException
// containing EVERY failure — not just the first.
async Task RunAllCollectingErrors(params Func<Task>[] work)
{
    throw new NotImplementedException();
}

// Run all of them; never throw. Return the successful results and the error
// messages, separately.
async Task<(List<string> Ok, List<string> Errors)> RunAllSettled(
    params Func<Task<string>>[] work)
{
    throw new NotImplementedException();
}

// Start `work` without awaiting it, but make sure a failure is REPORTED to
// `onError` instead of vanishing. Returns immediately.
void FireAndForget(Func<Task> work, Action<Exception> onError)
{
    throw new NotImplementedException();
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
