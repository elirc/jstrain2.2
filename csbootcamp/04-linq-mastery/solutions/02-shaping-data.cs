// ─────────────────────────────────────────────────────────────────────────
//  02 · shaping data — SOLUTION                           ★★☆ core
//  concepts: Select · SelectMany · Where · OrderBy · Distinct
//  run: dotnet run 02-shaping-data.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Most real LINQ is four operators in a row: filter, flatten, project,
//  sort. The one people reach for last is `SelectMany`, which is a shame
//  because it is the answer whenever you have a sequence OF sequences:
//
//      orders.Select(o => o.Items)      → IEnumerable<List<Item>>   ✗
//      orders.SelectMany(o => o.Items)  → IEnumerable<Item>         ✓
//
//  `OrderBy` is a STABLE sort — equal elements keep their original relative
//  order — and `ThenBy` adds tie-breakers rather than re-sorting.
//
//  Walkthrough:
//  `SelectMany` is the operator worth internalising. `Select` gives you one
//  output per input, so projecting a list-valued property produces a sequence
//  of lists that you then have to flatten by hand. `SelectMany` does both
//  steps, and it is also what the `from … from …` form of query syntax
//  compiles to.
//
//  `LinesWithCustomer` uses the **two-argument** overload, which passes both
//  the outer item and the inner one to a result selector. Without it you lose
//  the parent as soon as you flatten, and end up doing an awkward
//  `Select(o => o.Lines.Select(l => …))` followed by another flatten. This is
//  the overload most people never discover.
//
//  `Distinct` uses `Equals`/`GetHashCode`, so it works on strings here and
//  would NOT deduplicate a plain class (module 03/02). `DistinctBy(x => x.Key)`
//  is usually what you want on objects.
//
//  `OrderBy` is a **stable** sort: elements with equal keys keep their input
//  order, which the last test pins down. That is a real guarantee you can
//  rely on, and it is why `ThenBy` exists — chaining a second `OrderBy` would
//  *re-sort* and throw the first ordering away, while `ThenBy` only breaks
//  ties.
//
//  Note the ordering test wants totals descending *within* each customer, so
//  it is `OrderBy(customer).ThenByDescending(total)`. Writing
//  `OrderBy(customer).OrderByDescending(total)` compiles, reads almost
//  identically, and produces a completely different answer.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Every line item across every order, flattened.
List<string> AllProductNames(List<Order> orders)
    // One output per LINE, not per order.
    => [.. orders.SelectMany(o => o.Lines).Select(l => l.Product)];

// "customer: product" for every line, keeping the parent's customer.
List<string> LinesWithCustomer(List<Order> orders)
    // The two-argument overload keeps the outer item in scope.
    => [.. orders.SelectMany(o => o.Lines, (order, line) => $"{order.Customer}: {line.Product}")];

// Distinct product names, alphabetically.
List<string> Catalogue(List<Order> orders)
    => [.. orders.SelectMany(o => o.Lines)
                 .Select(l => l.Product)
                 .Distinct()
                 .OrderBy(p => p, StringComparer.Ordinal)];

// Orders sorted by customer, then by total DESCENDING within each customer.
List<string> Ranked(List<Order> orders)
    // ThenByDescending breaks ties; a second OrderBy would re-sort entirely.
    => [.. orders.OrderBy(o => o.Customer, StringComparer.Ordinal)
                 .ThenByDescending(o => o.Total)
                 .Select(o => $"{o.Customer}={o.Total}")];

// ──────────────────────────── tests ──────────────────────────────────────

List<Order> Orders() =>
[
    new("ada",  [new("widget", 2), new("gadget", 1)]),
    new("bob",  [new("widget", 5)]),
    new("ada",  [new("sprocket", 1)]),
];

Test("SelectMany flattens the nested lists", () =>
    Eq(AllProductNames(Orders()), new[] { "widget", "gadget", "widget", "sprocket" }));

Test("flattening an empty list gives nothing", () =>
    Eq(AllProductNames([]), new List<string>()));

Test("an order with no lines contributes nothing", () =>
    Eq(AllProductNames([new("ada", [])]), new List<string>()));

Test("the two-argument SelectMany keeps the parent", () =>
    Eq(LinesWithCustomer(Orders()), new[]
    {
        "ada: widget", "ada: gadget", "bob: widget", "ada: sprocket",
    }));

Test("Distinct removes repeats", () =>
    Eq(Catalogue(Orders()), new[] { "gadget", "sprocket", "widget" }));

Test("Distinct on an empty source is empty", () =>
    Eq(Catalogue([]), new List<string>()));

Test("OrderBy then ThenByDescending", () =>
    Eq(Ranked(Orders()), new[] { "ada=3", "ada=1", "bob=5" }));

Test("sorting is stable for equal keys", () =>
{
    // Two orders with the same customer AND total keep input order.
    var orders = new List<Order>
    {
        new("ada", [new("first", 1)]),
        new("ada", [new("second", 1)]),
    };

    Eq(Ranked(orders), new[] { "ada=1", "ada=1" });
    Eq(AllProductNames(orders), new[] { "first", "second" });
});

// ──────────────────────────── types ──────────────────────────────────────

public record Line(string Product, int Quantity);

public record Order(string Customer, List<Line> Lines)
{
    public int Total => Lines.Sum(l => l.Quantity);
}
