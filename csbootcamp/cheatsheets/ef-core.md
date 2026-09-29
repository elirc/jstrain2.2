# EF Core — offline reference

Covers modules 17–18: DbContext, querying, change tracking, relationships,
loading strategies, N+1, and EF behind an API.

## Setup

```csharp
public class ShopDb(DbContextOptions<ShopDb> options) : DbContext(options) {
    public DbSet<Product> Products => Set<Product>();
}

builder.Services.AddDbContext<ShopDb>(o => o.UseSqlite(connectionString));
// registers SCOPED — one context per HTTP request. This is correct.
```

In an exercise file:

```csharp
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
```

## Conventions

| Convention | Effect |
| --- | --- |
| Property named `Id` or `<Type>Id` | primary key |
| Integer key | database-generated |
| `string` property | `nvarchar`/`TEXT`, nullable per NRT annotation |
| `Product Category` + `int CategoryId` | foreign key relationship |
| `DbSet<Product> Products` | table `Products` |

Override with the Fluent API in `OnModelCreating` or with attributes
(`[Key]`, `[Required]`, `[MaxLength(100)]`, `[Table("t")]`, `[Column("c")]`).

## The two jobs EF does

1. **Translate LINQ into SQL** (`IQueryable`)
2. **Track objects in memory** so it knows what to write back

Almost every EF surprise is a misunderstanding of one of those.

## Deferred execution

```csharp
var q = db.Products.Where(p => p.Price > 10);      // NO SQL yet
var top = q.OrderBy(p => p.Name).Take(3).ToList(); // ONE SELECT, right here
```

Executes on: `ToList`/`ToListAsync`, `First`, `Single`, `Count`, `Any`, `Sum`,
`foreach`, `ToArray`, `ToDictionary`.

**Where you put `.ToList()` is the most consequential decision in an EF
query.**

```csharp
db.Products.Where(p => p.Price > 10).ToList()   // WHERE runs in SQL       ✅
db.Products.ToList().Where(p => p.Price > 10)   // loads EVERY row first   ❌
```

After `ToList()` you are in `IEnumerable` — everything downstream runs in your
process on data already pulled across the wire.

## Query cheat table

| You want | Write | Becomes |
| --- | --- | --- |
| Matching rows | `.Where(…).ToListAsync()` | `SELECT … WHERE` |
| One by key | `.FindAsync(id)` | checks the tracker first, then `SELECT` |
| One by predicate | `.SingleOrDefaultAsync(p => …)` | `SELECT … LIMIT 2` |
| First match | `.FirstOrDefaultAsync(p => …)` | `SELECT … LIMIT 1` |
| Does any match? | `.AnyAsync(p => …)` | `SELECT EXISTS(…)` |
| How many | `.CountAsync()` | `SELECT COUNT(*)` |
| Some columns | `.Select(p => new Dto(…))` | `SELECT col1, col2` |
| Page | `.Skip(n).Take(m)` | `LIMIT/OFFSET` |
| Sort | `.OrderBy(…).ThenByDescending(…)` | `ORDER BY` |
| No tracking | `.AsNoTracking()` | same SQL, no snapshot |
| See the SQL | `.ToQueryString()` | — |

**`Single` throws on duplicates; `First` doesn't.** Use `Single` when more
than one row would be a bug.

**`Any()` beats `Count() > 0`** — it can stop at the first row.

## Writing

```csharp
db.Products.Add(p);            // staged
db.Products.AddRange(a, b, c); // staged
await db.SaveChangesAsync();   // ONE transaction, batched
```

Nothing reaches the database until `SaveChanges`. After it, the
database-generated key is written back onto **your** object.

**Never call `SaveChanges` in a loop** — n round trips, n transactions, no
atomicity.

## Change tracking

```csharp
var p = await db.Products.FindAsync(id);
p.Price = 5m;
await db.SaveChangesAsync();   // UPDATE … SET Price = 5 — no Update() call
```

EF snapshots original values on load and diffs at save.
`db.Products.Update(p)` also works but marks **every** property modified.

| State | Meaning |
| --- | --- |
| `Unchanged` | loaded, untouched |
| `Modified` | a tracked property changed |
| `Added` | staged insert |
| `Deleted` | staged delete |
| `Detached` | not tracked — **edits go nowhere** |

Inspect with `db.Entry(e).State` and `db.ChangeTracker.Entries()`.

**Identity resolution:** two queries for the same row *in one context* return
the **same object**. `AsNoTracking()` returns a new object each time.

## When to use AsNoTracking

Read-only queries: no snapshot, less memory, and edits silently do nothing.
**Projecting with `Select` into a DTO opts out of tracking automatically** —
there is no entity to write back.

## Entities are not DTOs

```csharp
await db.Products
        .Select(p => new ProductDto(p.Id, p.Name, p.Price))   // BEFORE ToList
        .ToListAsync();
```

- Project **before** materialising: three columns fetched, not all of them.
- An entity is your **storage** shape; a DTO is your **wire contract**.
  Returning the entity publishes your schema and leaks `Stock`,
  `PasswordHash`, `IsAdmin`.
- Separate the DTO you **accept** from the one you **return** — a create DTO
  with no `Id` means a client cannot choose one.

## DI lifetime

`AddDbContext` registers **scoped** — one per request. A singleton
`DbContext` is not thread-safe, shares a change tracker between users, and
grows forever.

Seeding at startup needs an explicit scope:

```csharp
using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<ShopDb>();
db.Database.EnsureCreated();
```

## SQLite in-memory, for tests

```csharp
var connection = new SqliteConnection("Data Source=:memory:");
connection.Open();   // SQLite DISCARDS the database when the last connection closes
var options = new DbContextOptionsBuilder<ShopDb>().UseSqlite(connection).Options;
var db = new ShopDb(options);
db.Database.EnsureCreated();
```

Keeping the connection open is mandatory — that is what keeps the database
alive.

### SQLite limitations worth knowing

- **No decimal type.** EF stores `decimal` as TEXT to keep it exact, so
  SQLite cannot `SUM`/`ORDER BY` it server-side. Project and aggregate in
  memory, or use a different provider. On SQL Server the same LINQ translates.
- No native `DateTimeOffset` arithmetic, limited `ALTER TABLE`.

"LINQ is provider-independent" has edges, and the compiler won't warn you.

## Relationships

```csharp
class Blog { public List<Post> Posts { get; set; } = []; }     // one
class Post { public int BlogId { get; set; }                    // the FK
             public Blog Blog { get; set; } = null!; }          // many
```

Convention does the rest — table, column, constraint. **The FK's nullability
is the schema:**

| FK | Required? | On parent delete |
| --- | --- | --- |
| `int BlogId` | required | **Cascade** — children deleted |
| `int? BlogId` | optional | **ClientSetNull** — children kept, FK nulled |

Nobody chooses that in a design meeting; it falls out of a `?`. Check it
before any production delete. And **cascade only reaches entities EF has
loaded** — `Include` the children first, or rely on a database FK constraint
(which SQLite does not enforce by default).

Save the **graph**, not the keys:

```csharp
db.Blogs.Add(new Blog { Name = "tech", Posts = [new Post { Title = "linq" }] });
db.SaveChanges();   // insert blog → get id → write it into each post
```

### Many-to-many

```csharp
class Post { public List<Tag>  Tags  { get; set; } = []; }   // skip navigation
class Tag  { public List<Post> Posts { get; set; } = []; }
```

Two collections pointing at each other → EF generates a join table
(`PostTag`) you never see in C#. Model the join explicitly only when it
carries its own data (who tagged it, when, sort order).

- `Include(p => p.Tags)` **before** mutating the collection, or the duplicate
  check runs against an empty list.
- `post.Tags.Remove(tag)` deletes the **join row**, not the tag.
- Filter with `p.Tags.Any(t => t.Name == x)` → `EXISTS` subquery.

### Owned types (value objects)

```csharp
[Owned] record Address(string Street, string City, string Postcode);

class Customer {
    public Address ShippingAddress { get; set; } = null!;
    public Address BillingAddress  { get; set; } = null!;
}
// → Customers(Id, Name, ShippingAddress_City, …, BillingAddress_City, …)
```

No id, no table, no sharing — the properties become **prefixed columns on the
owner's table** (table splitting). So: no `Include` needed, you can filter on
`c.ShippingAddress.City`, and you replace the value wholesale rather than
editing it. Use `OwnsMany` when it needs its own table but still no identity.

The test: are two instances with equal fields interchangeable? Then it's a
value, not an entity.

## Loading related data

| You want | Write | Cost |
| --- | --- | --- |
| whole objects, to mutate | `.Include(b => b.Posts)` | every column of every row, tracked |
| two levels | `.Include(…).ThenInclude(p => p.Comments)` | same, deeper |
| ordered children | `.Include(b => b.Posts.OrderBy(p => p.Title))` | ordering runs in SQL |
| a shape to return | `.Select(b => new Dto(b.Name, b.Posts.Count))` | only named columns, untracked |

**Include when you need the objects; project when you need a shape.**

- `Include` loads exactly the levels you name — there is no "load everything".
- `Include` is **ignored** once you `Select` into a DTO.
- A nested projection is a **LEFT join**: a parent with no children still
  appears, with an empty list.

### Relationship fixup — why EF tests lie

In the *same* context that inserted a graph, `blog.Posts` is already populated
**with no query at all**: the change tracker holds those posts and wires the
navigation up. A fresh context returns an empty collection.

A test that reuses the seeding context passes while production — one context
per request — returns nothing. Always assert against a second context.

## The N+1 problem

```csharp
var blogs = db.Blogs.ToList();                            // 1 query
foreach (var b in blogs)
    counts.Add(db.Posts.Count(p => p.BlogId == b.Id));    // N more
```

**A query inside a loop over another query's results.** Nothing warns you.
20 blogs → 21 queries; instant on a laptop, 20 seconds at scale.

Fixes: `Include` (1 query, fetches everything) or a projection (1 query,
fetches two columns). Prefer the projection.

### Seeing your own SQL

| Tool | Use |
| --- | --- |
| `query.ToQueryString()` | the SQL for one query, without running it |
| log `Microsoft.EntityFrameworkCore.Database.Command` at Information | every statement EF sends |
| `DbCommandInterceptor` | count/assert queries in a test |

If you cannot see the SQL, you cannot see N+1.

## Soft delete

```csharp
blog.IsDeleted = true;                                     // an UPDATE, not a DELETE
modelBuilder.Entity<Blog>().HasQueryFilter(b => !b.IsDeleted);   // applied everywhere
db.Blogs.IgnoreQueryFilters()                              // the deliberate escape hatch
```

A DELETE is irreversible, breaks audit trails, and cascades in ways you may
not have predicted. A global query filter means every query remembers the
`WHERE` so you don't have to.

## Schema

| Situation | Use |
| --- | --- |
| Tests, throwaway | `db.Database.EnsureCreated()` |
| Real apps | migrations (`dotnet ef migrations add`, `db.Database.Migrate()`) |

Never mix the two on one database.

## Async everywhere

`ToListAsync`, `FirstOrDefaultAsync`, `SingleOrDefaultAsync`, `AnyAsync`,
`CountAsync`, `FindAsync`, `SaveChangesAsync`.

A request thread blocked on I/O is a thread not serving anyone.
