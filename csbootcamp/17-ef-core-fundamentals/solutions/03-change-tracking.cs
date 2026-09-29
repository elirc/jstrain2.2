// ─────────────────────────────────────────────────────────────────────────
//  03 · change tracking — SOLUTION                        ★★☆ core
//  concepts: the change tracker · AsNoTracking · identity resolution
//  run: dotnet run 03-change-tracking.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `Reprice` finds the entity, assigns the property, and calls SaveChanges.
//  There is no `Update()` call because there does not need to be: the entity
//  came out of this context, so it is tracked, and EF diffs it against the
//  snapshot it took at load time. `db.Products.Update(p)` would also work
//  but marks EVERY property modified, producing an UPDATE that writes
//  columns nobody touched — noisier SQL and a wider window for lost updates.
//
//  `ReadOnly` uses AsNoTracking. The payoff is the sixth test: the returned
//  object is Detached, so mutating it and calling SaveChanges does nothing
//  at all. That is exactly what you want for a query whose results you are
//  about to serialise to JSON and throw away — no snapshot, less memory, and
//  no chance of an accidental write. It is also a trap if you forget it is
//  there and wonder why your edit vanished.
//
//  `StateOf` reads `db.Entry(entity).State`, which is EF telling you what it
//  will do at the next SaveChanges. Watching an entity go Unchanged →
//  Modified → Unchanged is the clearest way to build intuition for the
//  tracker, and `db.ChangeTracker.Entries()` is the tool to reach for when
//  a save writes something you did not expect.
//
//  Identity resolution — two queries for row 1 in one context returning the
//  same object — is what stops you from holding two conflicting copies of a
//  row and saving whichever you touched last. It is per CONTEXT, which is
//  another reason a DbContext is scoped to one request (module 13's DI
//  lifetimes): a longer-lived context accumulates tracked entities forever.
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

bool Reprice(ShopDb db, int id, decimal newPrice)
{
    var product = db.Products.Find(id);
    if (product is null) return false;

    product.Price = newPrice;   // tracked → the diff becomes an UPDATE
    db.SaveChanges();
    return true;
}

Product? ReadOnly(ShopDb db, int id)
    => db.Products.AsNoTracking().SingleOrDefault(p => p.Id == id);

string StateOf(ShopDb db, Product product) => db.Entry(product).State.ToString();

// ──────────────────────────── tests ──────────────────────────────────────

Test("changing a tracked entity is enough to persist it", () =>
{
    using var db = Seeded();
    Ok(Reprice(db, 1, 1.50m));

    Eq(db.Products.Single(p => p.Id == 1).Price, 1.50m);
});

Test("Reprice reports a missing product", () =>
{
    using var db = Seeded();
    Ok(!Reprice(db, 999, 1m));
});

Test("a freshly loaded entity is Unchanged", () =>
{
    using var db = Seeded();
    var product = db.Products.First();

    Eq(StateOf(db, product), "Unchanged");
});

Test("mutating a tracked entity marks it Modified", () =>
{
    using var db = Seeded();
    var product = db.Products.First();
    product.Price = 99m;

    Eq(StateOf(db, product), "Modified");
});

Test("after SaveChanges it is Unchanged again", () =>
{
    using var db = Seeded();
    var product = db.Products.First();
    product.Price = 99m;
    db.SaveChanges();

    Eq(StateOf(db, product), "Unchanged");
});

Test("an untracked entity is Detached, and edits go nowhere", () =>
{
    using var db = Seeded();
    var product = ReadOnly(db, 1);
    NotNull(product);

    Eq(StateOf(db, product!), "Detached");

    product!.Price = 12345m;
    db.SaveChanges();

    Eq(db.Products.AsNoTracking().Single(p => p.Id == 1).Price, 9.99m);
});

Test("identity resolution: two loads in one context are the same object", () =>
{
    using var db = Seeded();
    var first = db.Products.Single(p => p.Id == 1);
    var second = db.Products.Single(p => p.Id == 1);

    Ok(ReferenceEquals(first, second));
});

Test("AsNoTracking gives you a NEW object each time", () =>
{
    using var db = Seeded();
    var first = db.Products.AsNoTracking().Single(p => p.Id == 1);
    var second = db.Products.AsNoTracking().Single(p => p.Id == 1);

    Ok(!ReferenceEquals(first, second));
});

// ──────────────────────────── types ──────────────────────────────────────

static ShopDb Seeded()
{
    var connection = new SqliteConnection("Data Source=:memory:");
    connection.Open();

    var options = new DbContextOptionsBuilder<ShopDb>().UseSqlite(connection).Options;
    var db = new ShopDb(options);
    db.Database.EnsureCreated();

    db.Products.AddRange(
        new Product { Name = "widget", Price = 9.99m },
        new Product { Name = "gadget", Price = 19.99m });
    db.SaveChanges();
    return db;
}

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
}

public class ShopDb(DbContextOptions<ShopDb> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
}
