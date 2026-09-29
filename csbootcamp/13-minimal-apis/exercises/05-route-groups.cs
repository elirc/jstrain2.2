// ─────────────────────────────────────────────────────────────────────────
//  05 · route groups                                      ★★☆ core
//  concepts: MapGroup · shared prefixes · endpoint filters
//  run: dotnet run 05-route-groups.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Once an API has thirty endpoints, repeating "/api/v1/..." thirty times is
//  a refactor waiting to go wrong. `MapGroup` factors out the prefix — and
//  more usefully, anything else the group shares: filters, metadata, auth.
//
//      var api = app.MapGroup("/api/v1");
//      api.MapGet("/items", …);        // serves /api/v1/items
//
//  Groups nest, and their prefixes concatenate.
//
//  An ENDPOINT FILTER wraps the handler — the minimal-API equivalent of an
//  action filter. It sees the arguments before the handler runs and the
//  result after, so it can short-circuit:
//
//      group.AddEndpointFilter(async (ctx, next) => {
//          if (bad) return Results.BadRequest();
//          return await next(ctx);      // call the handler
//      });
//
//  Build a versioned API where the v2 group requires an `X-Api-Key: secret`
//  header on every endpoint, enforced once by a filter, and v1 does not.
//
//  hint: ctx.HttpContext.Request.Headers gives you the incoming headers;
//        returning without calling next(ctx) skips the handler entirely
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void MapRoutes(WebApplication app)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("the v1 group serves under its prefix", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/api/v1/items"), "v1 items");
});

Test("the un-prefixed path is not mapped", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetStatus("/items"), 404);
});

Test("v1 needs no api key", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetStatus("/api/v1/items"), 200);
});

Test("v2 without the key is rejected by the filter", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetStatus("/api/v2/items"), 401);
});

Test("v2 with the right key reaches the handler", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    app.Client.DefaultRequestHeaders.Add("X-Api-Key", "secret");
    Eq(await app.GetBody("/api/v2/items"), "v2 items");
});

Test("v2 with a wrong key is still rejected", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    app.Client.DefaultRequestHeaders.Add("X-Api-Key", "guess");
    Eq(await app.GetStatus("/api/v2/items"), 401);
});

Test("the filter guards every endpoint in the group, not just the first", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetStatus("/api/v2/orders"), 401);
});

Test("a nested group concatenates prefixes", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    app.Client.DefaultRequestHeaders.Add("X-Api-Key", "secret");
    Eq(await app.GetBody("/api/v2/admin/stats"), "stats");
});
