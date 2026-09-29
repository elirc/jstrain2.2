// ─────────────────────────────────────────────────────────────────────────
//  03 · expiration and eviction — SOLUTION                ★★☆ core
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
//  Walkthrough:
//  Four small methods; the content is the difference between the two
//  expiration policies and what happens when you forget a bound.
//
//  **Sliding never expires a hot key.** The third test reads the entry every
//  50ms with a 150ms slide and it survives indefinitely — which is correct
//  behaviour and usually not what the author wanted. A price that changed an
//  hour ago is still being served because the page is popular. The last test
//  is the fix: a slide to evict what nobody wants, plus an absolute cap so
//  nothing is ever staler than you promised. Set both; it costs one extra
//  line.
//
//  **`SizeLimit` is all-or-nothing.** Turn it on and every `Set` must carry a
//  `Size`, or it throws — which the sixth test pins. That looks unfriendly
//  and is deliberate: a cache where half the entries are uncounted cannot
//  enforce a limit, so it refuses to pretend. The units are yours; what
//  matters is that they are consistent.
//
//  A cache with no bound is a memory leak with good intentions, and if the
//  key comes from user input it is also a denial-of-service knob — the same
//  point as the pageSize clamp in capstone 23/01.
//
//  **Eviction is lazy.** `MemoryCache` does not run a timer per entry; it
//  removes expired items when they are next touched, plus a periodic scan.
//  So `cache.Count` can include entries that are logically gone, which is why
//  the fifth test calls `Compact(0)` to force the pending work. In production
//  it does not matter; in a test that asserts on `Count`, it does.
//
//  **The eviction callback runs on the thread pool, not inline.** Both
//  callback tests await a `TaskCompletionSource` rather than asserting
//  immediately after `Remove` — asserting straight away is a race that passes
//  on a fast machine and fails in CI. Worth internalising as a general habit:
//  if a callback is documented as "posted", never assert on it
//  synchronously.
//
//  **`Replaced` is not `Removed`.** A cache that appears to be evicting
//  constantly may just be being overwritten by concurrent writers, and the
//  eviction reason is the only way to tell those apart. `Capacity` means you
//  are thrashing; `Expired` means your TTL is too short; `Replaced` means
//  something upstream is not deduplicating.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.Caching.Memory;

// A cache holding at most 3 units, where every entry counts as 1.
// Three units. Every entry must then declare a Size or Set throws.
MemoryCache BoundedCache() => new(new MemoryCacheOptions { SizeLimit = 3 });

// Store with an absolute lifetime: gone `ms` after it was written, however
// often it is read.
// Dies `ms` after it was WRITTEN. Reads do not extend it.
void SetAbsolute(IMemoryCache cache, string key, string value, int ms) =>
    cache.Set(key, value, new MemoryCacheEntryOptions
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMilliseconds(ms),
    });

// Store with a sliding lifetime: gone `ms` after the last READ.
// Dies `ms` after the last READ — so a hot key never dies at all.
void SetSliding(IMemoryCache cache, string key, string value, int ms) =>
    cache.Set(key, value, new MemoryCacheEntryOptions
    {
        SlidingExpiration = TimeSpan.FromMilliseconds(ms),
    });

// Store in the bounded cache, counting as one unit, and record every
// eviction as "$"{key}:{reason}" in `evictions`.
void SetTracked(MemoryCache cache, string key, string value, List<string> evictions) =>
    cache.Set(key, value, new MemoryCacheEntryOptions { Size = 1 }
        .RegisterPostEvictionCallback((evictedKey, _, reason, _) =>
        {
            // The callback runs on the thread pool: several can overlap.
            lock (evictions) evictions.Add($"{evictedKey}:{reason}");
        }));

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
