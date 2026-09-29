// ─────────────────────────────────────────────────────────────────────────
//  02 · shaping data                                      ★★☆ core
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
//  hint: `SelectMany` has an overload giving you both the outer and inner
//        item, which is how you keep the parent's data while flattening
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Every line item across every order, flattened.
List<string> AllProductNames(List<Order> orders)
{
    throw new NotImplementedException();
}

// "customer: product" for every line, keeping the parent's customer.
List<string> LinesWithCustomer(List<Order> orders)
{
    throw new NotImplementedException();
}

// Distinct product names, alphabetically.
List<string> Catalogue(List<Order> orders)
{
    throw new NotImplementedException();
}

// Orders sorted by customer, then by total DESCENDING within each customer.
List<string> Ranked(List<Order> orders)
{
    throw new NotImplementedException();
}

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
