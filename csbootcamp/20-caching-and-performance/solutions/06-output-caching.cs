// ─────────────────────────────────────────────────────────────────────────
//  06 · output caching — SOLUTION                         ★★★ stretch
//  concepts: caching the whole response · VaryBy · what must never be cached
//  run: dotnet run 06-output-caching.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 01 cached a VALUE. Output caching caches the whole **response** —
//  status, headers and body — so a hit never reaches your endpoint at all.
//  It is the cheapest possible hit and the easiest one to get dangerously
//  wrong.
//
//      builder.Services.AddOutputCache();
//      app.UseOutputCache();                 // BEFORE the endpoints
//      app.MapGet("/x", …).CacheOutput();
//
//  Three rules, and the third is the one that matters:
//
//   1. **`UseOutputCache` goes before the endpoints**, or there is nothing
//      in front of them to short-circuit.
//   2. **Vary by exactly what the response depends on.** The default key is
//      the whole URL, query string included — so `?utm_source=twitter`
//      creates a separate entry for a response that is byte-identical.
//      `SetVaryByQuery("q")` NARROWS the key to the parameters that actually
//      change the answer, which is how you stop tracking parameters
//      fragmenting the cache into uselessness.
//   3. **Never output-cache an authenticated response.** The cache sits in
//      front of your handler, so it does not know whose response it stored;
//      the next user gets the previous user's page. `.CacheOutput()` on a
//      `[Authorize]` endpoint is the most damaging one-line bug in this whole
//      track. (ASP.NET Core will not cache a response carrying a
//      `Set-Cookie`, or one from a request with an `Authorization` header —
//      but do not rely on that as your design.)
//
//  Walkthrough:
//  Two short methods, and the whole exercise is in where the middleware sits
//  and what the key varies by.
//
//  **`UseOutputCache()` goes before the endpoints.** It is a piece of
//  middleware, so it can only short-circuit what comes after it — put it
//  after `MapGet` and it caches nothing, silently. The last test is the
//  proof that it worked: ten requests, one execution.
//
//  **The default key is the whole URL, query string included** — which is
//  safe and wasteful. The sixth test shows `/time?utm_source=a` and
//  `?utm_source=b` producing two entries for a response that ignores its
//  query string entirely. Share a link on three platforms and you have three
//  copies of one page; add a cache-busting timestamp and the hit rate is
//  zero while the memory cost is not.
//
//  `SetVaryByQuery("q")` **narrows** the key to the parameters that actually
//  change the answer. That is the direction to think in: the default is
//  already conservative, and your job is to tell it which inputs are real.
//  Getting it wrong in the narrowing direction is the dangerous one — omit a
//  parameter that does change the response and every caller gets the first
//  one's answer.
//
//  **This is fundamentally different from exercise 01's cache-aside.** There,
//  the handler ran and cached a value. Here the handler does not run at all —
//  no database call, no serialisation, no allocation. That is why it is the
//  cheapest possible hit, and also why the handler has no opportunity to make
//  the response depend on who is asking.
//
//  Which is the rule to leave with: **never output-cache an authenticated
//  response.** The cache sits in front of your authorization, stores whatever
//  the first caller got, and hands it to the next one. `.CacheOutput()` added
//  to an `[Authorize]` endpoint during a performance push is a one-line data
//  breach, and it will look like the change worked.
//
//  ASP.NET Core has guards — it will not store a response carrying
//  `Set-Cookie`, and by default it does not serve cached responses to
//  requests carrying an `Authorization` header — but they are a safety net,
//  not a design. Decide per endpoint whether the response is genuinely the
//  same for everyone, and cache only those.
//
//  Output caching (the server keeps the response) is also not response
//  caching (the CLIENT keeps it, via `Cache-Control` — exercise 02). They
//  compose, and confusing them leads to a `Cache-Control: private` response
//  being stored in a shared server-side cache, which is the same breach by
//  another route.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;

var hits = new Counter();

// Register output caching.
void AddServices(WebApplicationBuilder builder) => builder.Services.AddOutputCache();

// Wire the pipeline and these endpoints:
//
//   GET /time      cached, 30s, no vary — counts a hit each time it RUNS
//   GET /search    cached, 30s, varying by the "q" query parameter
//   GET /live      NOT cached
//
// Every endpoint returns "hit {n}" where n is hits.Next() for that endpoint.
void BuildApp(WebApplication app)
{
    // BEFORE the endpoints: middleware can only short-circuit what follows.
    app.UseOutputCache();

    // No vary: the key is the path, so the query string is ignored.
    app.MapGet("/time", () => $"hit {hits.Next()}")
       .CacheOutput(policy => policy.Expire(TimeSpan.FromSeconds(30)));

    // Varying by "q" — without this, every search returns the first one.
    app.MapGet("/search", (string? q) => $"hit {hits.Next()}")
       .CacheOutput(policy => policy
           .Expire(TimeSpan.FromSeconds(30))
           .SetVaryByQuery("q"));

    // No .CacheOutput(): runs every time.
    app.MapGet("/live", () => $"hit {hits.Next()}");
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("the first request runs the endpoint", async () =>
{
    hits.Reset();
    await using var app = await Web.Serve(BuildApp, AddServices);

    Eq(await app.GetBody("/time"), "hit 1");
});

Test("the second request never reaches it", async () =>
{
    hits.Reset();
    await using var app = await Web.Serve(BuildApp, AddServices);

    Eq(await app.GetBody("/time"), "hit 1");
    Eq(await app.GetBody("/time"), "hit 1");
    Eq(await app.GetBody("/time"), "hit 1");

    Eq(hits.Count, 1, "the endpoint ran " + hits.Count + " times");
});

Test("an uncached endpoint runs every time", async () =>
{
    hits.Reset();
    await using var app = await Web.Serve(BuildApp, AddServices);

    Eq(await app.GetBody("/live"), "hit 1");
    Eq(await app.GetBody("/live"), "hit 2");
    Eq(hits.Count, 2);
});

Test("varying by query gives each search its own entry", async () =>
{
    hits.Reset();
    await using var app = await Web.Serve(BuildApp, AddServices);

    Eq(await app.GetBody("/search?q=cats"), "hit 1");
    Eq(await app.GetBody("/search?q=dogs"), "hit 2");

    Eq(hits.Count, 2, "two different queries must be two entries");
});

Test("...and repeating a search is a hit", async () =>
{
    hits.Reset();
    await using var app = await Web.Serve(BuildApp, AddServices);

    await app.GetBody("/search?q=cats");
    await app.GetBody("/search?q=dogs");
    Eq(await app.GetBody("/search?q=cats"), "hit 1");

    Eq(hits.Count, 2);
});

Test("by default EVERY distinct query string is a separate entry", async () =>
{
    // /time ignores its query string entirely, and still caches these
    // separately — one campaign link per entry, all identical.
    hits.Reset();
    await using var app = await Web.Serve(BuildApp, AddServices);

    Eq(await app.GetBody("/time?utm_source=a"), "hit 1");
    Eq(await app.GetBody("/time?utm_source=b"), "hit 2");

    Eq(hits.Count, 2, "an unrestricted key fragments on parameters nobody reads");
});

Test("SetVaryByQuery narrows the key to what matters", async () =>
{
    // Same search, two tracking parameters, ONE entry — because the policy
    // says the key varies by "q" and nothing else.
    hits.Reset();
    await using var app = await Web.Serve(BuildApp, AddServices);

    Eq(await app.GetBody("/search?q=cats&utm_source=a"), "hit 1");
    Eq(await app.GetBody("/search?q=cats&utm_source=b"), "hit 1");

    Eq(hits.Count, 1, "only q should take part in the key");
});

Test("a cached response is byte-for-byte the stored one", async () =>
{
    hits.Reset();
    await using var app = await Web.Serve(BuildApp, AddServices);

    var first = await app.GetBody("/time");
    var second = await app.GetBody("/time");

    Eq(first, second);
});

Test("the cache is in FRONT of the endpoint, which is the whole point", async () =>
{
    // Nothing in the handler runs on a hit: no database call, no
    // serialisation, no allocation. It is also why the handler cannot make
    // the response depend on the caller.
    hits.Reset();
    await using var app = await Web.Serve(BuildApp, AddServices);

    foreach (var _ in Enumerable.Range(0, 10))
        await app.GetBody("/time");

    Eq(hits.Count, 1);
});

// ──────────────────────────── types ──────────────────────────────────────

public sealed class Counter
{
    private int _count;

    public int Count => Volatile.Read(ref _count);

    public int Next() => Interlocked.Increment(ref _count);
    public void Reset() => Interlocked.Exchange(ref _count, 0);
}
