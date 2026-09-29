# 12 · Async and Await

Cover the answer, commit out loud, then reveal.

---

### Q1 — the one sentence

Where does an async method's exception live before you see it?

<details><summary>Answer</summary>

**On its Task.** `await` is what takes it back out and rethrows it.

Almost every async bug is a corollary: no await → nobody looks; `async void`
→ no Task to look at; `WhenAll` → several exceptions, one rethrown.
</details>

---

### Q2 — how long

```csharp
var a = await FetchAsync("a");   // 100ms
var b = await FetchAsync("b");   // 100ms
```

<details><summary>Answer</summary>

**200ms.** `await` means "suspend me until this finishes", not "run in the
background". `b` doesn't start until `a` comes back.

Concurrent version — 100ms:

```csharp
var ta = FetchAsync("a");        // started
var tb = FetchAsync("b");        // started
await Task.WhenAll(ta, tb);
```

Calling starts the work; awaiting is where you collect. The two look nearly
identical and differ by 2×.
</details>

---

### Q3 — what order

`Task.WhenAll(slow, fast)` — which result is first in the array?

<details><summary>Answer</summary>

**`slow`.** Results come back in **argument order**, not completion order.

That guarantee is why you rarely need a dictionary to match responses to
requests.
</details>

---

### Q4 — WhenAny's return

```csharp
var winner = await Task.WhenAny(tasks);
```

What is `winner`, and what happens to the others?

<details><summary>Answer</summary>

`winner` is **the Task**, not the value — so you `await` it again to get the
result (`await await Task.WhenAny(...)` is idiomatic and looks wrong).

The losers **keep running**. Nothing cancels them, and if one later throws,
that exception is unobserved. Pass a `CancellationToken` and cancel the
stragglers.
</details>

---

### Q5 — the missing exceptions

Three tasks in a `WhenAll`, two of them throw. You `catch` and log. How many
exceptions did you log?

<details><summary>Answer</summary>

**One.** `await Task.WhenAll(...)` rethrows only the **first**.

All of them are captured on the task itself:

```csharp
var all = Task.WhenAll(tasks);
try { await all; }
catch (Exception) { throw all.Exception!; }   // every one
```

The second failure is not gone — it is somewhere your log isn't looking.
</details>

---

### Q6 — does it stop

One task in a `WhenAll` throws immediately. Do the others get cancelled?

<details><summary>Answer</summary>

**No.** `WhenAll` does not short-circuit; every task runs to completion
regardless.

Usually what you want. If the first failure makes the rest pointless, you
need a `CancellationToken`, not `WhenAll`.
</details>

---

### Q7 — the process died

Why can't a `try/catch` around a call to an `async void` method catch its
exception?

<details><summary>Answer</summary>

Because the method **returned** the moment it hit its first `await` — long
before it threw. And there is **no Task** to store the exception on, so it is
raised on the thread pool and **terminates the process**.

Legal only for event handlers, which must match a `void`-returning delegate.
Everywhere else, `async Task`.
</details>

---

### Q8 — the safe discard

What's wrong with `_ = SendEmailAsync();`?

<details><summary>Answer</summary>

It starts the work **and loses any failure**. Nothing observes the Task, so a
fault vanishes silently.

```csharp
_ = Observe();
async Task Observe() {
    try { await SendEmailAsync(); }
    catch (Exception e) { logger.LogError(e, "…"); }
}
```

The wrapper must also cover the **call**, since the method can throw
synchronously before returning a Task at all.
</details>

---

### Q9 — cooperative

You cancel a token. What actually stops the running work?

<details><summary>Answer</summary>

**Nothing, unless the work checks.** Cancellation is cooperative — there is no
thread abort. A token flips a flag; code that inspects it stops.

A `CancellationToken` parameter you accept and never check is a lie in your
signature.
</details>

---

### Q10 — where to check

A loop honours its token but a mid-run cancel changes nothing. Why?

<details><summary>Answer</summary>

The check is **before** the loop, not **inside** it. `ThrowIfCancellationRequested()`
has to be somewhere the loop actually reaches each iteration.

And pass the token *down* — `Task.Delay(ms, token)`, `ToListAsync(token)` —
so cancellation is prompt rather than "at the end of the current nap".
</details>

---

### Q11 — throw or return

`ThrowIfCancellationRequested()` versus checking `IsCancellationRequested` and
breaking — which is correct?

<details><summary>Answer</summary>

**Both, for different questions.** Throwing says *"this operation did not
happen"*; breaking says *"here is what I managed"*.

A cancelled HTTP request wants the first. A batch job draining a queue on
shutdown wants the second.

What you must never do is **silently** return partial results the caller
believes are complete.
</details>

---

### Q12 — two reasons to stop

You need to give up after 5 seconds *or* when the caller cancels. How?

<details><summary>Answer</summary>

```csharp
using var linked = CancellationTokenSource.CreateLinkedTokenSource(token);
linked.CancelAfter(5000);
return await work(linked.Token);
```

Pass `linked.Token` **into the work** so it is told to stop rather than
abandoned while it carries on burning a connection.

`using` matters: the linked source registers a callback on the parent token
and a timer, and leaking those per request adds up.
</details>

---

### Q13 — which exception

Catching only `TaskCanceledException` — what do you miss?

<details><summary>Answer</summary>

`ThrowIfCancellationRequested()`, which throws
**`OperationCanceledException`**.

`TaskCanceledException` *derives* from it, so catch the base type and you
cover both.
</details>

---

### Q14 — the ignored token

```csharp
await foreach (var x in ReadAll().WithCancellation(token)) { … }
```

You cancel. Nothing stops. The producer takes a `CancellationToken`. Why?

<details><summary>Answer</summary>

The parameter is missing **`[EnumeratorCancellation]`**. Without it,
`WithCancellation` has no way to reach your parameter — the code compiles and
the token is **silently ignored**.

The compiler warns (CS8425). Believe it.

(Related quirk: an async iterator must contain a `yield` even if its body only
throws — CS8420.)
</details>

---

### Q15 — stream or buffer

`Task<List<T>>` vs `IAsyncEnumerable<T>` — when does the difference matter?

<details><summary>Answer</summary>

`Task<List<T>>` **buffers**: wait for all of it, hold all of it in memory,
then start work.

`IAsyncEnumerable<T>` **streams**: the first item is usable immediately, memory
is proportional to one page, and if the consumer `break`s the producer never
runs again — its `finally` blocks run, closing cursors and responses.

Buffer when the result is small and you need all of it. Stream when it is
large, unbounded, or the consumer might stop early.
</details>
