// ─────────────────────────────────────────────────────────────────────────
//  04 · per-user caching                                  ★★★ stretch
//  concepts: cache keys · the shared-response leak · invalidation
//  run: dotnet run 04-per-user-caching.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  The most damaging caching bug is not a stale value. It is a **cache key
//  that does not include everything the response depends on** — because then
//  one user's data is served to another, and it looks exactly like the cache
//  working.
//
//      cache["/dashboard"]              wrong: whose dashboard?
//      cache["/dashboard|ada"]          right
//
//  The rule: **the key must contain every input the response varies on.**
//  The path, the query string that matters, the user, the tenant, the
//  language, the API version. If it is not in the key, it is not in the
//  cache's model of the world, and the cache will happily reuse across it.
//
//  Then invalidation. There are two honest strategies:
//
//   · **Short TTLs** — accept staleness, evict by time. Simple, and enough
//     for most things.
//   · **Explicit removal on write** — the write path knows exactly which
//     keys it invalidated, because you made the keys derivable.
//
//  A key format nobody can reconstruct is a cache you can never invalidate,
//  which is why the key builder is a function rather than string
//  concatenation scattered at every call site.
//
//  hint: build the key in one place and invalidate through the same
//        function — that is the whole design
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.Caching.Memory;

// "dashboard|{user}" — one place, so the write path can rebuild it.
string KeyFor(string user)
{
    throw new NotImplementedException();
}

// The user's dashboard, from cache when possible. On a miss, call `load`
// and cache the result for 5 minutes.
string Dashboard(IMemoryCache cache, string user, Func<string, string> load)
{
    throw new NotImplementedException();
}

// This user's data changed: drop just their entry.
void InvalidateUser(IMemoryCache cache, string user)
{
    throw new NotImplementedException();
}

// Everything changed (a deployment, a schema change): drop the lot.
// A MemoryCache can be cleared with Clear().
void InvalidateEveryone(MemoryCache cache)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a miss loads and a hit does not", () =>
{
    using var cache = new MemoryCache(new MemoryCacheOptions());
    var loads = 0;

    string Load(string user) { loads++; return user + "'s dashboard"; }

    Eq(Dashboard(cache, "ada", Load), "ada's dashboard");
    Eq(Dashboard(cache, "ada", Load), "ada's dashboard");
    Eq(loads, 1);
});

Test("two users get two entries, not one shared one", () =>
{
    // The bug this exercise exists for. With a key of just "dashboard",
    // bob sees ada's page and every test still passes except this one.
    using var cache = new MemoryCache(new MemoryCacheOptions());

    Eq(Dashboard(cache, "ada", u => u + "'s dashboard"), "ada's dashboard");
    Eq(Dashboard(cache, "bob", u => u + "'s dashboard"), "bob's dashboard");
});

Test("bob's request never triggers a load for ada", () =>
{
    using var cache = new MemoryCache(new MemoryCacheOptions());
    var loaded = new List<string>();

    string Load(string user) { loaded.Add(user); return user + "!"; }

    Dashboard(cache, "ada", Load);
    Dashboard(cache, "bob", Load);
    Dashboard(cache, "ada", Load);

    Eq(loaded, new[] { "ada", "bob" });
});

Test("invalidating one user leaves the others alone", () =>
{
    using var cache = new MemoryCache(new MemoryCacheOptions());
    var loads = 0;

    string Load(string user) { loads++; return user + "!"; }

    Dashboard(cache, "ada", Load);
    Dashboard(cache, "bob", Load);
    Eq(loads, 2);

    InvalidateUser(cache, "ada");

    Dashboard(cache, "bob", Load);      // still cached
    Eq(loads, 2);

    Dashboard(cache, "ada", Load);      // reloaded
    Eq(loads, 3);
});

Test("the key is derivable, which is what makes invalidation possible", () =>
{
    // If the write path cannot rebuild the key, it cannot clear it — and
    // "we restart the pods to clear the cache" becomes a real procedure.
    Eq(KeyFor("ada"), "dashboard|ada");
    Eq(KeyFor("bob"), "dashboard|bob");
});

Test("clearing everything is a blunt instrument that works", () =>
{
    using var cache = new MemoryCache(new MemoryCacheOptions());
    var loads = 0;

    string Load(string user) { loads++; return user + "!"; }

    Dashboard(cache, "ada", Load);
    Dashboard(cache, "bob", Load);
    Eq(loads, 2);

    InvalidateEveryone(cache);

    Dashboard(cache, "ada", Load);
    Dashboard(cache, "bob", Load);
    Eq(loads, 4);
});

Test("a cached entry survives a fresh loader that would answer differently", () =>
{
    // The staleness trade, made visible: within the TTL, the cache wins.
    using var cache = new MemoryCache(new MemoryCacheOptions());

    Eq(Dashboard(cache, "ada", _ => "old"), "old");
    Eq(Dashboard(cache, "ada", _ => "new"), "old");

    InvalidateUser(cache, "ada");

    Eq(Dashboard(cache, "ada", _ => "new"), "new");
});

Test("invalidating a user who was never cached is harmless", () =>
{
    using var cache = new MemoryCache(new MemoryCacheOptions());

    InvalidateUser(cache, "nobody");

    Eq(Dashboard(cache, "nobody", u => u + "!"), "nobody!");
});
