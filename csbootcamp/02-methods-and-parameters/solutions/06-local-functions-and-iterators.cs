// ─────────────────────────────────────────────────────────────────────────
//  06 · local functions and iterators — SOLUTION          ★★★ stretch
//  concepts: local functions · yield return · deferred execution
//  run: dotnet run 06-local-functions-and-iterators.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The split is the whole exercise. `Take` itself contains no `yield`, so it
//  is an ordinary method: its body — including the validation — runs the
//  moment you call it. It then returns the result of `Iterate()`, a local
//  function that IS an iterator and stays deferred.
//
//  Write it as one method with the validation at the top and a `yield` below
//  and the validation silently moves into the state machine: the throw would
//  happen on the first MoveNext(), which for `Take(items, -1)` with no
//  enumeration means never. The test deliberately omits `.ToList()` to catch
//  exactly that. This is why every LINQ operator in the BCL is written as
//  this same two-method pair.
//
//  The laziness test pins down the pull count. `yield return item;` hands the
//  element out, and only when the consumer asks again does `++taken == count`
//  stop the loop — so taking 2 of 5 touches the source exactly twice.
//  Checking the count BEFORE yielding instead would pull a third element
//  before deciding to stop, which matters when the source is a database
//  cursor or a network stream.
//
//  Naturals() never terminates, and that is safe: an iterator only advances
//  when pulled, so `.Where(…).Take(3)` composes into a pipeline that stops
//  the producer as soon as the consumer has enough.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

IEnumerable<T> Take<T>(IEnumerable<T> source, int count)
{
    // Runs NOW, because this method contains no `yield`.
    ArgumentOutOfRangeException.ThrowIfNegative(count);
    return Iterate();

    // Runs later, on enumeration.
    IEnumerable<T> Iterate()
    {
        if (count == 0) yield break;
        var taken = 0;
        foreach (var item in source)
        {
            yield return item;
            if (++taken == count) yield break;
        }
    }
}

IEnumerable<int> Naturals()
{
    var n = 1;
    while (true) yield return n++;
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("Take returns the first n items", () =>
    Eq(Take(new[] { 1, 2, 3, 4 }, 2), new[] { 1, 2 }));

Test("Take of more than there is returns everything", () =>
    Eq(Take(new[] { 1, 2 }, 10), new[] { 1, 2 }));

Test("Take of zero is empty", () =>
    Eq(Take(new[] { 1, 2 }, 0), Array.Empty<int>()));

Test("a negative count throws at the call, before any enumeration", () =>
{
    Throws<ArgumentOutOfRangeException>(() => Take(new[] { 1, 2 }, -1));
});

Test("Take is lazy — it pulls only what it needs", () =>
{
    var pulled = 0;
    IEnumerable<int> Counted()
    {
        foreach (var n in new[] { 1, 2, 3, 4, 5 })
        {
            pulled++;
            yield return n;
        }
    }

    Take(Counted(), 2).ToList();
    Eq(pulled, 2);
});

Test("Naturals starts at 1", () =>
    Eq(Naturals().Take(3), new[] { 1, 2, 3 }));

Test("an infinite sequence is fine as long as you stop it", () =>
    Eq(Naturals().Where(n => n % 3 == 0).Take(3), new[] { 3, 6, 9 }));
