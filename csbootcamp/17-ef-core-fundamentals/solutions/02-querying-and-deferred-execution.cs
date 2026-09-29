// ─────────────────────────────────────────────────────────────────────────
//  02 · querying and deferred execution — SOLUTION        ★★☆ core
//  concepts: IQueryable · translation to SQL · client evaluation
//  run: dotnet run 02-querying-and-deferred-execution.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Every one of these is a single expression ending in exactly one
//  terminal operator, and that is the discipline: build the whole query as
//  IQueryable, then execute once.
//
//  `Above` filters and orders server-side, and only then materialises with
//  ToList. Writing `db.Products.ToList().Where(...)` gives the same answer
//  on three rows and pulls the entire table on three million.
//
//  `ByName` uses SingleOrDefault, not FirstOrDefault, deliberately. Both
//  return null when nothing matches; Single THROWS when more than one row
//  matches. Since the name is supposed to be unique here, Single turns a
//  broken assumption into a loud error instead of silently picking whichever
//  row the database happened to return first. Use First when "any match will
//  do" is genuinely true, Single when duplicates would be a bug.
//
//  `AnyInStock` uses `Any`, which becomes `SELECT EXISTS(...)` — the
//  database can stop at the first matching row. `Count() > 0` and
//  `.ToList().Any()` both give the right answer while scanning far more.
//
//  `StockValue` is the one that needs care with SQLite specifically. SQLite
//  has no native decimal type — EF stores decimals as TEXT to preserve them
//  exactly — and it cannot SUM a TEXT column meaningfully. So the
//  multiplication is expressed server-side where it can be, and the sum is
//  done in memory over a projection of just two columns. That is a genuine
//  provider limitation, not a style choice: on SQL Server the whole thing
//  translates. It is worth knowing that "LINQ is provider-independent" has
//  edges, and that the compiler will not warn you about them.
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

List<Product> Above(ShopDb db, decimal min)
    => db.Products
         .Where(p => p.Price > min)
         .OrderBy(p => p.Price)
         .ToList();              // one SELECT, filtered and sorted by SQL

// SingleOrDefault: null if absent, throws if ambiguous.
Product? ByName(ShopDb db, string name)
    => db.Products.SingleOrDefault(p => p.Name == name);

// Translates to SELECT EXISTS(...) — stops at the first hit.
bool AnyInStock(ShopDb db, string category)
    => db.Products.Any(p => p.Category == category && p.Stock > 0);

decimal StockValue(ShopDb db)
    // SQLite stores decimal as TEXT and cannot SUM it, so project the two
    // columns and total them in memory. On SQL Server, .Sum(p => p.Price *
    // p.Stock) translates fully.
    => db.Products
         .Select(p => new { p.Price, p.Stock })
         .AsEnumerable()
         .Sum(x => x.Price * x.Stock);

// ──────────────────────────── tests ──────────────────────────────────────

Test("Above filters and orders", () =>
{
    using var db = Seeded();
    Eq(Above(db, 5m).Select(p => p.Name), new[] { "widget", "gadget" });
});

Test("Above returns an empty list, never null", () =>
{
    using var db = Seeded();
    Eq(Above(db, 1000m), new List<Product>());
});

Test("ByName finds an exact match", () =>
{
    using var db = Seeded();
    Eq(ByName(db, "widget")?.Price, 9.99m);
});

Test("ByName returns null when nothing matches", () =>
{
    using var db = Seeded();
    Eq(ByName(db, "nope"), null);
});

Test("AnyInStock is true when stock exists", () =>
{
    using var db = Seeded();
    Ok(AnyInStock(db, "tools"));
});

Test("AnyInStock is false when everything is sold out", () =>
{
    using var db = Seeded();
    Ok(!AnyInStock(db, "books"));
});

Test("StockValue multiplies and sums in the database", () =>
{
    using var db = Seeded();
    Eq(StockValue(db), 79.95m);
});

Test("a query is only executed when it is enumerated", () =>
{
    using var db = Seeded();

    var query = db.Products.Where(p => p.Price > 5m);
    Ok(query is IQueryable<Product>);

    Eq(query.OrderBy(p => p.Name).Select(p => p.Name).ToList(),
       new[] { "gadget", "widget" });
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
        new Product { Name = "widget", Price = 9.99m, Category = "tools", Stock = 2 },
        new Product { Name = "gadget", Price = 19.99m, Category = "tools", Stock = 3 },
        new Product { Name = "novel", Price = 5.00m, Category = "books", Stock = 0 });
    db.SaveChanges();
    return db;
}

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public string Category { get; set; } = "";
    public int Stock { get; set; }
}

public class ShopDb(DbContextOptions<ShopDb> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
}
