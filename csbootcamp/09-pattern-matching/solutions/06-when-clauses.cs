// ─────────────────────────────────────────────────────────────────────────
//  06 · when clauses — SOLUTION                           ★★☆ core
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
//  Walkthrough:
//  Five shipping rules and **not one of them needs a `when`**. That is the
//  point of the exercise: every condition here is about the shape of a single
//  value, and a property pattern says it more directly than a guard does.
//
//      Order { Express: true, Total: >= 100m }     a pattern
//      Order o when o.Express && o.Total >= 100m   a guard doing the same job
//
//  Prefer the first, and not on style grounds. Patterns take part in the
//  compiler's **subsumption analysis** — it can prove one arm is already
//  covered by an earlier one and warn you the arm is dead. A `when` clause is
//  opaque: the compiler has to assume it might be false, so an unreachable
//  guarded arm gets no warning at all. Push logic into `when` unnecessarily
//  and you have traded away the only automatic check on a growing rules list.
//
//  **`AgainstAllowance` is what a guard is actually for.** It compares
//  `order.ItemCount` against a value that is not part of the subject, and no
//  pattern can express that — a property pattern can only compare against
//  constants. Method calls and cross-property comparisons are the legitimate
//  cases; everything else is a pattern in disguise.
//
//  **Arm order is the priority table.** International beats free shipping, so
//  `Country: not "GB"` sits above `Total: >= 50m`; express beats
//  international, so it sits above both. Nothing in the code says "priority":
//  the order of the arms IS the priority, which makes this readable and also
//  makes reordering a silent behaviour change. The last test exists for
//  exactly that reason — it pins one input per rule, so a reorder turns red
//  instead of quietly re-pricing every international order.
//
//  **`not "GB"` is a negated constant pattern**, and it composes inside a
//  property pattern where `!=` cannot go. Along with `and`, `or`, and the
//  relational forms, it is usually enough to keep a `when` off the arm.
//
//  A note on the thresholds: `>= 100m` and `>= 50m` are inclusive because
//  the spec says "over £100" the way a marketing page means it. Two of the
//  tests pin exactly £100 and exactly £50 for that reason — off-by-one on a
//  price threshold is a support ticket, not a compiler error.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Shipping cost by the table above. Order matters.
decimal Shipping(Order order) => order switch
{
    // Not one `when` in the list — every rule is a shape.
    { Express: true, Total: >= 100m } => 0m,
    { Express: true } => 15m,
    { Country: not "GB" } => 20m,
    { Total: >= 50m } => 0m,
    _ => 4.99m,
};

// "over" when the order has more items than the customer's allowance,
// "at limit" when it is exactly equal, "under" otherwise. This one DOES
// need a guard — it compares two properties of the same object.
// A genuine guard: the comparison is against a value that is not part of
// the subject, which no property pattern can express.
string AgainstAllowance(Order order, int allowance) => order switch
{
    _ when order.ItemCount > allowance => "over",
    _ when order.ItemCount == allowance => "at limit",
    _ => "under",
};

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
