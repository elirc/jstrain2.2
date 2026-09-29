# 10 · EF Core Relationships

Cover the answer, commit out loud, then reveal.

---

### Q1 — the whole declaration

What does EF need in order to infer a one-to-many relationship?

<details><summary>Answer</summary>

A **navigation property** on each side, and an FK property whose name follows
convention:

```csharp
class Blog { public List<Post> Posts { get; set; } = []; }
class Post { public int BlogId { get; set; } public Blog Blog { get; set; } = null!; }
```

`BlogId` next to a `Blog` navigation is enough — EF infers the table, the
column and the constraint. No `OnModelCreating` for the common case.
</details>

---

### Q2 — required or optional

`int BlogId` versus `int? BlogId` — what changes?

<details><summary>Answer</summary>

Everything about how deletes behave, and whether an orphan is legal:

| FK | Relationship | On parent delete |
| --- | --- | --- |
| `int BlogId` | **required** | **Cascade** — children deleted |
| `int? BlogId` | **optional** | **ClientSetNull** — children kept, FK nulled |

Nobody picks that in a design meeting. It falls out of a `?` typed for
unrelated reasons — which is why "we deleted a category and lost 40,000
products" is a real incident report.
</details>

---

### Q3 — who sets the foreign key

You add posts to `blog.Posts` and call `SaveChanges` once. Did you need to
set `BlogId`?

<details><summary>Answer</summary>

**No.** EF walks the object graph, sees the posts are new, inserts the blog
first to get its generated id, then writes that id into each post's `BlogId`.
One `SaveChanges`, one transaction, correct ordering.

Setting the FK by hand works and is occasionally necessary (you have the id
but not the entity), but for a generated key it means an extra round trip to
learn the id first.
</details>

---

### Q4 — the empty collection

A fresh context loads a Blog. `blog.Posts.Count` is 0, but the database has
two posts. Bug?

<details><summary>Answer</summary>

**No — that is correct.** EF Core does **not** lazy-load by default. It loads
exactly what you asked for, and you did not ask for the posts.

That default is deliberate: implicit lazy loading is how you get N+1 queries
you never wrote. Use `Include`, or project.

(The collection is empty rather than null only because it was initialised
`= []`. Do that on every navigation collection.)
</details>

---

### Q5 — the test that lies

The *same* context that just inserted a blog and its posts reports
`blog.Posts.Count == 2` — with no `Include` and no query. Why, and why does
it matter?

<details><summary>Answer</summary>

**Relationship fixup.** The change tracker still holds those posts, sees their
FK points at this blog, and wires the navigation up for free. No SQL ran.

It matters because a test that reuses its seeding context **passes**, while
production — which uses a new context per request — returns an empty
collection. Always assert against a second context.
</details>

---

### Q6 — Include depth

`.Include(b => b.Posts)` — are each post's comments loaded?

<details><summary>Answer</summary>

**No.** EF loads exactly the levels you name. Go deeper with
`.ThenInclude(p => p.Comments)`, which continues from the previous Include's
element type.

There is no "load everything" option, because everything is usually the whole
database.
</details>

---

### Q7 — Include vs project

Both give the right answer. When do you pick each?

<details><summary>Answer</summary>

- **`Include`** loads whole **entities**: every column of every related row,
  tracked. Use it when you are going to **mutate** the graph.
- **`Select`** into a DTO fetches **only the columns you name** and is
  **untracked** (there is no entity to write back).

Rule: **Include when you need the objects, project when you need a shape.**
For anything you are about to serialise as JSON, project.

Also: `Include` is silently **ignored** once you `Select` into a DTO.
</details>

---

### Q8 — spot it

```csharp
var blogs = db.Blogs.ToList();
foreach (var b in blogs)
    counts.Add(db.Posts.Count(p => p.BlogId == b.Id));
```

<details><summary>Answer</summary>

**N+1.** One query for the list, then one per row. 20 blogs → 21 queries.

`ToList()` ended the first query, so `blogs` is plain objects; every `Count`
in the loop is a fresh round trip. Nothing warns you — it is imperceptible on
3 rows and 20 seconds at 10,000 with real latency.

The signature: **a query inside a loop over another query's results.** That
includes touching a lazy-loaded navigation in a loop.
</details>

---

### Q9 — two fixes, one better

How do you fix N+1, and which fix do you prefer?

<details><summary>Answer</summary>

- `.Include(b => b.Posts)` → **1 query**, but fetches every column of every
  post to produce a handful of integers.
- `.Select(b => new Stat(b.Name, b.Posts.Count))` → **1 query**, and
  `b.Posts.Count` becomes a SQL `COUNT` subquery, so no posts are fetched and
  nothing is tracked.

**Prefer the projection.** Include only when you genuinely need the objects.
</details>

---

### Q10 — seeing it

How do you find N+1 in code you did not write?

<details><summary>Answer</summary>

Look at the SQL:

- `query.ToQueryString()` — the SQL for one query, without running it
- log `Microsoft.EntityFrameworkCore.Database.Command` at Information — every
  statement EF sends
- a `DbCommandInterceptor` — count and *assert on* queries in a test

If you cannot see the SQL, you cannot see N+1. Turn logging on once and watch
a page load; it is usually a surprise.
</details>

---

### Q11 — the missing join entity

Many-to-many between Post and Tag. How many classes do you write?

<details><summary>Answer</summary>

**Two.** Two collections pointing at each other:

```csharp
class Post { public List<Tag>  Tags  { get; set; } = []; }
class Tag  { public List<Post> Posts { get; set; } = []; }
```

EF generates a join table (`PostTag`) you never see in C# — those are **skip
navigations**, because they skip over the join entity.

Model the join explicitly only when it carries its **own data**: who tagged
it, when, in what order.
</details>

---

### Q12 — the duplicate that isn't caught

```csharp
var post = db.Posts.Single(p => p.Title == title);
if (post.Tags.Any(t => t.Id == tag.Id)) return;   // never true
post.Tags.Add(tag);
```

<details><summary>Answer</summary>

`Tags` was never loaded, so it is **empty** and the guard never fires. You
then insert a join row that may already exist.

Add `.Include(p => p.Tags)`. Loading a collection before you inspect or mutate
it is the rule.
</details>

---

### Q13 — remove means what

`post.Tags.Remove(tag); db.SaveChanges();` — is the tag deleted?

<details><summary>Answer</summary>

**No.** Only the **join row** is deleted. Both the post and the tag survive;
they are simply no longer linked.

That is specific to a skip navigation. For a one-to-many, removing a child
from the parent's collection deletes it or orphans it depending on the FK's
nullability (Q2).
</details>

---

### Q14 — no table of its own

What is an owned type, and how do you tell you have one?

<details><summary>Answer</summary>

A **value object** — something with no identity of its own. Mark it `[Owned]`
and its properties become **prefixed columns on the owner's table**:

```csharp
[Owned] record Address(string Street, string City, string Postcode);
// → Customers(Id, Name, ShippingAddress_City, …, BillingAddress_City, …)
```

That is *table splitting*. Consequences: no id, no `db.Addresses`, no sharing
between owners, no `Include` needed (it is the same row), and you **replace**
the value rather than editing it.

The test: are two instances with equal fields interchangeable? Then it is a
value, not an entity. There is no "address #47" that customers refer to.
</details>

---

### Q15 — the safer delete

Why do most production systems soft-delete instead of calling `Remove`?

<details><summary>Answer</summary>

A `DELETE` is irreversible, destroys audit history, and **cascades in ways you
may not have predicted**. A flag is none of those:

```csharp
blog.IsDeleted = true;    // one UPDATE, every row kept
```

The cost is that every query must remember the filter — which everyone
forgets. So add a **global query filter**:

```csharp
modelBuilder.Entity<Blog>().HasQueryFilter(b => !b.IsDeleted);
```

and `db.Blogs` excludes them everywhere automatically, with
`IgnoreQueryFilters()` as the deliberate escape hatch.
</details>
