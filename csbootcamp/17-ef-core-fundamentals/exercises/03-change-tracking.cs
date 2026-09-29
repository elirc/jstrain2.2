// ─────────────────────────────────────────────────────────────────────────
//  03 · change tracking                                   ★★☆ core
//  concepts: the change tracker · AsNoTracking · identity resolution
//  run: dotnet run 03-change-tracking.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  When EF loads an entity it keeps a snapshot of the original values. At
//  SaveChanges it compares the current object to that snapshot and writes an
//  UPDATE for whatever changed — which is why this works with no Update()
//  call anywhere:
//
//      var p = db.Products.First();
//      p.Price = 5m;
//      db.SaveChanges();          // UPDATE Products SET Price = 5 WHERE ...
//
//  Two consequences worth internalising:
//
//    · Tracking costs memory and time. A read-only query should say
//      `AsNoTracking()`, and then mutations to the result go nowhere.
//    · Within one context, asking for the same row twice gives you the SAME
//      object — "identity resolution". Across two contexts it does not.
//
//  Implement the three helpers.
//
//  hint: EntityState tells you what EF thinks it will do —
//        db.Entry(entity).State is Unchanged, Modified, Added or Deleted
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

// Change the product's price and persist it. Return false if there is no
// such product. Do NOT call db.Products.Update.
bool Reprice(ShopDb db, int id, decimal newPrice)
{
    throw new NotImplementedException();
}

// Load a product WITHOUT tracking it — for read-only use.
Product? ReadOnly(ShopDb db, int id)
{
    throw new NotImplementedException();
}

// What EF currently intends to do with this entity, as a string:
// "Unchanged", "Modified", "Added", "Deleted" or "Detached".
string StateOf(ShopDb db, Product product)
{
    throw new NotImplementedException();
}

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

    // The database never heard about it.
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
