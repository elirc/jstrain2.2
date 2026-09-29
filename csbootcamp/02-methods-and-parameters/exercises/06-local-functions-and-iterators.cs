// ─────────────────────────────────────────────────────────────────────────
//  06 · local functions and iterators                     ★★★ stretch
//  concepts: local functions · yield return · deferred execution
//  run: dotnet run 06-local-functions-and-iterators.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A method containing `yield return` does not run when you call it. Calling
//  it builds a state machine and returns immediately; the body executes only
//  as something enumerates the result. That is *deferred execution*, and it
//  is the same machinery LINQ is built on.
//
//  It also creates the trap this exercise is really about: argument
//  validation inside an iterator method does not run until the first
//  MoveNext(), which can be far away from the call that was wrong. The fix is
//  a non-iterator wrapper that validates eagerly and delegates to a local
//  iterator function.
//
//      Take(items, -1)          → throws IMMEDIATELY, at the call
//      Take(items, 2)           → lazy: nothing enumerated until you ask
//
//  hint: the outer method must not contain `yield` at all — put the yields in
//        a local function and `return` it
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// The first `count` items. Throws ArgumentOutOfRangeException for a negative
// count AT THE MOMENT OF THE CALL, not on first enumeration. Must stay lazy
// otherwise: never enumerate more of the source than it needs.
IEnumerable<T> Take<T>(IEnumerable<T> source, int count)
{
    throw new NotImplementedException();
}

// An endless 1, 2, 3, … sequence. Safe only because callers stop it.
IEnumerable<int> Naturals()
{
    throw new NotImplementedException();
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
    // No ToList() here on purpose: if validation were inside the iterator,
    // this line would build the state machine and NOT throw.
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
