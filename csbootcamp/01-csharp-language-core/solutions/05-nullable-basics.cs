// ─────────────────────────────────────────────────────────────────────────
//  05 · nullable basics — SOLUTION                        ★★☆ core
//  concepts: null-conditional · ?? · Nullable<T> · TryGetValue
//  run: dotnet run 05-nullable-basics.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Get leans on TryGetValue, which handles "missing" without throwing, and
//  then ?? handles "present but null". Two different kinds of absence, two
//  operators, one line. The wrong turn is `config[key]` — that throws
//  KeyNotFoundException rather than returning null, so the fallback never
//  runs.
//
//  GetInt shows that `int.TryParse` and `int?` fit together neatly: parse
//  into an int, and choose between the parsed value and null based on the
//  bool. Note `out var n` declares n inline. The `is not null` guard before
//  parsing is needed because TryParse accepts a null string but you want the
//  missing-key and null-value cases to land on the same answer anyway.
//
//  City is the whole point of ?.  Each ? short-circuits the ENTIRE rest of
//  the chain, so one test covers user==null, Address==null and City==null.
//  Written by hand that is three nested ifs; written with ?. it is one
//  expression, and the ?? at the end supplies the default exactly once.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

string Get(Dictionary<string, string?> config, string key, string fallback)
    => (config.TryGetValue(key, out var value) ? value : null) ?? fallback;

int? GetInt(Dictionary<string, string?> config, string key)
{
    if (!config.TryGetValue(key, out var raw) || raw is null) return null;
    return int.TryParse(raw, out var n) ? n : null;
}

string City(User? user) => user?.Address?.City ?? "unknown";

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
