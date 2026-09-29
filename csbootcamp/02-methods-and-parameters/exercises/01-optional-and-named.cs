// ─────────────────────────────────────────────────────────────────────────
//  01 · optional and named arguments                      ★☆☆ warm-up
//  concepts: default parameters · named arguments · overload choice
//  run: dotnet run 01-optional-and-named.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A default parameter value is baked into the CALL SITE at compile time, not
//  read from the method at runtime. That has a real consequence for library
//  code — change a default and callers keep the old one until they recompile —
//  and it is why defaults must be compile-time constants.
//
//  Build a paging helper used all over a web API:
//
//      Page(items)                        → first 20, page 1
//      Page(items, size: 2)               → first 2
//      Page(items, page: 2, size: 2)      → items 3 and 4
//
//  Out-of-range page or size clamps rather than throwing: a bad ?page=0 in a
//  query string should give you page 1, not a 500.
//
//  hint: named arguments let callers skip `page` and set only `size` — your
//        signature just has to put them in an order that allows it
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// page is 1-based. size defaults to 20, page to 1.
// size clamps to [1, 100]; page clamps to at least 1.
List<T> Page<T>(IEnumerable<T> items, int page = 1, int size = 20)
{
    throw new NotImplementedException();
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
