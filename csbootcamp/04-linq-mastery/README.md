# 04 · LINQ Mastery

LINQ is the reason C# collection code reads well, and the reason some of it
silently runs four times or quietly drops rows. Three things account for
almost every LINQ bug: **when it executes**, **what it captures**, and
**which join you actually asked for**.

## The mental model

**1. A query is a recipe, not a result.**

```csharp
var q = items.Where(Expensive);   // nothing has happened
var a = q.ToList();               // NOW it runs
var b = q.ToList();               // and now it runs AGAIN
```

Deferred: `Where`, `Select`, `SelectMany`, `OrderBy`, `Take`, `Skip`,
`Distinct`, `GroupBy`, `Join`.
Immediate: `ToList`, `ToArray`, `ToDictionary`, `Count`, `Sum`, `Max`,
`First`, `Any`, `Single`, `foreach`.

**2. Deferred means late-bound — to variables *and* to the source.**

```csharp
var threshold = 1;
var q = source.Where(n => n > threshold);
threshold = 2;
q.ToList();          // filters on 2, not 1
```

The same is true of the source: items added after the query was written are
included. `ToList()` at the point of definition freezes both.

**3. Multiple enumeration is the performance bug.**

Every `foreach` / `Count()` / `ToList()` on the same query re-executes it.
Against `IEnumerable` that is wasted CPU; against a `DbSet` it is another
round trip; against a one-shot stream the second pass returns nothing.
Materialise once.

**4. `Select` maps 1→1. `SelectMany` flattens.**

```csharp
orders.Select(o => o.Lines)      // IEnumerable<List<Line>>  ✗
orders.SelectMany(o => o.Lines)  // IEnumerable<Line>        ✓
orders.SelectMany(o => o.Lines, (order, line) => …)   // keeps the parent
```

That second overload is the one most people never find.

**5. `Join` is INNER. There is no `LeftJoin`.**

```csharp
lines.GroupJoin(catalogue, l => l.Product, p => p.Name, (l, ms) => new { l, ms })
     .SelectMany(x => x.ms.DefaultIfEmpty(), (x, p) => …)   // ← left join
```

## The details that bite

1. **`Max()` and `Average()` throw on an empty sequence; `Sum()` returns 0.**
   Addition has an identity; "largest of nothing" does not. Project to a
   nullable (`Select(x => (int?)x).Max()`) or use `DefaultIfEmpty`.

2. **`Aggregate` without a seed throws on an empty source** — same reason. A
   seed is also required whenever the result type differs from the element
   type.

3. **`Join` drops unmatched rows silently.** No error, no warning, quietly
   wrong totals. It is the most common mistranslation of "look up X for each
   Y".

4. **`OrderBy` is stable; a second `OrderBy` re-sorts.** Use `ThenBy` for
   tie-breakers. `OrderBy(a).OrderByDescending(b)` compiles, reads almost
   identically to `OrderBy(a).ThenByDescending(b)`, and gives a different
   answer.

5. **`Distinct` uses `Equals`/`GetHashCode`.** On a class without them, every
   instance is distinct. Use `DistinctBy(x => x.Key)` on objects.

6. **`Enumerable.Except` de-duplicates its result** — it is set subtraction,
   not "remove these items".

7. **`First` vs `Single`:** `Single` throws when there is more than one. Use
   it where duplicates would be a bug — it turns a broken assumption into a
   loud error instead of an arbitrary row.

8. **`Count() > 0` walks everything; `Any()` stops at the first hit.**

## Operator cheat table

| You want | Operator |
| --- | --- |
| Filter | `Where` |
| Transform 1→1 | `Select` |
| Flatten nested | `SelectMany` |
| Flatten, keeping the parent | `SelectMany(sel, (outer, inner) => …)` |
| Sort, then tie-break | `OrderBy(…).ThenBy(…)` |
| Unique by a key | `DistinctBy(x => x.Key)` |
| Group | `GroupBy` → `IGrouping<K,T>` |
| Inner join | `Join` |
| Left join | `GroupJoin` + `SelectMany` + `DefaultIfEmpty` |
| Fold to one value | `Aggregate(seed, (acc, x) => …)` |
| Safe max | `Select(x => (int?)…).Max()` |
| Pair two sequences | `Zip` |
| Page | `Skip(n).Take(m)` |
| Force execution | `ToList()` |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-deferred-execution.cs` | ★★☆ | count the touches; watch a query re-run and re-capture |
| 02 | `02-shaping-data.cs` | ★★☆ | `SelectMany` both ways, `Distinct`, stable sorting |
| 03 | `03-aggregation-and-joins.cs` | ★★★ | empty-source traps, `Aggregate` seeds, inner vs left join |
| 04 | `04-paging-and-slicing.cs` | ★★☆ | `Skip`/`Take`/`Chunk`, and why paging needs an explicit order |
| 05 | `05-linq-pitfalls.cs` | ★★☆ | multiple enumeration, side effects, `First` vs `Single`, value-type defaults |
| 06 | `06-custom-operators.cs` | ★★★ | your own operators, and eager validation in a lazy method |

**05 is the highest-value file in the module.** Every one of its four traps
compiles, none is caught by a type, and all four are things you will write.

**06 explains a piece of the BCL's design**: every operator is split into a
validating method and a private iterator, because a method containing `yield`
does not run its own argument checks until someone enumerates it.

Do them in order. **01 is the one that explains bugs you have already
shipped** — its "enumerating twice runs it twice" test is the whole reason
analyzers warn about possible multiple enumeration.

---

**Stuck?** `cheatsheets/collections.md` (LINQ operators, deferred execution) · **Self-check:** `quizzes/04-linq.md` · **Next:** `csbootcamp/05-classes-records-structs`
