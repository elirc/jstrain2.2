// ─────────────────────────────────────────────────────────────────────────
//  03 · expiration and eviction                           ★★☆ core
//  concepts: absolute vs sliding · size limits · eviction callbacks
//  run: dotnet run 03-expiration-and-eviction.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A cache without a bound is a memory leak with good intentions. Three
//  controls, and they do different jobs:
//
//      AbsoluteExpirationRelativeToNow   dies N after it was WRITTEN
//      SlidingExpiration                 dies N after it was last READ
//      Size + SizeLimit                  evicts under pressure
//
//  **Sliding expiration alone never expires a hot key.** An entry read every
//  second with a 5-minute slide lives forever, so a value that has changed
//  underneath you is served indefinitely. The usual correct answer is BOTH:
//  a slide to evict things nobody wants, and an absolute cap so nothing is
//  ever staler than you promised.
//
//  `SizeLimit` is opt-in and all-or-nothing: set it on the cache and every
//  single entry must then declare a `Size`, or `Set` throws. The units are
//  yours — entries, kilobytes, rows — as long as you are consistent.
//
//  Eviction callbacks tell you why something left, which is the only way to
//  find out that your cache is thrashing rather than working.
//
//  hint: the tests use short timeouts — keep the total waiting well under a
//        second and assert what happened, not how long it took
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.Caching.Memory;

// A cache holding at most 3 units, where every entry counts as 1.
MemoryCache BoundedCache()
{
    throw new NotImplementedException();
}

// Store with an absolute lifetime: gone `ms` after it was written, however
// often it is read.
void SetAbsolute(IMemoryCache cache, string key, string value, int ms)
{
    throw new NotImplementedException();
}

// Store with a sliding lifetime: gone `ms` after the last READ.
void SetSliding(IMemoryCache cache, string key, string value, int ms)
{
    throw new NotImplementedException();
}

// Store in the bounded cache, counting as one unit, and record every
// eviction as "$"{key}:{reason}" in `evictions`.
void SetTracked(MemoryCache cache, string key, string value, List<string> evictions)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("an absolute entry survives until its deadline", async () =>
{
    using var cache = new MemoryCache(new MemoryCacheOptions());
    SetAbsolute(cache, "k", "v", 300);

    await Task.Delay(60);

    Eq(cache.Get<string>("k"), "v");
});

Test("an absolute entry dies on schedule, however often it is read", async () =>
{
    // Reading does NOT extend it. That is the difference from sliding.
    using var cache = new MemoryCache(new MemoryCacheOptions());
    SetAbsolute(cache, "k", "v", 150);

    for (var i = 0; i < 5; i++)
    {
        await Task.Delay(50);
        _ = cache.Get<string>("k");
    }

    Eq(cache.Get<string>("k"), null);
});

Test("a sliding entry is kept alive by reads", async () =>
{
    using var cache = new MemoryCache(new MemoryCacheOptions());
    SetSliding(cache, "k", "v", 150);

    for (var i = 0; i < 4; i++)
    {
        await Task.Delay(50);
        Eq(cache.Get<string>("k"), "v", "read " + i + " should have kept it alive");
    }
});

Test("...and dies once nobody asks", async () =>
{
    using var cache = new MemoryCache(new MemoryCacheOptions());
    SetSliding(cache, "k", "v", 100);

    await Task.Delay(300);

    Eq(cache.Get<string>("k"), null);
});

Test("a size limit is enforced", () =>
{
    // Not a suggestion: without a bound, a cache keyed on user input is a
    // denial-of-service vector.
    using var cache = BoundedCache();
    var evictions = new List<string>();

    foreach (var n in Enumerable.Range(1, 6))
        SetTracked(cache, "k" + n, "v" + n, evictions);

    cache.Compact(0);   // force pending eviction work to run

    Ok(cache.Count <= 3, "expected at most 3 entries, found " + cache.Count);
});

Test("an entry with no Size throws once a limit is set", () =>
{
    // All-or-nothing: set SizeLimit and EVERY entry must declare a size.
    using var cache = BoundedCache();

    Throws<InvalidOperationException>(() => cache.Set("k", "v"));
});

Test("eviction callbacks say WHY something left", async () =>
{
    // The callback runs on the thread pool, NOT inline — so the test has to
    // wait for it. Code that assumed otherwise is a race, not a test.
    using var cache = new MemoryCache(new MemoryCacheOptions());
    var evicted = new TaskCompletionSource<string>();

    cache.Set("k", "v", new MemoryCacheEntryOptions()
        .RegisterPostEvictionCallback((key, _, reason, _) =>
            evicted.TrySetResult($"{key}:{reason}")));

    cache.Remove("k");

    Eq(await evicted.Task.WaitAsync(TimeSpan.FromSeconds(5)), "k:Removed");
});

Test("a replaced entry reports Replaced, not Removed", async () =>
{
    // Worth knowing: a cache that looks like it is evicting may just be
    // being overwritten, and the reason is how you tell.
    using var cache = new MemoryCache(new MemoryCacheOptions());
    var evicted = new TaskCompletionSource<string>();

    cache.Set("k", "v1", new MemoryCacheEntryOptions()
        .RegisterPostEvictionCallback((key, _, reason, _) =>
            evicted.TrySetResult($"{key}:{reason}")));

    cache.Set("k", "v2");

    Eq(await evicted.Task.WaitAsync(TimeSpan.FromSeconds(5)), "k:Replaced");
});

Test("absolute and sliding together give you both guarantees", async () =>
{
    // The combination you almost always want: evict what nobody wants, and
    // never serve anything staler than the absolute cap.
    using var cache = new MemoryCache(new MemoryCacheOptions());

    cache.Set("k", "v", new MemoryCacheEntryOptions
    {
        SlidingExpiration = TimeSpan.FromMilliseconds(200),
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMilliseconds(250),
    });

    for (var i = 0; i < 5; i++)
    {
        await Task.Delay(60);
        _ = cache.Get<string>("k");
    }

    // Read constantly, so the slide never fired. The absolute cap did.
    Eq(cache.Get<string>("k"), null);
});
