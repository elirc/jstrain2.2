// ─────────────────────────────────────────────────────────────────────────
//  01 · first endpoints — SOLUTION                        ★☆☆ warm-up
//  concepts: MapGet · route templates · returning values
//  run: dotnet run 01-first-endpoints.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Four routes, four different ways of describing a response.
//
//  Returning a raw `string` writes it as text/plain. Returning an object —
//  here an anonymous type — serialises it to JSON with camelCase property
//  names, which is why the assertion is `{"status":"ok"}` and not
//  `{"Status":"ok"}`. Web defaults use camelCase because that is what
//  JavaScript clients expect; it is a JsonSerializerOptions setting, not a
//  law, and knowing that saves an afternoon when a client insists on
//  PascalCase.
//
//  `Results.StatusCode(418)` is the escape hatch for codes without a named
//  helper. `Results.Redirect(url)` defaults to 302 (temporary); pass
//  `permanent: true` for a 301, which browsers and proxies cache
//  aggressively — a permanent redirect to the wrong place is very hard to
//  take back.
//
//  The last two tests are about routing itself, and nobody wires them up:
//  ASP.NET Core answers an unknown path with 404 and a known path with the
//  wrong verb with 405 Method Not Allowed, automatically. Distinguishing
//  those two is why routing is a real matching stage and not a dictionary
//  lookup on the path.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void MapRoutes(WebApplication app)
{
    app.MapGet("/ping", () => "pong");                       // text/plain
    app.MapGet("/health", () => new { status = "ok" });      // application/json
    app.MapGet("/teapot", () => Results.StatusCode(418));
    app.MapGet("/docs", () => Results.Redirect("/docs/index.html"));
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
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.Client.PostAsync("/ping", new StringContent(""));
    Eq((int)response.StatusCode, 405);
});
