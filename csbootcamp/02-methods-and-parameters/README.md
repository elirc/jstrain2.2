# 02 · Methods and Parameters

Method signatures in C# carry more information than in most languages: how an
argument is passed (`out`, `ref`, `in`), whether it can be omitted, whether it
soaks up a variable number of values, and which of several same-named methods
the compiler will actually pick. Every one of those decisions is made at
*compile time* at the *call site*, which is why the surprises here are so
consistently surprising.

## The mental model

**1. Defaults are baked into the caller.**

```csharp
void Log(string msg, int level = 1) { }
Log("hi");   // the compiler rewrites this to Log("hi", 1)
```

The literal `1` is copied into the calling assembly. Ship a library, change
the default to `2`, and callers keep using `1` until they recompile. That is
why defaults must be compile-time constants — and why a public library's
defaults are part of its binary contract.

**2. `out` / `ref` / `in` pass the variable, not the value.**

| Modifier | Caller must initialise | Method must assign | Method may read |
| --- | --- | --- | --- |
| `out` | no | **yes** | not before assigning |
| `ref` | **yes** | no | yes |
| `in` | **yes** | no (read-only) | yes |

`out` powers the `TryX` pattern — `int.TryParse`, `Dictionary.TryGetValue` —
which reports expected failure without exceptions and without allocating.

**3. Overload resolution prefers the most specific applicable method.**

Roughly: exact type match → implicit conversion → `params` expansion. A
`params` overload is always the last resort, so `Describe(42)` picks
`Describe(int)` over `Describe(params int[])` every time.

**4. A lambda that captures a local turns it into a heap object.**

```csharp
Func<int> Counter() { var n = 0; return () => ++n; }
```

`n` outlives `Counter`, because the compiler moved it into a generated class.
That is all a closure is — no magic, just a rewrite. Two calls to `Counter()`
make two objects, so two independent counters.

**5. `yield return` defers everything.**

A method containing `yield` doesn't execute when called; it returns a state
machine. The body runs one `MoveNext()` at a time as the caller enumerates.

## The details that bite

1. **Validation inside an iterator method runs late.** `ArgumentException`
   thrown next to a `yield return` fires on first enumeration, not at the
   call — possibly never. Split it: a normal method that validates, returning
   a local iterator function. Every BCL LINQ operator is written this way.

2. **Extension methods accept a null receiver.** `((string?)null).IsBlank()`
   does not throw, because the call compiles to a static call with `null` as
   an argument. Useful for `OrEmpty()`; startling the first time you see it.

3. **`counter++` returns the old value.** Use `++counter` when you want the
   new one. Half of all off-by-one bugs in counters are this.

4. **Re-using one buffer across `yield return`s is a bug.** Every consumer
   gets the same mutating list. Allocate a fresh one per chunk.

5. **Named arguments are part of your public API.** Rename a parameter and
   any caller using `size:` breaks. Renaming parameters is a breaking change.

6. **Optional parameters and overloads together create ambiguity.** If both
   `F(int)` and `F(int, int = 0)` exist, `F(1)` is ambiguous. Prefer one or
   the other, not both.

7. **`params` with no arguments passes a zero-length array, not null.** So
   `values.Length` is always safe.

## Cheat table

| You want | Signature |
| --- | --- |
| Might-fail parse, no allocation | `bool TryX(string s, out T value)` |
| Swap / mutate the caller's variable | `void F<T>(ref T a)` |
| Pass a big struct read-only, no copy | `void F(in BigStruct s)` |
| Variable argument count | `void F(params T[] items)` |
| A function value | `Func<TIn, TOut>` / `Action<T>` |
| Add a method to a type you don't own | `static class X { static R F(this T t) }` |
| Lazy sequence | `IEnumerable<T>` + `yield return` |
| Lazy sequence with eager validation | normal method + local iterator function |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-optional-and-named.cs` | ★☆☆ | a clamping pager, driven by named arguments |
| 02 | `02-out-and-ref.cs` | ★★☆ | your own TryDivide, Swap and Bump |
| 03 | `03-delegates-and-lambdas.cs` | ★★☆ | Memoize, Compose and an independent Counter |
| 04 | `04-extension-methods.cs` | ★★☆ | IsBlank / Truncate / OrEmpty / Batch |
| 05 | `05-params-and-overloads.cs` | ★★☆ | four overloads, and predicting which one runs |
| 06 | `06-local-functions-and-iterators.cs` | ★★★ | eager validation over a deferred iterator |

Do the warm-ups and core in order. Stretch if time allows — 06 is the one
that explains a whole class of "why didn't my exception fire?" bugs, so it is
worth the time even out of order.

---

**Stuck?** `cheatsheets/csharp-basics.md` (signatures, delegates, extension methods) · **Self-check:** `quizzes/02-methods-and-delegates.md` · **Next:** `csbootcamp/08-async-await` (then the web track — see `FLIGHTPLAN.md` for why 03–07 and 09–12 come later)
