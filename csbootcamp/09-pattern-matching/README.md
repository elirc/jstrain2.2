# 09 · Pattern Matching

Pattern matching replaces chains of `if`/cast/index with something the
compiler can check. The point is not brevity — it is **exhaustiveness**: a
switch expression warns when it cannot handle a case, and an `if` chain never
will.

## The mental model

**1. A switch *expression* returns a value.**

```csharp
var label = n switch { < 0 => "neg", 0 => "zero", _ => "pos" };
```

So it composes into an initialiser, an argument, an expression-bodied member —
places a switch *statement* cannot go.

**2. The pattern vocabulary, and it composes.**

| Pattern | Matches |
| --- | --- |
| `Circle c` | type, and **binds** `c` — no cast |
| `{ Radius: > 10 }` | property |
| `{ Express: true, Kilos: > 10 }` | several properties |
| `> 100`, `<= 0` | relational |
| `1 or 2 or 3` | disjunctive |
| `> 0 and < 10` | conjunctive |
| `not null` | negated |
| `(0, 0)` | positional — needs `Deconstruct` (records have one) |
| `[]`, `[var a, var b]`, `[var head, ..]`, `[.., var last]` | list / slice |
| `var x` | always; binds |
| `when x == y` | an arbitrary condition |

**3. Arms are tried top to bottom — order *is* the logic.**

```csharp
{ Express: true, Kilos: > 10 } => 25,   // specific FIRST
{ Express: true }              => 15,   // or this shadows it
```

The compiler catches a *fully* unreachable arm. It does **not** catch one
merely shadowed for some inputs, which is the one real hazard here.

**4. List patterns cannot index out of range.**

A pattern only binds what it has already matched, so `["set", var k, var v]`
is a length check, three index reads, and a literal comparison — with no way
to get any of them wrong.

## The details that bite

1. **Specific before general.** Moving one arm up or down changes behaviour
   silently. This is the bug to look for in a switch expression.

2. **`when` is for relationships *between* parts.** "The two values are
   equal to each other" is not something either value can match on its own.

3. **`[var a, .., var b]` also matches exactly two.** Put the `[var a, var b]`
   arm first if it should differ.

4. **Normalise before matching on shape.** `"  get   name  "` is only the
   same shape as `"get name"` after a `Split` with `RemoveEmptyEntries`
   (module 01/04).

5. **A switch expression with no `_` arm that misses a case** is a compiler
   warning and a `SwitchExpressionException` at runtime. Either handle
   everything or add the fallback deliberately.

6. **`is` patterns work outside switches too:** `if (x is Circle { Radius: > 0 } c)`
   is a type test, a property check and a binding in one.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-patterns.cs` | ★★☆ | relational, type, property and positional patterns; `when` |
| 02 | `02-list-patterns.cs` | ★★☆ | a command parser with no length checks or indexing |
| 03 | `03-exhaustiveness.cs` | ★★☆ | a closed hierarchy, and why a `_` arm throws away the compiler's help |
| 04 | `04-tuple-patterns.cs` | ★★☆ | a state machine written as a transition table |
| 05 | `05-deconstruction.cs` | ★★☆ | `Deconstruct`, positional and nested patterns, discards |
| 06 | `06-when-clauses.cs` | ★★☆ | guards vs patterns, and arm order as priority |

Three ideas run through 03–06 and they are worth stating separately from the
syntax:

**Arm order is behaviour, not style.** 04, 05 and 06 each have a test whose
only job is to fail if you reorder the arms. A general arm above a specific
one silently swallows it, and nothing warns you.

**Prefer a pattern to a `when`.** Patterns take part in exhaustiveness and
subsumption analysis; guards are opaque to both. A `when` earns its place
when it compares two properties, calls a method, or reaches outside the
subject — and nowhere else.

**A `_` arm is a decision, not a formality.** Over a closed set it discards
the compiler's ability to find every switch that needs updating. Over an open
set (`object`, an interface anyone can implement) it is mandatory. Same
syntax, opposite advice.

Do them in order. **01's "arm order matters" test is the one to remember** —
it is the only way a switch expression goes quietly wrong.

---

**Stuck?** `cheatsheets/csharp-basics.md` (patterns, switch expressions) · **Self-check:** `quizzes/05-types-and-records.md` · **Next:** `csbootcamp/10-strings-and-regex`
