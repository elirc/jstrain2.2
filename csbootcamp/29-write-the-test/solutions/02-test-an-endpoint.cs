// ─────────────────────────────────────────────────────────────────────────
//  02 · test an endpoint — SOLUTION                        ★★★ stretch
//  concepts: testing an HTTP contract · boundaries in a paged API
//  run: dotnet run 02-test-an-endpoint.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Same inversion as 01, one layer up: the endpoints are written, one
//  correctly and six not, and YOU write the test.
//
//  `CheckPaging` receives a function that registers `GET /items` on an app.
//  It must return normally for the correct one and THROW for each broken one.
//
//  The contract for GET /items?page=&pageSize=
//
//      · 25 items exist, with ids 1..25
//      · `page` is 1-BASED and defaults to 1
//      · `pageSize` defaults to 10 and is CLAMPED to a maximum of 20
//      · page < 1 or pageSize < 1  →  400
//      · a page past the end       →  200 with an empty array
//      · every 200 carries the header `X-Total-Count: 25`
//      · the body is a JSON array of the ids on that page
//
//  Serve the app once and make several requests against it:
//
//      await using var app = await Web.Serve(build);
//      var response = await app.Client.GetAsync("/items?page=2");
//      var body     = await response.Content.ReadAsStringAsync();
//
//  `response.Headers.TryGetValues("X-Total-Count", out var values)` reads the
//  header. Bodies come back as `[1,2,3]` — comparing the string is fine.
//
//  Walkthrough:
//  Seven assertions against one served app, and every one of them exists
//  because a specific broken implementation would otherwise pass:
//
//      page 1 is items 1–10            catches ZeroIndexed
//      X-Total-Count is "25"           catches NoTotalHeader
//      ?page=2&pageSize=5 → 6–10        catches IgnoresPageSize
//      ?pageSize=1000 → 20 items        catches NoClamp
//      ?page=99 → 200 and []           catches CrashesPastEnd
//      ?page=0 → 400                   catches NoValidation
//
//  Three things worth taking from this one.
//
//  **The default is a case.** `GET /items` with no query string is the
//  request every client actually makes, and `ZeroIndexed` breaks exactly
//  there — page 1 silently starts at item 11. A suite that always passes
//  parameters explicitly never exercises the defaults, and the defaults are
//  what production uses.
//
//  **The clamp is only visible past it.** With a maximum of 20 and 25 rows,
//  `?pageSize=1000` returns 20 when clamped and 25 when not. Had the maximum
//  been 50, both implementations would return all 25 and the assertion would
//  prove nothing. When you test a limit, make sure the fixture is large
//  enough that crossing it *shows*.
//
//  **Status and body are separate claims.** `?page=99` must be `200` **and**
//  `[]`. An implementation can get either one right on its own — a
//  `Results.NotFound()` there is a defensible-looking bug that a body-only
//  assertion would miss.
//
//  What is deliberately NOT asserted: the header on the 400 responses, or the
//  exact shape of the error body. Neither is in the contract, and a test that
//  pins undocumented behaviour turns every future refactor into a red suite.
//  Test the contract, not the implementation that happens to satisfy it.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Throw (any exception) if `build` does not implement the contract above.
// Return normally if it does.
async Task CheckPaging(Action<WebApplication> build)
{
    await using var app = await Web.Serve(build);

    async Task<(int Status, string Body, string? Total)> Get(string query)
    {
        var response = await app.Client.GetAsync("/items" + query);
        response.Headers.TryGetValues("X-Total-Count", out var values);

        return ((int)response.StatusCode,
                await response.Content.ReadAsStringAsync(),
                values?.FirstOrDefault());
    }

    static string Ids(int from, int count) =>
        "[" + string.Join(",", Enumerable.Range(from, count)) + "]";

    // No query string at all: page 1, size 10, items 1-10.  (ZeroIndexed)
    var first = await Get("");
    Eq(first.Status, 200);
    Eq(first.Body, Ids(1, 10), "the default page must be the FIRST page");

    // Every 200 must tell the client how many rows exist.  (NoTotalHeader)
    Eq(first.Total, "25", "missing or wrong X-Total-Count");

    // pageSize is honoured, and page is 1-based within it.  (IgnoresPageSize)
    Eq((await Get("?page=2&pageSize=5")).Body, Ids(6, 5), "pageSize was ignored");

    // ...and clamped at 20, which only shows above 20.  (NoClamp)
    Eq((await Get("?pageSize=1000")).Body, Ids(1, 20), "pageSize was not clamped");

    // Past the end is empty, not an error.  (CrashesPastEnd)
    var past = await Get("?page=99");
    Eq(past.Status, 200, "a page past the end is not an error");
    Eq(past.Body, "[]");

    // Out-of-range input is rejected, not quietly corrected.  (NoValidation)
    Eq((await Get("?page=0")).Status, 400, "page=0 must be rejected");
    Eq((await Get("?pageSize=0")).Status, 400, "pageSize=0 must be rejected");
}

// ─────────────────────────── tests ──────────────────────────────────────

Test("the check accepts the correct implementation", () => CheckPaging(Correct));

Test("it catches the 0-based skip (page 1 misses the first items)", () =>
    ThrowsAsync(() => CheckPaging(ZeroIndexed)));

Test("it catches the one that ignores pageSize", () =>
    ThrowsAsync(() => CheckPaging(IgnoresPageSize)));

Test("it catches the missing clamp (pageSize=1000 returns everything)", () =>
    ThrowsAsync(() => CheckPaging(NoClamp)));

Test("it catches the missing X-Total-Count header", () =>
    ThrowsAsync(() => CheckPaging(NoTotalHeader)));

Test("it catches the crash on a page past the end", () =>
    ThrowsAsync(() => CheckPaging(CrashesPastEnd)));

Test("it catches the one that accepts page=0", () =>
    ThrowsAsync(() => CheckPaging(NoValidation)));

// ─────────────────────────── implementations ────────────────────────────

// The reference implementation. Meets the contract.
static void Correct(WebApplication app) =>
    app.MapGet("/items", (HttpContext ctx, int page = 1, int pageSize = 10) =>
    {
        if (page < 1 || pageSize < 1) return Results.BadRequest();

        var size = Math.Min(pageSize, 20);
        ctx.Response.Headers["X-Total-Count"] = Data.All.Length.ToString();

        return Results.Json(Data.Page(page - 1, size));
    });

// Skips page*size instead of (page-1)*size: page 1 starts at item 11.
static void ZeroIndexed(WebApplication app) =>
    app.MapGet("/items", (HttpContext ctx, int page = 1, int pageSize = 10) =>
    {
        if (page < 1 || pageSize < 1) return Results.BadRequest();

        var size = Math.Min(pageSize, 20);
        ctx.Response.Headers["X-Total-Count"] = Data.All.Length.ToString();

        return Results.Json(Data.Page(page, size));
    });

// Accepts pageSize and then pages by 10 regardless.
static void IgnoresPageSize(WebApplication app) =>
    app.MapGet("/items", (HttpContext ctx, int page = 1, int pageSize = 10) =>
    {
        if (page < 1 || pageSize < 1) return Results.BadRequest();

        ctx.Response.Headers["X-Total-Count"] = Data.All.Length.ToString();

        return Results.Json(Data.Page(page - 1, 10));
    });

// Honours any pageSize the caller asks for — including 1000.
static void NoClamp(WebApplication app) =>
    app.MapGet("/items", (HttpContext ctx, int page = 1, int pageSize = 10) =>
    {
        if (page < 1 || pageSize < 1) return Results.BadRequest();

        ctx.Response.Headers["X-Total-Count"] = Data.All.Length.ToString();

        return Results.Json(Data.Page(page - 1, pageSize));
    });

// Correct pages, but no way for a client to know how many there are.
static void NoTotalHeader(WebApplication app) =>
    app.MapGet("/items", (int page = 1, int pageSize = 10) =>
    {
        if (page < 1 || pageSize < 1) return Results.BadRequest();

        return Results.Json(Data.Page(page - 1, Math.Min(pageSize, 20)));
    });

// Indexes instead of skipping, so a page past the end is a 500.
static void CrashesPastEnd(WebApplication app) =>
    app.MapGet("/items", (HttpContext ctx, int page = 1, int pageSize = 10) =>
    {
        if (page < 1 || pageSize < 1) return Results.BadRequest();

        var size = Math.Min(pageSize, 20);
        ctx.Response.Headers["X-Total-Count"] = Data.All.Length.ToString();

        var first = Data.All[(page - 1) * size];   // throws once page runs out
        return Results.Json(Data.All.Where(id => id >= first).Take(size));
    });

// Pages correctly and validates nothing: page=0 quietly returns a page.
static void NoValidation(WebApplication app) =>
    app.MapGet("/items", (HttpContext ctx, int page = 1, int pageSize = 10) =>
    {
        var size = Math.Min(Math.Max(pageSize, 1), 20);
        ctx.Response.Headers["X-Total-Count"] = Data.All.Length.ToString();

        return Results.Json(Data.Page(Math.Max(page - 1, 0), size));
    });

static class Data
{
    public static readonly int[] All = Enumerable.Range(1, 25).ToArray();

    public static int[] Page(int skipPages, int size) =>
        All.Skip(skipPages * size).Take(size).ToArray();
}
