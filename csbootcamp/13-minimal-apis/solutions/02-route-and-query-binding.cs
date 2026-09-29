// ─────────────────────────────────────────────────────────────────────────
//  02 · route and query binding — SOLUTION                ★★☆ core
//  concepts: route parameters · query strings · binding sources
//  run: dotnet run 02-route-and-query-binding.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Nothing here is annotated, and that is the point: the parameter NAME is
//  the binding. `id` matches `{id:int}` so it comes from the route; `q` and
//  `limit` match nothing in the template and are simple types, so they come
//  from the query string.
//
//  The two failure modes are worth separating in your head, because they
//  produce different status codes and you will be asked about it:
//
//    /items/abc  → 404. The `:int` constraint is part of route MATCHING.
//                  No route matched the request, so no handler exists.
//    ?limit=lots → 400. The route matched, then BINDING failed converting
//                  "lots" to an int. ASP.NET Core answers that itself.
//
//  Neither is a 500, and neither needs a try/catch from you. Writing your
//  own `int.TryParse` here would be strictly worse: you would turn a free
//  400 into a hand-rolled one.
//
//  `{*path}` is a catch-all: it matches the remaining segments including the
//  slashes, which ordinary `{path}` will not. Note the framework URL-decodes
//  values before you see them, so `%20` arrives as a space — do not decode
//  again, or "100%25" becomes "100%" and then breaks on the next pass.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void MapRoutes(WebApplication app)
{
    // id comes from the route, because the name matches the placeholder.
    app.MapGet("/items/{id:int}", (int id) => $"item {id}");

    // q and limit are simple types not in the template → query string.
    app.MapGet("/search", (string q, int limit = 10) => $"{q}:{limit}");

    // {*path} keeps the slashes.
    app.MapGet("/files/{*path}", (string path) => path);
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
