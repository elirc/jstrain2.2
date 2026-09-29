# 02 · Methods and Delegates — parameters, closures, iterators

Cover the answer, commit out loud, then reveal.

---

### Q1 — whose default?

You ship a library with `void Log(string m, int level = 1)`. You change the
default to `2` and publish v2. A consumer upgrades the DLL without
recompiling. What level do their existing `Log("hi")` calls use?

<details><summary>Answer</summary>

**1** — the old one. Default values are **baked into the call site** at compile time; the compiler rewrote `Log("hi")` as `Log("hi", 1)` in *their* assembly.

Consequences: defaults must be compile-time constants, and a public library's defaults are part of its **binary contract**. Changing one is a silent behaviour change that only takes effect on recompile.
</details>

---

### Q2 — out obligations

Why won't this compile?

```csharp
bool TryDivide(int a, int b, out int q) {
    if (b == 0) return false;
    q = a / b;
    return true;
}
```

<details><summary>Answer</summary>

An `out` parameter must be **definitely assigned on every path** out of the method. The early `return false` leaves `q` unassigned.

Add `q = 0;` before it. That rule is exactly what makes `out var` safe to read at the call site — the compiler guarantees something was written.
</details>

---

### Q3 — ref vs nothing

```csharp
void Swap<T>(T a, T b) => (a, b) = (b, a);
```

What does the caller observe?

<details><summary>Answer</summary>

**Nothing.** The method swapped its own two local copies. The caller's variables are untouched.

`ref T` passes the **storage location**, not the value or the reference — which is why `ref` works for both value and reference types. Note this is different from passing a class: without `ref`, you can *mutate the object* a reference points at, but you cannot *reassign the caller's variable*.
</details>

---

### Q4 — which overload

Given `Describe(int)`, `Describe(double)`, `Describe(string)`, and
`Describe(params int[])` — which runs for `Describe(42)`?

<details><summary>Answer</summary>

**`Describe(int)`.** A method applicable in **normal form** always beats one applicable only in **expanded form** (params expansion is the last resort).

Delete the `int` overload and the same call silently starts hitting the params one and returning something different. Overload resolution order, roughly: exact match → implicit conversion → params expansion.
</details>

---

### Q5 — off by one, the counter edition

```csharp
int Bump(ref int n) => n++;
var c = 41;
Console.WriteLine(Bump(ref c));   // ?
Console.WriteLine(c);             // ?
```

<details><summary>Answer</summary>

**`41`** then **`42`**. `n++` is *post*-increment: it stores the new value and **returns the old one**.

`++n` returns the new value. Half of all off-by-one bugs in counters, retry limits and index arithmetic are this.
</details>

---

### Q6 — two counters

```csharp
Func<int> Counter() { var n = 0; return () => ++n; }
var a = Counter(); var b = Counter();
a(); a(); a();
Console.WriteLine(b());   // ?
```

<details><summary>Answer</summary>

**`1`.** Each call to `Counter()` runs the method again, creating a **separate** local `n`, captured by a separate closure object.

A closure is not magic: the compiler moved `n` into a generated class so it can outlive the method. Two invocations, two instances. Use a `static` field instead and both counters share state — which is the bug this question exists to catch.
</details>

---

### Q7 — the null receiver

```csharp
public static bool IsBlank(this string? s) => string.IsNullOrWhiteSpace(s);
((string?)null).IsBlank();
```

Does that throw?

<details><summary>Answer</summary>

**No.** The call compiles to `Extensions.IsBlank(null)` — a static call with `null` as an argument. There is no dereference, so there is no `NullReferenceException`.

Genuinely useful (`OrEmpty()` on a possibly-null sequence removes a whole category of null checks) and genuinely startling the first time. Note it works *only* because the parameter is declared `string?`.
</details>

---

### Q8 — the exception that never fires

```csharp
IEnumerable<T> Take<T>(IEnumerable<T> src, int count) {
    if (count < 0) throw new ArgumentOutOfRangeException();
    foreach (var x in src) { yield return x; }
}

Take(items, -1);   // does this throw?
```

<details><summary>Answer</summary>

**No.** The method contains `yield`, so calling it just builds a state machine and returns immediately. The body — including the validation — does not run until the first `MoveNext()`. With no enumeration, it never runs at all.

The fix is the two-method split every BCL LINQ operator uses: a normal method that validates and returns a **local iterator function**.

```csharp
IEnumerable<T> Take<T>(IEnumerable<T> src, int count) {
    ArgumentOutOfRangeException.ThrowIfNegative(count);   // runs NOW
    return Iterate();
    IEnumerable<T> Iterate() { … yield … }                // runs later
}
```
</details>

---

### Q9 — how many pulls

`Take(source, 2)` where source is a five-element iterator. How many elements
should it pull, and how do you get that?

<details><summary>Answer</summary>

**Exactly 2.** Yield first, then decide:

```csharp
foreach (var x in src) { yield return x; if (++taken == count) yield break; }
```

Checking the count *before* yielding pulls a third element before deciding to stop. Irrelevant for an array; expensive when the source is a database cursor, a network stream, or a paged API.
</details>

---

### Q10 — the shared buffer

```csharp
var buffer = new List<T>(size);
foreach (var item in items) {
    buffer.Add(item);
    if (buffer.Count == size) { yield return buffer; buffer.Clear(); }
}
```

What's the bug?

<details><summary>Answer</summary>

Every consumer gets **the same list object**. Anyone who holds onto a chunk (or calls `.ToList()` on the outer sequence before enumerating the inner ones) sees it mutate under them — by the end, every chunk looks identical.

Fix: `buffer = new List<T>(size);` instead of `Clear()`. A fresh buffer per chunk.

Sneaky because a test that immediately projects each chunk with `.Select(b => b.ToList())` hides it.
</details>

---

### Q11 — naming is API

Is renaming a method parameter a breaking change?

<details><summary>Answer</summary>

**Yes**, for any caller using **named arguments** — `Page(items, size: 2)` stops compiling if you rename `size`.

Parameter names are part of your public surface, same as the method name. This surprises people who think only types matter.
</details>

---

### Q12 — params, empty

```csharp
static string Describe(params int[] values) => "many:" + values.Length;
Describe();   // ?
```

<details><summary>Answer</summary>

**`"many:0"`** — a params call with no arguments passes a **zero-length array**, never `null`. So `values.Length` is always safe and you never need a null check.

`Describe(new[] { 1, 2 })` also works: an array argument matches the params parameter in normal form, no expansion needed.
</details>

---

### Q13 — memoizing the wrong thing

What kind of function must you never memoize?

<details><summary>Answer</summary>

An **impure** one — anything with side effects, or whose result depends on time, randomness, I/O, or mutable external state.

Memoization replaces the second and subsequent calls with a cached value, so the side effect happens once and the stale result is returned forever. `Memoize(GetCurrentPrice)` is a bug factory.

Also worth knowing: caching the *result* means an f that **throws** is not cached, so the next call retries.
</details>

---

### Q14 — Func shape

What are the parameter and return types of `Func<string, int, bool>`?

<details><summary>Answer</summary>

Takes a `string` and an `int`, returns a **`bool`**. In `Func<...>` the **last** type argument is always the return type.

`Action<string, int>` takes the same two and returns nothing. `Func<bool>` takes nothing and returns `bool`.
</details>

---

### Q15 — where it shows up

Where do delegates appear in an ASP.NET Core app?

<details><summary>Answer</summary>

Nearly everywhere:

- an **endpoint handler** is a delegate (`app.MapGet("/x", () => …)`)
- **middleware** is a closure over `next` (`app.Use(async (ctx, next) => …)`)
- **DI factory registrations** (`AddSingleton(sp => …)`)
- every **LINQ** operator's lambda
- `IOptions` configuration callbacks

Which is why this module is on the critical path to the web modules even
though it looks like pure language study.
</details>
