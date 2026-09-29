# 06 · Interfaces and Generics

Interfaces are how you get seams (module 21) and swappable services (module
12). Generics are how you write one implementation that stays type-checked
across many types. Together they are most of what makes a C# codebase
extensible without becoming `object` soup.

## The mental model

**1. An interface is a contract with no state.**

Callers depend on the *shape*, not the class — so the implementation can be
swapped, faked, or decorated without touching them.

**2. Explicit implementation puts a member behind the interface only.**

```csharp
void ICounter.Reset() => Value = 0;      // NOT callable as counter.Reset()
void IRewindable.Reset() => Value--;     // two interfaces, one signature
```

Use it when two interfaces demand the same signature with different meanings,
or to keep a required-but-noisy member off your public surface.

**3. Default interface members are a versioning tool.**

An interface can ship a body, so you can add a member without breaking every
implementor. But it is callable **only through the interface** — not through
the concrete type — so it is not a way to share implementation.

**4. A constraint is a capability, not a restriction.**

| `where T :` | Unlocks |
| --- | --- |
| `class` / `struct` | reference / value semantics; makes `T?` unambiguous |
| `notnull` | neither null nor nullable |
| `IComparable<T>` | `CompareTo` — ordering |
| `new()` | `new T()` — must be listed **last** |
| `INumber<T>` | `+ - * /`, `T.Zero` — generic math (.NET 7+) |
| `SomeBase` | that type's members |

Without a constraint, `T` is effectively `object` and you can barely touch it.

**5. Variance: `out` produces, `in` consumes.**

```csharp
IEnumerable<Dog>  → IEnumerable<Animal>    ✓  covariant     (out T)
Action<Animal>    → Action<Dog>            ✓  contravariant (in T)
List<Dog>         → List<Animal>           ✗  invariant
```

`List<T>` is invariant for a reason: if it weren't, you could add a `Cat`
through the `List<Animal>` reference and the `List<Dog>` would contain a cat.
`IEnumerable<out T>` is safe precisely **because it has no `Add`**.

## The details that bite

1. **You cannot mark a parameter `out` if any member accepts a `T`.** The
   compiler enforces the precondition — a type that both produces and
   consumes must stay invariant.

2. **Variance requires a *reference* conversion.** `IEnumerable<int>` is not
   `IEnumerable<object>`, because `int → object` is boxing.

3. **`new()` must be the last constraint listed.** Compiler rule, easy to
   trip on.

4. **`T?` on an unconstrained parameter is ambiguous.** Add `where T : class`
   (or `struct`) to say which nullable you mean.

5. **Generic math changed what's possible.** Before `INumber<T>`, arithmetic
   was not expressible in a constraint, so "sum these numbers" needed one
   overload per numeric type. `T.Zero` — a *static abstract* interface
   member — is what makes the empty case work generically.

6. **An explicitly implemented member is invisible on the class.** Sometimes
   the whole point; occasionally a surprise when IntelliSense comes up empty.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-interfaces.cs` | ★★☆ | a repository contract, explicit implementation, default members |
| 02 | `02-generics-and-constraints.cs` | ★★☆ | one `Total` for int, double and decimal via generic math |
| 03 | `03-variance.cs` | ★★★ | why `List<T>` is invariant and `IEnumerable<T>` isn't |
| 04 | `04-explicit-implementation.cs` | ★★☆ | name collisions, and keeping plumbing off the public surface |
| 05 | `05-static-abstracts.cs` | ★★★ | `static abstract` members, `INumber<T>`, and the self-referencing constraint |
| 06 | `06-generic-building-blocks.cs` | ★★☆ | a repository whose constraints are the design |

**05 is the newest thing in this module and the most useful.** `static
abstract` is what makes one generic `Sum<T>` work for `int`, `double` and
`decimal` — before C# 11 that was five overloads and a hope.

**06 is the practical one.** Its two constraints are not decoration: without
`where TEntity : IHasId<TKey>` the repository cannot ask an entity for its own
key, and every call site has to supply one.

Do them in order. **03's third test is the one worth sitting with** — it
shows the exact unsoundness the type system is protecting you from, which is
the whole reason variance has rules rather than just working everywhere.

---

**Stuck?** `cheatsheets/csharp-basics.md` (interfaces, generics) · **Self-check:** `quizzes/05-types-and-records.md` · **Next:** `csbootcamp/07-nullability-and-errors`
