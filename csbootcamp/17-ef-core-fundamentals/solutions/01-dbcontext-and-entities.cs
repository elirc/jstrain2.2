// ─────────────────────────────────────────────────────────────────────────
//  01 · DbContext and entities — SOLUTION                 ★☆☆ warm-up
//  concepts: DbSet · SaveChanges · generated keys
//  run: dotnet run 01-dbcontext-and-entities.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `Add` stages; `SaveChanges` commits. That split is the thing to hold on
//  to — the "nothing is stored before SaveChanges" test proves it, and it is
//  why you can build up a whole object graph and persist it atomically.
//
//  After SaveChanges, EF writes the database-generated key back onto the
//  instance you handed it. That is why `product.Id` is populated without a
//  re-query: the object you added IS the tracked entity, not a copy.
//
//  `AddRange` + one `SaveChanges` is one round trip (EF batches the
//  inserts). Calling SaveChanges inside a loop instead is the classic
//  performance mistake — n round trips, n transactions, and no atomicity if
//  one fails halfway.
//
//  `CountProducts` uses `db.Products.Count()`, which translates to
//  `SELECT COUNT(*)` and asks the database. `db.Products.ToList().Count`
//  would fetch every row into memory and count them locally — same answer,
//  wildly different cost once the table is real.
//
//  The `AsNoTracking().Count()` in the "nothing is stored" test bypasses the
//  change tracker deliberately, so it reports what the DATABASE holds rather
//  than what the context is planning. Worth remembering when a query
//  surprises you with rows you have not saved yet.
//
//  `decimal` maps to a SQLite TEXT column here and round-trips exactly.
//  Mapping money to `double` is the bug that test guards against.
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

Product AddProduct(ShopDb db, string name, decimal price)
{
    var product = new Product { Name = name, Price = price };
    db.Products.Add(product);
    db.SaveChanges();
    return product;          // Id was written back onto this instance
}

void AddMany(ShopDb db, params Product[] products)
{
    db.Products.AddRange(products);
    db.SaveChanges();        // one batch, one transaction
}

int CountProducts(ShopDb db) => db.Products.Count();   // SELECT COUNT(*)

// ──────────────────────────── tests ──────────────────────────────────────

Test("a saved product gets a generated id", () =>
{
    using var db = NewDb();
    var product = AddProduct(db, "widget", 9.99m);

    Ok(product.Id > 0, "the database should have assigned an id");
});

Test("ids are assigned in insertion order", () =>
{
    using var db = NewDb();
    var first = AddProduct(db, "a", 1m);
    var second = AddProduct(db, "b", 2m);

    Eq(second.Id, first.Id + 1);
});

Test("the product can be read back", () =>
{
    using var db = NewDb();
    var saved = AddProduct(db, "widget", 9.99m);

    var found = db.Products.Single(p => p.Id == saved.Id);
    Eq(found.Name, "widget");
    Eq(found.Price, 9.99m);
});

Test("decimals survive the round trip exactly", () =>
{
    using var db = NewDb();
    AddProduct(db, "precise", 19.95m);

    Eq(db.Products.Single().Price, 19.95m);
});

Test("nothing is stored before SaveChanges", () =>
{
    using var db = NewDb();
    db.Products.Add(new Product { Name = "unsaved", Price = 1m });

    Eq(db.Products.AsNoTracking().Count(), 0);
});

Test("AddMany stores every product", () =>
{
    using var db = NewDb();
    AddMany(db,
        new Product { Name = "a", Price = 1m },
        new Product { Name = "b", Price = 2m },
        new Product { Name = "c", Price = 3m });

    Eq(CountProducts(db), 3);
});

Test("CountProducts reflects the database", () =>
{
    using var db = NewDb();
    Eq(CountProducts(db), 0);

    AddProduct(db, "one", 1m);
    Eq(CountProducts(db), 1);
});

// ──────────────────────────── types ──────────────────────────────────────

static ShopDb NewDb()
{
    var connection = new SqliteConnection("Data Source=:memory:");
    connection.Open();

    var options = new DbContextOptionsBuilder<ShopDb>().UseSqlite(connection).Options;
    var db = new ShopDb(options);
    db.Database.EnsureCreated();
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
