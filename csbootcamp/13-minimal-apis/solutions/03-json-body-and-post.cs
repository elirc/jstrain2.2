// ─────────────────────────────────────────────────────────────────────────
//  03 · JSON bodies and POST — SOLUTION                   ★★☆ core
//  concepts: body binding · records as DTOs · 201 Created
//  run: dotnet run 03-json-body-and-post.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `CreateNote` is a complex type, so it is read from the body — no
//  `[FromBody]` needed. Note the two DTOs: what a client may SEND
//  (CreateNote, no id) and what the API RETURNS (Note, with id). Reusing one
//  type for both is the mistake that lets a client POST its own id, and in a
//  larger app lets it set fields like `IsAdmin`. Separate types are the fix,
//  and they cost one line each.
//
//  `Results.Created($"/notes/{note.Id}", note)` does three things at once:
//  status 201, the Location header, and the body. Returning
//  `Results.Ok(note)` instead is the common shortcut and it loses the
//  Location header that tells the client where the thing now lives.
//
//  Validation returns `Results.BadRequest()` before touching the store.
//  `Results.ValidationProblem` (module 16) gives a structured RFC 7807 body;
//  a bare 400 is fine here.
//
//  Two responses arrive without any code from you, and both are worth
//  recognising: a `text/plain` body is 415 because the endpoint declared it
//  reads JSON, and the case-insensitive match of `TITLE` to `Title` is
//  System.Text.Json's web defaults. Neither is something to hand-roll.
//
//  `nextId` and `store` are captured locals — one set per Serve() call,
//  which is exactly the isolation each test wants. In a real app this is
//  where a service from DI goes; see module 12.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void MapRoutes(WebApplication app)
{
    var store = new Dictionary<int, Note>();
    var nextId = 0;

    app.MapPost("/notes", (CreateNote input) =>
    {
        if (string.IsNullOrWhiteSpace(input.Title))
            return Results.BadRequest();

        var note = new Note(++nextId, input.Title);
        store[note.Id] = note;
        return Results.Created($"/notes/{note.Id}", note);
    });

    app.MapGet("/notes/{id:int}", (int id) =>
        store.TryGetValue(id, out var note) ? Results.Ok(note) : Results.NotFound());
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
