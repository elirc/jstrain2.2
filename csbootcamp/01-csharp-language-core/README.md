# 01 · C# Language Core

C# is statically typed, and that changes where your bugs live. In JavaScript
most mistakes surface at runtime, in production, on a Tuesday. In C# a large
class of them cannot compile at all — but a *different* class hides behind
things that look obvious and aren't: `7 / 2` is `3`, a `struct` copies itself
when you pass it, and `decimal` and `double` disagree about what `0.1 + 0.2`
means. This module is about those.

## The mental model

**1. The type of an expression comes from its operands, not its destination.**

```csharp
double half = 7 / 2;        // 3.0 — both sides are int, so int division ran
double right = 7 / 2.0;     // 3.5 — one double operand promotes the whole thing
```

Assigning to `double` happens *after* the division. If you want a `double`
result, one operand has to be a `double` before the operator runs.

**2. Value types copy; reference types alias.**

```csharp
struct S { public int X; }
class  C { public int X; }

var s1 = new S { X = 1 }; var s2 = s1; s2.X = 99;   // s1.X is still 1
var c1 = new C { X = 1 }; var c2 = c1; c2.X = 99;   // c1.X is now 99
```

`struct`, `int`, `bool`, `DateTime`, and every `enum` are value types.
`class`, `string`, arrays, `List<T>`, and delegates are reference types.
When a caller's data changes unexpectedly, this is almost always why.

**3. Null is a type-system concern, not a runtime surprise.**

Nullable reference types are on by default in modern .NET. `string` means
"never null" and `string?` means "might be". The compiler tracks it and warns
you when you dereference without checking:

```csharp
string? maybe = GetName();
int len = maybe.Length;        // warning: may be null here
int safe = maybe?.Length ?? 0; // no warning, and no crash
```

**4. Strings are immutable.**

Every operation that "changes" a string returns a new one. Building a string
in a loop with `+=` allocates one string per iteration — O(n²) copying.
`StringBuilder` keeps a single growable buffer and materialises once.

## The details that bite

1. **`decimal` for money, `double` for measurements.** `double` is binary
   floating point, so `0.1 + 0.2 != 0.3`. `decimal` is base-10 and exact for
   the values invoices care about, at the cost of speed and range.

2. **`Math.Round` uses banker's rounding by default.** `Math.Round(2.5)` is
   `2`, not `3` — it rounds to even to reduce statistical bias. For money you
   almost always want `MidpointRounding.AwayFromZero`, explicitly.

3. **Integer overflow is silent in release builds.** `int.MaxValue + 1` wraps
   to `int.MinValue` and no one tells you. Wrap the arithmetic in `checked { }`
   to turn that into an `OverflowException`.

4. **`Parse` throws; `TryParse` doesn't.** Bad user input is normal, not
   exceptional. Exceptions are slow and a per-field exception on a busy
   endpoint is a real availability problem.

5. **Always pass a culture when parsing or formatting.** `decimal.Parse("1.50")`
   is `150` on a German machine, because `.` is its thousands separator. On the
   server, `CultureInfo.InvariantCulture` — every time.

6. **`==` on a class means reference identity unless you override it.** Two
   `Money` objects with identical fields are not equal by default. Override
   `Equals` *and* `GetHashCode` together, or `Dictionary` and `HashSet` will
   quietly misbehave.

7. **Ranges are half-open at the end.** `items[1..3]` is elements 1 and 2.
   `^1` is the last element, and `items[^0..]` is the empty slice — which is
   the behaviour that makes clamping work cleanly.

8. **`string.Split` with `RemoveEmptyEntries` collapses runs of whitespace.**
   Without it, `"a  b".Split(' ')` gives you three tokens, one of them empty.

## Cheat table

| You want | Reach for |
| --- | --- |
| Money | `decimal`, `MidpointRounding.AwayFromZero` |
| Measurements, ratios | `double` |
| Might-be-absent number | `int?` / `Nullable<int>` |
| Parse user input | `int.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n)` |
| A timestamp | `DateTimeOffset`, normalised to UTC at the boundary |
| Default when null | `a ?? b` |
| Walk a chain that may break | `a?.B?.C ?? fallback` |
| Last element / last two | `items[^1]` / `items[^2..]` |
| Build a string in a loop | `StringBuilder` |
| Value equality on a data type | a `record` |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-fizzbuzz-range.cs` | ★☆☆ | FizzBuzz that returns data instead of printing |
| 02 | `02-numeric-types.cs` | ★☆☆ | int vs double vs decimal, and checked overflow |
| 03 | `03-value-vs-reference.cs` | ★★☆ | prove copy-vs-alias, then stop a list from leaking |
| 04 | `04-string-fundamentals.cs` | ★☆☆ | a slugifier and a StringBuilder repeat |
| 05 | `05-nullable-basics.cs` | ★★☆ | a config reader written with `?.` and `??` only |
| 06 | `06-arrays-and-ranges.cs` | ★★☆ | Middle / LastN / Rotate using range syntax |
| 07 | `07-parsing-input.cs` | ★★☆ | the request boundary: TryParse + InvariantCulture |
| 08 | `08-equality-and-tostring.cs` | ★★★ | the Equals/GetHashCode contract, then let a record do it |

Do the warm-ups and core in order. Stretch if time allows — 08 is the one
worth coming back to even if you skip it now, because the hash-code contract
is the kind of thing that only bites you six months later.

---

**Stuck?** `cheatsheets/csharp-basics.md` (types, operators, parsing, string methods) · **Self-check:** `quizzes/01-language-core.md` · **Next:** `csbootcamp/02-methods-and-parameters`
