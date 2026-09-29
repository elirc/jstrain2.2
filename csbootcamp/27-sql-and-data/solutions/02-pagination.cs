// ─────────────────────────────────────────────────────────────────────────
//  02 · pagination — SOLUTION                             ★★☆ core
//  concepts: OFFSET vs keyset · stable ordering · the drift bug
//  run: dotnet run 02-pagination.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `Skip(n).Take(m)` — OFFSET pagination — is what everyone writes, and it
//  has two problems that only appear with real data:
//
//  **It gets slower the deeper you go.** `OFFSET 100000` makes the database
//  find and discard a hundred thousand rows before returning ten.
//
//  **It DRIFTS.** If a row is inserted before your position between page 1
//  and page 2, everything shifts down and you see one item twice. Delete a
//  row and you skip one entirely. On a feed sorted newest-first, where
//  inserts happen at the front constantly, this is not an edge case.
//
//  **Keyset pagination** ("seek", "cursor") asks for rows *after a known
//  position* instead of counting from the start:
//
//      WHERE (CreatedAt, Id) < (@lastCreatedAt, @lastId)
//      ORDER BY CreatedAt DESC, Id DESC
//      LIMIT @size
//
//  Constant cost at any depth, and immune to inserts before the cursor.
//
//  Walkthrough:
//  The two drift tests are the whole module. Same data, same insert, and
//  offset paging shows `"d"` on both pages while keyset paging picks up
//  exactly where it left off.
//
//  The reason is what each one *means*. `Skip(2)` says "start at position
//  two", and position two is a different row after an insert at the front.
//  A cursor says "start after this specific row", and that row is still the
//  same row no matter what was added above it. Counting is relative;
//  a key is absolute.
//
//  On a feed sorted newest-first — which is most feeds — inserts happen at
//  the front constantly, so this is the normal case rather than an edge
//  case. Users see duplicates, or miss items entirely when a row is deleted.
//  It is also why infinite-scroll implementations built on `?page=` feel
//  subtly broken.
//
//  The other cost is performance: `OFFSET 100000` makes the database find
//  and discard a hundred thousand rows to return ten. Keyset uses the index
//  to *seek* directly to the cursor, so page 10,000 costs the same as page 1.
//
//  The comparison is lexicographic on `(CreatedOn, Id)` — "earlier date, OR
//  the same date and a smaller id". That tuple must be **unique**, which is
//  what the last test checks: three posts sharing a timestamp still paginate
//  correctly because the id breaks the tie. Order by a non-unique column
//  alone and rows at the boundary can appear on both pages or on neither,
//  which is a genuinely maddening bug to chase.
//
//  In SQL this is `WHERE (CreatedAt, Id) < (@at, @id)` — supported directly
//  by PostgreSQL, and written as the expanded OR form elsewhere. In EF Core
//  you write the expanded form, and it translates.
//
//  Offset paging is still fine for small, stable, admin-facing tables where
//  users jump to page 7. Keyset cannot do "jump to page 7" — that is its one
//  real limitation, and the reason to keep both in mind.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// OFFSET pagination — page is 1-based.
List<Post> ByOffset(List<Post> all, int page, int size)
    // "start at position N" — and N means a different row after an insert.
    => [.. all
        .OrderByDescending(p => p.CreatedOn).ThenByDescending(p => p.Id)
        .Skip((Math.Max(page, 1) - 1) * size)
        .Take(size)];

// KEYSET pagination. `after` is the last item of the previous page, or null
// for the first page. Newest first, id descending as the tie-breaker.
List<Post> ByKeyset(List<Post> all, Cursor? after, int size)
{
    var ordered = all
        .OrderByDescending(p => p.CreatedOn)
        .ThenByDescending(p => p.Id);          // the tie-breaker matters

    // "start AFTER this row" — lexicographic on (CreatedOn, Id), which is
    // WHERE (CreatedAt, Id) < (@at, @id) in SQL.
    var page = after is null
        ? ordered
        : ordered.Where(p =>
            p.CreatedOn < after.CreatedOn ||
            (p.CreatedOn == after.CreatedOn && p.Id < after.Id));

    return [.. page.Take(size)];
}

// ──────────────────────────── tests ──────────────────────────────────────

// Newest first: 5, 4, 3, 2, 1
List<Post> Seed() =>
[
    new(5, "e", new DateOnly(2026, 1, 5)),
    new(4, "d", new DateOnly(2026, 1, 4)),
    new(3, "c", new DateOnly(2026, 1, 3)),
    new(2, "b", new DateOnly(2026, 1, 2)),
    new(1, "a", new DateOnly(2026, 1, 1)),
];

Test("offset page 1", () =>
    Eq(ByOffset(Seed(), 1, 2).Select(p => p.Title), new[] { "e", "d" }));

Test("offset page 2", () =>
    Eq(ByOffset(Seed(), 2, 2).Select(p => p.Title), new[] { "c", "b" }));

Test("a partial last page", () =>
    Eq(ByOffset(Seed(), 3, 2).Select(p => p.Title), new[] { "a" }));

Test("a page past the end is empty", () =>
    Eq(ByOffset(Seed(), 99, 2), new List<Post>()));

Test("keyset page 1 matches offset page 1", () =>
    Eq(ByKeyset(Seed(), null, 2).Select(p => p.Title), new[] { "e", "d" }));

Test("keyset page 2 follows the cursor", () =>
{
    var first = ByKeyset(Seed(), null, 2);
    var cursor = new Cursor(first[^1].CreatedOn, first[^1].Id);

    Eq(ByKeyset(Seed(), cursor, 2).Select(p => p.Title), new[] { "c", "b" });
});

Test("keyset walks the whole set exactly once", () =>
{
    var all = Seed();
    var seen = new List<string>();
    Cursor? cursor = null;

    while (true)
    {
        var page = ByKeyset(all, cursor, 2);
        if (page.Count == 0) break;

        seen.AddRange(page.Select(p => p.Title));
        cursor = new Cursor(page[^1].CreatedOn, page[^1].Id);
    }

    Eq(seen, new[] { "e", "d", "c", "b", "a" });
});

Test("OFFSET drifts when a row is inserted between pages", () =>
{
    // THE BUG. Read page 1, someone posts, read page 2 — and "d" appears
    // twice because everything shifted down by one.
    var all = Seed();
    var page1 = ByOffset(all, 1, 2).Select(p => p.Title).ToList();

    all.Insert(0, new Post(6, "f", new DateOnly(2026, 1, 6)));

    var page2 = ByOffset(all, 2, 2).Select(p => p.Title).ToList();

    Eq(page1, new[] { "e", "d" });
    Eq(page2, new[] { "d", "c" });        // "d" seen twice
    Ok(page1.Intersect(page2).Any(), "offset paging duplicated a row");
});

Test("KEYSET does not drift", () =>
{
    // Same insert, but the cursor names a POSITION rather than a count.
    var all = Seed();
    var page1 = ByKeyset(all, null, 2);
    var cursor = new Cursor(page1[^1].CreatedOn, page1[^1].Id);

    all.Insert(0, new Post(6, "f", new DateOnly(2026, 1, 6)));

    var page2 = ByKeyset(all, cursor, 2).Select(p => p.Title).ToList();

    Eq(page1.Select(p => p.Title), new[] { "e", "d" });
    Eq(page2, new[] { "c", "b" });        // exactly where we left off
    Ok(!page1.Select(p => p.Title).Intersect(page2).Any());
});

Test("the id breaks ties when timestamps collide", () =>
{
    // Without a unique tie-breaker, two posts sharing a timestamp can
    // appear on both pages or on neither.
    var sameDay = new DateOnly(2026, 2, 1);
    var all = new List<Post>
    {
        new(3, "c", sameDay), new(2, "b", sameDay), new(1, "a", sameDay),
    };

    var page1 = ByKeyset(all, null, 2);
    var cursor = new Cursor(page1[^1].CreatedOn, page1[^1].Id);
    var page2 = ByKeyset(all, cursor, 2);

    Eq(page1.Select(p => p.Title), new[] { "c", "b" });
    Eq(page2.Select(p => p.Title), new[] { "a" });
});

// ──────────────────────────── types ──────────────────────────────────────

public record Post(int Id, string Title, DateOnly CreatedOn);
public record Cursor(DateOnly CreatedOn, int Id);
