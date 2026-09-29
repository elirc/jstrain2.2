// ─────────────────────────────────────────────────────────────────────────
//  06 · when clauses                                      ★★☆ core
//  concepts: guards vs patterns · arm order as behaviour · rules engines
//  run: dotnet run 06-when-clauses.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A pattern tests the SHAPE of a value. A `when` clause tests anything else:
//
//      Order { Express: true } o when o.Total >= 100m => 0m
//
//  The rule for choosing between them is simple and worth following:
//
//      **Anything a pattern can express, express as a pattern.**
//
//  A pattern participates in exhaustiveness checking and in the compiler's
//  subsumption analysis — it can tell you an arm is unreachable because an
//  earlier one already covers it. A `when` clause is opaque: the compiler
//  assumes it might be false, so it never warns you that an arm is dead. Push
//  logic into `when` unnecessarily and you give up the help.
//
//  What genuinely needs a `when`: a comparison BETWEEN two properties, a
//  method call, or anything involving a value from outside the subject.
//
//  The shipping rules, in priority order:
//
//      express and total >= 100     → 0      (free express over £100)
//      express                      → 15
//      not shipping to GB           → 20
//      total >= 50                  → 0
//      otherwise                    → 4.99
//
//  hint: `Order { Express: true, Total: >= 100m }` needs no `when` at all —
//        only one of the five rules genuinely does
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Shipping cost by the table above. Order matters.
decimal Shipping(Order order)
{
    throw new NotImplementedException();
}

// "over" when the order has more items than the customer's allowance,
// "at limit" when it is exactly equal, "under" otherwise. This one DOES
// need a guard — it compares two properties of the same object.
string AgainstAllowance(Order order, int allowance)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("free express over the threshold", () =>
    Eq(Shipping(new Order(150m, "GB", true, 2)), 0m));

Test("express under the threshold is charged", () =>
    Eq(Shipping(new Order(20m, "GB", true, 2)), 15m));

Test("the express threshold is inclusive", () =>
    Eq(Shipping(new Order(100m, "GB", true, 1)), 0m));

Test("international is charged even for a large order", () =>
{
    // 200 is over the free-shipping threshold, but the country rule comes
    // first. Reorder the arms and this is the test that notices.
    Eq(Shipping(new Order(200m, "FR", false, 1)), 20m);
    Eq(Shipping(new Order(20m, "FR", false, 1)), 20m);
});

Test("express beats international", () =>
    Eq(Shipping(new Order(20m, "FR", true, 1)), 15m));

Test("domestic orders over 50 ship free", () =>
{
    Eq(Shipping(new Order(50m, "GB", false, 1)), 0m);
    Eq(Shipping(new Order(49.99m, "GB", false, 1)), 4.99m);
});

Test("a small domestic order pays the flat rate", () =>
    Eq(Shipping(new Order(10m, "GB", false, 1)), 4.99m));

Test("the allowance comparison", () =>
{
    Eq(AgainstAllowance(new Order(10m, "GB", false, 5), 3), "over");
    Eq(AgainstAllowance(new Order(10m, "GB", false, 3), 3), "at limit");
    Eq(AgainstAllowance(new Order(10m, "GB", false, 1), 3), "under");
});

Test("every rule is reachable", () =>
{
    // A dead arm is a rule that will never fire, and the usual cause is an
    // earlier arm that already covers it. All five outcomes must be
    // achievable from some input.
    var outcomes = new[]
    {
        Shipping(new Order(150m, "GB", true, 1)),
        Shipping(new Order(20m, "GB", true, 1)),
        Shipping(new Order(20m, "FR", false, 1)),
        Shipping(new Order(60m, "GB", false, 1)),
        Shipping(new Order(10m, "GB", false, 1)),
    };

    Eq(outcomes.Distinct().Count(), 4);   // 0 appears twice, by design
    Eq(outcomes, new[] { 0m, 15m, 20m, 0m, 4.99m });
});

// ──────────────────────────── types ──────────────────────────────────────

public record Order(decimal Total, string Country, bool Express, int ItemCount);
