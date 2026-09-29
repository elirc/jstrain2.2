// ─────────────────────────────────────────────────────────────────────────
//  04 · paging and slicing                                ★★☆ core
//  concepts: Skip/Take · Chunk · TakeWhile · why paging needs an order
//  run: dotnet run 04-paging-and-slicing.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Paging is four operators and one rule that is easy to skip:
//
//      Skip(n) / Take(n)      the page
//      Chunk(n)               batches, as arrays, last one possibly short
//      TakeWhile / SkipWhile  stop or start at a CONDITION, not a count
//
//  **The rule: paging without an explicit order is undefined.** `Skip` and
//  `Take` operate on position, and if nothing fixes the position, nothing
//  stops the source returning things in a different order next time. In
//  memory it usually looks stable; against a database it is not, and the
//  symptom is a row appearing on both page 1 and page 2 while another is
//  never shown at all.
//
//  So: `OrderBy` first, then `Skip`, then `Take`. Always in that order, and
//  order by something UNIQUE — ordering by a non-unique column has exactly
//  the same problem inside each group of equal values.
//
//  hint: `TakeWhile` stops at the first element that fails the predicate,
//        which is not the same as `Where` — it does not resume afterwards
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Page `page` (1-based) of `size` items, ordered by Id so the pages are
// stable. Out-of-range pages are empty, not an error.
List<Row> Page(List<Row> rows, int page, int size)
{
    throw new NotImplementedException();
}

// Every page, in order, as a list of lists. The last one may be short.
List<List<Row>> AllPages(List<Row> rows, int size)
{
    throw new NotImplementedException();
}

// The rows up to but NOT including the first failed one.
List<Row> UntilFirstFailure(List<Row> rows)
{
    throw new NotImplementedException();
}

// Everything from the first failed one onwards, including it.
List<Row> FromFirstFailure(List<Row> rows)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

static List<Row> Rows(int count) =>
    Enumerable.Range(1, count).Select(n => new Row(n, "r" + n, true)).ToList();

Test("page 1 is the first n rows", () =>
    Eq(Page(Rows(25), 1, 10).Select(r => r.Id), Enumerable.Range(1, 10)));

Test("page 2 continues where page 1 stopped", () =>
    Eq(Page(Rows(25), 2, 10).Select(r => r.Id), Enumerable.Range(11, 10)));

Test("the last page is short, not padded", () =>
    Eq(Page(Rows(25), 3, 10).Count, 5));

Test("a page past the end is empty, not an error", () =>
    Eq(Page(Rows(25), 99, 10), Array.Empty<Row>()));

Test("paging is stable even when the source is shuffled", () =>
{
    // Same rows, different input order. If the implementation forgot to
    // order, these two disagree.
    var rows = Rows(25);
    var shuffled = rows.OrderByDescending(r => r.Id % 7).ThenByDescending(r => r.Id).ToList();

    Eq(Page(shuffled, 2, 10).Select(r => r.Id), Page(rows, 2, 10).Select(r => r.Id));
});

Test("every row appears on exactly one page", () =>
{
    var pages = AllPages(Rows(25), 10);

    Eq(pages.Count, 3);
    Eq(pages.Select(p => p.Count), new[] { 10, 10, 5 });
    Eq(pages.SelectMany(p => p).Select(r => r.Id), Enumerable.Range(1, 25));
});

Test("chunking an empty list gives no pages at all", () =>
    Eq(AllPages([], 10).Count, 0));

Test("TakeWhile stops at the first failure and does not resume", () =>
{
    // Note the difference from Where: row 4 is fine, and it is still
    // excluded, because the sequence STOPPED at row 3.
    var rows = new List<Row>
    {
        new(1, "a", true), new(2, "b", true), new(3, "c", false), new(4, "d", true),
    };

    Eq(UntilFirstFailure(rows).Select(r => r.Id), new[] { 1, 2 });
});

Test("SkipWhile is the mirror image", () =>
{
    var rows = new List<Row>
    {
        new(1, "a", true), new(2, "b", true), new(3, "c", false), new(4, "d", true),
    };

    Eq(FromFirstFailure(rows).Select(r => r.Id), new[] { 3, 4 });
});

Test("all-good and all-bad are the degenerate cases", () =>
{
    Eq(UntilFirstFailure(Rows(3)).Count, 3);
    Eq(FromFirstFailure(Rows(3)).Count, 0);
});

// ──────────────────────────── types ──────────────────────────────────────

public record Row(int Id, string Name, bool Ok);
