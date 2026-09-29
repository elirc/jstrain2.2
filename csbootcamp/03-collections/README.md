# 03 · Collections

Two data structures do ninety percent of the work — `List<T>` and
`Dictionary<K,V>` — and the difference between code that scales and code that
looks identical but crawls is usually one `Contains` in the wrong place.

## The mental model

**1. Know what each operation costs.**

| Operation | `List<T>` | `Dictionary<K,V>` / `HashSet<T>` |
| --- | --- | --- |
| Lookup by key / `Contains` | **O(n)** — scans | **O(1)** — one hash |
| Index `[i]` | O(1) | n/a |
| Add to end | O(1) amortised | O(1) |
| `Insert(0, x)` / `Remove` | O(n) — shifts | O(1) |
| Ordered? | **yes**, insertion order | **no** — never rely on it |

**A `list.Contains` inside a loop over another list is O(n²)** — the most
common accidental quadratic in C#, and invisible in review because both
versions read the same.

```csharp
all.Where(x => !exclude.Contains(x))            // O(n × m)
var skip = new HashSet<string>(exclude);        // O(m)
all.Where(x => !skip.Contains(x))               // O(n + m)  ✅
```

**2. `HashSet.Add` returns a bool — that *is* the duplicate check.**

```csharp
if (!seen.Add(item)) { /* already had it */ }   // one hash, not two
```

Set algebra mutates in place: `UnionWith`, `IntersectWith`, `ExceptWith`,
`SymmetricExceptWith`. Copy first if the caller's data must survive.

**3. `TryGetValue` hashes once.**

```csharp
if (dict.ContainsKey(k)) dict[k]++; else dict[k] = 1;   // ❌ three hashes
dict.TryGetValue(k, out var n); dict[k] = n + 1;        // ✅ two
```

**4. Reshaping a flat list: pick the right one.**

| | One value per key | Duplicate key | Missing key |
| --- | --- | --- | --- |
| `ToDictionary(k)` | required | **throws** | throws |
| `ToLookup(k)` | many | fine | **empty sequence** |
| `GroupBy(k)` | many, lazy | fine | absent from results |

`ToDictionary` on data you don't control is a crash waiting for the day two
rows share a key. `ToLookup` is the safe default — and its indexer never
throws, which removes the `TryGetValue`-then-null-check dance you'd write
around a `Dictionary<K, List<V>>`.

## The details that bite

1. **Hash-based collections need real value equality.** A class without
   `Equals`/`GetHashCode` (module 01/08) puts every instance in its own slot —
   a `HashSet` that silently fails to deduplicate. Use a `record`.

2. **An ignore-case dictionary stores the FIRST spelling seen.** Lookups match
   any casing, but `Keys` gives you what was inserted. Matters when you
   round-trip keys.

3. **Pass the comparer to the dictionary, don't lowercase every key.** No
   per-item allocation, and the comparer travels with the collection.

4. **`Enumerable.Except` also de-duplicates.** "Remove these, keep the rest
   as-is" is a `Where` over a `HashSet`, not `Except`.

5. **Never rely on `HashSet`/`Dictionary` enumeration order.** It is an
   implementation detail. If you need order, build a `List` in the order you
   want.

6. **`GroupBy` preserves first-appearance order of groups** — but sort
   explicitly if you depend on it.

## Choosing a collection

| You need | Use |
| --- | --- |
| An ordered, indexable sequence | `List<T>` |
| Key → one value, fast | `Dictionary<K,V>` |
| Key → many values | `ILookup<K,V>` via `ToLookup` |
| "Have I seen this?" / dedupe | `HashSet<T>` |
| FIFO / LIFO | `Queue<T>` / `Stack<T>` |
| Sorted by key, always | `SortedDictionary<K,V>` |
| Thread-safe, concurrent writes | `ConcurrentDictionary<K,V>` |
| A public read-only view | `IReadOnlyList<T>` / `IReadOnlyDictionary<K,V>` |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-list-and-dictionary.cs` | ★☆☆ | a word index, and an `Except` that isn't quadratic |
| 02 | `02-sets.cs` | ★★☆ | dedupe via `Add`'s return value; set algebra; equality traps |
| 03 | `03-grouping-and-lookups.cs` | ★★☆ | `GroupBy` / `ToLookup` / `ToDictionary` and the duplicate-key crash |
| 04 | `04-ordering-and-comparers.cs` | ★★☆ | stable sorts, `IComparer`, and the comparer that decides dictionary identity |
| 05 | `05-mutating-while-iterating.cs` | ★★☆ | the exception, and the silent version that is worse |
| 06 | `06-queues-stacks-and-priorities.cs` | ★★☆ | FIFO, LIFO, a stable priority queue, and BFS |

**04–06 are about picking the container from the question you ask.** "Is this
in here?" is a set; "what is next?" is a queue; "what is most urgent?" is a
priority queue; and if you are sorting, the comparer is part of the design
rather than an afterthought.

**05 is the one to read even if you skip it.** Everyone meets the
`InvalidOperationException` from `foreach` + `Remove`. Far fewer people know
that the index-loop version does not throw — it silently skips an element, and
only when two removals are adjacent.

Do them in order. **01's last test is the one to feel** — 20,000 items, where
the quadratic version takes minutes and the right one takes milliseconds.

---

**Stuck?** `cheatsheets/collections.md` (costs, choosing, LINQ reshaping) · **Self-check:** `quizzes/03-collections.md` · **Next:** `csbootcamp/04-linq-mastery`
