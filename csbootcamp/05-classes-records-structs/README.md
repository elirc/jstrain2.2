# 05 · Classes, Records and Structs

Module 01 established *value vs reference*. This one is about choosing which
kind of type to declare, getting values into it safely, and — the part that
surprises people coming from Java — the fact that C# methods are not virtual
unless you say so.

## The mental model

**1. Pick the type by how it should behave.**

| Use | When |
| --- | --- |
| `record` | data with identity-by-value: DTOs, events, value objects |
| `class` | something with identity and a lifecycle: services, entities |
| `readonly record struct` | small immutable values: money, points, ranges |
| `struct` | rarely — small, immutable, and you have measured |

The test: are two instances with equal fields **interchangeable**? Then it is
a value → `record`. Does it have identity (two customers named "ada" are
different customers)? Then it is an entity → `class`.

**2. A `record` writes the boilerplate for you.**

Value `Equals`, matching `GetHashCode`, `==`/`!=`, `ToString`, `Deconstruct`,
and `with`:

```csharp
var updated = original with { Status = "paid" };   // a COPY; original untouched
```

**`with` is a SHALLOW copy.** Reference members are shared, so a `List<T>`
inside a record is a hole straight through the immutability — and it makes
the record compare by reference too.

**3. Four ways to initialise, differing in when and whether.**

| | Settable | Enforced |
| --- | --- | --- |
| ctor parameter | once | compile time |
| `{ get; init; }` | during construction only | no |
| `required` | during construction only | **compile time** |
| `{ get; set; }` | forever, by anyone | no |

`init` gives you readable object-initialiser syntax *and* immutability.
`required` closes the "forgot a member" hole. **Neither stops a bad
value** — only a validating constructor can, because it is the one path every
instance takes.

**4. Virtual is opt-in, both ends.**

```csharp
class Base    { public virtual  string Name() => "base"; }
class Derived : Base { public override string Name() => "derived"; }
```

| | Dispatch follows |
| --- | --- |
| `override` | the **object** — same answer however you hold it |
| `new` | the **variable's declared type** — two behaviours for one object |

`abstract` = virtual with no default and a compiler-enforced obligation.
`sealed override` ends the chain.

## The details that bite

1. **A record holding a mutable collection is not a value.** Its generated
   `Equals` compares that member by reference, so two records with identical
   data are unequal. Use `ImmutableList<T>`, or expose `IReadOnlyList<T>` and
   never hand out the mutable reference.

2. **`with` will not copy deeply.** Build the new collection yourself; C#
   will not guess how deep you meant.

3. **`new` is a compatibility hatch, not a design tool.** When the compiler
   suggests it, you almost certainly meant `virtual` + `override` and forgot
   one. Anything that stores your object as the base type — a `List<Base>`, a
   parameter, a LINQ projection — silently gets the base behaviour.

4. **`abstract` beats a `virtual` that throws.** The failure moves from
   runtime to compile time, and no subclass can forget.

5. **`base.X()` is a non-virtual call**, so it reaches the parent rather than
   recursing into your own override.

6. **A primary constructor parameter is not a property.** `greeter.greeting`
   does not exist — which is usually what you want for a dependency.

7. **`default(SomeStruct)` skips your constructor.** A struct that validates
   in its constructor can still exist zeroed. If invalid states must be
   unrepresentable, use a class or record class.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-records-and-immutability.cs` | ★★☆ | `with`, value equality, and the shallow-copy hole |
| 02 | `02-construction.cs` | ★★☆ | `init`, `required`, and a constructor that enforces an invariant |
| 03 | `03-inheritance-and-dispatch.cs` | ★★★ | `override` vs `new` — same object, two answers |
| 04 | `04-structs-and-copies.cs` | ★★★ | value semantics, boxing, and why a mutable struct is a bug |
| 05 | `05-equality.cs` | ★★☆ | the `Equals`/`GetHashCode` contract, written out by hand |
| 06 | `06-operators-and-conversions.cs` | ★★★ | a money type: operators, `IComparable`, implicit vs explicit |

**04 and 05 are two halves of one idea.** A struct is copied everywhere and a
class is not; a record compares by value and a class does not. Almost every
"why did my change not stick" and "why does my HashSet have duplicates" traces
back to one of those two sentences.

**06 is where a domain type earns its keep.** `Pence` cannot be added to a
`Percentage`, cannot lose its scale in a division, and prints as `-£2.50`
rather than `£-2.50` — none of which a bare `int` will do for you.

Do them in order. **03's dispatch pair is the one to remember**: the same
`Hider` reports `"hider"` or `"base"` depending only on the type of the
variable holding it.

---

**Stuck?** `cheatsheets/csharp-basics.md` (types, equality, records) · **Deep dive:** `guides/01-value-vs-reference-and-null.md` · **Self-check:** `quizzes/05-types-and-records.md` · **Next:** `csbootcamp/06-interfaces-and-generics`
