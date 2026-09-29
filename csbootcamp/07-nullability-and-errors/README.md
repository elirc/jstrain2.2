# 07 · Nullability and Errors

Module 01 covered the null *operators*. This module is about the two ways a
method can tell its caller "that didn't work", and about picking the right
one — because the wrong choice is either an exception nobody catches or a
result nobody checks.

## The mental model

**1. Exceptions are for the exceptional.**

A broken invariant, a failed disk write, a bug. **Not** for a user typing a
bad email or a lookup coming up empty — those are ordinary outcomes, and
modelling them as exceptions costs you three things:

- they are **invisible in the signature** — nothing says what can throw
- the caller can **forget** them, and the compiler will not care
- they are **slow**, which matters on a hot path

**2. Put data on the exception, not just in the message.**

```csharp
class OrderNotFoundException(int orderId) : Exception($"order {orderId} not found")
{
    public int OrderId { get; } = orderId;
}
```

A caller acting on `ex.OrderId` still works after someone localises the
message. A caller parsing `ex.Message` does not.

**3. `throw;` preserves the stack trace. `throw ex;` resets it.**

The second makes the trace start at your catch block, so the actual throw
site is gone. When wrapping, keep the original as `InnerException` — losing
it is why so many logs say "processing failed" and nothing else.

**4. Exception filters decide *before* the stack unwinds.**

```csharp
catch (TransientException) when (attempt < attempts) { /* retry */ }
```

If the filter is false the exception continues with its original context
intact, and a debugger still breaks at the real throw site. Catch-check-
rethrow has already unwound by the time you decide.

**5. `Result<T>` puts expected failure in the type.**

```csharp
ParseAge(input).Then(CheckRange).Map(age => $"age {age}")
```

| | Function | Use for |
| --- | --- | --- |
| `Map` | `T → U` | a transformation that cannot fail |
| `Then` | `T → Result<U>` | another step that can fail |

Both short-circuit: on a failure the function never runs and the first error
wins. Using `Map` where you needed `Then` gives `Result<Result<U>>` — the
compiler telling you which one you wanted.

## The details that bite

1. **`finally` runs on success, on throw, and on the way out of a `return`.**
   It is what `using` compiles to, and the only reliable place for cleanup.

2. **Retrying a permanent failure is just latency.** A filter is how you retry
   one kind of failure and let another straight through.

3. **Catching `Exception` and logging is not handling.** If you cannot do
   something about it, let it reach the one place that turns exceptions into
   responses (module 14).

4. **Never echo an arbitrary `ex.Message` to a client.** It may hold a
   connection string or a file path (module 14/03).

5. **`Result<T>` is viral.** Once a method returns one, its callers must
   handle it — that is the point *and* the cost. Use it at boundaries you
   control, not for genuine bugs.

6. **A null reference or broken invariant should still throw.** `Result` is
   for expected failure, not for hiding defects.

## Choosing

| Situation | Use |
| --- | --- |
| Bad user input at an API boundary | validation → 400 (module 16) |
| A lookup that may legitimately miss | `T?` or `TryGet` |
| An expected domain failure you want callers to handle | `Result<T>` |
| A broken invariant / a bug | `throw` |
| I/O that failed | `throw`, catch at the edge |
| An operation cancelled | `OperationCanceledException` (module 08) |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-exceptions.cs` | ★★☆ | data-carrying exceptions, wrapping without losing the trace, retry via a filter |
| 02 | `02-the-result-pattern.cs` | ★★★ | `Result<T>` with `Map`/`Then` and short-circuiting |
| 03 | `03-nullable-reference-types.cs` | ★★☆ | guard clauses, `[NotNullWhen]`, and annotations that stop callers needing `!` |
| 04 | `04-disposal-and-cleanup.cs` | ★★☆ | `using`, reverse disposal order, and what a synchronous `Dispose` silently skips |
| 05 | `05-collecting-errors.cs` | ★★☆ | accumulating validation vs fail-fast, one error per field |
| 06 | `06-invariants-and-guards.cs` | ★★☆ | throw helpers, and validating *before* you mutate |

Do 01 and 02 in order; the rest are independent.

**02's last test is the summary of the Result half**: every bad input produced
a *value* describing the failure, and the compiler made the caller look at it.

**05 is the counterweight.** `Result` short-circuits, which is right for a
pipeline and wrong for a form. Knowing which one you are writing is most of
the judgement this module is trying to build.

**06 is the one that transfers furthest.** "Check before you change" is the
same rule as validating before the database write in capstone 23/01, and the
same rule as `Response.HasStarted` in module 14/03 — once the state has moved,
your error handling has fewer options than it thinks.

---

**Stuck?** `cheatsheets/csharp-basics.md` (null operators, exceptions) · **Deep dive:** `guides/01-value-vs-reference-and-null.md` · **Self-check:** `quizzes/07-middleware-and-pipeline.md` · **Next:** `csbootcamp/08-async-await`
