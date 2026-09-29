// ─────────────────────────────────────────────────────────────────────────
//  01 · the bookmarks API                                  ★★★ capstone
//  concepts: minimal APIs · EF Core relationships · validation · paging
//  run: dotnet run 01-the-bookmarks-api.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A capstone: no new mechanism, every piece already covered. What is new is
//  that you have to make them agree with each other.
//
//  Build a bookmarks API over two related tables. Collections have many
//  bookmarks; a bookmark belongs to exactly one collection.
//
//      POST   /collections                    201 + Location
//      GET    /collections/{id}               200 CollectionSummary · 404
//      POST   /collections/{id}/bookmarks     201 + Location · 404 · 400
//      GET    /collections/{id}/bookmarks     200 (paged) · 404
//      GET    /bookmarks/{id}                 200 · 404
//      PUT    /bookmarks/{id}                 204 · 404 · 400
//      DELETE /bookmarks/{id}                 204 · 404
//
//  The rules the tests hold you to:
//
//   1. **A missing parent is 404, not 400 and not 500.** Posting a bookmark
//      to collection 999 must not be an FK violation that escapes as a 500.
//
//   2. **Validate before you touch the database.** `Title` is required and at
//      most 100 characters. `Url` is required and must be an ABSOLUTE http or
//      https URI. Failures are `400` and the response body must name the
//      offending field — `Results.ValidationProblem` does this for you.
//
//   3. **`GET /collections/{id}` returns a COUNT, not the bookmarks.** A
//      collection with 40,000 bookmarks must not serialise 40,000 rows. Do
//      the counting in the query.
//
//   4. **Listing is paged and ordered.** `page` is 1-based (default 1),
//      `pageSize` defaults to 20 and is clamped to 100. Order by `Title`,
//      ascending. Every 200 carries `X-Total-Count` = the number of bookmarks
//      in that collection, not the number on the page.
//
//   5. **`DELETE` is 204 the first time and 404 the second.** Deleting a
//      bookmark that is not there is not a success.
//
//  The plumbing below — entities, DbContext, fixture — is given. The route
//  handlers are yours. Work one endpoint at a time; the tests are ordered so
//  each is reachable as soon as the ones above it pass.
//
//  hint: `Results.Created`, `Results.NoContent`, `Results.NotFound`,
//        `Results.ValidationProblem(new Dictionary<string, string[]>{...})`
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

void MapApi(WebApplication app)
{
    // 1 · Create a collection. 201, Location = /collections/{id},
    //     body = a CollectionSummary with BookmarkCount 0.
    app.MapPost("/collections", async (NewCollection input, BookmarkDb db) =>
    {
        throw new NotImplementedException();
    });

    // 2 · One collection as a summary. 404 when there is no such row.
    //     Count in the query — do NOT load the bookmarks.
    app.MapGet("/collections/{id:int}", async (int id, BookmarkDb db) =>
    {
        throw new NotImplementedException();
    });

    // 3 · Add a bookmark to a collection.
    //     404 if the collection is missing · 400 if the input is invalid ·
    //     otherwise 201 with Location = /bookmarks/{id}.
    app.MapPost("/collections/{id:int}/bookmarks",
        async (int id, NewBookmark input, BookmarkDb db) =>
    {
        throw new NotImplementedException();
    });

    // 4 · The bookmarks in a collection, paged and ordered by Title.
    //     404 if the collection is missing.
    //     Set X-Total-Count to the collection's TOTAL, not the page size.
    app.MapGet("/collections/{id:int}/bookmarks",
        async (int id, HttpContext ctx, BookmarkDb db, int page = 1, int pageSize = 20) =>
    {
        throw new NotImplementedException();
    });

    // 5 · One bookmark. 404 when missing.
    app.MapGet("/bookmarks/{id:int}", async (int id, BookmarkDb db) =>
    {
        throw new NotImplementedException();
    });

    // 6 · Replace a bookmark's Url and Title. 204 · 404 · 400.
    app.MapPut("/bookmarks/{id:int}", async (int id, NewBookmark input, BookmarkDb db) =>
    {
        throw new NotImplementedException();
    });

    // 7 · Delete a bookmark. 204 the first time, 404 after that.
    app.MapDelete("/bookmarks/{id:int}", async (int id, BookmarkDb db) =>
    {
        throw new NotImplementedException();
    });
}

// ──────────────────────────── tests ──────────────────────────────────────

async Task<int> NewCollectionId(ServedApp app, string name)
{
    var response = await app.PostJson("/collections", new { name });
    Eq((int)response.StatusCode, 201, "creating a collection should be 201");

    return Read(await response.Content.ReadAsStringAsync()).GetProperty("id").GetInt32();
}

Test("creating a collection returns 201 and a Location", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var response = await app.PostJson("/collections", new { name = "reading" });

    Eq((int)response.StatusCode, 201);
    var body = Read(await response.Content.ReadAsStringAsync());

    Eq(body.GetProperty("name").GetString(), "reading");
    Eq(body.GetProperty("bookmarkCount").GetInt32(), 0);
    Eq(response.Headers.Location?.ToString(),
       "/collections/" + body.GetProperty("id").GetInt32());
});

Test("a collection that does not exist is 404", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    Eq(await app.GetStatus("/collections/999"), 404);
});

Test("a bookmark can be added to a collection", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewCollectionId(app, "reading");

    var response = await app.PostJson($"/collections/{id}/bookmarks",
        new { url = "https://example.com/a", title = "A" });

    Eq((int)response.StatusCode, 201);
    var created = Read(await response.Content.ReadAsStringAsync());
    Eq(response.Headers.Location?.ToString(),
       "/bookmarks/" + created.GetProperty("id").GetInt32());
});

Test("adding to a collection that does not exist is 404, not 500", async () =>
{
    // The lazy version lets EF raise an FK violation and it escapes as a 500.
    await using var app = await Fixture.Serve(MapApi);
    var response = await app.PostJson("/collections/999/bookmarks",
        new { url = "https://example.com/a", title = "A" });

    Eq((int)response.StatusCode, 404);
});

Test("a relative url is rejected with 400 and the field is named", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewCollectionId(app, "reading");

    var response = await app.PostJson($"/collections/{id}/bookmarks",
        new { url = "/not-absolute", title = "A" });

    Eq((int)response.StatusCode, 400);
    var body = await response.Content.ReadAsStringAsync();
    Ok(body.Contains("rl"), "the 400 body should name the Url field: " + body);
});

Test("a non-http scheme is rejected", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewCollectionId(app, "reading");

    var response = await app.PostJson($"/collections/{id}/bookmarks",
        new { url = "javascript:alert(1)", title = "A" });

    Eq((int)response.StatusCode, 400);
});

Test("a blank title is rejected", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewCollectionId(app, "reading");

    var response = await app.PostJson($"/collections/{id}/bookmarks",
        new { url = "https://example.com/a", title = "   " });

    Eq((int)response.StatusCode, 400);
});

Test("a title over 100 characters is rejected", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewCollectionId(app, "reading");

    var response = await app.PostJson($"/collections/{id}/bookmarks",
        new { url = "https://example.com/a", title = new string('x', 101) });

    Eq((int)response.StatusCode, 400);

    // ...and 100 exactly is fine. Boundaries are where these live.
    var ok = await app.PostJson($"/collections/{id}/bookmarks",
        new { url = "https://example.com/b", title = new string('x', 100) });

    Eq((int)ok.StatusCode, 201);
});

Test("the collection summary reports a count, not the rows", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewCollectionId(app, "reading");

    foreach (var n in Enumerable.Range(1, 3))
        await app.PostJson($"/collections/{id}/bookmarks",
            new { url = $"https://example.com/{n}", title = $"T{n}" });

    var body = await app.GetBody($"/collections/{id}");

    Eq(Read(body).GetProperty("bookmarkCount").GetInt32(), 3);
    Ok(!body.Contains("example.com"), "the summary serialised the bookmarks");
});

Test("the listing is ordered by title", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewCollectionId(app, "reading");

    foreach (var title in new[] { "Zebra", "Apple", "Mango" })
        await app.PostJson($"/collections/{id}/bookmarks",
            new { url = "https://example.com/" + title, title });

    var titles = Titles(await app.GetBody($"/collections/{id}/bookmarks"));

    Eq(titles, new[] { "Apple", "Mango", "Zebra" });
});

Test("the listing pages, and reports the collection total", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewCollectionId(app, "reading");

    foreach (var n in Enumerable.Range(1, 25))
        await app.PostJson($"/collections/{id}/bookmarks",
            new { url = $"https://example.com/{n}", title = $"T{n:D2}" });

    var (body, total) = await GetWithTotal(app, $"/collections/{id}/bookmarks?page=2&pageSize=10");

    Eq(Titles(body), Enumerable.Range(11, 10).Select(n => $"T{n:D2}").ToArray());
    Eq(total, "25", "X-Total-Count must be the collection total, not the page");
});

Test("the default page is the FIRST page and holds 20", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewCollectionId(app, "reading");

    foreach (var n in Enumerable.Range(1, 25))
        await app.PostJson($"/collections/{id}/bookmarks",
            new { url = $"https://example.com/{n}", title = $"T{n:D2}" });

    var titles = Titles(await app.GetBody($"/collections/{id}/bookmarks"));

    Eq(titles.Length, 20);
    Eq(titles[0], "T01");
});

Test("pageSize is clamped at 100", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewCollectionId(app, "reading");

    Fixture.Seed(app, db =>
    {
        db.Bookmarks.AddRange(Enumerable.Range(1, 105).Select(n =>
            new Bookmark { Url = $"https://example.com/{n}", Title = $"T{n:D3}", CollectionId = id }));
        db.SaveChanges();
    });

    var (body, total) = await GetWithTotal(app, $"/collections/{id}/bookmarks?pageSize=1000");

    Eq(Titles(body).Length, 100, "an unbounded pageSize is a denial-of-service knob");
    Eq(total, "105");
});

Test("listing a collection that does not exist is 404", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    Eq(await app.GetStatus("/collections/999/bookmarks"), 404);
});

Test("a bookmark can be replaced", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewCollectionId(app, "reading");

    var created = Read(await (await app.PostJson($"/collections/{id}/bookmarks",
        new { url = "https://example.com/a", title = "A" })).Content.ReadAsStringAsync());
    var bookmarkId = created.GetProperty("id").GetInt32();

    var response = await app.PutJson($"/bookmarks/{bookmarkId}",
        new { url = "https://example.com/b", title = "B" });

    Eq((int)response.StatusCode, 204);
    Eq(Read(await app.GetBody($"/bookmarks/{bookmarkId}")).GetProperty("title").GetString(), "B");
});

Test("replacing a bookmark that does not exist is 404", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var response = await app.PutJson("/bookmarks/999",
        new { url = "https://example.com/b", title = "B" });

    Eq((int)response.StatusCode, 404);
});

Test("an invalid replacement is rejected and changes nothing", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewCollectionId(app, "reading");

    var created = Read(await (await app.PostJson($"/collections/{id}/bookmarks",
        new { url = "https://example.com/a", title = "A" })).Content.ReadAsStringAsync());
    var bookmarkId = created.GetProperty("id").GetInt32();

    Eq((int)(await app.PutJson($"/bookmarks/{bookmarkId}",
        new { url = "nonsense", title = "B" })).StatusCode, 400);

    Eq(Read(await app.GetBody($"/bookmarks/{bookmarkId}")).GetProperty("title").GetString(), "A");
});

Test("delete is 204 once and 404 after", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewCollectionId(app, "reading");

    var created = Read(await (await app.PostJson($"/collections/{id}/bookmarks",
        new { url = "https://example.com/a", title = "A" })).Content.ReadAsStringAsync());
    var bookmarkId = created.GetProperty("id").GetInt32();

    Eq((int)(await app.Send(Delete($"/bookmarks/{bookmarkId}"))).StatusCode, 204);
    Eq(await app.GetStatus($"/bookmarks/{bookmarkId}"), 404);
    Eq((int)(await app.Send(Delete($"/bookmarks/{bookmarkId}"))).StatusCode, 404);
});

// ──────────────────────────── test plumbing ──────────────────────────────

static HttpRequestMessage Delete(string path) => new(HttpMethod.Delete, path);

static JsonElement Read(string json) => JsonDocument.Parse(json).RootElement;

static string[] Titles(string json) =>
    Read(json).EnumerateArray().Select(e => e.GetProperty("title").GetString()!).ToArray();

static async Task<(string Body, string? Total)> GetWithTotal(ServedApp app, string path)
{
    var response = await app.Send(new HttpRequestMessage(HttpMethod.Get, path));
    response.Headers.TryGetValues("X-Total-Count", out var values);

    return (await response.Content.ReadAsStringAsync(), values?.FirstOrDefault());
}

// ──────────────────────────── the data layer (given) ─────────────────────

public class Collection
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<Bookmark> Bookmarks { get; set; } = new();
}

public class Bookmark
{
    public int Id { get; set; }
    public string Url { get; set; } = "";
    public string Title { get; set; } = "";
    public int CollectionId { get; set; }
    public Collection? Collection { get; set; }
}

public record NewCollection(string Name);
public record NewBookmark(string Url, string Title);
public record CollectionSummary(int Id, string Name, int BookmarkCount);

public class BookmarkDb(DbContextOptions<BookmarkDb> options) : DbContext(options)
{
    public DbSet<Collection> Collections => Set<Collection>();
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();
}

static class Fixture
{
    // One in-memory database per served app: every test starts empty.
    public static async Task<ServedApp> Serve(Action<WebApplication> map)
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();

        return await Web.Serve(
            builder => builder.Services.AddDbContext<BookmarkDb>(o => o.UseSqlite(connection)),
            app =>
            {
                Scoped(app, db => db.Database.EnsureCreated());
                map(app);
            });
    }

    /// <summary>Reach past the API and write to the database directly.</summary>
    public static void Seed(ServedApp app, Action<BookmarkDb> seed) => Scoped(app.App, seed);

    private static void Scoped(WebApplication app, Action<BookmarkDb> action)
    {
        using var scope = app.Services.CreateScope();
        action(scope.ServiceProvider.GetRequiredService<BookmarkDb>());
    }
}
