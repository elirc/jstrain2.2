// ─────────────────────────────────────────────────────────────────────────
//  03 · exhaustiveness — SOLUTION                         ★★☆ core
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
//  Walkthrough:
//  **Running this file prints two CS8509 warnings.** That is not a mistake to
//  fix — it is the entire lesson, on screen. `Crypto` exists and neither
//  `Fee` nor `Describe` handles it, so the compiler names both switches and
//  tells you they are not exhaustive. In a real refactor that warning list is
//  your work queue.
//
//  Add a `_` arm and the warnings disappear. So does the help. `Crypto` then
//  silently takes the default, the code compiles clean, and the bug reaches
//  production wearing a plausible answer — which is what
//  `DescribeWithFallback` demonstrates in the sixth test.
//
//  **`SwitchExpressionException` is the good failure.** With no `_`, an
//  unhandled case throws at the point of the mistake with the value in the
//  message. Loud and immediate beats "the fee was 0 and nobody noticed for a
//  quarter".
//
//  **Closed versus open is the whole distinction.** `Payment` is a closed
//  set: an abstract record whose subtypes all live here, so the compiler can
//  enumerate them and a missing case is knowable. `object` is open — any
//  assembly can add a type — so `Kind` MUST have a fallback, and having one
//  there is correctness, not laziness. Same syntax, opposite advice, and the
//  thing that decides is whether the set can grow behind your back.
//
//  (Making the subtypes `sealed` matters too: an unsealed `Card` could be
//  inherited from elsewhere, and `Card card` would still match, but you would
//  have lost the guarantee that you know what a `Card` is.)
//
//  **`Cash => "cash"`** with no identifier is a type pattern that binds
//  nothing — the same as `Cash _`. Use it whenever you only care that the
//  case matched.
//
//  On the arithmetic: `Math.Round(amount * 0.029m, 2)` on `decimal` uses
//  banker's rounding by default (midpoints go to the even digit). For money
//  that is often what an accountant wants; when it is not, say
//  `MidpointRounding.AwayFromZero` explicitly rather than discovering the
//  difference from a reconciliation report.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Runtime.CompilerServices;

// Fee by payment type:
//   Card    → 2.9% of amount, rounded to 2dp
//   Cash    → 0
//   Invoice → 1.50 flat
// No `_` arm: the hierarchy is closed and you want the compiler's help.
decimal Fee(Payment payment, decimal amount) => payment switch
{
    Card => Math.Round(amount * 0.029m, 2),
    Cash => 0m,
    Invoice => 1.50m,
    // No `_`. The CS8509 warning here is the compiler telling you Crypto
    // exists and is unhandled — which is exactly what you want it to say.
};

// A human label. Card includes the last four: "card ending 4242".
// Again, no `_` arm.
string Describe(Payment payment) => payment switch
{
    Card card => "card ending " + card.Last4,
    Cash => "cash",
    Invoice invoice => $"invoice, net {invoice.Days}",
};

// Same idea over an OPEN set: `object` can be anything, so a fallback is
// mandatory here rather than a mistake. Return "int", "string", "null",
// or "other".
// `object` is an OPEN set — any assembly can add to it — so the fallback
// here is correctness, not laziness.
string Kind(object? value) => value switch
{
    int => "int",
    string => "string",
    null => "null",
    _ => "other",
};

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
