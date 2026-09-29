# 03 · Collections

Cover the answer, commit out loud, then reveal.

---

### Q1 — the one sentence

When do you reach for a `HashSet<T>` instead of a `List<T>`?

<details><summary>Answer</summary>

**When the question you keep asking is "is this in there?"** `List.Contains`
is O(n); `HashSet.Contains` is O(1).

The tell is a `.Contains` call inside a loop. That is an O(n²) scan, and the
fix is almost always one line: `var set = list.ToHashSet();`
</details>

---

### Q2 — what does this print

```csharp
var d = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
d["Ada"] = 1;
d["ADA"] = 2;
Console.WriteLine($"{d.Count} {d.Keys.Single()}");
```

<details><summary>Answer</summary>

**`1 Ada`.**

The comparer makes them the same key, so the second assignment overwrites the
*value* — but the stored **key keeps its first spelling**. The dictionary has
no reason to rewrite a key that already matches.

This is why a case-insensitive export shows the capitalisation of whichever
row arrived first, which is nobody's intent and a genuinely annoying bug to
track down.
</details>

---

### Q3 — pick the access

You need a value and you are not sure the key exists. Rank these.

```csharp
var v = dict[key];
if (dict.ContainsKey(key)) v = dict[key];
dict.TryGetValue(key, out var v);
var v = dict.GetValueOrDefault(key, -1);
```

<details><summary>Answer</summary>

**`TryGetValue` is the default.** One hash, no exception, and the `bool` tells
you which case you are in.

`GetValueOrDefault` is fine when a fallback is genuinely equivalent to a hit.
`ContainsKey` + `[key]` hashes twice for no benefit. Bare `[key]` throws —
correct only when a missing key really is a bug.
</details>

---

### Q4 — what happens

```csharp
foreach (var item in list)
    if (item.Expired) list.Remove(item);
```

<details><summary>Answer</summary>

**`InvalidOperationException`** — "Collection was modified; enumeration
operation may not execute."

The enumerator holds a version number; mutating bumps it and the next `MoveNext`
throws. Use `list.RemoveAll(i => i.Expired)`, or build a new list with `Where`,
or iterate backwards by index.

The nastiest variant does *not* throw: remove the second-to-last element and
enumeration ends early with no error at all.
</details>

---

### Q5 — cost

`list.Insert(0, x)` on a `List<int>` with a million elements. What does it
cost, and why?

<details><summary>Answer</summary>

**O(n)** — every existing element shifts up one slot.

`List<T>` is an array underneath. Adding at the end is O(1) amortised; adding
at the front is a full copy. If you are inserting at the front repeatedly, you
want a `Queue<T>`, a `LinkedList<T>`, or to build the list backwards and
reverse it once.
</details>

---

### Q6 — why are there two of these

```csharp
var set = new HashSet<Person>();
set.Add(new Person("ada", 36));
set.Add(new Person("ada", 36));
Console.WriteLine(set.Count);
```

<details><summary>Answer</summary>

**Depends entirely on what `Person` is.**

- `record Person(string Name, int Age)` → **1**. Records generate `Equals` and
  `GetHashCode` from their properties.
- `class Person` with the same properties → **2**. A plain class uses
  *reference* identity, so two objects are two keys.

"My HashSet has duplicates" is nearly always a class that should have been a
record — or a missing `IEqualityComparer<T>`.
</details>

---

### Q7 — which container

You need to look up a config value by name, and you also need to print the
settings in alphabetical order. One container or two?

<details><summary>Answer</summary>

**One: `SortedDictionary<string, string>`** — O(log n) lookup, and enumeration
comes out in key order.

Or a plain `Dictionary` plus `.OrderBy(kv => kv.Key)` at print time, which is
O(1) lookup and pays the sort only when you actually print. That is usually the
better trade: sort at the edge, not on every write.
</details>

---

### Q8 — spot the bug

```csharp
var index = orders.ToDictionary(o => o.CustomerId);
```

<details><summary>Answer</summary>

**It throws the moment one customer has two orders.**

`ToDictionary` asserts the key is unique. That is a feature when it *should* be
unique, and a crash when you meant "group them". For many-per-key, use
`ToLookup(o => o.CustomerId)` or `GroupBy`.
</details>

---

### Q9 — what type comes back

```csharp
var groups = people.GroupBy(p => p.Department);
```

<details><summary>Answer</summary>

**`IEnumerable<IGrouping<string, Person>>`.**

An `IGrouping<K, T>` is an `IEnumerable<T>` that also has a `.Key`. So you
`foreach` the groups and `foreach` (or `Count()`, `Sum()`) inside each one.

It is *not* a dictionary — there is no lookup by key. `ToLookup` is the one
that gives you that.
</details>

---

### Q10 — Any or Count

```csharp
if (items.Count() > 0) { … }
```

<details><summary>Answer</summary>

**Use `Any()`.**

On a `List<T>` the difference is nil. On a lazy sequence, `Count()` walks every
element to answer a question `Any()` answers with the first one — and on an EF
query, `Count()` is a full `SELECT COUNT(*)` where `Any()` is a `LIMIT 1`.

Also note `.Count` (property, O(1)) versus `.Count()` (method, O(n) on
`IEnumerable`). The parentheses are the whole difference.
</details>

---

### Q11 — what does the spread do

```csharp
List<int> a = [1, 2];
int[] b = [3, 4];
List<int> c = [.. a, .. b, 5];
```

<details><summary>Answer</summary>

**`c` is `[1, 2, 3, 4, 5]`.**

Collection expressions (C# 12+) work across list, array, span and anything with
a suitable `Create` or `Add`. `..` splices in an existing sequence. The target
type decides what gets built — the same `[1, 2, 3]` literal is a `List<int>`
here and an `int[]` a line earlier.
</details>

---

### Q12 — mutation through a return value

```csharp
public List<Order> Orders => _orders;
```

What has the caller been handed?

<details><summary>Answer</summary>

**Your internal list, with full permission to modify it.** `_orders.Clear()`
from the outside is one call away, and nothing in your class will know.

Return `IReadOnlyList<Order>` to state the intent, or `_orders.ToList()` for a
real copy. `IReadOnlyList` is a promise, not a guarantee — a caller can cast
back — but it is the difference between a mistake and a deliberate act.
</details>

---

### Q13 — trace it

```csharp
var counts = new Dictionary<string, int>();
foreach (var w in "a b a c a".Split(' '))
    counts[w] = counts.GetValueOrDefault(w) + 1;
```

<details><summary>Answer</summary>

**`a → 3, b → 1, c → 1`.**

`GetValueOrDefault` returns `0` for a missing key, so the first sighting stores
`1`. This is the whole counting idiom; there is no need for `ContainsKey`.
</details>

---

### Q14 — which is faster, and does it matter

```csharp
var missing = wanted.Where(w => !have.Contains(w)).ToList();
```

`wanted` and `have` are both `List<string>` with 10,000 entries.

<details><summary>Answer</summary>

**That is 100 million comparisons.** `have.Contains` is O(n), inside a loop
over `wanted`.

```csharp
var haveSet = have.ToHashSet();
var missing = wanted.Where(w => !haveSet.Contains(w)).ToList();
```

20,000 operations instead of 100,000,000. One line, and it is the single most
common easy win in code that has started to feel slow.
</details>

---

### Q15 — the one to remember

You have a `List<T>` and you keep asking a question about it. What is the
question that tells you to change container?

<details><summary>Answer</summary>

**"Is X in here?" or "what is the one with key X?"**

Both are O(n) on a list and O(1) on a `HashSet`/`Dictionary`. Everything else —
order, indexing, appending — a `List<T>` already does well.

Pick the container from the question you ask most, not from the shape of the
data.
</details>

---

**Next:** [`04-linq.md`](04-linq.md) · **Cheatsheet:** [`../cheatsheets/collections.md`](../cheatsheets/collections.md)
