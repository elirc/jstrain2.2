// ─────────────────────────────────────────────────────────────────────────
//  01 · first endpoints                                   ★☆☆ warm-up
//  concepts: MapGet · route templates · returning values
//  run: dotnet run 01-first-endpoints.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A minimal API endpoint is a route template plus a delegate. What the
//  delegate RETURNS decides the response:
//
//      () => "pong"                → 200, text/plain
//      () => new { ok = true }     → 200, application/json (serialised)
//      () => Results.NotFound()    → 404, no body
//
//  Returning a string gives you text/plain — not a JSON string. That catches
//  everyone once: a client doing response.json() on `"pong"` fails, because
//  the wire bytes are `pong`, unquoted, with no JSON content type.
//
//  Wire up four routes on the app you are given:
//
//      GET /ping         → "pong" as plain text
//      GET /health       → JSON { "status": "ok" }
//      GET /teapot       → status 418, no body
//      GET /docs         → redirect (302) to /docs/index.html
//
//  hint: Results.StatusCode(418) and Results.Redirect(url) do the last two
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void MapRoutes(WebApplication app)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("GET /ping returns plain text", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.Client.GetAsync("/ping");

    Eq((int)response.StatusCode, 200);
    Eq(await response.Content.ReadAsStringAsync(), "pong");
    Eq(response.Content.Headers.ContentType?.MediaType, "text/plain");
});

Test("GET /health returns JSON", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.Client.GetAsync("/health");

    Eq((int)response.StatusCode, 200);
    Eq(response.Content.Headers.ContentType?.MediaType, "application/json");
    Eq(await response.Content.ReadAsStringAsync(), "{\"status\":\"ok\"}");
});

Test("GET /teapot returns 418", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetStatus("/teapot"), 418);
});

Test("GET /docs redirects", async () =>
{
    // A redirect-following client would hide the 302, so turn that off.
    await using var app = await Web.Serve(MapRoutes);
    using var noRedirect = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false })
    {
        BaseAddress = new Uri(app.BaseAddress),
    };

    var response = await noRedirect.GetAsync("/docs");
    Eq((int)response.StatusCode, 302);
    Eq(response.Headers.Location?.ToString(), "/docs/index.html");
});

Test("an unmapped route is a 404", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetStatus("/nothing-here"), 404);
});

Test("the wrong verb on a mapped route is 405, not 404", async () =>
{
    // The route exists, the method does not — routing tells them apart.
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.Client.PostAsync("/ping", new StringContent(""));
    Eq((int)response.StatusCode, 405);
});
