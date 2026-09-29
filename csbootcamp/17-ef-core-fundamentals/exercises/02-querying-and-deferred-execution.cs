// ─────────────────────────────────────────────────────────────────────────
//  02 · querying and deferred execution                   ★★☆ core
//  concepts: IQueryable · translation to SQL · client evaluation
//  run: dotnet run 02-querying-and-deferred-execution.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `db.Products.Where(...)` does not run a query. It builds an EXPRESSION
//  TREE that EF later translates into SQL. Nothing executes until something
//  forces it: `ToList`, `First`, `Count`, `Any`, or a `foreach`.
//
//  That is why this is one query, not two:
//
//      var q = db.Products.Where(p => p.Price > 10);   // no SQL yet
//      var top = q.OrderBy(p => p.Name).Take(3).ToList();   // ONE SELECT
//
//  And why this is a disaster:
//
//      db.Products.ToList().Where(p => p.Price > 10)   // loads EVERY row
//
//  The moment you call ToList you leave IQueryable and land in
//  IEnumerable — everything after that runs in your process, on data already
//  dragged across the wire. Where the `.ToList()` goes is the single most
//  consequential decision in an EF query.
//
//  Implement four queries. All of them must run in the DATABASE.
//
//  hint: FirstOrDefault returns null when nothing matches; Single THROWS if
//        there is more than one — that difference is the exercise
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

// Products costing more than `min`, cheapest first.
List<Product> Above(ShopDb db, decimal min)
{
    throw new NotImplementedException();
}

// The single product with this exact name, or null if there is none.
Product? ByName(ShopDb db, string name)
{
    throw new NotImplementedException();
}

// Is anything in this category in stock? Must not load the rows.
bool AnyInStock(ShopDb db, string category)
{
    throw new NotImplementedException();
}

// Total value of stock: sum of Price * Stock, computed by the database.
decimal StockValue(ShopDb db)
{
    throw new NotImplementedException();
}

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
    // widget 9.99*2 + gadget 19.99*3 + novel 5.00*0 = 79.95
    Eq(StockValue(db), 79.95m);
});

Test("a query is only executed when it is enumerated", () =>
{
    using var db = Seeded();

    // Building the query touches nothing…
    var query = db.Products.Where(p => p.Price > 5m);
    // …and it is still an IQueryable, not results.
    Ok(query is IQueryable<Product>);

    // Composing further still adds to the SAME eventual SQL statement.
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
