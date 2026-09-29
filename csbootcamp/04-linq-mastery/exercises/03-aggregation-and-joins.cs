// ─────────────────────────────────────────────────────────────────────────
//  03 · aggregation and joins                             ★★★ stretch
//  concepts: Aggregate · Join · GroupJoin · empty-source traps
//  run: dotnet run 03-aggregation-and-joins.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Aggregates look simple and have two sharp edges:
//
//      empty.Sum()      → 0        (fine)
//      empty.Max()      → THROWS   (InvalidOperationException)
//      empty.Average()  → THROWS
//
//  `Sum` has an identity to fall back on; `Max` and `Average` do not. On any
//  collection that might be empty — which is most of them — use the nullable
//  overload or `DefaultIfEmpty`.
//
//  `Join` is an INNER join: unmatched rows on either side DISAPPEAR.
//  `GroupJoin` is the basis of a LEFT join: every left row survives, with a
//  possibly-empty group attached.
//
//  hint: `Aggregate` needs an explicit seed whenever the result type differs
//        from the element type — or when the source can be empty
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Total quantity across all lines. 0 for an empty list.
int TotalQuantity(List<Line> lines)
{
    throw new NotImplementedException();
}

// The largest quantity, or null when there is nothing.
int? LargestQuantity(List<Line> lines)
{
    throw new NotImplementedException();
}

// "a+b+c" — the products joined by '+'. Empty string for no lines.
// Use Aggregate, not string.Join.
string ProductChain(List<Line> lines)
{
    throw new NotImplementedException();
}

// INNER join: only lines whose product exists in the catalogue.
// "product@price" per match.
List<string> Priced(List<Line> lines, List<Product> catalogue)
{
    throw new NotImplementedException();
}

// LEFT join: every line appears; unknown products get price 0.
List<string> PricedOrZero(List<Line> lines, List<Product> catalogue)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

List<Line> Lines() => [new("widget", 2), new("gadget", 1), new("ghost", 4)];
List<Product> Catalogue() => [new("widget", 10), new("gadget", 20)];

Test("sums quantities", () => Eq(TotalQuantity(Lines()), 7));

Test("Sum of an empty list is 0, not an exception", () =>
    Eq(TotalQuantity([]), 0));

Test("finds the largest quantity", () => Eq(LargestQuantity(Lines()), 4));

Test("Max of an empty list is null, not an exception", () =>
{
    // The trap: a bare .Max() on an empty sequence THROWS.
    Eq(LargestQuantity([]), null);
});

Test("Aggregate builds the chain", () =>
    Eq(ProductChain(Lines()), "widget+gadget+ghost"));

Test("Aggregate over an empty list returns the seed", () =>
    Eq(ProductChain([]), ""));

Test("Aggregate over one item has no separator", () =>
    Eq(ProductChain([new("solo", 1)]), "solo"));

Test("an inner join drops unmatched lines", () =>
{
    // "ghost" is not in the catalogue, so it vanishes — silently.
    Eq(Priced(Lines(), Catalogue()), new[] { "widget@10", "gadget@20" });
});

Test("an inner join with no catalogue yields nothing", () =>
    Eq(Priced(Lines(), []), new List<string>()));

Test("a left join keeps every line", () =>
    Eq(PricedOrZero(Lines(), Catalogue()),
       new[] { "widget@10", "gadget@20", "ghost@0" }));

Test("a left join with no catalogue keeps them all at zero", () =>
    Eq(PricedOrZero(Lines(), []), new[] { "widget@0", "gadget@0", "ghost@0" }));

// ──────────────────────────── types ──────────────────────────────────────

public record Line(string Product, int Quantity);
public record Product(string Name, int Price);
