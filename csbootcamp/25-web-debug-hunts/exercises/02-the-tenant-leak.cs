// ─────────────────────────────────────────────────────────────────────────
//  02 · the tenant leak                                   ★★★ hunt
//  concepts: DI lifetimes · per-request state · cross-request bleed
//  run: dotnet run 02-the-tenant-leak.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  THIS FILE SHIPS BROKEN. The tests are red on the first run, by design.
//
//  Every request carries an `X-Tenant` header. Middleware reads it, stores
//  it, and the endpoint reports which tenant's data it would return.
//
//  It works flawlessly when you click around by hand. Under any real traffic
//  it serves one customer's tenant to another — the single worst kind of bug
//  this course can show you.
//
//  The registration is one word wrong.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;

void AddServices(WebApplicationBuilder builder)
{
    builder.Services.AddSingleton<TenantContext>();
}

void BuildPipeline(WebApplication app)
{
    app.Use(async (ctx, next) =>
    {
        var tenant = ctx.RequestServices.GetRequiredService<TenantContext>();
        tenant.Name = ctx.Request.Headers["X-Tenant"].ToString();

        await next(ctx);
    });

    app.MapGet("/data", (TenantContext tenant) => $"data for {tenant.Name}");
}

// ──────────────────────────── tests ──────────────────────────────────────

async Task<string> Fetch(ServedApp app, string tenant)
{
    var request = new HttpRequestMessage(HttpMethod.Get, "/data");
    request.Headers.Add("X-Tenant", tenant);
    return await (await app.Send(request)).Content.ReadAsStringAsync();
}

Test("one request at a time works", async () =>
{
    await using var app = await Web.Serve(AddServices, BuildPipeline);
    Eq(await Fetch(app, "acme"), "data for acme");
});

Test("sequential requests each see their own tenant", async () =>
{
    await using var app = await Web.Serve(AddServices, BuildPipeline);

    Eq(await Fetch(app, "acme"), "data for acme");
    Eq(await Fetch(app, "globex"), "data for globex");
});

Test("CONCURRENT requests do not see each other's tenant", async () =>
{
    // The SYMPTOM. Twenty tenants in flight together; with the bug present
    // at least one request almost always reports somebody else's tenant.
    // (The last test below is the deterministic proof.)
    await using var app = await Web.Serve(AddServices, BuildPipeline);

    var tenants = Enumerable.Range(0, 20).Select(n => $"tenant-{n}").ToArray();
    var results = await Task.WhenAll(tenants.Select(t => Fetch(app, t)));

    for (var i = 0; i < tenants.Length; i++)
        Eq(results[i], $"data for {tenants[i]}");
});

Test("the context is not shared between requests", async () =>
{
    await using var app = await Web.Serve(AddServices, BuildPipeline);

    // Two scopes must resolve two different instances.
    using var scopeA = app.App.Services.CreateScope();
    using var scopeB = app.App.Services.CreateScope();

    Ok(!ReferenceEquals(
        scopeA.ServiceProvider.GetRequiredService<TenantContext>(),
        scopeB.ServiceProvider.GetRequiredService<TenantContext>()),
       "two requests resolved the SAME TenantContext");
});

// ──────────────────────────── types ──────────────────────────────────────

// Holds the tenant for the CURRENT request.
public class TenantContext
{
    public string Name { get; set; } = "";
}
