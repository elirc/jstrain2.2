// ─────────────────────────────────────────────────────────────────────────
//  03 · the report runs twice                             ★★★ hunt
//  concepts: deferred execution · multiple enumeration
//  run: dotnet run 03-the-report-runs-twice.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  THIS FILE SHIPS BROKEN. The tests are red on the first run, by design.
//
//  `Summarise` builds a report over a sequence of readings. It produces the
//  right numbers on a plain list, and then falls apart on the streaming
//  source the production code actually passes in: the counts come out wrong,
//  and the expensive source is walked far more than once.
//
//  The method is four lines. One of them is the bug, and it is the same bug
//  three times over.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// A report over the readings above `threshold`.
Report Summarise(IEnumerable<int> readings, int threshold)
{
    var above = readings.Where(r => r > threshold);

    return new Report(above.Count(), above.Sum(), above.Any() ? above.Max() : 0);
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
