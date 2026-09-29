// ─────────────────────────────────────────────────────────────────────────
//  03 · many implementations                              ★★☆ core
//  concepts: IEnumerable<T> injection · keyed services · TryAdd · decorators
//  run: dotnet run 03-many-implementations.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Registering the same interface twice does not "overwrite" it. The
//  container keeps BOTH, and what you get depends on how you ask:
//
//      GetRequiredService<IRule>()      → the LAST one registered
//      GetRequiredService<IEnumerable<IRule>>()  → ALL of them, in order
//
//  That second form is how you build a pipeline of rules, validators or
//  handlers without a switch statement: register each one, inject the whole
//  set, run them all.
//
//  When you need to pick a *specific* one by name, use keyed services:
//
//      services.AddKeyedSingleton<IStore, Redis>("cache");
//      provider.GetRequiredKeyedService<IStore>("cache");
//
//  And `TryAdd*` registers only if that service type is not already there —
//  which is how library authors supply a default you can override.
//
//  hint: injecting `IEnumerable<IRule>` gives you every registration, in
//        registration order — that order is part of your behaviour
#:project ../../_lib/Check/Check.csproj
#:package Microsoft.Extensions.DependencyInjection@10.0.11

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

// Register all three rules, in this order: NotEmpty, MaxLength, NoDigits.
// Also register Validator, which runs them all.
ServiceProvider BuildRules()
{
    throw new NotImplementedException();
}

// Register TWO stores under the keys "fast" and "durable".
ServiceProvider BuildKeyed()
{
    throw new NotImplementedException();
}

// Register `first` as IGreeter, then TRY to add `second`. The TryAdd must
// not replace the existing registration.
ServiceProvider BuildWithDefault()
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("injecting IEnumerable gives every registration", () =>
{
    using var provider = BuildRules();
    var rules = provider.GetRequiredService<IEnumerable<IRule>>().ToList();

    Eq(rules.Count, 3);
});

Test("they arrive in REGISTRATION order", () =>
{
    using var provider = BuildRules();
    var names = provider.GetRequiredService<IEnumerable<IRule>>()
                        .Select(r => r.GetType().Name);

    Eq(names, new[] { "NotEmpty", "MaxLength", "NoDigits" });
});

Test("the validator runs all of them and collects every failure", () =>
{
    using var provider = BuildRules();
    var validator = provider.GetRequiredService<Validator>();

    // "" is empty AND has no digits problem; only NotEmpty should fire.
    Eq(validator.Check(""), new[] { "must not be empty" });
});

Test("several rules can fail at once", () =>
{
    using var provider = BuildRules();
    var validator = provider.GetRequiredService<Validator>();

    Eq(validator.Check("abcdefghijk1"), new[]
    {
        "must be 10 characters or fewer",
        "must not contain digits",
    });
});

Test("valid input produces no failures", () =>
{
    using var provider = BuildRules();
    Eq(provider.GetRequiredService<Validator>().Check("hello"), new List<string>());
});

Test("resolving the bare interface gives the LAST registration", () =>
{
    // A real gotcha: registering twice does not overwrite, but a single
    // resolve silently picks one.
    using var provider = BuildRules();
    Eq(provider.GetRequiredService<IRule>().GetType().Name, "NoDigits");
});

Test("keyed services are picked by name", () =>
{
    using var provider = BuildKeyed();

    Eq(provider.GetRequiredKeyedService<IStore>("fast").Name, "memory");
    Eq(provider.GetRequiredKeyedService<IStore>("durable").Name, "disk");
});

Test("an unknown key throws rather than guessing", () =>
{
    using var provider = BuildKeyed();
    Throws<InvalidOperationException>(() => provider.GetRequiredKeyedService<IStore>("nope"));
});

Test("TryAdd does not replace an existing registration", () =>
{
    using var provider = BuildWithDefault();
    Eq(provider.GetRequiredService<IGreeter>().Greet(), "hello from first");
});

Test("TryAdd also does not add a second one", () =>
{
    using var provider = BuildWithDefault();
    Eq(provider.GetRequiredService<IEnumerable<IGreeter>>().Count(), 1);
});

// ──────────────────────────── types ──────────────────────────────────────

public interface IRule
{
    // Null when the value passes.
    string? Check(string value);
}

public class NotEmpty : IRule
{
    public string? Check(string value)
        => string.IsNullOrWhiteSpace(value) ? "must not be empty" : null;
}

public class MaxLength : IRule
{
    public string? Check(string value)
        => value.Length > 10 ? "must be 10 characters or fewer" : null;
}

public class NoDigits : IRule
{
    public string? Check(string value)
        => value.Any(char.IsDigit) ? "must not contain digits" : null;
}

// Runs every registered rule and returns the failures, in rule order.
public class Validator(IEnumerable<IRule> rules)
{
    public List<string> Check(string value)
        => [.. rules.Select(r => r.Check(value)).Where(m => m is not null).Cast<string>()];
}

public interface IStore { string Name { get; } }
public class MemoryStore : IStore { public string Name => "memory"; }
public class DiskStore : IStore { public string Name => "disk"; }

public interface IGreeter { string Greet(); }
public class FirstGreeter : IGreeter { public string Greet() => "hello from first"; }
public class SecondGreeter : IGreeter { public string Greet() => "hello from second"; }
