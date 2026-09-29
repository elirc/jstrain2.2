// ─────────────────────────────────────────────────────────────────────────
//  02 · route and query binding                           ★★☆ core
//  concepts: route parameters · query strings · binding sources
//  run: dotnet run 02-route-and-query-binding.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Minimal APIs bind handler parameters by NAME and by TYPE, with no
//  attributes needed in the common case. The rules, in order:
//
//    · name matches a route template placeholder  → from the route
//    · type is a simple type (int, string, Guid…) → from the query string
//    · type is complex                            → from the JSON body
//
//  Route constraints filter at the ROUTING stage, before your code runs, so
//  "/items/abc" against "/items/{id:int}" is a 404 — the route simply does
//  not match. That is different from binding failure, which is a 400.
//
//  Build:
//
//      GET /items/{id:int}                  → "item 7"
//      GET /search?q=hats&limit=5           → "hats:5", limit defaults to 10
//      GET /files/{*path}                   → the whole remaining path
//
//  hint: an optional query parameter is just a C# optional parameter —
//        `int limit = 10` — and a catch-all route segment is `{*name}`
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void MapRoutes(WebApplication app)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a route parameter binds by name", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/items/7"), "item 7");
});

Test("an :int constraint rejects non-numeric ids at routing time", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    // Not 400 — the route never matched, so nothing was bound.
    Eq(await app.GetStatus("/items/abc"), 404);
});

Test("a query parameter binds by name", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/search?q=hats&limit=5"), "hats:5");
});

Test("an omitted query parameter uses the C# default", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/search?q=hats"), "hats:10");
});

Test("query values are URL-decoded for you", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/search?q=red%20hats"), "red hats:10");
});

Test("a non-numeric limit is a 400, not a 500", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetStatus("/search?q=hats&limit=lots"), 400);
});

Test("a catch-all segment captures the rest of the path", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/files/a/b/c.txt"), "a/b/c.txt");
});
