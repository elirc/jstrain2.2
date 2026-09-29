// ─────────────────────────────────────────────────────────────────────────
//  01 · in-memory caching — SOLUTION                      ★★☆ core
//  concepts: cache-aside · expiry · the stampede · negative caching
//  run: dotnet run 01-in-memory-caching.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  The cache-aside pattern is four lines and three traps:
//
//      if (cache.TryGet(key, out var hit)) return hit;
//      var value = await LoadExpensively(key);
//      cache.Set(key, value, ttl);
//      return value;
//
//  Trap 1 — **the stampede.** Between the miss and the set, every concurrent
//  request also misses and also calls the expensive thing. On a hot key at
//  the moment it expires, that is a thundering herd hitting your database.
//
//  Trap 2 — **negative results.** If a miss means "not found" and you do not
//  cache that, every lookup for a non-existent key hits the source forever.
//
//  Trap 3 — **unbounded growth.** A cache with no eviction is a memory leak
//  with good branding.
//
//  Build one that handles all three. The clock is injected, so expiry is
//  testable instantly (module 21/02).
//
//  Walkthrough:
//  The shape is **check, lock, check again, load**. That second check is the
//  whole stampede fix: twenty callers miss, nineteen queue on the semaphore,
//  and by the time they get in the first one has already stored the value —
//  so they find it and return without loading. One load, twenty callers,
//  which is what the concurrency test proves.
//
//  Skip the double-check and every queued caller loads in turn: you have
//  serialised the stampede rather than prevented it, which is arguably worse
//  because it also removed the concurrency.
//
//  **One semaphore per key, not one for the cache.** A single global lock
//  makes a slow load for one key block every unrelated key — turning your
//  cache into a bottleneck under exactly the load it exists to relieve. The
//  "slow load does not block another key" test pins that down.
//
//  **Negative caching**: the entry stores `string?`, so a null result is a
//  real cached value rather than "not present". Without it, every request for
//  a key that does not exist reaches the source forever — and missing keys
//  are exactly what a scraper or a broken client hammers. (In production you
//  usually give negative entries a *shorter* TTL, so a newly-created record
//  appears sooner.)
//
//  **Capacity** turns a memory leak into a cache. Real caches evict by
//  least-recently-used; this one evicts the nearest to expiry, which is
//  simpler and adequate here. `IMemoryCache` gives you `SizeLimit` plus
//  eviction callbacks and is what you would use rather than writing this.
//
//  Expiry uses `>` not `>=`, so an entry survives exactly to its deadline —
//  the same boundary decision as module 21/02, and the reason the clock is
//  injected: a 5-minute TTL is tested in microseconds.
//
//  One honest caveat: `TryGet` removes expired entries as a side effect of a
//  read, which module 21/02 warned against. Here it is deliberate and
//  documented — it keeps expired entries from occupying capacity — but it
//  does mean `Count` can change without a write.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Collections.Concurrent;

// ──────────────────────────── tests ──────────────────────────────────────

Test("a miss calls the loader and returns its value", async () =>
{
    var clock = new FakeClock();
    var cache = new Cache(clock);
    var calls = 0;

    var value = await cache.GetOrLoad("a", async () => { calls++; await Task.Yield(); return "A"; },
                                      TimeSpan.FromMinutes(5));

    Eq(value, "A");
    Eq(calls, 1);
});

Test("a hit does NOT call the loader again", async () =>
{
    var clock = new FakeClock();
    var cache = new Cache(clock);
    var calls = 0;
    Task<string> Load() { calls++; return Task.FromResult("A"); }

    await cache.GetOrLoad("a", Load, TimeSpan.FromMinutes(5));
    await cache.GetOrLoad("a", Load, TimeSpan.FromMinutes(5));

    Eq(calls, 1);
});

Test("different keys are cached independently", async () =>
{
    var cache = new Cache(new FakeClock());

    Eq(await cache.GetOrLoad("a", () => Task.FromResult("A"), TimeSpan.FromMinutes(5)), "A");
    Eq(await cache.GetOrLoad("b", () => Task.FromResult("B"), TimeSpan.FromMinutes(5)), "B");
});

Test("an entry survives right up to its expiry", async () =>
{
    var clock = new FakeClock();
    var cache = new Cache(clock);
    var calls = 0;
    Task<string> Load() { calls++; return Task.FromResult("A"); }

    await cache.GetOrLoad("a", Load, TimeSpan.FromMinutes(5));
    clock.Advance(TimeSpan.FromMinutes(5));
    await cache.GetOrLoad("a", Load, TimeSpan.FromMinutes(5));

    Eq(calls, 1);
});

Test("an entry is reloaded once past its expiry", async () =>
{
    var clock = new FakeClock();
    var cache = new Cache(clock);
    var calls = 0;
    Task<string> Load() { calls++; return Task.FromResult("A"); }

    await cache.GetOrLoad("a", Load, TimeSpan.FromMinutes(5));
    clock.Advance(TimeSpan.FromMinutes(5) + TimeSpan.FromTicks(1));
    await cache.GetOrLoad("a", Load, TimeSpan.FromMinutes(5));

    Eq(calls, 2);
});

Test("a null result is cached too — no repeated lookups for a missing key", async () =>
{
    // Negative caching. Without it, every request for a key that does not
    // exist hits the source, forever.
    var cache = new Cache(new FakeClock());
    var calls = 0;
    Task<string?> Load() { calls++; return Task.FromResult<string?>(null); }

    Eq(await cache.GetOrLoad("missing", Load, TimeSpan.FromMinutes(5)), null);
    Eq(await cache.GetOrLoad("missing", Load, TimeSpan.FromMinutes(5)), null);

    Eq(calls, 1);
});

Test("concurrent misses on ONE key load only once — no stampede", async () =>
{
    var cache = new Cache(new FakeClock());
    var calls = 0;

    async Task<string> SlowLoad()
    {
        Interlocked.Increment(ref calls);
        await Task.Delay(50);          // long enough for others to pile in
        return "A";
    }

    var racers = Enumerable.Range(0, 20)
        .Select(_ => cache.GetOrLoad("hot", SlowLoad, TimeSpan.FromMinutes(5)));
    var results = await Task.WhenAll(racers);

    Eq(calls, 1);                      // twenty callers, ONE load
    Ok(results.All(r => r == "A"));
});

Test("a slow load on one key does not block another key", async () =>
{
    // Per-key locking, not one global lock.
    var cache = new Cache(new FakeClock());

    var slow = cache.GetOrLoad("slow", async () => { await Task.Delay(200); return "S"; },
                               TimeSpan.FromMinutes(5));
    var fast = cache.GetOrLoad("fast", () => Task.FromResult("F"), TimeSpan.FromMinutes(5));

    // The fast key completes without waiting for the slow one.
    Eq(await fast, "F");
    Eq(await slow, "S");
});

Test("Invalidate forces the next call to reload", async () =>
{
    var cache = new Cache(new FakeClock());
    var calls = 0;
    Task<string> Load() { calls++; return Task.FromResult("A"); }

    await cache.GetOrLoad("a", Load, TimeSpan.FromMinutes(5));
    cache.Invalidate("a");
    await cache.GetOrLoad("a", Load, TimeSpan.FromMinutes(5));

    Eq(calls, 2);
});

Test("the cache does not grow without bound", async () =>
{
    // Capacity 3: adding a fourth key evicts the oldest.
    var cache = new Cache(new FakeClock(), capacity: 3);

    foreach (var key in new[] { "a", "b", "c", "d" })
        await cache.GetOrLoad(key, () => Task.FromResult(key), TimeSpan.FromMinutes(5));

    Ok(cache.Count <= 3, $"expected at most 3 entries, got {cache.Count}");
});

// ──────────────────────────── types ──────────────────────────────────────

public class FakeClock : TimeProvider
{
    private DateTimeOffset _now = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
    public override DateTimeOffset GetUtcNow() => _now;
    public void Advance(TimeSpan by) => _now += by;
}

// A cache-aside cache with per-key locking, expiry, negative caching and a
// capacity bound.
public class Cache(TimeProvider clock, int capacity = 1024)
{
    private readonly ConcurrentDictionary<string, Entry> _entries = new();
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _gates = new();

    public int Count => _entries.Count;

    public async Task<string?> GetOrLoad(string key, Func<Task<string?>> load, TimeSpan ttl)
    {
        // 1. Cheap check with no locking at all.
        if (TryGet(key, out var hit)) return hit;

        // 2. One gate PER KEY, so a slow load blocks only its own key.
        var gate = _gates.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync();
        try
        {
            // 3. Check AGAIN: whoever held the gate has probably stored it.
            //    This is what turns a stampede into a single load.
            if (TryGet(key, out hit)) return hit;

            var value = await load();
            Store(key, value, ttl);      // null is stored too — negative caching
            return value;
        }
        finally
        {
            gate.Release();
        }
    }

    public void Invalidate(string key) => _entries.TryRemove(key, out _);

    private bool TryGet(string key, out string? value)
    {
        value = null;
        if (!_entries.TryGetValue(key, out var entry)) return false;

        // `>` not `>=`: an entry survives exactly to its deadline.
        if (clock.GetUtcNow() > entry.ExpiresAt)
        {
            _entries.TryRemove(key, out _);
            return false;
        }

        value = entry.Value;
        return true;
    }

    private void Store(string key, string? value, TimeSpan ttl)
    {
        _entries[key] = new Entry(value, clock.GetUtcNow() + ttl);

        // Bounded, or it is a memory leak with good branding.
        while (_entries.Count > capacity)
        {
            var evict = _entries.OrderBy(kv => kv.Value.ExpiresAt).FirstOrDefault();
            if (evict.Key is null) break;
            _entries.TryRemove(evict.Key, out _);
        }
    }

    private record Entry(string? Value, DateTimeOffset ExpiresAt);
}
