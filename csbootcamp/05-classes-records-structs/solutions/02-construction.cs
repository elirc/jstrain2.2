// ─────────────────────────────────────────────────────────────────────────
//  02 · construction and initialisation — SOLUTION        ★★☆ core
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
//  Walkthrough:
//  Four mechanisms, and they solve different halves of the same problem.
//
//  `init` freezes a property AFTER construction while still allowing the
//  readable object-initialiser form. Before `init` existed you had to choose:
//  a constructor with eight positional arguments, or `set` and hope nobody
//  wrote to it later. `init` gives you both.
//
//  `required` closes the gap `init` leaves open: an initialiser you simply
//  forgot to fill. Omitting `Host` in `new Config { }` is a **compile
//  error**, not a null at runtime. That is enforcement the type system does
//  for free, and it is why `required` beats a `[Required]` attribute for
//  anything constructed in code.
//
//  But neither stops a BAD value. `new Config { Host = "  ", Port = -1 }`
//  compiles happily. Only a constructor can enforce an invariant, because a
//  constructor is the one place every instance must pass through. That is
//  what `Endpoint` demonstrates: validate once, and every `Endpoint` that
//  exists anywhere in the program is valid. No caller has to check, and no
//  code path can skip it.
//
//  This is the "make invalid states unrepresentable" idea in its cheapest
//  form. Compare with validating at the API boundary (module 16): that
//  catches bad input arriving, while a validating constructor catches bad
//  input from *anywhere*, including your own code.
//
//  The primary constructor on `Greeter` puts `greeting` in scope for the
//  whole class body — no field, no assignment. The compiler captures it into
//  a private field only if a member actually uses it. Note it is NOT a
//  property: `greeter.greeting` does not exist, which is usually what you
//  want for a dependency.
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

    public Endpoint(string host, int port)
    {
        // Every instance passes through here, so the invariant holds for all.
        if (string.IsNullOrWhiteSpace(host))
            throw new ArgumentException("host must not be blank", nameof(host));
        ArgumentOutOfRangeException.ThrowIfLessThan(port, 1);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(port, 65535);

        Host = host;
        Port = port;
    }

    public string Describe() => $"{Host}:{Port}";
}

// A primary constructor: `greeting` is usable anywhere in the class body.
public class Greeter(string greeting)
{
    // `greeting` is in scope for the whole body — no field to declare.
    public string Greet(string name) => $"{greeting}, {name}";

    public string Shout(string name) => Greet(name).ToUpperInvariant();
}
