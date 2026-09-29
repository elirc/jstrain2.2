// ─────────────────────────────────────────────────────────────────────────
//  03 · exhaustiveness                                    ★★☆ core
//  concepts: closed hierarchies · why `_` is a liability · union-style types
//  run: dotnet run 03-exhaustiveness.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  C# has no `enum class` or discriminated union, but an **abstract record
//  with sealed subtypes** gets you most of the way:
//
//      public abstract record Payment;
//      public sealed record Card(string Last4) : Payment;
//      public sealed record Cash : Payment;
//
//  Nothing outside this file can add a case — `Payment` has no accessible
//  constructor for anyone else to call — so the set of possibilities is
//  CLOSED. That is what makes exhaustiveness checking useful: the compiler
//  can tell you when a `switch` has missed one.
//
//  Which leads to the rule this exercise exists for:
//
//      **In a closed hierarchy, do not write a `_` arm.**
//
//  A `_` silences the exhaustiveness warning forever. Add a fourth payment
//  type six months from now and the compiler says nothing — the new case
//  quietly takes the default, which is a bug that ships. Without the `_`, the
//  compiler points at every switch that needs updating, which is exactly the
//  refactoring help you wanted.
//
//  A switch expression that misses a case at run time throws
//  `System.Runtime.CompilerServices.SwitchExpressionException`.
//
//  hint: `Describe` is the one that must have no `_` arm; the tests check
//        both what it returns and what it does with something unexpected
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Runtime.CompilerServices;

// Fee by payment type:
//   Card    → 2.9% of amount, rounded to 2dp
//   Cash    → 0
//   Invoice → 1.50 flat
// No `_` arm: the hierarchy is closed and you want the compiler's help.
decimal Fee(Payment payment, decimal amount)
{
    throw new NotImplementedException();
}

// A human label. Card includes the last four: "card ending 4242".
// Again, no `_` arm.
string Describe(Payment payment)
{
    throw new NotImplementedException();
}

// Same idea over an OPEN set: `object` can be anything, so a fallback is
// mandatory here rather than a mistake. Return "int", "string", "null",
// or "other".
string Kind(object? value)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("card fees are a percentage", () =>
    Eq(Fee(new Card("4242"), 100m), 2.90m));

Test("cash is free and invoices are flat", () =>
{
    Eq(Fee(new Cash(), 100m), 0m);
    Eq(Fee(new Invoice(30), 100m), 1.50m);
    Eq(Fee(new Invoice(30), 1000m), 1.50m);
});

Test("the fee rounds to two decimal places", () =>
    Eq(Fee(new Card("4242"), 33.33m), 0.97m));

Test("each case gets its own description", () =>
{
    Eq(Describe(new Card("4242")), "card ending 4242");
    Eq(Describe(new Cash()), "cash");
    Eq(Describe(new Invoice(30)), "invoice, net 30");
});

Test("an unhandled case throws rather than returning a wrong answer", () =>
{
    // Pretend a fourth type appeared and Describe was not updated. With no
    // `_` arm the failure is loud and immediate; with one it would silently
    // return the default and nobody would find out.
    Throws<SwitchExpressionException>(() => Describe(new Crypto()));
});

Test("a `_` arm would have hidden it", () =>
{
    // Same input, a switch that HAS a fallback. It returns a plausible
    // string and reports nothing. This is the bug the rule prevents.
    Eq(DescribeWithFallback(new Crypto()), "unknown");
    Eq(DescribeWithFallback(new Cash()), "cash");
});

Test("an OPEN set needs the fallback", () =>
{
    Eq(Kind(42), "int");
    Eq(Kind("ada"), "string");
    Eq(Kind(null), "null");
    Eq(Kind(3.14), "other");
});

// ──────────────────────────── given ──────────────────────────────────────

// The contrast case: identical logic, plus a `_`.
static string DescribeWithFallback(Payment payment) => payment switch
{
    Card card => "card ending " + card.Last4,
    Cash => "cash",
    Invoice invoice => $"invoice, net {invoice.Days}",
    _ => "unknown",
};

public abstract record Payment;
public sealed record Card(string Last4) : Payment;
public sealed record Cash : Payment;
public sealed record Invoice(int Days) : Payment;

// Added later, on purpose, and deliberately not handled anywhere.
public sealed record Crypto : Payment;
