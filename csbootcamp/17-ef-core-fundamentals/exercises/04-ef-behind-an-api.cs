// ─────────────────────────────────────────────────────────────────────────
//  04 · EF Core behind an API                             ★★★ stretch
//  concepts: AddDbContext · scoped lifetime · entity vs DTO
//  run: dotnet run 04-ef-behind-an-api.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Putting the two halves together. `AddDbContext<T>` registers the context
//  as SCOPED — one per HTTP request — which is exactly right: a DbContext is
//  a unit of work for one request, and its change tracker must not outlive
//  it. Registering it as a singleton is a genuine production outage waiting
//  to happen (a shared change tracker, cross-request data bleed, and it is
//  not thread-safe).
//
//  The other rule: do not serialise entities straight to the client. An
//  entity is your storage shape; a DTO is your wire contract. Returning the
//  entity leaks columns you did not mean to publish, and couples every
//  client to your schema — rename a column and you break them.
//
//  Build the endpoints:
//
//      GET  /products        → 200, list of {id, name, price} — no Stock
//      GET  /products/{id}   → 200 or 404
//      POST /products        → 201 + Location, or 400 for a blank name
//
//  Use async EF methods (ToListAsync, FindAsync, SaveChangesAsync) — a
//  request thread blocked on I/O is a thread not serving anyone.
//
//  hint: the DbContext is injected into the handler like any other service;
//        project with Select BEFORE ToListAsync so SQL fetches only what
//        the DTO needs
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

void MapRoutes(WebApplication app)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("the seeded products are listed", async () =>
{
    await using var app = await ServeShop();
    Eq(await app.GetBody("/products"),
       "[{\"id\":1,\"name\":\"widget\",\"price\":9.99},"
       + "{\"id\":2,\"name\":\"gadget\",\"price\":19.99}]");
});

Test("the response is the DTO, not the entity", async () =>
{
    await using var app = await ServeShop();
    var body = await app.GetBody("/products");

    // Stock is a column, not part of the contract.
    Ok(!body.Contains("stock", StringComparison.OrdinalIgnoreCase));
});

Test("a single product is returned by id", async () =>
{
    await using var app = await ServeShop();
    Eq(await app.GetBody("/products/1"), "{\"id\":1,\"name\":\"widget\",\"price\":9.99}");
});

Test("a missing product is a 404", async () =>
{
    await using var app = await ServeShop();
    Eq(await app.GetStatus("/products/999"), 404);
});

Test("POST creates a product and returns 201", async () =>
{
    await using var app = await ServeShop();
    var response = await app.PostJson("/products", new { name = "sprocket", price = 4.50m });

    Eq((int)response.StatusCode, 201);
    Eq(response.Headers.Location?.ToString(), "/products/3");
});

Test("the created product is really in the database", async () =>
{
    await using var app = await ServeShop();
    await app.PostJson("/products", new { name = "sprocket", price = 4.50m });

    Eq(await app.GetBody("/products/3"), "{\"id\":3,\"name\":\"sprocket\",\"price\":4.5}");
});

Test("a blank name is a 400 and stores nothing", async () =>
{
    await using var app = await ServeShop();
    var response = await app.PostJson("/products", new { name = "  ", price = 1m });

    Eq((int)response.StatusCode, 400);
    Eq(await app.GetStatus("/products/3"), 404);
});

Test("each request gets its own DbContext", async () =>
{
    await using var app = await ServeShop();

    // Two independent requests both succeed; a shared/disposed context
    // would throw ObjectDisposedException on the second.
    Eq(await app.GetStatus("/products"), 200);
    Eq(await app.GetStatus("/products"), 200);
});

// ──────────────────────────── helpers ────────────────────────────────────

// Starts the app over a private in-memory database seeded with two rows.
async Task<ServedApp> ServeShop()
{
    var connection = new SqliteConnection("Data Source=:memory:");
    connection.Open();

    return await Web.Serve(
        builder => builder.Services.AddDbContext<ShopDb>(o => o.UseSqlite(connection)),
        app =>
        {
            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ShopDb>();
                db.Database.EnsureCreated();
                db.Products.AddRange(
                    new Product { Name = "widget", Price = 9.99m, Stock = 5 },
                    new Product { Name = "gadget", Price = 19.99m, Stock = 0 });
                db.SaveChanges();
            }

            MapRoutes(app);
        });
}

// ──────────────────────────── types ──────────────────────────────────────

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public int Stock { get; set; }          // internal — never sent to clients
}

public record ProductDto(int Id, string Name, decimal Price);
public record CreateProduct(string Name, decimal Price);

public class ShopDb(DbContextOptions<ShopDb> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
}
