// ─────────────────────────────────────────────────────────────────────────
//  02 · the tenant leak — SOLUTION                        ★★★ hunt
//  concepts: DI lifetimes · per-request state · cross-request bleed
//  run: dotnet run 02-the-tenant-leak.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  **Bug class: per-request state in a singleton.**
//
//  `AddSingleton<TenantContext>()` creates ONE instance for the entire
//  application. Every request writes its tenant into that same object, so
//  under concurrency request A sets "acme", request B overwrites it with
//  "globex", and A's endpoint then reads "globex" and returns B's data.
//
//  The fix is one word: `AddScoped`. A scope is created per HTTP request, so
//  each request gets its own `TenantContext` and there is nothing to
//  overwrite.
//
//  What makes this the nastiest bug in the course is how it hides. Click
//  around by hand and it is flawless — the first two tests pass — because
//  you are only ever making one request at a time. It needs **concurrency**
//  to appear, which your development machine does not have and production
//  does. And when it appears, the symptom is not a crash: it is one customer
//  seeing another customer's data.
//
//  Note which test is the real proof. The concurrency test is the SYMPTOM
//  and is inherently probabilistic — with the bug present it almost always
//  fails, but "almost" is not a test. The last test is deterministic: two
//  scopes must resolve two different instances, and with a singleton they
//  never will. When you write a test for a concurrency bug, find the
//  structural assertion.
//
//  How to recognise it: any service holding request-specific state —
//  a tenant, a user, a correlation id, a `DbContext` — registered as a
//  singleton. Per-request state belongs in `Scoped` or in
//  `HttpContext.Items` (module 14/05). And note that DI scope validation
//  will NOT catch this one: a singleton depending on nothing is a legal
//  graph. Only the lifetime is wrong.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;

void AddServices(WebApplicationBuilder builder)
{
    // Scoped: ONE PER REQUEST. As a singleton this is a single object
    // shared by every concurrent request, and they overwrite each other.
    builder.Services.AddScoped<TenantContext>();
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
