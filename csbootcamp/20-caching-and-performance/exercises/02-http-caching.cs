// ─────────────────────────────────────────────────────────────────────────
//  02 · HTTP caching                                      ★★★ stretch
//  concepts: ETag · 304 Not Modified · Cache-Control
//  run: dotnet run 02-http-caching.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  The cheapest response is the one you do not send. HTTP has this built in,
//  and most APIs never use it:
//
//      GET /items/1                     → 200, ETag: "abc"
//      GET /items/1  If-None-Match:"abc" → 304, NO BODY
//
//  A 304 costs a few dozen bytes instead of a full payload, and the client
//  keeps using what it already had. For a list endpoint polled every few
//  seconds, that is most of your bandwidth.
//
//  `Cache-Control` says who may store it and for how long:
//
//      no-store                never write it down (anything sensitive)
//      no-cache                store, but revalidate before every use
//      private, max-age=60     only the end user's browser, 60s
//      public, max-age=60      shared proxies and CDNs too
//
//  Getting `public` wrong on a per-user response means a CDN serving one
//  user's data to another — the caching equivalent of module 19's IDOR.
//
//  hint: an ETag must be quoted, and `If-None-Match` echoes it verbatim
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Security.Cryptography;
using System.Text;

// Map:
//   GET /items/{id}   → 200 + ETag + "private, max-age=60"
//                       304 (no body) when If-None-Match matches
//                       404 for an unknown id
//   GET /me           → 200 + "no-store" (never cached anywhere)
//   GET /public/news  → 200 + "public, max-age=300"
void MapRoutes(WebApplication app, Dictionary<int, string> items)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Dictionary<int, string> Items() => new() { [1] = "widget", [2] = "gadget" };

async Task<ServedApp> Serve(Dictionary<int, string>? items = null)
{
    var data = items ?? Items();
    return await Web.Serve(app => MapRoutes(app, data));
}

Test("a first request returns 200 with a body and an ETag", async () =>
{
    await using var app = await Serve();
    var response = await app.Client.GetAsync("/items/1");

    Eq((int)response.StatusCode, 200);
    Eq(await response.Content.ReadAsStringAsync(), "widget");
    Ok(response.Headers.ETag is not null, "expected an ETag");
});

Test("the ETag is quoted, as the spec requires", async () =>
{
    await using var app = await Serve();
    var etag = (await app.Client.GetAsync("/items/1")).Headers.ETag!.Tag;

    Ok(etag.StartsWith('"') && etag.EndsWith('"'), $"unquoted ETag: {etag}");
});

Test("returning the ETag gets a 304 with NO body", async () =>
{
    await using var app = await Serve();
    var first = await app.Client.GetAsync("/items/1");

    var request = new HttpRequestMessage(HttpMethod.Get, "/items/1");
    request.Headers.TryAddWithoutValidation("If-None-Match", first.Headers.ETag!.Tag);
    var second = await app.Send(request);

    Eq((int)second.StatusCode, 304);
    Eq(await second.Content.ReadAsStringAsync(), "");
});

Test("a STALE ETag gets a fresh 200", async () =>
{
    await using var app = await Serve();

    var request = new HttpRequestMessage(HttpMethod.Get, "/items/1");
    request.Headers.TryAddWithoutValidation("If-None-Match", "\"not-the-current-one\"");
    var response = await app.Send(request);

    Eq((int)response.StatusCode, 200);
    Eq(await response.Content.ReadAsStringAsync(), "widget");
});

Test("the ETag changes when the content changes", async () =>
{
    var items = Items();
    await using var app = await Serve(items);

    var before = (await app.Client.GetAsync("/items/1")).Headers.ETag!.Tag;
    items[1] = "widget v2";
    var after = (await app.Client.GetAsync("/items/1")).Headers.ETag!.Tag;

    Ok(before != after, "an ETag must be derived from the content");
});

Test("an old ETag stops matching after the content changes", async () =>
{
    var items = Items();
    await using var app = await Serve(items);
    var stale = (await app.Client.GetAsync("/items/1")).Headers.ETag!.Tag;

    items[1] = "widget v2";

    var request = new HttpRequestMessage(HttpMethod.Get, "/items/1");
    request.Headers.TryAddWithoutValidation("If-None-Match", stale);
    var response = await app.Send(request);

    Eq((int)response.StatusCode, 200);
    Eq(await response.Content.ReadAsStringAsync(), "widget v2");
});

Test("different items have different ETags", async () =>
{
    await using var app = await Serve();

    var one = (await app.Client.GetAsync("/items/1")).Headers.ETag!.Tag;
    var two = (await app.Client.GetAsync("/items/2")).Headers.ETag!.Tag;

    Ok(one != two);
});

Test("a per-user response is private, never public", async () =>
{
    await using var app = await Serve();
    var cacheControl = (await app.Client.GetAsync("/items/1")).Headers.CacheControl!;

    Ok(cacheControl.Private, "a per-user response must not be shared-cacheable");
    Ok(!cacheControl.Public);
    Eq(cacheControl.MaxAge, TimeSpan.FromSeconds(60));
});

Test("sensitive data is no-store", async () =>
{
    await using var app = await Serve();
    var cacheControl = (await app.Client.GetAsync("/me")).Headers.CacheControl!;

    Ok(cacheControl.NoStore, "sensitive responses must never be written down");
});

Test("genuinely public data may be shared-cached", async () =>
{
    await using var app = await Serve();
    var cacheControl = (await app.Client.GetAsync("/public/news")).Headers.CacheControl!;

    Ok(cacheControl.Public);
    Eq(cacheControl.MaxAge, TimeSpan.FromSeconds(300));
});

Test("an unknown item is still a 404", async () =>
{
    await using var app = await Serve();
    Eq(await app.GetStatus("/items/99"), 404);
});
