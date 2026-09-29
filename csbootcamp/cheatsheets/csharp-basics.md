# C# basics — offline reference

Covers modules 01–02: types, operators, strings, parsing, signatures,
delegates, extension methods, iterators.

## Numeric types

| Type | Use for | Gotcha |
| --- | --- | --- |
| `int` | counts, ids | `7 / 2 == 3`; overflow wraps silently in release |
| `long` | big counts, ticks | |
| `double` | measurements, ratios | `0.1 + 0.2 != 0.3` |
| `decimal` | **money** | exact base-10; slower, smaller range; suffix `m` |

```csharp
double half  = 7 / 2;      // 3.0 — int division ran first
double right = 7 / 2.0;    // 3.5 — one double operand promotes the expression
(double)sum / count        // cast ONE operand, not the result

Math.Round(2.5)                                    // 2  — banker's rounding!
Math.Round(2.345m, 2, MidpointRounding.AwayFromZero)  // 2.35 — money

checked { return a + b; }  // throws OverflowException instead of wrapping
```

## Value vs reference

| Value types (copied) | Reference types (aliased) |
| --- | --- |
| `int`, `bool`, `char`, `double`, `decimal` | `class`, `string`, arrays |
| `struct`, `enum`, `DateTime`, tuples | `List<T>`, delegates, `record` (class) |

```csharp
var s2 = s1;  s2.X = 99;   // struct: s1 unchanged
var c2 = c1;  c2.X = 99;   // class:  c1.X is now 99

new List<int>(source)      // a real copy (shallow — elements still shared)
```

`string` is a reference type but **immutable**, so it behaves like a value.

## Null

```csharp
string?  maybe;            // may be null — compiler tracks it
a ?? b                     // a, unless null, then b
a ??= b                    // assign only if a is null
x?.Y?.Z ?? "default"       // each ? short-circuits the WHOLE rest of the chain
int?                       // Nullable<int>

dict.TryGetValue(k, out var v)          // absent → false, no exception
dict[k]                                  // absent → KeyNotFoundException
dict.GetValueOrDefault(k)                // absent → default
```

## Strings

| Want | Use |
| --- | --- |
| Interpolate | `$"{name} is {age}"` |
| Multi-line / no escapes | `"""raw string"""` |
| Blank check | `string.IsNullOrWhiteSpace(s)` |
| Split, dropping blanks | `s.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)` |
| Join | `string.Join("-", parts)` |
| Build in a loop | `StringBuilder` (`+=` is O(n²)) |
| Compare, ignoring case | `a.Equals(b, StringComparison.OrdinalIgnoreCase)` |
| Contains, ordinal | `s.Contains(x, StringComparison.Ordinal)` |
| Slice | `s[1..^1]`, `s[^3..]` |

Strings are immutable: every "change" allocates a new one.

## Ranges and indices

```csharp
items[^1]      // last element
items[1..3]    // elements 1 and 2 — END IS EXCLUSIVE
items[..^1]    // all but the last
items[^2..]    // last two
items[^0..]    // empty (this is what makes clamping work)

items.AsSpan()[1..^1]   // same window, no allocation
```

## Parsing at the boundary

**Always `TryParse`. Always a culture.**

```csharp
int.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n)
decimal.TryParse(s, NumberStyles.Number, CultureInfo.InvariantCulture, out var d)
DateTimeOffset.TryParse(s, CultureInfo.InvariantCulture,
    DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var t)
```

`decimal.Parse("1.50")` is **150** on a German machine. Use `DateTimeOffset`,
not `DateTime` — an offset is part of the value.

## Equality

```csharp
public override bool Equals(object? obj)
    => obj is Money o && Amount == o.Amount && Currency == o.Currency;

public override int GetHashCode() => HashCode.Combine(Amount, Currency);
```

**Equal objects must return the same hash code.** Use the *same members* in
both. `a.GetHashCode() ^ b.GetHashCode()` is the classic bad mix — XOR is
commutative and clusters.

In `operator ==`, never write `left == right` (infinite recursion):

```csharp
if (ReferenceEquals(left, right)) return true;   // both null
if (left is null || right is null) return false;
return left.Equals(right);
```

Or just use a `record`, which generates all of it:

```csharp
record Money(decimal Amount, string Currency);
// value Equals, matching GetHashCode, ==, !=, and
// ToString → "Money { Amount = 9.99, Currency = USD }"
```

## Method signatures

| Modifier | Caller initialises | Method must assign | Method may read |
| --- | --- | --- | --- |
| `out` | no | **yes, on every path** | not before assigning |
| `ref` | **yes** | no | yes |
| `in` | **yes** | no (read-only) | yes |

```csharp
bool TryDivide(int a, int b, out int q) {
    if (b == 0) { q = 0; return false; }   // out MUST be assigned here too
    q = a / b; return true;
}

void Swap<T>(ref T a, ref T b) => (a, b) = (b, a);
int Bump(ref int n) => ++n;       // ++n = new value; n++ = old value
```

Defaults are **baked into the call site** at compile time, so they must be
compile-time constants, and changing one doesn't affect already-built callers.

Overload resolution: exact match → implicit conversion → `params` expansion.
A `params` overload is always the last resort.

## Delegates and closures

```csharp
Func<int, string>   // takes int, returns string — LAST type is the return
Action<int>         // takes int, returns nothing
Func<bool>          // takes nothing, returns bool

Func<int> Counter() { var n = 0; return () => ++n; }   // n moves to the heap
```

Each call to `Counter()` creates a separate captured local — two independent
counters. That is all a closure is: a compiler rewrite, not magic.

## Extension methods

```csharp
static class Extensions {
    public static bool IsBlank(this string? s) => string.IsNullOrWhiteSpace(s);
    public static IEnumerable<T> OrEmpty<T>(this IEnumerable<T>? xs) => xs ?? [];
}
```

Must live in a **static, non-nested class**. Because the call compiles to a
static call, **the receiver may be null** — `((string?)null).IsBlank()` does
not throw.

## Iterators

```csharp
IEnumerable<T> Take<T>(IEnumerable<T> src, int count) {
    ArgumentOutOfRangeException.ThrowIfNegative(count);   // runs NOW
    return Iterate();

    IEnumerable<T> Iterate() {                            // runs on enumeration
        var taken = 0;
        foreach (var x in src) { yield return x; if (++taken == count) yield break; }
    }
}
```

A method containing `yield` **does not run when called** — it returns a state
machine. So validation next to a `yield` fires on first `MoveNext()`, possibly
never. Split it: a normal method that validates, returning a local iterator.
Every BCL LINQ operator is written this way.

## Collection expressions

```csharp
int[] a = [1, 2, 3];
List<string> b = [];
int[] joined = [.. first, .. second];    // spread
```

## Modern syntax quick list

```csharp
if (x is null) / if (x is not null)          // prefer over == null
var (a, b) = tuple;                          // deconstruction
obj switch { 0 => "zero", > 0 => "pos", _ => "neg" }
(n % 3, n % 5) switch { (0, 0) => "FizzBuzz", (0, _) => "Fizz", ... }
x is Money m && m.Amount > 0                 // type test + bind
value is { } notNull                         // "is not null", bound
record Point(int X, int Y);                  // positional record
class Svc(IDep dep) { }                      // primary constructor
sealed class A : B;                          // empty body
```
