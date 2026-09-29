// ─────────────────────────────────────────────────────────────────────────
//  03 · the pricing service — SOLUTION                     ★★★ capstone
//  concepts: caching · stampede · retries · options · hosted startup work
//  run: dotnet run 03-the-pricing-service.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  The third capstone sits between your API and something slower and less
//  reliable than you are. Everything here is about protecting the upstream
//  from your traffic, and your callers from the upstream's bad days.
//
//      GET /price/{sku}     200 { sku, price } · 404 · 503
//
//  Three pieces, all yours:
//
//  **`PriceCache`** — the whole point of the file.
//
//   1. **Cache hits do not call the source.** Entries live for
//      `PriceOptions.CacheMilliseconds`, which comes from configuration.
//
//   2. **Cache MISSES do not call it either.** A sku the source does not know
//      is a `null`, and `null` gets cached exactly like a price. Otherwise
//      every request for a sku that does not exist — which is what a scraper
//      or a broken client sends thousands of — goes straight through your
//      cache to the thing you were protecting.
//
//   3. **A stampede calls it ONCE.** Twenty concurrent requests for a cold
//      sku must produce one upstream call, not twenty. `GetOrCreateAsync`
//      does NOT do this for you: it is not atomic, and twenty callers all
//      miss before the first one finishes. This is the single most common
//      way a cache makes an outage worse instead of better.
//
//   4. **Transient failures are retried**, up to `MaxAttempts` in total. The
//      source signals transient trouble with `HttpRequestException`.
//
//   5. **A source that stays down is a 503**, not a 500 and not a hang. You
//      are not broken; your dependency is, and the status code should say so.
//
//  **`PriceWarmer`** — an `IHostedService` that loads `PriceOptions.Warm`
//  into the cache during startup, so the first real request is a hit. Do the
//  work in `StartAsync`: the host awaits it before the server accepts a
//  single connection, which is exactly the guarantee you want here and the
//  reason this is not a `BackgroundService`.
//
//  **The endpoint** — 200 with `{ sku, price }`, 404 when the price is null,
//  503 when the source could not be reached.
//
//  Walkthrough:
//  Four separate protections, and each one is a line or two that only matters
//  on the worst day your service will have.
//
//  **The double-checked read is the whole stampede fix.** Check the cache,
//  take the per-sku gate, then check the cache AGAIN. Nineteen of the twenty
//  callers arrive at the second check after the first has already stored the
//  value, so they return it and never call the source. Without the re-check
//  they queue politely on the semaphore and then each make the call they were
//  waiting to avoid — which is slower than having no lock at all.
//
//  `GetOrCreateAsync` does not do this. It looks like it should, and its name
//  suggests it does, but the get and the create are not atomic: twenty
//  callers can all miss and all run the factory. It is a convenience wrapper,
//  not a concurrency control, and mistaking one for the other is how a cache
//  turns a slow dependency into a dead one.
//
//  **The gate is per sku, not global.** A single lock would serialise every
//  price lookup in the process behind whichever sku happened to be cold.
//
//  **Null is a value.** `cache.Set(sku, (decimal?)null, ttl)` stores a real
//  entry, and `TryGetValue` returns true for it. Skip this and every request
//  for a sku that does not exist is a cache miss forever — the "negative
//  caching" case, and the one an attacker reaches for, since unknown keys are
//  free to generate and expensive for you to answer.
//
//  **The retry catches with a filter, `when (attempt < attempts)`.** On the
//  last attempt the exception is not caught at all and propagates to the
//  endpoint, which turns it into a 503. Writing it as a catch plus a rethrow
//  works too but unwinds the stack twice and loses the original throw site;
//  the filter runs before any unwinding, which is why it is also the right
//  tool for the `NotImplementedException` case in capstone 02.
//
//  **503, not 500.** A 500 says "we have a bug" and sends someone to read
//  your code. A 503 says "our dependency is down", which is both true and
//  actionable, and it is the status a load balancer and a client's retry
//  logic already know how to interpret.
//
//  **The warmer works in `StartAsync`, and the host awaits it.** That is the
//  difference from a `BackgroundService`: `ExecuteAsync` is started and NOT
//  awaited, so a warm-up written there races the first request and the
//  guarantee evaporates. The cost is that slow startup work delays readiness
//  — which is usually what you want for a cache warm, and never what you want
//  for a poll loop.
//
//  One thing left deliberately unhandled: `_locks` grows one semaphore per
//  sku ever requested and nothing removes them. At this scale it does not
//  matter; at real scale it is a slow leak, and the fix is an eviction
//  callback that removes the gate when the entry expires.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;
using System.Text.Json;

void MapApi(WebApplication app)
{
    // 200 { sku, price } · 404 when there is no such sku · 503 when the
    // source is unreachable after every retry.
    app.MapGet("/price/{sku}", async (string sku, PriceCache cache) =>
    {
        try
        {
            var price = await cache.Get(sku);

            // No such sku is a 404 — a real answer, and a cached one.
            return price is null ? Results.NotFound() : Results.Ok(new { sku, price });
        }
        catch (HttpRequestException)
        {
            // Not our bug. 503 says "the dependency is down", which is what
            // a load balancer and a client's retry logic already understand.
            return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
        }
    });
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a price is fetched and returned", async () =>
{
    var source = new CountingSource(new() { ["abc"] = 9.99m });
    await using var app = await Fixture.Serve(MapApi, source);

    var body = await app.GetBody("/price/abc");

    Eq(Read(body).GetProperty("price").GetDecimal(), 9.99m);
    Eq(source.Calls, 1);
});

Test("an unknown sku is 404", async () =>
{
    var source = new CountingSource(new());
    await using var app = await Fixture.Serve(MapApi, source);

    Eq(await app.GetStatus("/price/nope"), 404);
});

Test("a second request inside the TTL does not touch the source", async () =>
{
    var source = new CountingSource(new() { ["abc"] = 9.99m });
    await using var app = await Fixture.Serve(MapApi, source);

    await app.GetBody("/price/abc");
    await app.GetBody("/price/abc");
    await app.GetBody("/price/abc");

    Eq(source.Calls, 1, "the cache is not being read");
});

Test("a MISS is cached too", async () =>
{
    // Otherwise every request for a sku that does not exist is a free pass
    // through the cache to the upstream.
    var source = new CountingSource(new());
    await using var app = await Fixture.Serve(MapApi, source);

    Eq(await app.GetStatus("/price/nope"), 404);
    Eq(await app.GetStatus("/price/nope"), 404);
    Eq(await app.GetStatus("/price/nope"), 404);

    Eq(source.Calls, 1, "a negative result must be cached like any other");
});

Test("the entry expires and is fetched again", async () =>
{
    var source = new CountingSource(new() { ["abc"] = 9.99m });
    await using var app = await Fixture.Serve(MapApi, source, cacheMs: 150);

    await app.GetBody("/price/abc");
    await Task.Delay(350);
    await app.GetBody("/price/abc");

    Eq(source.Calls, 2, "the entry never expired");
});

Test("the TTL comes from configuration", async () =>
{
    var source = new CountingSource(new() { ["abc"] = 9.99m });
    await using var app = await Fixture.Serve(MapApi, source, cacheMs: 60_000);

    await app.GetBody("/price/abc");
    await Task.Delay(350);
    await app.GetBody("/price/abc");

    Eq(source.Calls, 1, "a long TTL was ignored — is the value hard-coded?");
});

Test("twenty concurrent misses make ONE upstream call", async () =>
{
    // The source is slow, so every one of them misses before the first
    // returns. GetOrCreateAsync alone loses this test.
    var source = new CountingSource(new() { ["abc"] = 9.99m }, delayMs: 120);
    await using var app = await Fixture.Serve(MapApi, source);

    await Task.WhenAll(Enumerable.Range(0, 20).Select(_ => app.GetBody("/price/abc")));

    Eq(source.Calls, 1, "a cache stampede reached the upstream");
});

Test("all twenty still get the right answer", async () =>
{
    var source = new CountingSource(new() { ["abc"] = 9.99m }, delayMs: 120);
    await using var app = await Fixture.Serve(MapApi, source);

    var bodies = await Task.WhenAll(
        Enumerable.Range(0, 20).Select(_ => app.GetBody("/price/abc")));

    Ok(bodies.All(b => Read(b).GetProperty("price").GetDecimal() == 9.99m),
       "a waiting caller got the wrong value — or none");
});

Test("a transient failure is retried", async () =>
{
    var source = new FlakySource(failures: 2, price: 4.50m);
    await using var app = await Fixture.Serve(MapApi, source);

    var body = await app.GetBody("/price/abc");

    Eq(Read(body).GetProperty("price").GetDecimal(), 4.50m);
    Eq(source.Calls, 3, "expected two failures and one success");
});

Test("a source that stays down is a 503", async () =>
{
    var source = new FlakySource(failures: 99, price: 4.50m);
    await using var app = await Fixture.Serve(MapApi, source);

    Eq(await app.GetStatus("/price/abc"), 503);
    Eq(source.Calls, 3, "MaxAttempts is not being honoured");
});

Test("retries stop at MaxAttempts from configuration", async () =>
{
    var source = new FlakySource(failures: 99, price: 4.50m);
    await using var app = await Fixture.Serve(MapApi, source, maxAttempts: 5);

    Eq(await app.GetStatus("/price/abc"), 503);
    Eq(source.Calls, 5);
});

Test("warmed skus are already in the cache when the first request lands", async () =>
{
    var source = new CountingSource(new() { ["abc"] = 9.99m, ["xyz"] = 1.00m });
    await using var app = await Fixture.Serve(MapApi, source, warm: ["abc", "xyz"]);

    // Serve() has returned, so StartAsync has completed. The warmer is done.
    Eq(source.Calls, 2, "the warmer did not run before the server started");

    var body = await app.GetBody("/price/abc");

    Eq(Read(body).GetProperty("price").GetDecimal(), 9.99m);
    Eq(source.Calls, 2, "the warmed value was not reused");
});

Test("warming does not break a sku it was not asked to warm", async () =>
{
    var source = new CountingSource(new() { ["abc"] = 9.99m, ["xyz"] = 1.00m });
    await using var app = await Fixture.Serve(MapApi, source, warm: ["abc"]);

    Eq(source.Calls, 1);
    Eq(Read(await app.GetBody("/price/xyz")).GetProperty("price").GetDecimal(), 1.00m);
    Eq(source.Calls, 2);
});

// ──────────────────────────── test plumbing ──────────────────────────────

static JsonElement Read(string json) => JsonDocument.Parse(json).RootElement;

// ──────────────────────────── your code ──────────────────────────────────

public sealed class PriceCache(
    IPriceSource source, IMemoryCache cache, IOptions<PriceOptions> options)
{
    // One gate per sku: a single global lock would serialise every lookup in
    // the process behind whichever sku happened to be cold.
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    /// <summary>
    /// The price for a sku, or null if there is no such sku. Throws
    /// HttpRequestException when the source could not be reached at all.
    /// </summary>
    public async Task<decimal?> Get(string sku)
    {
        // Fast path: no lock, no allocation, no upstream call.
        if (cache.TryGetValue(sku, out decimal? cached)) return cached;

        var gate = _locks.GetOrAdd(sku, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync();

        try
        {
            // The second check is the stampede fix. Nineteen of twenty
            // callers find the value the first one just stored and stop here.
            if (cache.TryGetValue(sku, out cached)) return cached;

            var price = await Fetch(sku);

            // null is stored like any other value — negative caching.
            cache.Set(sku, price, TimeSpan.FromMilliseconds(options.Value.CacheMilliseconds));

            return price;
        }
        finally
        {
            gate.Release();
        }
    }

    private async Task<decimal?> Fetch(string sku)
    {
        var attempts = Math.Max(options.Value.MaxAttempts, 1);

        for (var attempt = 1; ; attempt++)
        {
            try
            {
                return await source.Get(sku);
            }
            // On the LAST attempt the filter is false, so this catch does not
            // run and the exception propagates to the endpoint as a 503.
            catch (HttpRequestException) when (attempt < attempts)
            {
            }
        }
    }
}

public sealed class PriceWarmer(PriceCache cache, IOptions<PriceOptions> options)
    : IHostedService
{
    // The host AWAITS this before the server accepts a connection, so by the
    // time any request arrives these skus are already in the cache. In a
    // BackgroundService this would race the first request instead.
    public Task StartAsync(CancellationToken cancellationToken) =>
        Task.WhenAll(options.Value.Warm.Select(sku => cache.Get(sku)));

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

// ──────────────────────────── given ──────────────────────────────────────

public sealed class PriceOptions
{
    public int CacheMilliseconds { get; set; } = 60_000;
    public int MaxAttempts { get; set; } = 3;
    public string[] Warm { get; set; } = [];
}

public interface IPriceSource
{
    /// <summary>Null means "no such sku". HttpRequestException means "try again".</summary>
    Task<decimal?> Get(string sku);
}

/// <summary>Answers from a dictionary and counts how often it was asked.</summary>
public sealed class CountingSource(Dictionary<string, decimal> prices, int delayMs = 0)
    : IPriceSource
{
    private int _calls;

    public int Calls => Volatile.Read(ref _calls);

    public async Task<decimal?> Get(string sku)
    {
        Interlocked.Increment(ref _calls);
        if (delayMs > 0) await Task.Delay(delayMs);

        return prices.TryGetValue(sku, out var price) ? price : null;
    }
}

/// <summary>Fails the first N times it is called, then answers.</summary>
public sealed class FlakySource(int failures, decimal price) : IPriceSource
{
    private int _calls;

    public int Calls => Volatile.Read(ref _calls);

    public Task<decimal?> Get(string sku)
    {
        var call = Interlocked.Increment(ref _calls);

        return call <= failures
            ? throw new HttpRequestException("upstream is having a moment")
            : Task.FromResult<decimal?>(price);
    }
}

static class Fixture
{
    public static Task<ServedApp> Serve(
        Action<WebApplication> map,
        IPriceSource source,
        int cacheMs = 60_000,
        int maxAttempts = 3,
        string[]? warm = null)
        => Web.Serve(
            builder =>
            {
                builder.Services.AddMemoryCache();
                builder.Services.AddSingleton<IPriceSource>(source);
                builder.Services.AddSingleton<PriceCache>();
                builder.Services.AddHostedService<PriceWarmer>();

                // Real binding, from real configuration.
                builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Prices:CacheMilliseconds"] = cacheMs.ToString(),
                    ["Prices:MaxAttempts"] = maxAttempts.ToString(),
                });

                builder.Services.Configure<PriceOptions>(options =>
                {
                    builder.Configuration.GetSection("Prices").Bind(options);
                    options.Warm = warm ?? [];
                });
            },
            map);
}
