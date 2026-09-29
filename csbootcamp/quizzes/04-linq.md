# 04 · LINQ

Cover the answer, commit out loud, then reveal.

---

### Q1 — the one sentence

What does `Where` return?

<details><summary>Answer</summary>

**A query, not a result.** Nothing has been filtered yet.

`Where`, `Select`, `OrderBy`, `Skip`, `Take` are all deferred: they describe
work. `ToList`, `ToArray`, `Count`, `First`, `Sum` and `foreach` are what
*execute* it.
</details>

---

### Q2 — what does this print

```csharp
var numbers = new List<int> { 1, 2, 3 };
var big = numbers.Where(n => n > 2);
numbers.Add(10);
Console.WriteLine(string.Join(",", big));
```

<details><summary>Answer</summary>

**`3,10`.**

`big` was never a snapshot. It is a recipe, and it ran at `string.Join` — by
which time the list had a 10 in it.

`ToList()` at the point of definition is how you freeze it. This is the single
most surprising thing about LINQ the first time it bites you.
</details>

---

### Q3 — how many times does the predicate run

```csharp
var evens = numbers.Where(n => { Console.Write("."); return n % 2 == 0; });
var count = evens.Count();
var first = evens.First();
```

<details><summary>Answer</summary>

**Twice over the sequence** — once for `Count()`, once for `First()` (which
stops early, so fewer dots the second time).

Enumerating a query twice does the work twice. If you need it more than once,
materialise it once: `var evens = numbers.Where(…).ToList();`

On a database query, "twice" means two round trips.
</details>

---

### Q4 — order the operators

```csharp
people.OrderBy(p => p.Name).Where(p => p.Age >= 18)
people.Where(p => p.Age >= 18).OrderBy(p => p.Name)
```

Same result?

<details><summary>Answer</summary>

**Same result, different cost.** The first sorts everyone and then discards the
minors; the second sorts only the rows that survive.

Filter first, then order, then project. Over a database it usually does not
matter — the provider reorders it — but in memory it is real work.
</details>

---

### Q5 — First or Single

You look up a user by email, and email is unique in your database. Which?

<details><summary>Answer</summary>

**`Single` / `SingleOrDefault`.**

`First` says "there may be several, give me one". `Single` says "there is
exactly one, and I want to know if that is wrong". Using `First` where you meant
`Single` turns a duplicate-data bug into silence — and the duplicate you never
noticed becomes an incident six months later.

The cost: `Single` reads one row further to prove uniqueness. Worth it.
</details>

---

### Q6 — spot the trap

```csharp
var ids = new List<int>();
var firstId = ids.FirstOrDefault();
if (firstId == 0) { … }
```

<details><summary>Answer</summary>

**`0` is indistinguishable from a real zero.**

`FirstOrDefault` on a value type returns `default(T)`, and `default(int)` is a
perfectly plausible id. Use `Any()` first, or project to a nullable:
`ids.Cast<int?>().FirstOrDefault()` — now `null` means "empty" and nothing
else.
</details>

---

### Q7 — which one flattens

```csharp
orders.Select(o => o.Lines)
orders.SelectMany(o => o.Lines)
```

<details><summary>Answer</summary>

- `Select` → `IEnumerable<List<Line>>` — a sequence of lists.
- `SelectMany` → `IEnumerable<Line>` — one flat sequence.

If you find yourself writing a nested `foreach` to get at the inner items, that
is `SelectMany`.
</details>

---

### Q8 — what comes out first

```csharp
var top = scores
    .OrderByDescending(s => s.Points)
    .Take(3);
```

Three people all have 50 points and went in as Ada, Bob, Cy. What order do
they come out?

<details><summary>Answer</summary>

**Ada, Bob, Cy** — the order they went in.

LINQ's sort is **stable**: equal elements keep their relative order, and
`OrderByDescending` does not reverse the ties, it only reverses the comparison.

If you want a defined tiebreak, say so: `.ThenBy(s => s.Name)`. Relying on the
incidental order is how a "sort by score" quietly changes when someone reorders
the source.
</details>

---

### Q9 — what type is this

```csharp
var groups = orders.GroupBy(o => o.CustomerId);
```

<details><summary>Answer</summary>

**`IEnumerable<IGrouping<int, Order>>`** — each group is itself a sequence of
orders, with a `.Key`.

```csharp
foreach (var g in groups)
    Console.WriteLine($"{g.Key}: {g.Sum(o => o.Total)}");
```

You cannot look a group up by key. `ToLookup` gives you that.
</details>

---

### Q10 — Aggregate

```csharp
new[] { 1, 2, 3, 4 }.Aggregate((a, b) => a * b)
```

<details><summary>Answer</summary>

**24.** It threads an accumulator through the sequence — `((1*2)*3)*4`.

The overload with a seed is the useful one, because it handles the empty case
and lets the accumulator be a different type:

```csharp
words.Aggregate(new StringBuilder(), (sb, w) => sb.Append(w)).ToString()
```

The no-seed version **throws on an empty sequence**. Prefer the seeded one.
</details>

---

### Q11 — Distinct on objects

```csharp
var unique = people.Distinct().ToList();
```

`Person` is a `class`. What did you get?

<details><summary>Answer</summary>

**Everything** — `Distinct` uses `Equals`/`GetHashCode`, and a class compares
by reference.

Options: make it a `record`, pass an `IEqualityComparer<Person>`, or use
`DistinctBy(p => p.Email)`, which is usually what you actually meant.
</details>

---

### Q12 — closures in a query

```csharp
var threshold = 5;
var query = numbers.Where(n => n > threshold);
threshold = 100;
var result = query.ToList();
```

<details><summary>Answer</summary>

**The lambda captured the *variable*, not the value** — so it filters on 100.

Deferred execution plus closure capture, combined. Both are reasonable on their
own and surprising together. `ToList()` at definition time, or copy into a
local the lambda captures instead.
</details>

---

### Q13 — Zip and chunk

What do these give you?

```csharp
names.Zip(ages)
numbers.Chunk(3)
```

<details><summary>Answer</summary>

- `Zip` → pairs, stopping at the **shorter** of the two. `IEnumerable<(T, U)>`.
- `Chunk(3)` → `IEnumerable<T[]>`, batches of three with a possibly-short last
  one.

`Chunk` is the right answer to "send these to the API 100 at a time", which
otherwise gets written as an index loop with an off-by-one in it.
</details>

---

### Q14 — spot the N+1

```csharp
foreach (var blog in db.Blogs)
    Console.WriteLine(blog.Posts.Count());
```

<details><summary>Answer</summary>

**One query for the blogs, then one per blog for its posts.** 1 + N round
trips.

In LINQ-to-objects this is merely a loop. Against a database it is the single
most common performance bug there is. The fixes are `Include`, or — better —
projecting the count in the query:

```csharp
db.Blogs.Select(b => new { b.Name, Posts = b.Posts.Count })
```

Module [`18-ef-core-relationships`](../18-ef-core-relationships) is the long
version.
</details>

---

### Q15 — the one to remember

What is the difference between LINQ over a `List<T>` and LINQ over a
`DbSet<T>`?

<details><summary>Answer</summary>

**`IEnumerable<T>` runs your lambda in C#. `IQueryable<T>` translates it to
SQL.**

Which means: on `IQueryable`, `Where` becomes a `WHERE` and only matching rows
travel; call `.ToList()` first and you have pulled the whole table into memory
and filtered it there. The code looks identical and differs by the entire
table.

The tell is where `AsEnumerable()`/`ToList()` sits in the chain. Everything
after it is C#.
</details>

---

**Next:** [`05-types-and-records.md`](05-types-and-records.md) · **Cheatsheet:** [`../cheatsheets/collections.md`](../cheatsheets/collections.md)
