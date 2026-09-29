# Async and await — offline reference

Covers module 08: Task, concurrency, cancellation, exceptions, async streams.

## The one sentence

**An async method's exception is stored on its Task, and `await` is what takes
it back out.** Nearly every async bug is a corollary.

## Sequential vs concurrent

```csharp
var a = await FetchAsync("a");      // waits
var b = await FetchAsync("b");      // only starts now          → 200ms

var ta = FetchAsync("a");           // started
var tb = FetchAsync("b");           // started, both in flight
var results = await Task.WhenAll(ta, tb);                     // → 100ms
```

**Calling** starts the work; **awaiting** is where you stop and collect. The
difference is where the `await` sits.

| You want | Write |
| --- | --- |
| Run these together | `await Task.WhenAll(tasks)` |
| First to finish | `await await Task.WhenAny(tasks)` |
| All outcomes, good and bad | wrap each in try/catch, then `WhenAll` |
| A value already computed | `Task.FromResult(x)` / `ValueTask.FromResult(x)` |
| Yield without real work | `await Task.Yield()` |

- `WhenAll` on `Task<T>[]` → `Task<T[]>` **in argument order**, not
  completion order.
- `WhenAny` returns **the task**, so await it a second time for its value.
  The losers keep running — pass a token to stop them.
- `WhenAll` **does not short-circuit**: every task runs to completion despite
  failures.

## Exceptions

```csharp
var all = Task.WhenAll(tasks);
try { await all; }
catch (Exception) {
    throw all.Exception!;      // ALL of them, not just the first
}
```

**`await Task.WhenAll(...)` rethrows only the FIRST exception.** The rest are
on `all.Exception.InnerExceptions`. Log only what you caught and they vanish.

### async void

```csharp
async void Handler() { … }     // NO TASK — nowhere to store the exception
```

It is raised on the thread pool and **terminates the process**. The caller's
`try/catch` cannot see it: the method returned at its first `await`.

Legal for event handlers (which must match a `void` delegate). Nowhere else.

### Fire-and-forget

```csharp
_ = work();                    // ❌ starts it AND loses any failure

_ = Observe();                 // ✅
async Task Observe() {
    try { await work(); }      // catches a sync throw from work() too
    catch (Exception e) { logger.LogError(e, "background work failed"); }
}
```

## Cancellation

Cooperative: nothing kills a thread. A token flips; code that checks stops.

```csharp
token.ThrowIfCancellationRequested();     // between units of work
await Task.Delay(ms, token);              // pass it DOWN for promptness
if (token.IsCancellationRequested) break; // stop without throwing
```

| Style | Means |
| --- | --- |
| `ThrowIfCancellationRequested` | "this operation did not happen" |
| check + `break` | "here is what I managed" |

Neither is more correct — a cancelled HTTP request wants the first, a batch
job draining on shutdown wants the second. Never silently return partial
results the caller thinks are complete.

### Timeouts

```csharp
using var linked = CancellationTokenSource.CreateLinkedTokenSource(token);
linked.CancelAfter(timeoutMs);
return await work(linked.Token);          // the work is TOLD to stop
```

Fires if **either** the caller cancels or the clock runs out.
`task.WaitAsync(TimeSpan)` is the shorthand when you cannot pass a token in —
but it abandons the work rather than cancelling it.

- **Dispose the linked source.** It registers a callback on the parent token;
  leaking that per request adds up.
- **`TaskCanceledException` derives from `OperationCanceledException`.** Catch
  the base one.

ASP.NET Core gives every endpoint a token that fires when the client
disconnects. Pass it to EF (`ToListAsync(ct)`) and `HttpClient` or you finish
computing a response for a tab that closed a minute ago.

## Async streams

```csharp
async IAsyncEnumerable<T> ReadAll(
    [EnumeratorCancellation] CancellationToken token = default)
{
    for (var page = 1; ; page++) {
        var items = await FetchPage(page, token);
        if (items.Count == 0) yield break;
        foreach (var item in items) yield return item;
    }
}

await foreach (var item in ReadAll().WithCancellation(token)) { … }
```

`Task<List<T>>` **buffers** — wait for all of it, then here is everything.
`IAsyncEnumerable<T>` **streams** — first item immediately, one page in memory,
and if the consumer `break`s the producer never runs again (its `finally`
blocks run, closing cursors and responses).

- **`[EnumeratorCancellation]` is required** for `WithCancellation(token)` to
  reach your parameter. Without it the code compiles and the token is
  **silently ignored**. Compiler warning CS8425.
- **An async iterator must contain a `yield`** even if the body only throws
  (CS8420).
- Returning `IAsyncEnumerable<T>` from an ASP.NET Core endpoint streams the
  JSON array as items are produced.

## Task vs ValueTask

| | Use when |
| --- | --- |
| `Task` / `Task<T>` | the default. Cacheable, awaitable many times. |
| `ValueTask<T>` | a hot path that usually completes **synchronously** (a cache hit) and allocation shows in a profile |

`ValueTask` may be awaited **only once** and must not be stored or awaited
concurrently. Use `Task` unless you have measured.

## Testing async code

- **Never assert a wall-clock threshold.** "under 100ms" passes on your laptop
  and fails on loaded CI.
- Assert **structure** (how many calls were in flight) or **relative** timing
  (concurrent < sequential).
- Inject the clock — a validator or retry policy that reads `DateTime.Now`
  cannot be tested deterministically.

## Quick diagnosis

| Symptom | Likely cause |
| --- | --- |
| Slower than expected, CPU idle | `await` inside the loop — sequential when you meant concurrent |
| An exception "disappeared" | un-awaited Task, or only the first of a `WhenAll` was logged |
| Process died with no stack | `async void` |
| Cancellation does nothing | token never checked, not passed down, or `[EnumeratorCancellation]` missing |
| Work continues after the client left | request token not passed to EF / HttpClient |
