// ─────────────────────────────────────────────────────────────────────────
//  06 · owned types — SOLUTION                            ★★☆ core
//  concepts: value objects · [Owned] · table splitting
//  run: dotnet run 06-owned-types.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The implementations are unremarkable, and that is the finding: an owned
//  type behaves like ordinary properties everywhere it matters. You filter on
//  `c.ShippingAddress.City` exactly as you would on `c.Name`, and it compiles
//  to a plain `WHERE ShippingAddress_City = @city` against one table.
//
//  The two schema tests are the point. There is no `Addresses` table and no
//  address id — the columns live on `Customers`, prefixed by the navigation
//  name, which is how one entity can hold *two* addresses without ambiguity.
//  That is table splitting.
//
//  Consequences worth carrying:
//
//    · **No `Include` needed.** The data is already in the row being read.
//      Test 4 relies on that: `ShippingAddress` is populated with no extra
//      query, because there was never an extra table to join.
//    · **No identity.** You cannot query `db.Addresses`, share one address
//      between two customers, or hold a reference to it. Deleting the
//      customer deletes the address, necessarily — it was columns.
//    · **Replace, don't mutate.** `Relocate` assigns a whole new `Address`.
//      Since `Address` is a `record`, it is immutable anyway, and EF just
//      writes the three columns. That is the natural grammar for a value.
//
//  The last-but-one test is the conceptual anchor: two addresses with equal
//  fields are *equal*. Entities are compared by identity (two customers named
//  "ada" are different customers); values are compared by content (two
//  addresses at 1 Main St are the same address). Which comparison is correct
//  for a type is how you decide whether it deserves a table.
//
//  When you DO want a separate table but still no independent identity, use
//  `OwnsMany` — the owned collection lives in its own table with a foreign
//  key back, and still cannot be queried on its own. And when the thing turns
//  out to have real identity after all (an Address that customers *share*),
//  promote it to an entity and accept the join.
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

Customer AddCustomer(ShopDb db, string name, Address shipping, Address billing)
{
    var customer = new Customer
    {
        Name = name,
        ShippingAddress = shipping,
        BillingAddress = billing,
    };

    db.Customers.Add(customer);
    db.SaveChanges();     // one INSERT — the addresses are columns
    return customer;
}

List<string> ShippingTo(ShopDb db, string city)
    // Reaches into the owned value; becomes WHERE ShippingAddress_City = @city.
    => db.Customers
         .Where(c => c.ShippingAddress.City == city)
         .OrderBy(c => c.Name)
         .Select(c => c.Name)
         .ToList();

bool Relocate(ShopDb db, string name, Address newAddress)
{
    var customer = db.Customers.SingleOrDefault(c => c.Name == name);
    if (customer is null) return false;

    // Replace the whole value rather than editing it — a record is
    // immutable, and this is the natural grammar for a value object.
    customer.ShippingAddress = newAddress;
    db.SaveChanges();
    return true;
}

List<CustomerCity> Cities(ShopDb db)
    => db.Customers
         .OrderBy(c => c.Name)
         .Select(c => new CustomerCity(c.Name, c.ShippingAddress.City))
         .ToList();

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
