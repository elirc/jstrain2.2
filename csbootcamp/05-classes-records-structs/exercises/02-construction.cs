// ─────────────────────────────────────────────────────────────────────────
//  02 · construction and initialisation                   ★★☆ core
//  concepts: init · required · primary constructors · object initialisers
//  run: dotnet run 02-construction.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  C# has four ways to get values into an object, and they differ in WHEN
//  the value can be set and WHETHER the compiler enforces it:
//
//      ctor parameter     set once, enforced at compile time
//      { get; init; }     set during construction only, then frozen
//      required           the compiler REFUSES to construct without it
//      { get; set; }      set any time, by anyone, forever
//
//  `init` is the one that makes object-initialiser syntax safe: you get the
//  readable `new Thing { A = 1, B = 2 }` form AND immutability afterwards.
//  `required` closes the remaining hole — an initialiser you forgot to fill.
//
//  Build a Config type that cannot be constructed in an invalid state.
//
//  hint: a constructor that validates is the only way to guarantee an
//        invariant; `init` alone stops later mutation, not bad initial values
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("required members must be supplied", () =>
{
    // Omitting Host would not COMPILE — that is the point of `required`.
    var config = new Config { Host = "localhost" };
    Eq(config.Host, "localhost");
});

Test("init members can be set in the initialiser", () =>
    Eq(new Config { Host = "h", Port = 8080 }.Port, 8080));

Test("an unset init member keeps its default", () =>
    Eq(new Config { Host = "h" }.Port, 80));

Test("init members are frozen after construction", () =>
{
    // `config.Port = 9;` here would be a COMPILE error. The test asserts
    // the property has no public setter, which is the same guarantee.
    var property = typeof(Config).GetProperty(nameof(Config.Port))!;
    Ok(property.SetMethod is not null);
    Ok(property.SetMethod!.ReturnParameter
        .GetRequiredCustomModifiers()
        .Any(m => m.Name == "IsExternalInit"),
       "Port should be init-only");
});

Test("the validating constructor accepts good input", () =>
{
    var endpoint = new Endpoint("localhost", 8080);
    Eq(endpoint.Host, "localhost");
    Eq(endpoint.Port, 8080);
});

Test("the validating constructor rejects a blank host", () =>
    Throws<ArgumentException>(() => new Endpoint("  ", 80)));

Test("the validating constructor rejects an out-of-range port", () =>
{
    Throws<ArgumentOutOfRangeException>(() => new Endpoint("h", 0));
    Throws<ArgumentOutOfRangeException>(() => new Endpoint("h", 70_000));
});

Test("a validated type cannot exist in a bad state", () =>
{
    // Every path in is the constructor, so this holds for every instance.
    var endpoint = new Endpoint("h", 443);
    Ok(!string.IsNullOrWhiteSpace(endpoint.Host));
    Ok(endpoint.Port is > 0 and <= 65535);
});

Test("a primary constructor parameter is in scope for the whole type", () =>
{
    var greeter = new Greeter("hello");
    Eq(greeter.Greet("ada"), "hello, ada");
    Eq(greeter.Shout("ada"), "HELLO, ADA");
});

Test("Describe renders the endpoint", () =>
    Eq(new Endpoint("localhost", 8080).Describe(), "localhost:8080"));

// ──────────────────────────── types ──────────────────────────────────────

// Host is REQUIRED; Port is optional with a default. Both frozen after
// construction.
public class Config
{
    public required string Host { get; init; }
    public int Port { get; init; } = 80;
}

// A type that validates in its constructor, so no instance can be invalid.
//   · blank host  → ArgumentException
//   · port outside 1..65535 → ArgumentOutOfRangeException
//   · Describe()  → "host:port"
public class Endpoint
{
    public string Host { get; }
    public int Port { get; }

    public Endpoint(string host, int port) => throw new NotImplementedException();

    public string Describe() => throw new NotImplementedException();
}

// A primary constructor: `greeting` is usable anywhere in the class body.
public class Greeter(string greeting)
{
    public string Greet(string name) => throw new NotImplementedException();

    public string Shout(string name) => throw new NotImplementedException();
}
