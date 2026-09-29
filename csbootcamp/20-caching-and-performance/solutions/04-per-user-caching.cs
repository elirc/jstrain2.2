// ─────────────────────────────────────────────────────────────────────────
//  04 · per-user caching — SOLUTION                       ★★★ stretch
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
//  Walkthrough:
//  Four methods, and three of them are one line. The design is `KeyFor`.
//
//  **The key must contain every input the response varies on.** Drop the user
//  from it and every test in this file still passes except the second one —
//  and in production, bob sees ada's dashboard. That failure looks like the
//  cache working: fast, consistent, and completely wrong. It is the same bug
//  as module 25/02's singleton holding per-request state, reached from a
//  different direction, and it is one of the few caching bugs that is a
//  security incident rather than a performance one.
//
//  Things that belong in a key and get forgotten: the user, the tenant, the
//  language, the API version, the permissions the response was rendered
//  under, and the query parameters that actually change the answer.
//
//  **The key is a FUNCTION, not string concatenation at the call site.** That
//  is what makes `InvalidateUser` possible: the write path can rebuild
//  exactly the key the read path used. Scatter `"dashboard|" + user` across
//  six files and one of them will use a different separator, and then
//  "restart the pods to clear the cache" becomes a real operational
//  procedure — which is a sentence people genuinely say.
//
//  **Two honest invalidation strategies**, and this file has both. Explicit
//  removal on write is precise and requires you to know every key a change
//  affects. `Clear()` is blunt, correct, and briefly expensive — fine after a
//  deployment or a schema change, terrible on every write.
//
//  What is NOT an honest strategy: a long TTL and hope. The seventh test
//  makes the trade visible — within the TTL, the cache wins even though the
//  loader would now answer differently. That is the deal you signed; the only
//  question is whether the staleness window is one you can defend to whoever
//  reports the bug.
//
//  **`TryGetValue` rather than `GetOrCreate`.** Two reasons: it is explicit
//  about the miss path, and `GetOrCreate` is not atomic — twenty concurrent
//  misses all run the factory (capstone 23/03 is the long version). At this
//  scale it does not matter; the habit does.
//
//  Note the null-forgiving `!` after `TryGetValue` returns true. That is one
//  of the rare places it is honest: the overload has no `[NotNullWhen]`
//  because a cached value legitimately can be null, and we have decided ours
//  never is.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.Caching.Memory;

// "dashboard|{user}" — one place, so the write path can rebuild it.
// ONE place. The write path rebuilds the key by calling the same function,
// which is the entire reason invalidation is possible at all.
string KeyFor(string user) => "dashboard|" + user;

// The user's dashboard, from cache when possible. On a miss, call `load`
// and cache the result for 5 minutes.
string Dashboard(IMemoryCache cache, string user, Func<string, string> load)
{
    var key = KeyFor(user);

    if (cache.TryGetValue(key, out string? cached)) return cached!;

    var value = load(user);
    cache.Set(key, value, TimeSpan.FromMinutes(5));

    return value;
}

// This user's data changed: drop just their entry.
// Precise, and possible only because the key is derivable.
void InvalidateUser(IMemoryCache cache, string user) => cache.Remove(KeyFor(user));

// Everything changed (a deployment, a schema change): drop the lot.
// A MemoryCache can be cleared with Clear().
// Blunt, correct, briefly expensive. For a deployment, not for a write.
void InvalidateEveryone(MemoryCache cache) => cache.Clear();

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
