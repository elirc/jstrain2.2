# 01 · Language Core — types, value semantics, null, ranges, equality

Cover the answer, commit out loud, then reveal. If you hedge, you got it wrong.

---

### Q1 — the division

What does this print?

```csharp
double half = 7 / 2;
Console.WriteLine(half);
```

<details><summary>Answer</summary>

**`3`** — both operands are `int`, so integer division runs and produces `3`. The widening to `double` happens *afterwards*, on a value that has already lost its fraction.

The type of an expression comes from its operands, never from where you assign it. `7 / 2.0` or `(double)7 / 2` gives `3.5` — cast **one operand**, not the result. `(double)(7 / 2)` is the classic wrong fix.
</details>

---

### Q2 — banker in the building

```csharp
Console.WriteLine(Math.Round(2.5));
Console.WriteLine(Math.Round(3.5));
```

<details><summary>Answer</summary>

**`2`** and **`4`** — `Math.Round` defaults to `MidpointRounding.ToEven` ("banker's rounding"), which rounds to the nearest even number to avoid statistical bias when you round millions of values.

For money you almost always want `Math.Round(x, 2, MidpointRounding.AwayFromZero)`. Say it explicitly; the default will surprise an auditor.
</details>

---

### Q3 — money and floats

Why is `decimal` the right type for a price and `double` wrong?

<details><summary>Answer</summary>

`double` is **binary** floating point: it stores fractions as sums of powers of two, and `0.1` has no exact binary representation. So `0.1 + 0.2 == 0.30000000000000004`, and a million of those drift.

`decimal` is **base-10** floating point — it represents exactly the values humans write on invoices, at the cost of range and speed. `0.1m + 0.2m == 0.3m` exactly.

Rule: `decimal` for money, `double` for measurements and ratios.
</details>

---

### Q4 — the silent wrap

```csharp
int x = int.MaxValue;
Console.WriteLine(x + 1);
```

<details><summary>Answer</summary>

**`-2147483648`** — `int.MinValue`. Integer arithmetic **wraps silently** in a release build; nobody tells you.

`checked { x + 1 }` throws `OverflowException` instead. Use it anywhere a total could plausibly get large — a wrapped total that goes negative is far worse than an exception.
</details>

---

### Q5 — copy or alias

```csharp
struct S { public int X; }
class  C { public int X; }

var s1 = new S { X = 1 }; var s2 = s1; s2.X = 99;
var c1 = new C { X = 1 }; var c2 = c1; c2.X = 99;
// s1.X? c1.X?
```

<details><summary>Answer</summary>

**`s1.X == 1`, `c1.X == 99`.**

A `struct` is a value type: assignment copies every field, so `s2` is a separate thing. A `class` is a reference type: assignment copies the *reference*, so `c1` and `c2` name the same heap object.

This is the root of almost every "why did that change?" bug in C#. Value types: `int`, `bool`, `char`, `double`, `decimal`, `struct`, `enum`, `DateTime`, tuples. Everything else is a reference type.
</details>

---

### Q6 — the leaky getter

```csharp
List<int> SafeCopy(List<int> source) => source;
```

What's wrong, and what's the fix?

<details><summary>Answer</summary>

It hands the caller a **live handle on your own list**. They can `Add` to it and mutate your internal state; you can mutate it under them. It passes any test that only checks contents.

Fix: `new List<int>(source)` — a new backing array with the elements copied in.

Note that for a list of a *reference* type this is still a **shallow** copy: the elements are shared. Depth is a decision you make on purpose, not a default you inherit.
</details>

---

### Q7 — the chain

```csharp
string City(User? user) => user?.Address?.City ?? "unknown";
```

How many null cases does that one line handle?

<details><summary>Answer</summary>

**Three.** Each `?.` short-circuits the **entire rest of the chain**, so `user == null`, `Address == null`, and `City == null` all land on `"unknown"`.

Written by hand that is three nested `if`s. The `??` supplies the default exactly once, at the end.
</details>

---

### Q8 — missing vs null

For `Dictionary<string, string?>`, what's the difference between these?

```csharp
config["debug"]
config.TryGetValue("debug", out var v)
config.GetValueOrDefault("debug")
```

<details><summary>Answer</summary>

- `config["debug"]` **throws `KeyNotFoundException`** when the key is absent.
- `TryGetValue` returns `false` and never throws — the safe default.
- `GetValueOrDefault` returns `null` for absent, and you cannot tell "absent" from "present but null".

With a nullable value type there are genuinely **two kinds of absence**, and they often want different handling:
`(config.TryGetValue(k, out var v) ? v : null) ?? fallback` covers both.
</details>

---

### Q9 — the exclusive end

```csharp
int[] items = [10, 20, 30, 40, 50];
// items[1..3]?  items[^1]?  items[^2..]?  items[^0..]?
```

<details><summary>Answer</summary>

- `items[1..3]` → **`[20, 30]`** — the end of a range is **exclusive**.
- `items[^1]` → **`50`** — `^1` is the last element (`^0` is one past the end).
- `items[^2..]` → **`[40, 50]`**.
- `items[^0..]` → **`[]`** — the empty slice. That is precisely what makes clamping work: `items[^Math.Clamp(n, 0, Length)..]` handles `n == 0` with no special case.
</details>

---

### Q10 — the German server

Your tests pass locally and the price parsing breaks in the Frankfurt region. Why?

<details><summary>Answer</summary>

`decimal.Parse("1.50")` uses **`CurrentCulture`**. In `de-DE`, `.` is the *thousands* separator, so `"1.50"` parses as **150**.

Always pass `CultureInfo.InvariantCulture` when parsing or formatting anything that came off the wire. The wire format is a protocol, not a human preference.

Same class of bug: `ToString()` on a `double` emitting `4,2`, and `DateTime.Parse` reading `03/04` as April 3rd or March 4th depending on where the container landed.
</details>

---

### Q11 — Parse vs TryParse

Why is `int.Parse` the wrong choice for a query-string value?

<details><summary>Answer</summary>

Bad input from a user is **normal, not exceptional**. `Parse` throws, and exceptions are expensive — a per-field exception on a busy endpoint is a real availability problem, and an attacker can trigger it deliberately.

`TryParse` returns a `bool` and costs nothing. It also forces you to decide what a bad value *means* (a 400, a default, a validation message) instead of letting an exception decide for you somewhere far away.
</details>

---

### Q12 — the hash contract

You override `Equals` on a class but not `GetHashCode`. What breaks, and when?

<details><summary>Answer</summary>

`Dictionary`, `HashSet`, `Distinct`, `GroupBy`, `Contains` — anything hash-based. They bucket by hash **first** and only call `Equals` within a bucket, so two "equal" objects with different hashes land in different buckets and never meet.

The contract: **equal objects must return the same hash code.** Unequal ones *may* collide. Derive both from the same members, and use `HashCode.Combine(a, b)` — `a.GetHashCode() ^ b.GetHashCode()` is commutative and clusters badly.

Nastiest part: a bad hash still gives *correct answers* in small tests (collisions fall back to `Equals`), so it surfaces as a performance cliff months later.
</details>

---

### Q13 — infinite recursion

What's wrong here?

```csharp
public static bool operator ==(Money? a, Money? b) => a == b;
```

<details><summary>Answer</summary>

`a == b` **calls this same operator** — infinite recursion, `StackOverflowException`.

The correct shape:

```csharp
if (ReferenceEquals(a, b)) return true;   // covers both-null
if (a is null || b is null) return false;
return a.Equals(b);
```
</details>

---

### Q14 — one line instead of forty

```csharp
sealed record MoneyRecord(decimal Amount, string Currency);
```

What does that generate?

<details><summary>Answer</summary>

Value-based `Equals`, a matching `GetHashCode`, `operator ==` and `!=`, `ToString()` rendering `MoneyRecord { Amount = 9.99, Currency = USD }`, a `Deconstruct`, and a `with` expression for non-destructive copies.

Unless you need custom semantics, this is the right answer for a data type. Write the hand-rolled version once so you can recognise what the compiler is doing for you — then stop writing it.
</details>

---

### Q15 — struct equality for free

Two `struct`s with identical fields compare equal with no code from you. Why is that still worth overriding?

<details><summary>Answer</summary>

The default `ValueType.Equals` uses **reflection** to walk the fields (unless the struct is blittable), which is dramatically slower than a hand-written comparison — and it is called on every dictionary lookup.

Use `record struct`, which generates a fast one, or override `Equals`/`GetHashCode` yourself. "It already works" and "it works efficiently" are different claims.
</details>
