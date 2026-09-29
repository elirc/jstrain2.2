# 18 · EF Core Relationships

Module 17 was one table. Real schemas are graphs, and the graph is where ORMs
earn their keep and where they hurt you. The three questions this module
answers:

1. How do I *declare* a relationship? (conventions do almost all of it)
2. How do I *load* one? (and why isn't it loaded already?)
3. Why is my endpoint slow? (it's N+1, and it always looks fine)

## The mental model

**1. A navigation property plus an FK is the whole declaration.**

```csharp
class Blog { public List<Post> Posts { get; set; } = []; }   // one
class Post {
    public int  BlogId { get; set; }                          // the FK
    public Blog Blog   { get; set; } = null!;                 // many
}
```

EF sees `BlogId` next to a `Blog` navigation and infers the table, the column
and the constraint. No configuration for the common case.

**2. The FK's nullability *is* the schema.**

| Declaration | Meaning |
| --- | --- |
| `int BlogId` | **required** — a post must have a blog; the insert fails otherwise |
| `int? BlogId` | **optional** — a post may be orphaned |

**3. Save the graph, not the keys.**

```csharp
db.Blogs.Add(new Blog { Name = "tech", Posts = [new Post { Title = "linq" }] });
db.SaveChanges();   // inserts blog, gets its id, writes it into each post
```

One `SaveChanges`, one transaction, correct ordering. You never assign
`BlogId` yourself.

**4. Nothing related is loaded unless you ask.**

EF Core does **not** lazy-load by default, and that is deliberate — implicit
lazy loading is how you get N+1 queries you never wrote.

| You want | Write | Cost |
| --- | --- | --- |
| the whole objects, to mutate them | `.Include(b => b.Posts)` | every column of every row, tracked |
| two levels | `.Include(…).ThenInclude(p => p.Comments)` | same, deeper |
| a shape to return as JSON | `.Select(b => new Dto(b.Name, b.Posts.Count))` | only the columns you named, untracked |

**Include when you need the objects; project when you need a shape.**

**5. Many-to-many is two collections; owned types are columns.**

```csharp
class Post { public List<Tag>  Tags  { get; set; } = []; }   // skip navigation
class Tag  { public List<Post> Posts { get; set; } = []; }   // → implicit join table

[Owned] record Address(string Street, string City, string Postcode);
// → ShippingAddress_Street, ShippingAddress_City, … on the OWNER's table
```

An owned type is a **value**: no id, no table, no sharing, and you replace it
wholesale rather than editing it. Ask whether two instances with equal fields
are interchangeable — if yes, it is a value, not an entity.

**6. N+1 is a query inside a loop over another query's results.**

```csharp
var blogs = db.Blogs.ToList();                            // 1 query
foreach (var b in blogs)
    counts.Add(db.Posts.Count(p => p.BlogId == b.Id));    // N more
```

Nothing warns you. It's instant on 3 rows and 20 seconds on 10,000.

## The details that bite

1. **Relationship fixup makes tests lie.** In the *same* context that inserted
   the posts, `blog.Posts` is already populated — not by a query, but because
   the change tracker holds those posts and wires the navigation up. A fresh
   context returns an empty collection. A test reusing the seeding context can
   pass while production, which uses a context per request, returns nothing.

2. **`Include` loads exactly the levels you name.** There is no "load
   everything", because everything is usually the whole database.

3. **`Include` is ignored once you `Select` into a DTO.** Express what you want
   inside the projection instead.

4. **Initialise navigation collections (`= []`).** Otherwise they're null
   rather than empty, and every consumer needs a null check.

5. **A projection is untracked.** `ChangeTracker.Entries()` stays empty, which
   is exactly right for a read you're about to serialise.

6. **`Count()` on a filtered `DbSet` beats `Include(...).Posts.Count`.** The
   first is `SELECT COUNT(*)`; the second fetches every row to count it.

7. **A nested projection is a LEFT join.** A blog with no posts still appears,
   with an empty list — not missing from the results.

8. **Delete behaviour is decided by the FK's nullability, not by you.**
   `int BlogId` → **Cascade**: the children are deleted. `int? AuthorId` →
   **ClientSetNull**: the children survive, orphaned. Nobody chooses that in a
   design meeting; it falls out of a `?` typed for other reasons. Check it
   before any production delete.

9. **Cascade only reaches entities EF has loaded.** `Include` the children
   before removing the parent, or rely on a database FK constraint — which
   SQLite does not enforce by default.

10. **Many-to-many needs no join entity.** Two collections pointing at each
    other and EF generates the join table. Model it explicitly only when the
    relationship carries its own data (who tagged it, when, in what order).

11. **`Include` before mutating a collection.** Without it the collection is
    empty, so your duplicate check passes when it shouldn't.

12. **Removing from a skip navigation deletes the join row, not the entity.**
    The tag survives; only the link goes.

## Seeing your own queries

| Tool | Use |
| --- | --- |
| `query.ToQueryString()` | the SQL for one query, without running it |
| log `Microsoft.EntityFrameworkCore.Database.Command` at Information | every statement EF sends |
| a `DbCommandInterceptor` | count or assert on queries in a test (exercise 03 does this) |

If you cannot see the SQL, you cannot see N+1. Turn the logging on once and
watch a page load — it is usually a surprise.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-one-to-many.cs` | ★★☆ | navigations, FK conventions, saving a graph, required vs optional |
| 02 | `02-loading-related-data.cs` | ★★☆ | Include, ThenInclude, and projections that beat both |
| 03 | `03-the-n-plus-1-problem.cs` | ★★★ | write the bug, count the queries, then fix it two ways |
| 04 | `04-many-to-many.cs` | ★★☆ | skip navigations over an implicit join table |
| 05 | `05-cascade-and-orphans.cs` | ★★★ | cascade vs orphan — decided by one `?` — and soft delete |
| 06 | `06-owned-types.cs` | ★★☆ | value objects as columns, not tables |

Do them in order. **03 is the one to do even if you skip everything else** —
it is the single most common performance bug in ORM code, and the query
counter makes it something you can *see* rather than something you've read
about. **05 is the one to read before your next production delete.**

---

**Stuck?** `cheatsheets/ef-core.md` (relationships, Include, projections, N+1) · **Self-check:** `quizzes/10-ef-relationships.md` · **Next:** `csbootcamp/19-auth-and-security`
