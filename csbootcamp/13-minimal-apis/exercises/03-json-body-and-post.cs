// ─────────────────────────────────────────────────────────────────────────
//  03 · JSON bodies and POST                              ★★☆ core
//  concepts: body binding · records as DTOs · 201 Created
//  run: dotnet run 03-json-body-and-post.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A handler parameter whose type is not "simple" is deserialised from the
//  JSON request body. `record`s make ideal DTOs: immutable, value equality,
//  and a constructor the serialiser can use.
//
//  JSON property matching is case-INSENSITIVE by default in ASP.NET Core, so
//  `{"title":"x"}` and `{"Title":"x"}` both bind to `Title`. Responses go out
//  camelCase.
//
//  Build a create endpoint that behaves like a real one:
//
//      POST /notes  {"title":"buy milk"}   → 201, Location: /notes/1,
//                                             body {"id":1,"title":"buy milk"}
//      POST /notes  {"title":""}           → 400
//      POST /notes  (not JSON)             → 415 Unsupported Media Type
//
//  Ids start at 1 and increment. Keep them in the closure — persistence is
//  module 17's problem.
//
//  hint: Results.Created(uri, value) sets the status AND the Location header
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void MapRoutes(WebApplication app)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("POST returns 201 with the created note", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.PostJson("/notes", new { title = "buy milk" });

    Eq((int)response.StatusCode, 201);
    Eq(await response.Content.ReadAsStringAsync(), "{\"id\":1,\"title\":\"buy milk\"}");
});

Test("POST sets a Location header pointing at the new resource", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.PostJson("/notes", new { title = "buy milk" });

    Eq(response.Headers.Location?.ToString(), "/notes/1");
});

Test("ids increment across requests", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    await app.PostJson("/notes", new { title = "one" });
    var second = await app.PostJson("/notes", new { title = "two" });

    Eq(await second.Content.ReadAsStringAsync(), "{\"id\":2,\"title\":\"two\"}");
});

Test("the created note can be read back", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    await app.PostJson("/notes", new { title = "buy milk" });

    Eq(await app.GetBody("/notes/1"), "{\"id\":1,\"title\":\"buy milk\"}");
});

Test("reading a missing note is a 404", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetStatus("/notes/99"), 404);
});

Test("an empty title is rejected with 400", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.PostJson("/notes", new { title = "   " });
    Eq((int)response.StatusCode, 400);
});

Test("binding is case-insensitive", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.PostJson("/notes", new { TITLE = "shouty" });
    Eq((int)response.StatusCode, 201);
});

Test("a non-JSON content type is 415", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var body = new StringContent("title=x", System.Text.Encoding.UTF8, "text/plain");
    var response = await app.Client.PostAsync("/notes", body);
    Eq((int)response.StatusCode, 415);
});

// ──────────────────────────── types ──────────────────────────────────────

record CreateNote(string Title);
record Note(int Id, string Title);
