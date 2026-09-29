// ─────────────────────────────────────────────────────────────────────────
//  03 · aggregation and joins — SOLUTION                  ★★★ stretch
//  concepts: Aggregate · Join · GroupJoin · empty-source traps
//  run: dotnet run 03-aggregation-and-joins.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  **The empty-source asymmetry is the thing to remember.** `Sum()` on an
//  empty sequence is 0, because addition has an identity. `Max()` and
//  `Average()` throw `InvalidOperationException`, because "the largest of
//  nothing" has no answer. That inconsistency is honest rather than buggy,
//  but it means `orders.Max(o => o.Total)` is a latent crash on any query
//  that can return no rows.
//
//  Two fixes. Projecting to a NULLABLE first — `Select(l => (int?)l.Quantity)
//  .Max()` — returns null for an empty source instead of throwing, which is
//  what `LargestQuantity` uses. Or `DefaultIfEmpty(0).Max()` when you want a
//  real default. Writing `lines.Any() ? lines.Max(...) : 0` also works and
//  enumerates the source twice (module 04/01).
//
//  `Aggregate` with a **seed** is what makes the empty case work: the seed is
//  the answer when there is nothing to fold. Seedless `Aggregate` throws on an
//  empty source for exactly the same reason `Max` does. The chain uses a
//  conditional separator so a single item gets no `+` — the classic
//  trailing-separator bug avoided by testing the accumulator rather than
//  trimming afterwards. (Real code should use `string.Join`; the point here
//  is understanding the fold.)
//
//  **`Join` is an INNER join.** `"ghost"` has no catalogue entry, so it
//  disappears — silently, with no error. That is the most common surprise
//  when translating "look up the price for each line" into LINQ: rows vanish
//  and the totals are quietly wrong. If every left row must survive, `Join`
//  is the wrong operator.
//
//  **`GroupJoin` + `SelectMany` + `DefaultIfEmpty` is the LEFT join.**
//  GroupJoin gives every left row a possibly-empty group; flattening with
//  `DefaultIfEmpty` substitutes a null for the empty case, so the row
//  survives with a fallback. There is no `LeftJoin` operator, so this
//  three-step idiom is worth memorising.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

int TotalQuantity(List<Line> lines) => lines.Sum(l => l.Quantity);   // 0 when empty

int? LargestQuantity(List<Line> lines)
    // Projecting to int? makes Max return null instead of throwing.
    => lines.Select(l => (int?)l.Quantity).Max();

string ProductChain(List<Line> lines)
    // The SEED is what makes the empty case work — and is required whenever
    // the result type differs from the element type.
    => lines.Aggregate(
        "",
        (chain, line) => chain.Length == 0 ? line.Product : chain + "+" + line.Product);

List<string> Priced(List<Line> lines, List<Product> catalogue)
    // INNER join: a line with no matching product simply disappears.
    => [.. lines.Join(
        catalogue,
        line => line.Product,
        product => product.Name,
        (line, product) => $"{line.Product}@{product.Price}")];

List<string> PricedOrZero(List<Line> lines, List<Product> catalogue)
    // LEFT join: GroupJoin + SelectMany + DefaultIfEmpty. There is no
    // LeftJoin operator; this three-step dance is the idiom.
    => [.. lines
        .GroupJoin(catalogue, line => line.Product, product => product.Name,
                   (line, matches) => new { line, matches })
        .SelectMany(x => x.matches.DefaultIfEmpty(),
                    (x, product) => $"{x.line.Product}@{product?.Price ?? 0}")];

// ──────────────────────────── tests ──────────────────────────────────────

List<Line> Lines() => [new("widget", 2), new("gadget", 1), new("ghost", 4)];
List<Product> Catalogue() => [new("widget", 10), new("gadget", 20)];

Test("sums quantities", () => Eq(TotalQuantity(Lines()), 7));

Test("Sum of an empty list is 0, not an exception", () =>
    Eq(TotalQuantity([]), 0));

Test("finds the largest quantity", () => Eq(LargestQuantity(Lines()), 4));

Test("Max of an empty list is null, not an exception", () =>
{
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
