// ─────────────────────────────────────────────────────────────────────────
//  06 · custom operators — SOLUTION                       ★★★ stretch
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
//  Walkthrough:
//  **The two-method split is the entire lesson.** `Batch` validates and
//  returns `BatchIterator(...)`; the iterator holds the `yield return`s.
//  Because the public method contains no `yield`, its body runs when it is
//  called — so a bad size throws at the call site, where the mistake is,
//  rather than later from inside somebody else's `foreach`.
//
//  Look at the third and fourth tests: they never enumerate anything. They
//  call `Batch` and expect a throw. Write it as a single iterator method and
//  both go green only when someone iterates, which in a real codebase means
//  the exception arrives with a stack trace pointing at innocent code.
//
//  Every operator in the BCL is written this way. It is not a stylistic
//  preference — it is the only way to get eager validation out of a lazy
//  method.
//
//  **The laziness is then worth keeping.** The fifth and eighth tests run
//  against `Forever()`, an infinite sequence. They terminate because the
//  iterator only produces what is asked for. Buffer the whole source into a
//  list "for simplicity" and both tests hang — which is the difference
//  between an operator that composes and one that merely works on the input
//  you happened to test.
//
//  **`TakeUntil` yields, then decides.** Yield the element first, then check
//  the predicate and `yield break` — that ordering is what makes the
//  terminator inclusive. Check first and you have re-implemented `TakeWhile`
//  with the condition negated.
//
//  Inclusive-vs-exclusive matters more than it sounds: reading a protocol
//  until the end-of-message marker, or a log until the line that says the
//  job finished, both want the terminator *kept*. There is no built-in
//  operator for it, which is precisely why writing your own is worth knowing
//  how to do.
//
//  **The batch buffer is reset, not reused.** `batch = []` allocates a fresh
//  list; `batch.Clear()` would hand every caller the same list object, and
//  anyone who kept a reference — `.ToList()` on the outer sequence, say —
//  would find all their batches holding the last chunk's contents. A classic
//  and very confusing aliasing bug.
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
    // No `yield` in THIS method, so its body runs when it is called — which
    // is what makes the validation eager.
    public static IEnumerable<IEnumerable<T>> Batch<T>(this IEnumerable<T> source, int size)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentOutOfRangeException.ThrowIfLessThan(size, 1);

        return BatchIterator(source, size);
    }

    private static IEnumerable<IEnumerable<T>> BatchIterator<T>(IEnumerable<T> source, int size)
    {
        var batch = new List<T>(size);

        foreach (var item in source)
        {
            batch.Add(item);

            if (batch.Count < size) continue;

            yield return batch;

            // A NEW list, not Clear() — the caller may still be holding the
            // one we just handed out.
            batch = new List<T>(size);
        }

        if (batch.Count > 0) yield return batch;
    }

    // Elements up to AND INCLUDING the first one that matches.
    public static IEnumerable<T> TakeUntil<T>(this IEnumerable<T> source, Func<T, bool> stop)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(stop);

        return TakeUntilIterator(source, stop);
    }

    private static IEnumerable<T> TakeUntilIterator<T>(IEnumerable<T> source, Func<T, bool> stop)
    {
        foreach (var item in source)
        {
            // Yield FIRST, then decide — that is what makes the terminator
            // inclusive. Check first and this is just TakeWhile negated.
            yield return item;

            if (stop(item)) yield break;
        }
    }
}
