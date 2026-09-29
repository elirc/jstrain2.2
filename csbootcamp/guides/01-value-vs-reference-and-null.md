# Value, Reference, and Null

*Read when: something mutated that you didn't expect, a "copy" wasn't a copy,
a struct behaved strangely in a collection, or the compiler is warning about
null on a line you're sure is safe.*

Pairs with [`01-csharp-language-core`](../01-csharp-language-core/).

---

## 1. Two kinds of variable

Every C# variable holds one of two things:

- a **value type** variable holds the data itself
- a **reference type** variable holds the *address* of data elsewhere

```csharp
struct S { public int X; }
class  C { public int X; }

var s1 = new S { X = 1 };  var s2 = s1;  s2.X = 99;   // s1.X == 1
var c1 = new C { X = 1 };  var c2 = c1;  c2.X = 99;   // c1.X == 99
```

Assignment always copies **the variable's contents**. For `S` that is the
data; for `C` that is an address, and now two names point at one object.

The list, memorised once:

| Value types | Reference types |
| --- | --- |
| `int`, `long`, `float`, `double`, `decimal` | `class` |
| `bool`, `char` | `string` |
| `struct`, `enum` | arrays, `List<T>`, `Dictionary<K,V>` |
| `DateTime`, `DateTimeOffset`, `TimeSpan`, `Guid` | delegates, `Func<>`, `Action<>` |
| tuples `(int, string)` | `record` (unless `record struct`) |
| `Nullable<T>` | `object`, `dynamic` |

`string` is the one that trips people: it *is* a reference type, but because
it is **immutable** you can never observe the sharing. Every "modification"
returns a new string and leaves the original alone, so it behaves like a
value. That immutability is also why building a string in a loop with `+=` is
O(n²) — n intermediate strings for one answer. `StringBuilder` keeps one
growable buffer.

## 2. Parameters copy the variable, not the object

```csharp
void MoveCopy(PointStruct p)  { p.X += 10; }   // caller unaffected
void MoveShared(PointClass p) { p.X += 10; }   // caller SEES this
void Reassign(PointClass p)   { p = new(); }   // caller does NOT see this
```

The third one is the subtle case. `p` is a *copy of the reference*. Mutating
what it points at is visible to the caller; pointing it somewhere else is not,
because you only changed your own copy of the address.

To reassign the caller's variable you need `ref`, which passes the **storage
location** itself:

```csharp
void Swap<T>(ref T a, ref T b) => (a, b) = (b, a);   // works for BOTH kinds
```

That is why `ref` is orthogonal to value-vs-reference: it is about the
*variable*, not the data.

The three modifiers, and the contract each one signs:

| Modifier | Caller must initialise | Method must assign | Method may read |
| --- | --- | --- | --- |
| `out` | no | **yes, on every path** | not before assigning |
| `ref` | **yes** | no | yes |
| `in` | **yes** | no (read-only) | yes |

`out`'s "must assign on every path" is what makes `out var` safe at the call
site — the compiler guarantees something was written, which is why the `TryX`
pattern works without a null check.

## 3. The leaky accessor

This is the bug the whole distinction exists to prevent:

```csharp
class Order {
    private readonly List<Item> _items = [];
    public List<Item> Items => _items;         // ← hands out a live handle
}

order.Items.Clear();      // callers can gut your object
```

`readonly` on the field means the *reference* cannot be reassigned. It says
nothing about the list's contents. `_items.Add(...)` is still legal, from
anywhere that can reach it.

Three levels of defence, in increasing order of strength:

```csharp
public IReadOnlyList<Item> Items => _items;          // intent, but castable back
public IEnumerable<Item> Items => _items.AsReadOnly(); // a real read-only view
public List<Item> Snapshot() => new(_items);           // a copy — diverges after
```

And note that the copy is **shallow**. `new List<Item>(_items)` gives you a
new list holding the *same* `Item` objects; mutate one and both lists see it.
Depth is a decision you make on purpose:

```csharp
new List<Item>(_items)                         // shallow
_items.Select(i => i with { }).ToList()        // one level deeper (records)
JsonSerializer.Deserialize<List<Item>>(json)   // deep, via a round trip
```

There is no built-in deep clone in .NET, and that is deliberate — the runtime
cannot know how deep you meant.

## 4. Structs are not just "cheap classes"

A `struct` is copied on **every** assignment, argument pass, and return. That
is fast for small types and quietly expensive for large ones. It also produces
behaviour that looks like a bug:

```csharp
var list = new List<PointStruct> { new() { X = 1 } };
// list[0].X = 99;        // does not compile: list[0] returns a COPY
var p = list[0]; p.X = 99; list[0] = p;   // the honest version
```

The compiler blocks the first line precisely because it would have modified a
temporary and thrown your write away. With an array — `array[0].X = 99` — it
*does* compile and *does* work, because array indexing yields a direct
reference to the element. Same syntax, different semantics, depending on the
container.

Guidance: use `struct` for small, immutable, value-like things — a `Money`, a
`Point`, a `Temperature` — ideally as `readonly record struct`, which gives
you value equality, a fast generated `GetHashCode`, and a compiler guarantee
that nothing mutates. Use `class` for everything with identity or a lifecycle.

The default `ValueType.Equals` on a struct compares fields for you, but does
it via **reflection** for non-blittable types — correct and slow, and called
on every dictionary lookup. `record struct` generates a fast one.

## 5. Equality has three separate meanings

```csharp
ReferenceEquals(a, b)   // the same object?
a.Equals(b)             // equivalent by the type's own rules?
a == b                  // whatever the type's operator says (or reference identity)
```

For a `class`, all three default to reference identity — two `Money` objects
with identical fields are *not* equal. For a `record` or `struct`, `Equals`
and `==` are value-based.

If you override `Equals` you must override `GetHashCode`, and they must use
**the same members**:

```csharp
public override bool Equals(object? o)
    => o is Money m && Amount == m.Amount && Currency == m.Currency;

public override int GetHashCode() => HashCode.Combine(Amount, Currency);
```

The contract is one-directional: **equal objects must have equal hash codes**;
unequal ones *may* collide. Hash-based collections bucket by hash first and
only call `Equals` within a bucket, so violating it means two "equal" objects
land in different buckets and never meet — `HashSet` stops deduplicating,
`Dictionary` lookups miss.

`HashCode.Combine` because `a.GetHashCode() ^ b.GetHashCode()` is commutative
(so `(1, 2)` and `(2, 1)` collide) and clusters badly on similar inputs.

The worst part: a *bad but consistent* hash still gives **correct answers** —
collisions fall back to `Equals` — so the bug never fails a test. It surfaces
months later as a performance cliff.

Writing `operator ==` has one trap:

```csharp
public static bool operator ==(Money? a, Money? b) {
    if (ReferenceEquals(a, b)) return true;   // covers both-null
    if (a is null || b is null) return false; // `a == null` would RECURSE
    return a.Equals(b);
}
```

Use `is null`, never `== null`, inside your own `==`.

Or write `record Money(decimal Amount, string Currency);` and get all of it —
`Equals`, `GetHashCode`, `==`, `!=`, `ToString`, `Deconstruct`, `with` — in one
line. Write the manual version once so you can recognise what the compiler
generates, then stop writing it.

## 6. Null is a type, not a value

With nullable reference types on (the default), the compiler tracks
nullability through your code:

```csharp
string  never;   // the compiler will complain if you assign null
string? maybe;   // allowed to be null, and it tracks where
```

This is **compile-time only**. Nothing changes at runtime, and nothing stops
null arriving from a JSON deserialiser, a reflection call, or a library
compiled without the feature. It is a very good linter, not a guarantee.

The operators that replace hand-written null checks:

```csharp
a ?? b                  // a, unless null, then b
a ??= b                 // assign only if a is null
x?.Y                    // null if x is null, else x.Y
x?.Y?.Z ?? "fallback"   // each ? short-circuits the ENTIRE rest of the chain
```

That short-circuit is the important part. `user?.Address?.City ?? "unknown"`
handles *three* null cases — user, address, and city — in one line. Written by
hand it is three nested `if`s, and one of them is the one you forget.

The one to be careful with is `!`, the null-forgiving operator:

```csharp
var name = user!.Name;   // "trust me, compiler"
```

It suppresses the warning and changes nothing else. If you are wrong, you get
a `NullReferenceException` at exactly the point you told the compiler to stop
helping. Every `!` is a claim you are making without evidence; prefer a real
check, and when you must use one, leave a comment saying why it holds.

## 7. Two kinds of absence

A dictionary lookup can fail in two genuinely different ways, and conflating
them causes real bugs:

```csharp
var config = new Dictionary<string, string?> { ["debug"] = null };

config["missing"]                    // THROWS KeyNotFoundException
config.GetValueOrDefault("debug")    // null — but so is a missing key
config.TryGetValue("debug", out var v)  // true, v == null
config.TryGetValue("missing", out var w) // false, w == null
```

Only `TryGetValue` can tell "the key isn't there" from "the key is there and
holds null". When both should fall back to the same default, this collapses
them deliberately and readably:

```csharp
(config.TryGetValue(key, out var value) ? value : null) ?? fallback
```

The same distinction is why `PATCH` DTOs use nullable members. `bool? Done`
lets you tell "the client didn't send this field" (`null`) from "the client
set it to false". With `bool Done`, an absent field deserialises to `false`
and your PATCH silently un-completes every task it touches. Real bug, shipped
often.

## 8. `default` is not always null

```csharp
default(int)          // 0
default(bool)         // false
default(DateTime)     // 0001-01-01
default(string)       // null
default(Guid)         // 00000000-0000-0000-0000-000000000000
default(SomeStruct)   // every field zeroed, no constructor ran
```

That last one matters: a struct's default instance skips your constructor
entirely. A `struct Temperature` that validates its range in a constructor can
still exist as `default` with a value of zero, and there is nothing you can do
to prevent it. If invalid states must be unrepresentable, use a class or a
record class, where `null` at least announces itself.

It is also why `FirstOrDefault()` on a list of structs returns a zeroed struct
rather than null, which reads as a legitimate result. `.FirstOrDefault()` on
`List<int>` returning `0` is indistinguishable from finding an actual `0` —
use `.Cast<int?>().FirstOrDefault()` or `Any()` first when the difference
matters.

---

## The short version

1. Value types copy on assignment; reference types share. `string` is a
   reference type that acts like a value because it is immutable.
2. Parameters copy the *variable*. You can mutate the object a reference
   points at, but not reassign the caller's variable — that needs `ref`.
3. `readonly` on a collection field protects the reference, not the contents.
   Hand out a copy or a read-only view.
4. Every copy is shallow until you make it deep, on purpose.
5. Structs copy constantly; `list[0].X = 99` doesn't compile for a reason.
   Prefer `readonly record struct` for small value-like types.
6. Override `Equals` and `GetHashCode` together, from the same members, or
   hash-based collections quietly misbehave — and still pass your tests.
7. Nullable reference types are a compile-time linter, not a runtime
   guarantee. Every `!` is an unevidenced claim.
8. `?.` short-circuits the whole chain; `??` supplies the default once.
9. "Missing" and "null" are different. Only `TryGetValue` distinguishes them —
   and that distinction is what makes `PATCH` work.
10. `default(T)` for a struct skips your constructor.
