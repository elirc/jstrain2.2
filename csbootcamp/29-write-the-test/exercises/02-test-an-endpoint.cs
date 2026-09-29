// ─────────────────────────────────────────────────────────────────────────
//  02 · test an endpoint                                   ★★★ stretch
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
//  hint: six bugs, so at least six assertions. Two of them are only visible
//  at a boundary, and one is only visible on a request you would never make
//  by hand.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Throw (any exception) if `build` does not implement the contract above.
// Return normally if it does.
async Task CheckPaging(Action<WebApplication> build)
{
    await Task.CompletedTask;
    throw new NotImplementedException();
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
