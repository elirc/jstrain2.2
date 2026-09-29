// ─────────────────────────────────────────────────────────────────────────
//  03 · the pricing service                                ★★★ capstone
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
//  hint: one `SemaphoreSlim` per sku, and re-check the cache after you take
//        it — the whole point is that the caller who waited finds the value
//        the first one just put there
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
        throw new NotImplementedException();
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

#pragma warning disable CS9113   // unread until you write the bodies

public sealed class PriceCache(
    IPriceSource source, IMemoryCache cache, IOptions<PriceOptions> options)
{
    /// <summary>
    /// The price for a sku, or null if there is no such sku. Throws
    /// HttpRequestException when the source could not be reached at all.
    /// </summary>
    public Task<decimal?> Get(string sku)
    {
        throw new NotImplementedException();
    }
}

public sealed class PriceWarmer(PriceCache cache, IOptions<PriceOptions> options)
    : IHostedService
{
    // Load every sku in options.Value.Warm. The host AWAITS this before the
    // server accepts connections.
    public Task StartAsync(CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

#pragma warning restore CS9113

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
