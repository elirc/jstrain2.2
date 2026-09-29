// ─────────────────────────────────────────────────────────────────────────
//  06 · custom operators                                  ★★★ stretch
//  concepts: extension methods · yield · eager argument validation
//  run: dotnet run 06-custom-operators.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  LINQ is not magic — every operator is an extension method on
//  `IEnumerable<T>`, and yours compose with the built-in ones exactly the
//  same way. Writing a couple is the fastest way to stop treating it as a
//  closed set.
//
//  The one non-obvious rule, and the reason this exercise is ★★★:
//
//      **An iterator method's body does not run when you call it.**
//
//  A method containing `yield return` returns a state machine immediately.
//  Nothing inside it executes until the first `MoveNext` — including your
//  argument checks. So this is broken:
//
//      static IEnumerable<T> Batch<T>(this IEnumerable<T> source, int size)
//      {
//          if (size < 1) throw new ArgumentOutOfRangeException(nameof(size));
//          …
//          yield return …;
//      }
//
//  `Batch(items, 0)` returns happily and throws later, from somewhere else,
//  usually inside a `foreach` in unrelated code. The fix is the **two-method
//  split** that every operator in the BCL uses: a normal method that
//  validates and then calls a private iterator.
//
//  hint: `TakeUntil` includes the element that ended it; `TakeWhile` does not
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// An infinite sequence: only a lazy operator can survive it.
static IEnumerable<int> Forever()
{
    for (var n = 0; ; n++)
        yield return n;
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("Batch splits into fixed-size groups", () =>
    Eq(new[] { 1, 2, 3, 4, 5 }.Batch(2).Select(b => b.ToArray()),
       new[] { new[] { 1, 2 }, [3, 4], [5] }));

Test("Batch of an empty source yields nothing", () =>
    Eq(Array.Empty<int>().Batch(3).Count(), 0));

Test("a bad size throws IMMEDIATELY, not on enumeration", () =>
{
    // The whole point of the two-method split. Without it this line is
    // perfectly happy and the throw arrives from inside someone's foreach,
    // three stack frames away from the mistake.
    Throws<ArgumentOutOfRangeException>(() => new[] { 1, 2 }.Batch(0));
    Throws<ArgumentOutOfRangeException>(() => new[] { 1, 2 }.Batch(-1));
});

Test("a null source also throws immediately", () =>
    Throws<ArgumentNullException>(() => ((IEnumerable<int>)null!).Batch(2)));

Test("Batch is still lazy once the arguments are good", () =>
{
    // Nothing has been read yet: the source is infinite and this returns.
    var batches = Forever().Batch(3);

    Eq(batches.First().ToArray(), new[] { 0, 1, 2 });
});

Test("TakeUntil includes the element that stopped it", () =>
{
    // TakeWhile(n => n != 3) gives 1, 2. TakeUntil gives 1, 2, 3 — the
    // difference matters when the terminator is the thing you wanted.
    Eq(new[] { 1, 2, 3, 4 }.TakeUntil(n => n == 3), new[] { 1, 2, 3 });
    Eq(new[] { 1, 2, 3, 4 }.TakeWhile(n => n != 3), new[] { 1, 2 });
});

Test("TakeUntil that never matches returns everything", () =>
    Eq(new[] { 1, 2, 3 }.TakeUntil(n => n == 99), new[] { 1, 2, 3 }));

Test("TakeUntil stops reading as soon as it matches", () =>
{
    // Laziness is not a detail here: the source never ends.
    Eq(Forever().TakeUntil(n => n == 3), new[] { 0, 1, 2, 3 });
});

Test("custom operators compose with the built-in ones", () =>
    Eq(Enumerable.Range(1, 10).Where(n => n % 2 == 1).Batch(2).Select(b => b.Sum()),
       new[] { 4, 12, 9 }));

// ──────────────────────────── your code ──────────────────────────────────

public static class Operators
{
    // Groups of `size`, the last possibly short.
    // ArgumentNullException for a null source, ArgumentOutOfRangeException
    // for a size below 1 — BOTH thrown when Batch is CALLED.
    public static IEnumerable<IEnumerable<T>> Batch<T>(this IEnumerable<T> source, int size)
    {
        throw new NotImplementedException();
    }

    // Elements up to AND INCLUDING the first one that matches.
    public static IEnumerable<T> TakeUntil<T>(this IEnumerable<T> source, Func<T, bool> stop)
    {
        throw new NotImplementedException();
    }
}
