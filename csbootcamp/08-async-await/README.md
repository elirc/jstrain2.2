# 08 · Async and Await

Leg 2 uses `async` on almost every line — EF queries, HTTP handlers,
`HttpClient` calls — and explains it locally as it goes. This module is the
one that drills it, because the mistakes here don't announce themselves: a
sequential loop that should be concurrent just *feels* slow, a swallowed
exception just *doesn't appear*, and an ignored `CancellationToken` looks
exactly like an honoured one.

## The mental model

**1. `await` means "suspend me", not "run in the background".**

```csharp
var a = await FetchAsync("a");     // waits
var b = await FetchAsync("b");     // only starts now      → 200ms
```
```csharp
var ta = FetchAsync("a");          // started
var tb = FetchAsync("b");          // started, both in flight
await Task.WhenAll(ta, tb);        //                      → 100ms
```

**Calling** an async method starts the work. **Awaiting** it is where you stop
and collect. The two snippets look nearly identical and differ by 2× — the
only difference is where the `await` sits.

**2. `Task.WhenAll` preserves *argument* order, not completion order.**

So results stay aligned with their inputs, and you rarely need a dictionary to
reassemble responses. `Task.WhenAny` returns **the task** that finished first —
await it again for its value — and the losers keep running.

**3. The exception is stored on the Task; `await` takes it back out.**

Every pitfall below is a corollary of that one sentence.

**4. Cancellation is cooperative.** Nothing kills a thread. A token flips, and
code that checks stops. A `CancellationToken` parameter you accept and ignore
is a lie in your signature.

```csharp
token.ThrowIfCancellationRequested();     // between units of work
await Task.Delay(ms, token);              // pass it DOWN
if (token.IsCancellationRequested) break; // stop without throwing
```

**5. `IAsyncEnumerable<T>` streams; `Task<List<T>>` buffers.**

`await foreach` gives you the first item immediately and holds one page in
memory instead of the whole result set — and if the consumer stops early, the
producer never runs again.

## The details that bite

1. **`async void` has no Task**, so there is nowhere to put the exception. It
   is raised on the thread pool and **takes the process down**, and the
   caller's `try/catch` cannot see it — the method returned at its first
   `await`. Legal only for event handlers, which must match a `void`
   delegate. Everywhere else: `async Task`.

2. **`await Task.WhenAll(...)` rethrows only the FIRST exception.** All of
   them are captured on `whenAll.Exception.InnerExceptions`. Log only what you
   caught and the rest vanish silently.

3. **`WhenAll` does not short-circuit.** Every task runs to completion despite
   the failures. If the first failure makes the rest pointless, you need a
   `CancellationToken`, not `WhenAll`.

4. **`_ = work();` starts it and loses the failure.** Wrap fire-and-forget in
   something that catches — including around the *call*, since `work()` can
   throw before it ever returns a Task.

5. **Check the token *inside* the loop.** Before the loop only, and a mid-run
   cancel changes nothing.

6. **`[EnumeratorCancellation]` or `WithCancellation` is ignored.** It
   compiles, the token is silently dropped, and cancellation does nothing.
   The compiler warns (CS8425).

7. **`TaskCanceledException` derives from `OperationCanceledException`.**
   Catch the base one, or you miss `ThrowIfCancellationRequested`.

8. **Dispose your linked token source.** `CreateLinkedTokenSource` registers a
   callback on the parent; not disposing leaks it — invisible until you do it
   per request.

9. **Don't assert wall-clock thresholds.** "under 100ms" passes on your laptop
   and fails on loaded CI. Assert *structure* (how many calls were in flight)
   or *relative* timing (concurrent < sequential).

## Cheat table

| You want | Write |
| --- | --- |
| Run these together | `await Task.WhenAll(tasks)` |
| First one to finish | `await await Task.WhenAny(tasks)` |
| All outcomes, successes and failures | wrap each in try/catch, then `WhenAll` |
| Every exception, not just the first | catch, then read `whenAll.Exception.InnerExceptions` |
| Give up after a timeout | `CreateLinkedTokenSource(token)` + `CancelAfter(ms)` |
| Timeout without touching the work | `task.WaitAsync(TimeSpan)` |
| Stream results as they arrive | `IAsyncEnumerable<T>` + `yield return` |
| Consume a stream | `await foreach (var x in src.WithCancellation(ct))` |
| Start work you won't await | a local async wrapper with try/catch |

## Where this shows up in leg 2

- **Module 13/17** — `ToListAsync`, `SaveChangesAsync`. A request thread
  blocked on I/O is a thread not serving anyone.
- **Module 14** — middleware is `async (ctx, next)`; forgetting `await next`
  makes the outbound half run too early.
- **ASP.NET Core** hands every endpoint a `CancellationToken` that fires when
  the client disconnects. Pass it to EF and `HttpClient` or you finish
  computing a response for a browser tab that closed a minute ago.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-tasks-and-concurrency.cs` | ★★☆ | sequential vs concurrent, proved by counting in-flight calls |
| 02 | `02-cancellation.cs` | ★★☆ | honour a token, return partial results, build a timeout |
| 03 | `03-exceptions-and-pitfalls.cs` | ★★★ | collect *every* failure; safe fire-and-forget |
| 04 | `04-async-streams.cs` | ★★☆ | a paged `IAsyncEnumerable` that stops when you do |

Do them in order — 03 depends on the model 01 builds. **02 is the one that
changes how you write ASP.NET Core endpoints**, and **03 is the one that
explains the bugs you have already shipped.**

---

**Stuck?** `cheatsheets/async.md` (Task, WhenAll, cancellation, async streams) · **Self-check:** `quizzes/12-async-await.md` · **Next:** `csbootcamp/13-minimal-apis`
