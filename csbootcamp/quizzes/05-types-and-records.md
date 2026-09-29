# 05 · Types, Records and Patterns

Covers modules 05 (classes, records, structs), 06 (interfaces and generics) and
09 (pattern matching).

Cover the answer, commit out loud, then reveal.

---

### Q1 — the one sentence

What does `record` give you that `class` does not?

<details><summary>Answer</summary>

**Value equality, `with`, deconstruction, and a readable `ToString`.**

Two records with identical property values are `Equal`; two classes with
identical property values are not. Everything downstream — `Distinct`,
`HashSet`, `Contains`, dictionary keys, assertion helpers — follows from that
one difference.
</details>

---

### Q2 — what does this print

```csharp
record Point(int X, int Y);

var a = new Point(1, 2);
var b = a with { Y = 5 };
Console.WriteLine($"{a} {b} {a == new Point(1, 2)}");
```

<details><summary>Answer</summary>

**`Point { X = 1, Y = 2 } Point { X = 1, Y = 5 } True`.**

`with` copies and changes — `a` is untouched. The generated `ToString` prints
the properties, and `==` compares by value.
</details>

---

### Q3 — class or struct

You are modelling a 2D coordinate that gets created in a tight loop, never
mutated, and is 8 bytes. Which?

<details><summary>Answer</summary>

**`readonly record struct`.** Small, immutable, value semantics, no heap
allocation.

The rough rule: struct if it is small (≤ 16 bytes is the usual guidance),
immutable, and behaves like a value. Class for anything with identity, anything
large, and anything you intend to mutate.

A **mutable** struct is the trap — copies mean your mutation lands on a copy
and vanishes. `readonly` makes the compiler stop you.
</details>

---

### Q4 — spot the bug

```csharp
struct Counter { public int Value; public void Bump() => Value++; }

var list = new List<Counter> { new Counter() };
list[0].Bump();
Console.WriteLine(list[0].Value);
```

<details><summary>Answer</summary>

**`0`. It compiles, runs, and does nothing.**

`list[0]` is a property call that returns a **copy**. `Bump()` increments the
copy, the copy is discarded, and the list never changes. No error, no warning
worth noticing.

Swap the `List` for an array and it prints `1` — arrays index to the actual
storage. The same line, two different behaviours, decided by the container.

Note that `list[0].Value = 5` *does* fail to compile (CS1612, "cannot modify
the return value"). The compiler catches the assignment and not the method
call, which is a thin line to be standing on. Make structs `readonly` and the
whole category disappears.
</details>

---

### Q5 — equality on a record with a list

```csharp
record Basket(string Owner, List<string> Items);

var a = new Basket("ada", ["milk"]);
var b = new Basket("ada", ["milk"]);
Console.WriteLine(a == b);
```

<details><summary>Answer</summary>

**`False`.**

The generated `Equals` compares each member with *its own* equality. `List<T>`
is a class with reference equality, so two distinct lists are never equal —
even with identical contents.

Records give you value equality over the members you have; they do not make
the members' equality deep. Use an `ImmutableArray<T>` with a custom `Equals`,
or compare with `SequenceEqual` explicitly.
</details>

---

### Q6 — what does `required` do

```csharp
class Options
{
    public required string Host { get; init; }
    public int Port { get; init; } = 80;
}
```

<details><summary>Answer</summary>

**The compiler refuses `new Options()`** unless `Host` is set in the object
initialiser.

It gives you "must be provided" without writing a constructor, and it composes
with `init` so the property is set once and never again. This is the modern way
to say a property is mandatory — better than a nullable field plus a runtime
check nobody runs.
</details>

---

### Q7 — interface with a body

Can an interface contain an implementation?

<details><summary>Answer</summary>

**Yes — default interface methods.** A member with a body that implementers may
override but need not.

Useful for adding a member to a published interface without breaking every
implementer. Not a substitute for a base class: there are no instance fields,
and the method is only callable through the interface type, not the concrete
one.
</details>

---

### Q8 — two interfaces, same member

A type implements `IReader` and `IWriter`, both of which declare `void Close()`.
How many `Close` methods does it need?

<details><summary>Answer</summary>

**One, if the behaviour is the same** — a single public `Close()` satisfies
both.

If they must differ, use **explicit implementation**:

```csharp
void IReader.Close() { … }
void IWriter.Close() { … }
```

Explicitly implemented members are not on the concrete type's public surface —
you have to cast to the interface to call them. That is the feature: it keeps a
type's public API clean when it implements an interface for plumbing reasons.
</details>

---

### Q9 — what does the constraint buy you

```csharp
static T Max<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) >= 0 ? a : b;
```

<details><summary>Answer</summary>

**The ability to call `CompareTo` at all.** Without a constraint, `T` is only
`object` and the method has nothing to work with.

Common constraints: `where T : class`, `where T : struct`, `where T : new()`,
`where T : SomeBase`, `where T : IInterface`, and — newer and very useful —
`where T : INumber<T>` for arithmetic that works across `int`, `double` and
`decimal` alike.
</details>

---

### Q10 — trace the switch

```csharp
string Describe(object o) => o switch
{
    int n when n < 0 => "negative",
    0                => "zero",
    int              => "positive",
    string { Length: 0 } => "empty string",
    string s         => $"string of {s.Length}",
    null             => "null",
    _                => "something else",
};
```

What does `Describe(0)` return, and what about `Describe(null)`?

<details><summary>Answer</summary>

**`"zero"` and `"null"`.**

Arms are tested **top to bottom**, first match wins — so ordering is
behaviour, not style. The `when` clause runs only after the type pattern
matches.

Note `null` needs its own arm: a type pattern like `string s` never matches
null, and without the arm you would fall to `_`.
</details>

---

### Q11 — property patterns

Rewrite this as one pattern.

```csharp
if (order != null && order.Customer != null && order.Customer.Country == "GB"
    && order.Total > 100)
```

<details><summary>Answer</summary>

```csharp
if (order is { Customer.Country: "GB", Total: > 100 })
```

The outer `{ }` already excludes null, and nested property patterns short-
circuit on any null along the path. Relational patterns (`> 100`) work inside
too, and so do `and`/`or`/`not`.
</details>

---

### Q12 — what is the difference

```csharp
if (shape is Circle c) …
var area = shape switch { Circle c => …, Square s => … };
```

<details><summary>Answer</summary>

**Same pattern, two contexts.** `is` is a boolean test that also binds; `switch`
is an expression that must produce a value.

The switch expression's advantage is **exhaustiveness**: the compiler warns
when you have not covered every case, which an `if` chain will never do. That
warning is the reason to prefer it for closed hierarchies.
</details>

---

### Q13 — spot the bug

```csharp
record Money(decimal Amount, string Currency)
{
    public static Money operator +(Money a, Money b)
        => new(a.Amount + b.Amount, a.Currency);
}
```

<details><summary>Answer</summary>

**It adds euros to dollars without noticing.** `b.Currency` is never checked.

```csharp
=> a.Currency == b.Currency
    ? new(a.Amount + b.Amount, a.Currency)
    : throw new InvalidOperationException($"cannot add {a.Currency} to {b.Currency}");
```

The general lesson: when a type carries a unit, every operation has to agree
about the unit, and the type is the only place that check will reliably live.
</details>

---

### Q14 — deconstruction

```csharp
record Point(int X, int Y);
var (x, y) = new Point(3, 4);
```

Why does that work, and how do you get it on a class?

<details><summary>Answer</summary>

**Records generate a `Deconstruct` method** from their positional parameters.

Any type gets it by writing one:

```csharp
public void Deconstruct(out int x, out int y) => (x, y) = (X, Y);
```

Once it exists, positional patterns work too: `p is (0, 0)`.
</details>

---

### Q15 — the one to remember

You are choosing between `class`, `record` and `struct` for a DTO that crosses
your API boundary. Which, and why?

<details><summary>Answer</summary>

**`record`.**

It is immutable by default, so nothing downstream can quietly modify a request
after validation. It has value equality, so tests compare naturally. It prints
readably, so a failing assertion tells you what it actually got. And `with`
gives you cheap derived copies.

Reach for `class` when the thing has identity and lifecycle (an EF entity, a
service). Reach for `struct` only when it is small, immutable and allocated in
bulk.
</details>

---

**Cheatsheet:** [`../cheatsheets/csharp-basics.md`](../cheatsheets/csharp-basics.md) · **Deep dive:** [`../guides/01-value-vs-reference-and-null.md`](../guides/01-value-vs-reference-and-null.md)
