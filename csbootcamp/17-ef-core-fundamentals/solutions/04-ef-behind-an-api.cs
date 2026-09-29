// ─────────────────────────────────────────────────────────────────────────
//  04 · EF Core behind an API — SOLUTION                  ★★★ stretch
//  concepts: AddDbContext · scoped lifetime · entity vs DTO
//  run: dotnet run 04-ef-behind-an-api.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The `Select` into `ProductDto` happens BEFORE `ToListAsync`, so it is
//  part of the SQL: the database is asked for three columns, not four, and
//  `Stock` never crosses the wire or the process boundary. Projecting after
//  materialising (`.ToListAsync()` then `.Select(...)`) gives the same JSON
//  while fetching every column of every row — the difference is invisible in
//  a test and very visible in a query plan.
//
//  Projection also opts you out of change tracking automatically: EF does
//  not track anonymous or DTO results, because there is no entity to write
//  back. So a projected read query is `AsNoTracking` for free.
//
//  The DTO boundary is the other half. `Stock` is a real column that the API
//  deliberately does not publish. Return the entity instead and you have
//  published your schema: clients start depending on `stock`, and renaming
//  the column becomes a breaking change to a public contract. Two records
//  cost two lines and buy you the freedom to refactor storage.
//
//  Note the two DTOs again — `CreateProduct` has no `Id`, so a client cannot
//  propose one.
//
//  `AddDbContext` registers scoped, which is why the last test passes: each
//  request resolves a fresh context, and the previous one was disposed when
//  its request ended. Register it as a singleton and the second request
//  throws `ObjectDisposedException` — or worse, succeeds and quietly shares
//  a change tracker between users.
//
//  The seeding uses `app.Services.CreateScope()` because the app's root
//  provider cannot resolve a scoped service directly. That is not a
//  workaround; it is the framework refusing to let you accidentally
//  lengthen a scoped lifetime.
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
    // Project in SQL: three columns fetched, and no change tracking.
    app.MapGet("/products", async (ShopDb db) =>
        await db.Products
                .OrderBy(p => p.Id)
                .Select(p => new ProductDto(p.Id, p.Name, p.Price))
                .ToListAsync());

    app.MapGet("/products/{id:int}", async (int id, ShopDb db) =>
    {
        var dto = await db.Products
                          .Where(p => p.Id == id)
                          .Select(p => new ProductDto(p.Id, p.Name, p.Price))
                          .SingleOrDefaultAsync();

        return dto is null ? Results.NotFound() : Results.Ok(dto);
    });

    app.MapPost("/products", async (CreateProduct input, ShopDb db) =>
    {
        if (string.IsNullOrWhiteSpace(input.Name)) return Results.BadRequest();

        var product = new Product { Name = input.Name, Price = input.Price };
        db.Products.Add(product);
        await db.SaveChangesAsync();          // Id written back here

        var dto = new ProductDto(product.Id, product.Name, product.Price);
        return Results.Created($"/products/{product.Id}", dto);
    });
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

    Eq(await app.GetStatus("/products"), 200);
    Eq(await app.GetStatus("/products"), 200);
});

// ──────────────────────────── helpers ────────────────────────────────────

async Task<ServedApp> ServeShop()
{
    var connection = new SqliteConnection("Data Source=:memory:");
    connection.Open();

    return await Web.Serve(
        builder => builder.Services.AddDbContext<ShopDb>(o => o.UseSqlite(connection)),
        app =>
        {
            // A scoped service cannot be resolved from the root provider.
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
    public int Stock { get; set; }
}

public record ProductDto(int Id, string Name, decimal Price);
public record CreateProduct(string Name, decimal Price);

public class ShopDb(DbContextOptions<ShopDb> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
}
