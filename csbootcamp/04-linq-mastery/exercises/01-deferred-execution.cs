// ─────────────────────────────────────────────────────────────────────────
//  01 · deferred execution                                ★★☆ core
//  concepts: lazy queries · multiple enumeration · capture
//  run: dotnet run 01-deferred-execution.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A LINQ query is a RECIPE, not a result. `Where`, `Select` and friends
//  build an object that knows how to produce items; nothing runs until
//  something asks for them.
//
//      var q = items.Where(Expensive);   // nothing has happened
//      var a = q.ToList();               // NOW it runs
//      var b = q.ToList();               // and now it runs AGAIN
//
//  Two consequences that cause real bugs:
//
//    · **multiple enumeration** — every `foreach`/`Count()`/`ToList()` on the
//      same query re-executes it, re-hitting the database or re-running the
//      side effects
//    · **late capture** — the query reads its captured variables when it
//      RUNS, not when it was written
//
//  hint: `.ToList()` once is how you turn a recipe into data
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Return the query WITHOUT executing it.
IEnumerable<int> BuildQuery(IEnumerable<int> source, Func<int, bool> predicate)
{
    throw new NotImplementedException();
}

// Execute once and return a materialised list that can be read repeatedly
// without re-running the source.
List<int> RunOnce(IEnumerable<int> source, Func<int, bool> predicate)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

// Counts how many times the source was actually walked.
IEnumerable<int> Counted(int[] items, Counter counter)
{
    foreach (var item in items)
    {
        counter.Touched++;
        yield return item;
    }
}

Test("building a query touches nothing", () =>
{
    var counter = new Counter();
    BuildQuery(Counted([1, 2, 3], counter), n => n > 1);

    Eq(counter.Touched, 0);
});

Test("enumerating runs it", () =>
{
    var counter = new Counter();
    var query = BuildQuery(Counted([1, 2, 3], counter), n => n > 1);

    Eq(query.ToList(), new[] { 2, 3 });
    Eq(counter.Touched, 3);
});

Test("enumerating TWICE runs it twice", () =>
{
    // The bug: each ToList/Count/foreach re-executes the whole query.
    var counter = new Counter();
    var query = BuildQuery(Counted([1, 2, 3], counter), n => n > 1);

    query.ToList();
    query.ToList();

    Eq(counter.Touched, 6);
});

Test("materialising once fixes it", () =>
{
    var counter = new Counter();
    var list = RunOnce(Counted([1, 2, 3], counter), n => n > 1);

    list.Count();
    list.Count();

    Eq(counter.Touched, 3);   // walked once, however often you read it
});

Test("a deferred query sees a LATER change to its captured variable", () =>
{
    // Written with threshold = 1, executed with threshold = 2.
    var threshold = 1;
    var source = new[] { 1, 2, 3 };
    var query = source.Where(n => n > threshold);

    threshold = 2;
    Eq(query.ToList(), new[] { 3 });   // not { 2, 3 }
});

Test("materialising immediately freezes the captured value", () =>
{
    var threshold = 1;
    var source = new[] { 1, 2, 3 };
    var list = source.Where(n => n > threshold).ToList();

    threshold = 2;
    Eq(list, new[] { 2, 3 });          // captured at execution time
});

Test("a deferred query sees later changes to the SOURCE too", () =>
{
    var source = new List<int> { 1, 2 };
    var query = source.Where(n => n > 0);

    source.Add(3);
    Eq(query.ToList(), new[] { 1, 2, 3 });
});

Test("First and Any execute immediately, and stop early", () =>
{
    var counter = new Counter();
    var query = BuildQuery(Counted([1, 2, 3], counter), n => n > 1);

    Eq(query.First(), 2);
    Eq(counter.Touched, 2);   // stopped as soon as it had one
});

// ──────────────────────────── types ──────────────────────────────────────

public class Counter { public int Touched; }
