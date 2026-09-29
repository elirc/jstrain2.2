// ─────────────────────────────────────────────────────────────────────────
//  03 · the report runs twice — SOLUTION                  ★★★ hunt
//  concepts: deferred execution · multiple enumeration
//  run: dotnet run 03-the-report-runs-twice.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  **Bug class: multiple enumeration of a deferred query.**
//
//  `above` is a QUERY, not a result (module 04/01). Each of `Count()`,
//  `Sum()`, `Any()` and `Max()` executes it again from the start — so the
//  source is walked **four** times, not once.
//
//  On a `List<int>` that is merely wasteful, which is why the first test
//  passes and the bug survives review. The damage shows up on everything
//  else:
//
//    · a **one-shot** source — a stream, a cursor, a network read — yields
//      nothing on the second pass, so the report comes back as zeros
//    · a source with **side effects** (logging, metering, paging an API) does
//      them four times
//    · an EF `IQueryable` issues **four round trips** (module 17)
//
//  The fix is one word: materialise once with `ToList()`. After that `above`
//  is data, and the four aggregates read the same in-memory array.
//
//  Note the `Any() ? Max() : 0` guard is still needed — `Max()` throws on an
//  empty sequence (module 04/03) — but against a list it is now free rather
//  than two more walks.
//
//  How to recognise it: a local holding a LINQ query that is used more than
//  once. Analyzers flag it as "possible multiple enumeration"; the
//  giveaway in review is two aggregate calls on the same variable.
//
//  The general rule: return `IEnumerable<T>` when the caller should control
//  execution, and materialise the moment you need to look at the results
//  twice.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// A report over the readings above `threshold`.
Report Summarise(IEnumerable<int> readings, int threshold)
{
    // ToList: walk the source ONCE. Without it, each aggregate below
    // re-executes the query — four passes over a possibly one-shot source.
    var above = readings.Where(r => r > threshold).ToList();

    return new Report(above.Count, above.Sum(), above.Count > 0 ? above.Max() : 0);
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("it summarises a plain list", () =>
    Eq(Summarise([1, 5, 9], 4), new Report(2, 14, 9)));

Test("nothing above the threshold is an empty report", () =>
    Eq(Summarise([1, 2], 10), new Report(0, 0, 0)));

Test("it walks the source exactly ONCE", () =>
{
    var source = new CountingSource([1, 5, 9]);
    Summarise(source, 4);

    Eq(source.Walks, 1);
});

Test("it is correct over a ONE-SHOT source", () =>
{
    // A stream, a cursor, a network read — anything that cannot be replayed.
    var source = OneShot([1, 5, 9]);
    Eq(Summarise(source, 4), new Report(2, 14, 9));
});

Test("a one-shot source with nothing above the threshold", () =>
    Eq(Summarise(OneShot([1, 2]), 10), new Report(0, 0, 0)));

Test("it does not re-run a source with side effects", () =>
{
    var pulls = 0;
    IEnumerable<int> Counted()
    {
        foreach (var n in new[] { 1, 5, 9 }) { pulls++; yield return n; }
    }

    Summarise(Counted(), 4);
    Eq(pulls, 3);
});

// ──────────────────────────── helpers ────────────────────────────────────

// Yields its items ONCE. A second enumeration returns nothing, exactly like
// a consumed network stream.
IEnumerable<int> OneShot(int[] items)
{
    var spent = false;
    return Inner();

    IEnumerable<int> Inner()
    {
        if (spent) yield break;
        spent = true;
        foreach (var item in items) yield return item;
    }
}

// ──────────────────────────── types ──────────────────────────────────────

public record Report(int Count, int Total, int Highest);

// Counts how many times it has been enumerated from the start.
public class CountingSource(int[] items) : IEnumerable<int>
{
    public int Walks { get; private set; }

    public IEnumerator<int> GetEnumerator()
    {
        Walks++;
        return ((IEnumerable<int>)items).GetEnumerator();
    }

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        => GetEnumerator();
}
