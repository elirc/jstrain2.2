// ─────────────────────────────────────────────────────────────────────────
//  06 · owned types                                       ★★☆ core
//  concepts: value objects · [Owned] · table splitting
//  run: dotnet run 06-owned-types.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Not every class in your model deserves a table. An `Address` has no
//  identity of its own — there is no "address #47" that customers refer to;
//  there is just *this customer's* address. It is a VALUE, not an entity.
//
//  EF calls that an OWNED TYPE. Mark it `[Owned]` and its properties become
//  extra COLUMNS on the owner's table, prefixed with the navigation name:
//
//      Customers( Id, Name,
//                 ShippingAddress_Street, ShippingAddress_City, … ,
//                 BillingAddress_Street,  BillingAddress_City,  … )
//
//  One table, no join, no separate id. The C# stays clean and the SQL stays
//  flat. That is *table splitting*, and it is the right shape for money,
//  coordinates, date ranges, and addresses.
//
//  The give-away that something is a value object: you would replace it
//  wholesale rather than edit it in place, and two of them with equal fields
//  are interchangeable.
//
//  Implement four operations. `Address` is already marked `[Owned]`.
//
//  hint: you can filter on an owned property just like a normal one —
//        `c.ShippingAddress.City == "Paris"` becomes a plain WHERE
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

// Store a customer with both addresses. Return the saved customer.
Customer AddCustomer(ShopDb db, string name, Address shipping, Address billing)
{
    throw new NotImplementedException();
}

// Names of customers shipping to this city, alphabetically. One query,
// filtered in SQL.
List<string> ShippingTo(ShopDb db, string city)
{
    throw new NotImplementedException();
}

// Replace a customer's shipping address wholesale. False if no such
// customer.
bool Relocate(ShopDb db, string name, Address newAddress)
{
    throw new NotImplementedException();
}

// Each customer's name paired with their shipping city, ordered by name.
List<CustomerCity> Cities(ShopDb db)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("an owned type gets no table of its own", () =>
{
    using var db = Seeded();
    var tables = db.Database.SqlQueryRaw<string>(
        "SELECT name FROM sqlite_master WHERE type='table'").ToList();

    Ok(tables.Contains("Customers"));
    Ok(!tables.Contains("Address") && !tables.Contains("Addresses"),
       "owned types are columns, not a table — got: " + string.Join(", ", tables));
});

Test("its properties become prefixed columns on the owner", () =>
{
    using var db = Seeded();
    var columns = db.Database.SqlQueryRaw<string>(
        "SELECT name FROM pragma_table_info('Customers')").ToList();

    Ok(columns.Contains("ShippingAddress_City"), string.Join(", ", columns));
    Ok(columns.Contains("BillingAddress_City"), string.Join(", ", columns));
});

Test("both addresses round-trip", () =>
{
    using var db = Seeded();

    using var fresh = TestDb.Again();
    var ada = fresh.Customers.Single(c => c.Name == "ada");

    Eq(ada.ShippingAddress.City, "Paris");
    Eq(ada.BillingAddress.City, "London");
});

Test("an owned navigation loads WITHOUT Include", () =>
{
    // It is the same row, so there is nothing extra to fetch.
    using var db = Seeded();

    using var fresh = TestDb.Again();
    Eq(fresh.Customers.Single(c => c.Name == "bob").ShippingAddress.Street, "2 Oak St");
});

Test("you can filter on an owned property in SQL", () =>
{
    using var db = Seeded();
    Eq(ShippingTo(TestDb.Again(), "Paris"), new[] { "ada" });
});

Test("filtering returns empty for an unused city", () =>
{
    using var db = Seeded();
    Eq(ShippingTo(db, "Tokyo"), new List<string>());
});

Test("replacing the whole value works", () =>
{
    using var db = Seeded();
    Ok(Relocate(db, "ada", new Address("9 Rue Neuve", "Lyon", "69000")));

    using var fresh = TestDb.Again();
    var ada = fresh.Customers.Single(c => c.Name == "ada");
    Eq(ada.ShippingAddress.City, "Lyon");
    Eq(ada.ShippingAddress.Postcode, "69000");
});

Test("relocating leaves the billing address alone", () =>
{
    using var db = Seeded();
    Relocate(db, "ada", new Address("9 Rue Neuve", "Lyon", "69000"));

    using var fresh = TestDb.Again();
    Eq(fresh.Customers.Single(c => c.Name == "ada").BillingAddress.City, "London");
});

Test("Relocate reports a missing customer", () =>
{
    using var db = Seeded();
    Ok(!Relocate(db, "nobody", new Address("x", "y", "z")));
});

Test("AddCustomer saves the owner and both owned values in one insert", () =>
{
    using var db = Seeded();
    var saved = AddCustomer(db, "cleo",
        new Address("3 Elm St", "Rome", "00184"),
        new Address("4 Fir St", "Milan", "20121"));

    Ok(saved.Id > 0);

    using var fresh = TestDb.Again();
    var cleo = fresh.Customers.Single(c => c.Name == "cleo");
    Eq(cleo.ShippingAddress, new Address("3 Elm St", "Rome", "00184"));
    Eq(cleo.BillingAddress, new Address("4 Fir St", "Milan", "20121"));
});

Test("owned values compare by value, not identity", () =>
{
    // A record: two addresses with the same fields ARE equal. That is
    // exactly what makes it a value object.
    Eq(new Address("1 Main St", "Paris", "75001"),
       new Address("1 Main St", "Paris", "75001"));
});

Test("a projection can reach into the owned value", () =>
{
    using var db = Seeded();
    Eq(Cities(TestDb.Again()), new[]
    {
        new CustomerCity("ada", "Paris"),
        new CustomerCity("bob", "Berlin"),
    });
});

// ──────────────────────────── helpers ────────────────────────────────────

ShopDb Seeded()
{
    var db = TestDb.New();

    db.Customers.AddRange(
        new Customer
        {
            Name = "ada",
            ShippingAddress = new Address("1 Main St", "Paris", "75001"),
            BillingAddress = new Address("1 Main St", "London", "EC1"),
        },
        new Customer
        {
            Name = "bob",
            ShippingAddress = new Address("2 Oak St", "Berlin", "10115"),
            BillingAddress = new Address("2 Oak St", "Berlin", "10115"),
        });

    db.SaveChanges();
    return db;
}

// ──────────────────────────── types ──────────────────────────────────────

public record CustomerCity(string Name, string City);

// No Id, no table. A value, owned by whoever holds it.
[Owned]
public record Address(string Street, string City, string Postcode);

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public Address ShippingAddress { get; set; } = null!;
    public Address BillingAddress { get; set; } = null!;
}

public class ShopDb(DbContextOptions<ShopDb> options) : DbContext(options)
{
    public DbSet<Customer> Customers => Set<Customer>();
}

static class TestDb
{
    private static SqliteConnection? _connection;

    public static ShopDb New()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        var db = Context();
        db.Database.EnsureCreated();
        return db;
    }

    public static ShopDb Again() => Context();

    private static ShopDb Context()
        => new(new DbContextOptionsBuilder<ShopDb>().UseSqlite(_connection!).Options);
}
