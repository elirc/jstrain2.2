# Collections and LINQ

Choosing the container, knowing what an operation costs, and reshaping data
without a loop.

---

## Choosing

| You need | Use | Lookup |
| --- | --- | --- |
| An ordered, growable list | `List<T>` | by index O(1), by value O(n) |
| Key → value | `Dictionary<K,V>` | O(1) |
| "Have I seen this?" | `HashSet<T>` | O(1) |
| Key → value, **sorted by key** | `SortedDictionary<K,V>` | O(log n) |
| First in, first out | `Queue<T>` | — |
| Last in, first out | `Stack<T>` | — |
| A fixed-size buffer | `T[]` | by index O(1) |
| Many readers, some writers | `ConcurrentDictionary<K,V>` | O(1) |
| A return type nobody should mutate | `IReadOnlyList<T>` / `IEnumerable<T>` | — |

The default is `List<T>` until you find yourself writing `.Contains` inside a
loop. That is a `HashSet<T>` (or a `Dictionary<K,V>`) asking to be used: it
turns an O(n²) scan into O(n), and it is usually a two-line change.

```csharp
// O(n × m)
var missing = wanted.Where(w => !have.Contains(w)).ToList();   // have is a List

// O(n + m)
var haveSet = have.ToHashSet();
var missing = wanted.Where(w => !haveSet.Contains(w)).ToList();
```

---

## Initialising

```csharp
List<int> a = [1, 2, 3];                       // collection expression (C# 12+)
int[] b = [1, 2, 3];
List<int> c = [.. a, .. b];                    // spread

var d = new Dictionary<string, int>
{
    ["ada"] = 1,
    ["bob"] = 2,
};

var e = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
```

Collection expressions work for anything with a `Create` method or an
`Add`-able shape, which in practice means all of the above.

---

## Dictionary access, four ways

```csharp
var v = dict["ada"];                        // throws if missing
dict.TryGetValue("ada", out var v);         // false if missing — the default
var v = dict.GetValueOrDefault("ada");      // default(V) if missing
var v = dict.GetValueOrDefault("ada", -1);  // your own fallback

dict["ada"] = 1;        // add OR overwrite
dict.Add("ada", 1);     // throws if already there
dict.TryAdd("ada", 1);  // false if already there, no throw
```

`ContainsKey` followed by `[...]` hashes the key twice. `TryGetValue` hashes
once and is the idiom.

### Counting and grouping into a dictionary

```csharp
counts[word] = counts.GetValueOrDefault(word) + 1;

// or, when the value is a collection:
if (!groups.TryGetValue(key, out var list))
    groups[key] = list = [];
list.Add(item);
```

### The comparer decides identity

```csharp
var d = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
d["Ada"] = 1;
d["ADA"] = 2;      // same key — overwrites the VALUE

d.Keys.Single();   // "Ada" — the FIRST spelling wins, not the last
```

The key that was stored first is the one you get back. Surprising, and a real
source of "why does the export show the wrong capitalisation" bugs.

---

## LINQ: the shape of it

Every query is `source → filter → project → materialise`.

```csharp
var names = people
    .Where(p => p.Age >= 18)          // filter
    .OrderBy(p => p.LastName)         // order
    .Select(p => p.FullName)          // project
    .ToList();                        // materialise
```

**Filter before you project**, and order last of the three — ordering rows you
are about to throw away is work you did not need.

### Deferred execution

`Where`, `Select`, `OrderBy`, `Take`, `Skip` return a *query*, not a result.
Nothing runs until something enumerates it.

```csharp
var query = numbers.Where(n => n > 2);   // nothing has happened
numbers.Add(10);
query.ToList();                          // NOW it runs — and sees the 10
```

Two consequences worth remembering: enumerating twice does the work twice, and
a query that closes over a mutable variable sees the variable's value *at
enumeration time*. `ToList()` is how you say "now, once, and freeze it".

### The operators, by what they answer

| Question | Operator |
| --- | --- |
| Which ones? | `Where` |
| Turn each into what? | `Select`, `SelectMany` |
| In what order? | `OrderBy`, `ThenBy`, `OrderByDescending`, `Reverse` |
| How many? | `Count`, `LongCount` |
| Any at all? / All of them? | `Any`, `All` |
| Just one | `First`, `FirstOrDefault`, `Single`, `SingleOrDefault`, `Last` |
| A slice | `Skip`, `Take`, `Chunk` |
| Rolled up | `Sum`, `Min`, `Max`, `Average`, `Aggregate` |
| Bucketed | `GroupBy`, `ToLookup` |
| Joined | `Join`, `GroupJoin`, `Zip` |
| Deduplicated | `Distinct`, `DistinctBy`, `Union`, `Intersect`, `Except` |
| As a container | `ToList`, `ToArray`, `ToDictionary`, `ToHashSet` |

### `First` vs `Single`

`First` means "there may be several; give me one". `Single` means "there is
exactly one, and I want to hear about it if I am wrong". Reaching for `First`
when you meant `Single` turns a data-integrity bug into silence.

`FirstOrDefault` on a `List<int>` returns `0`, not null — which is
indistinguishable from a real zero. For value types, prefer
`.Cast<int?>().FirstOrDefault()` or check with `Any` first.

### `SelectMany` flattens

```csharp
orders.Select(o => o.Lines)      // IEnumerable<List<Line>>
orders.SelectMany(o => o.Lines)  // IEnumerable<Line>
```

### `GroupBy` gives you keyed groups, not a dictionary

```csharp
var byDept = people.GroupBy(p => p.Department);

foreach (var group in byDept)
    Console.WriteLine($"{group.Key}: {group.Count()}");

// Straight to a dictionary of lists:
var lookup = people.ToLookup(p => p.Department);        // multi-value, no throw
var index  = people.ToDictionary(p => p.Id);            // throws on a duplicate key
```

`ToDictionary` throwing on duplicates is a feature — it is an assertion that
the key is unique. `ToLookup` is the one that expects several per key.

### Ordering is stable

`OrderBy` preserves the original order of equal elements. So elements that tie
come back in the order they went in, and a "descending sort" over equal totals
does not reverse them. Chain `ThenBy` for the real tiebreak rather than relying
on it.

```csharp
people.OrderByDescending(p => p.Score).ThenBy(p => p.Name)
```

---

## Mutating while enumerating

```csharp
foreach (var item in list)
    if (item.Expired) list.Remove(item);      // InvalidOperationException
```

Three fixes, in order of preference:

```csharp
list.RemoveAll(i => i.Expired);               // best
var kept = list.Where(i => !i.Expired).ToList();
for (var i = list.Count - 1; i >= 0; i--)     // backwards, when you must
    if (list[i].Expired) list.RemoveAt(i);
```

Dictionaries have the same rule; snapshot the keys with `.Keys.ToList()` first.

---

## Equality, and why your `HashSet` has duplicates

A `HashSet<T>` and a `Dictionary<K,V>` use `GetHashCode` and `Equals`.

- `record` and `record struct` implement both from their properties. They work.
- A `class` does **not** — it uses reference identity, so two objects with
  identical contents are two different keys.
- A tuple `(int, string)` does. So does `string`.

If a `HashSet<T>` of your own class is not deduplicating, that is why. Make it
a `record`, or pass an `IEqualityComparer<T>`.

---

## Costs worth carrying in your head

| Operation | Cost |
| --- | --- |
| `list[i]` | O(1) |
| `list.Add` | O(1) amortised |
| `list.Insert(0, x)` / `RemoveAt(0)` | O(n) — shifts everything |
| `list.Contains` | O(n) |
| `set.Contains`, `dict[key]` | O(1) |
| `list.Sort()`, `OrderBy` | O(n log n) |
| `Count()` on `IEnumerable<T>` | O(n) — **enumerates** |
| `.Count` on `List<T>`/array `.Length` | O(1) |

`Count()` versus `Any()` on a lazy sequence: `Any()` stops at the first
element, `Count()` walks all of them. `if (query.Count() > 0)` over a database
query is a full scan to answer a question `Any()` answers with a `LIMIT 1`.

---

## Where this is drilled

Modules [`03-collections`](../03-collections) and
[`04-linq-mastery`](../04-linq-mastery). Quizzes
[`03-collections.md`](../quizzes/03-collections.md) and
[`04-linq.md`](../quizzes/04-linq.md).

For LINQ over a *database* — where these operators become SQL and the rules
change — see [`ef-core.md`](ef-core.md) and module
[`17-ef-core-fundamentals`](../17-ef-core-fundamentals).
