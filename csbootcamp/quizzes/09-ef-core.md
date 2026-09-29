# 09 · EF Core

Cover the answer, commit out loud, then reveal.

---

### Q1 — the two jobs

EF Core does two things at once. Name them.

<details><summary>Answer</summary>

1. **Translates LINQ into SQL** (the `IQueryable` half).
2. **Tracks objects in memory** so it knows what to write back (the change-tracker half).

Almost every EF surprise — the slow query, the update that didn't save, the update that saved something you didn't touch — is a misunderstanding of one of those two.
</details>

---

### Q2 — when does it run

```csharp
var q = db.Products.Where(p => p.Price > 10);
```

How many database round trips so far?

<details><summary>Answer</summary>

**Zero.** That builds an expression tree. Nothing executes until something forces it: `ToList`/`ToListAsync`, `First`, `Single`, `Count`, `Any`, `Sum`, `ToArray`, or a `foreach`.

Which is why `q.OrderBy(…).Take(3).ToList()` is still **one** SELECT — composition adds to the same eventual statement.
</details>

---

### Q3 — the placement

What's the difference?

```csharp
db.Products.Where(p => p.Price > 10).ToList()
db.Products.ToList().Where(p => p.Price > 10)
```

<details><summary>Answer</summary>

The first filters **in SQL**. The second loads **every row in the table** into memory and filters there.

Same answer, catastrophically different cost. After `.ToList()` you have left `IQueryable` for `IEnumerable`, and everything downstream runs in your process on data already dragged across the wire.

Where you put `.ToList()` is the single most consequential decision in an EF query.
</details>

---

### Q4 — Single or First

When should you use `Single` over `First`?

<details><summary>Answer</summary>

When **more than one match would be a bug**. `Single` throws on duplicates; `First` silently returns whichever row came back first.

`SingleOrDefault` and `FirstOrDefault` both return null for "no match" — the difference is only about the second row. Using `First` on what should be a unique key hides the day your uniqueness constraint stopped holding.
</details>

---

### Q5 — the cheap existence check

`Count() > 0`, `ToList().Any()`, or `Any()`?

<details><summary>Answer</summary>

**`Any()`** — it becomes `SELECT EXISTS(...)` and the database can stop at the first matching row.

`Count() > 0` counts every match. `ToList().Any()` fetches every match into memory first. All three are correct; only one is cheap.
</details>

---

### Q6 — no Update call

```csharp
var p = await db.Products.FindAsync(id);
p.Price = 5m;
await db.SaveChangesAsync();
```

Why does that persist without an `Update` call?

<details><summary>Answer</summary>

The entity came out of this context, so it is **tracked**. EF snapshotted its original values at load and diffs them at `SaveChanges`, emitting an UPDATE for exactly what changed.

`db.Products.Update(p)` also works but marks **every** property modified, producing a wider UPDATE that writes columns nobody touched — noisier SQL and a bigger window for lost updates.
</details>

---

### Q7 — the edit that vanished

You loaded with `AsNoTracking()`, changed a property, called `SaveChanges`,
and nothing happened. Why?

<details><summary>Answer</summary>

`AsNoTracking()` returns a **Detached** entity — no snapshot, so the change tracker has no idea it exists and there is nothing to diff.

That is the *point* for read-only queries (less memory, no accidental writes), and a genuine trap when you forget it is there. Check with `db.Entry(e).State`.
</details>

---

### Q8 — the five states

Name the `EntityState` values and what each means at the next `SaveChanges`.

<details><summary>Answer</summary>

- **Unchanged** — loaded, untouched. No SQL.
- **Modified** — a tracked property changed. UPDATE.
- **Added** — staged insert. INSERT.
- **Deleted** — staged delete. DELETE.
- **Detached** — not tracked at all. Nothing, ever.

`db.Entry(e).State` and `db.ChangeTracker.Entries()` are the tools when a save writes something you did not expect.
</details>

---

### Q9 — same object?

Query row 1 twice in one context. One object or two? What about with
`AsNoTracking()`?

<details><summary>Answer</summary>

**One object** — that is *identity resolution*. The tracker returns the instance it already has, so you cannot end up holding two conflicting copies of a row.

With `AsNoTracking()` you get a **new object each time**, because nothing is being tracked to resolve against.

Identity resolution is per **context**, which is another reason a `DbContext` is scoped to one request.
</details>

---

### Q10 — the loop

Why is `SaveChanges` inside a `foreach` a mistake?

<details><summary>Answer</summary>

**n round trips and n transactions.** If row 400 fails, rows 1–399 are already committed and there is no rollback.

`AddRange(...)` then **one** `SaveChangesAsync()` batches the inserts into a single transaction — faster and atomic.
</details>

---

### Q11 — project first

Why does the `Select` go before `ToListAsync`?

```csharp
await db.Products.Select(p => new ProductDto(p.Id, p.Name, p.Price)).ToListAsync();
```

<details><summary>Answer</summary>

Because then it is part of the **SQL**: the database is asked for three columns instead of all of them.

`.ToListAsync()` then `.Select(...)` produces identical JSON while fetching every column of every row. Invisible in a test, very visible in a query plan.

Bonus: projections are **not tracked** — there is no entity to write back — so a projected read is `AsNoTracking` for free.
</details>

---

### Q12 — entity or DTO

Why not return your entity straight from the endpoint?

<details><summary>Answer</summary>

An entity is your **storage shape**; a DTO is your **wire contract**. Returning the entity:

- **leaks columns** you never meant to publish — `Stock`, `PasswordHash`, `IsAdmin`, `InternalNotes`
- **couples every client to your schema**, so renaming a column becomes a breaking change to a public API
- drags **navigation properties** into the serialiser, which can cause cycles or accidental lazy loads

Two records cost two lines and buy you the freedom to refactor storage.
</details>

---

### Q13 — the lifetime

What lifetime does `AddDbContext` use, and what breaks if you make it a
singleton?

<details><summary>Answer</summary>

**Scoped** — one per HTTP request, which is correct: a `DbContext` is a unit of work for one request.

As a singleton it is **not thread-safe**, its change tracker is **shared between users** (request A's pending edits visible to request B), and it grows forever because tracked entities are never released.
</details>

---

### Q14 — seeding at startup

Why does this throw?

```csharp
var db = app.Services.GetRequiredService<ShopDb>();
```

<details><summary>Answer</summary>

You cannot resolve a **scoped** service from the **root** provider. Doing so would make it effectively a singleton for the app's lifetime — exactly the bug in Q13 — so the container refuses.

```csharp
using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<ShopDb>();
```

That is the framework protecting you, not a workaround.
</details>

---

### Q15 — the provider edge

`.Sum(p => p.Price * p.Stock)` on `decimal` works on SQL Server and fails on
SQLite. Why?

<details><summary>Answer</summary>

**SQLite has no decimal type.** EF stores `decimal` as TEXT to preserve it exactly, and SQLite cannot meaningfully `SUM` or `ORDER BY` a TEXT column.

Workaround: project the columns and aggregate in memory, or use a provider with a real decimal type.

The general lesson matters more than the specific one: "LINQ is provider-independent" has edges, the compiler will not warn you about them, and you find them at runtime. `.ToQueryString()` shows you what SQL you are actually getting.
</details>
