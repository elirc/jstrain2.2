// ─────────────────────────────────────────────────────────────────────────
//  05 · route groups — SOLUTION                           ★★☆ core
//  concepts: MapGroup · shared prefixes · endpoint filters
//  run: dotnet run 05-route-groups.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `MapGroup` returns a RouteGroupBuilder that is itself an
//  IEndpointRouteBuilder, which is why nesting works: `v2.MapGroup("/admin")`
//  is the same call again, and the prefixes concatenate to /api/v2/admin.
//
//  The filter is attached to the GROUP, so it runs for every endpoint the
//  group contains — including ones added after the AddEndpointFilter call,
//  and including nested groups. The "guards every endpoint" and "nested
//  group" tests exist to prove both, because the intuition that a filter
//  only covers what came before it is wrong and would be an ugly security
//  hole.
//
//  Inside the filter, returning WITHOUT awaiting `next(ctx)` short-circuits:
//  the handler never runs. That is the whole control-flow model, and it is
//  why the filter can enforce auth rather than merely observe it. Returning
//  `await next(ctx)` passes through, and you could also inspect or replace
//  the result on the way back out.
//
//  Note the ordering trap this avoids: filters compose outward-in in the
//  order added, so an auth filter should be added FIRST in the group, before
//  anything that might read the body or do expensive work.
//
//  Real code would use `.RequireAuthorization()` and the auth middleware
//  (module 19) rather than a hand-rolled header check; this is the mechanism
//  underneath, with nothing hidden.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void MapRoutes(WebApplication app)
{
    var v1 = app.MapGroup("/api/v1");
    v1.MapGet("/items", () => "v1 items");

    var v2 = app.MapGroup("/api/v2");

    // Attached to the group: covers every endpoint below, added before or
    // after this line, nested groups included.
    v2.AddEndpointFilter(async (ctx, next) =>
    {
        var key = ctx.HttpContext.Request.Headers["X-Api-Key"].ToString();
        if (key != "secret") return Results.Unauthorized();   // skips the handler
        return await next(ctx);                               // runs the handler
    });

    v2.MapGet("/items", () => "v2 items");
    v2.MapGet("/orders", () => "v2 orders");

    var admin = v2.MapGroup("/admin");   // → /api/v2/admin
    admin.MapGet("/stats", () => "stats");
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
