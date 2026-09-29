// ─────────────────────────────────────────────────────────────────────────
//  01 · optional and named arguments — SOLUTION           ★☆☆ warm-up
//  concepts: default parameters · named arguments · overload choice
//  run: dotnet run 01-optional-and-named.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Clamp the inputs first, then do one Skip/Take. Doing it the other way —
//  branching on each bad case — turns a two-line method into a thicket, and
//  every branch is somewhere a bug can hide. `Math.Clamp` states the allowed
//  range once, in the place a reader will look for it.
//
//  `(page - 1) * size` is the skip count, and it is the classic off-by-one:
//  the API is 1-based because query strings are, while Skip is 0-based. Doing
//  the conversion in exactly one place is the whole defence.
//
//  Note that clamping happens BEFORE the multiply. Clamping after would let
//  page: -5 compute a negative skip, and Skip(negative) silently skips
//  nothing — which happens to give the right answer here, and would give the
//  wrong one the moment someone reordered the lines.
//
//  Named arguments cost you nothing at the definition site: because `page`
//  and `size` both have defaults, a caller can supply either, both, or
//  neither. Worth remembering that the default is copied into the caller's
//  compiled code, so changing 20 to 25 here does not change an already-built
//  caller until it is rebuilt.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

List<T> Page<T>(IEnumerable<T> items, int page = 1, int size = 20)
{
    var safeSize = Math.Clamp(size, 1, 100);
    var safePage = Math.Max(page, 1);
    return items.Skip((safePage - 1) * safeSize).Take(safeSize).ToList();
}

// ──────────────────────────── tests ──────────────────────────────────────

var items = Enumerable.Range(1, 50).ToList();

Test("defaults to the first 20 of page 1", () =>
    Eq(Page(items), Enumerable.Range(1, 20)));

Test("a named size argument alone still works", () =>
    Eq(Page(items, size: 2), new[] { 1, 2 }));

Test("page 2 skips a full page", () =>
    Eq(Page(items, page: 2, size: 2), new[] { 3, 4 }));

Test("the last page may be short", () =>
    Eq(Page(items, page: 3, size: 20), new[] { 41, 42, 43, 44, 45, 46, 47, 48, 49, 50 }));

Test("a page past the end is empty, not an error", () =>
    Eq(Page(items, page: 99), new List<int>()));

Test("page 0 and negative pages clamp to page 1", () =>
{
    Eq(Page(items, page: 0, size: 3), new[] { 1, 2, 3 });
    Eq(Page(items, page: -5, size: 3), new[] { 1, 2, 3 });
});

Test("size clamps into [1, 100]", () =>
{
    Eq(Page(items, size: 0).Count, 1);
    Eq(Page(items, size: 10_000).Count, 50);
});
