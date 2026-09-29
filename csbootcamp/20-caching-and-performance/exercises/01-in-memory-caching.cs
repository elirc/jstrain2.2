// ─────────────────────────────────────────────────────────────────────────
//  01 · in-memory caching                                 ★★☆ core
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
//  hint: one lock per key, not one lock for the whole cache — otherwise a
//        slow load for key A blocks every unrelated key
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
    public int Count => throw new NotImplementedException();

    public Task<string?> GetOrLoad(string key, Func<Task<string?>> load, TimeSpan ttl)
        => throw new NotImplementedException();

    public void Invalidate(string key) => throw new NotImplementedException();
}
