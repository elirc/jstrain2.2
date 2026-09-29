// ─────────────────────────────────────────────────────────────────────────
//  05 · nullable basics                                   ★★☆ core
//  concepts: null-conditional · ?? · Nullable<T> · TryGetValue
//  run: dotnet run 05-nullable-basics.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Null is the single most expensive mistake in the history of this language
//  family, and C# gives you a set of operators specifically to stop writing
//  it by hand:
//
//      x?.Y      null if x is null, else x.Y      (short-circuits the chain)
//      a ?? b    a, unless a is null, then b
//      a ??= b   assign b to a only if a is null
//      int?      an int that is allowed to be null
//
//  Build a tiny config reader over a dictionary that may be missing keys and
//  may hold null values.
//
//      Get(cfg, "port", "8080")   → the value, or "8080" if absent
//      GetInt(cfg, "port")        → 8080 as int?, or null if absent/invalid
//      City(user)                 → the city, or "unknown" anywhere down the
//                                   chain that a null shows up
//
//  hint: do it WITHOUT any `if (x == null)` — the operators above cover
//        every case here
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// The value for the key, or fallback when the key is missing or its value
// is null.
string Get(Dictionary<string, string?> config, string key, string fallback)
{
    throw new NotImplementedException();
}

// The value parsed as an int, or null when missing, null, or not a number.
int? GetInt(Dictionary<string, string?> config, string key)
{
    throw new NotImplementedException();
}

// user?.Address?.City, defaulting to "unknown" if anything on the way is
// null — including the city itself.
string City(User? user)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

var config = new Dictionary<string, string?>
{
    ["port"] = "8080",
    ["host"] = "localhost",
    ["debug"] = null,
    ["retries"] = "not-a-number",
};

Test("Get returns a present value", () =>
    Eq(Get(config, "host", "0.0.0.0"), "localhost"));

Test("Get falls back when the key is missing", () =>
    Eq(Get(config, "nope", "default"), "default"));

Test("Get falls back when the value is null", () =>
    Eq(Get(config, "debug", "off"), "off"));

Test("GetInt parses a numeric value", () =>
    Eq(GetInt(config, "port"), 8080));

Test("GetInt is null for a missing key", () =>
    Eq(GetInt(config, "nope"), null));

Test("GetInt is null for an unparseable value", () =>
    Eq(GetInt(config, "retries"), null));

Test("City walks a full chain", () =>
    Eq(City(new User { Address = new Address { City = "Paris" } }), "Paris"));

Test("City short-circuits on a null user", () =>
    Eq(City(null), "unknown"));

Test("City short-circuits on a null address", () =>
    Eq(City(new User { Address = null }), "unknown"));

Test("City falls back on a null city", () =>
    Eq(City(new User { Address = new Address { City = null } }), "unknown"));

// ──────────────────────────── types ──────────────────────────────────────

class User
{
    public Address? Address { get; set; }
}

class Address
{
    public string? City { get; set; }
}
