// ─────────────────────────────────────────────────────────────────────────
//  05 · the distributed cache — SOLUTION                  ★★☆ core
//  concepts: IDistributedCache · serialization · no object identity
//  run: dotnet run 05-distributed-cache.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `IMemoryCache` holds object references in this process. `IDistributedCache`
//  holds **bytes**, somewhere else — Redis, SQL Server, another machine. The
//  interface is deliberately small and the differences are the whole lesson:
//
//   1. **Bytes only.** Everything is serialised on the way in and
//      deserialised on the way out. You choose the format and pay for it on
//      every hit.
//   2. **No object identity.** What comes back is a NEW object with equal
//      contents. Mutating it changes nothing; `ReferenceEquals` is false.
//      With `IMemoryCache` the opposite is true, and code that relied on
//      that quietly breaks when someone swaps the implementation.
//   3. **Every call is I/O.** `Get` is a network round trip, so it is async,
//      it can fail, and it can be slower than recomputing a cheap value.
//   4. **No sliding-only entries that live forever**, and no eviction
//      callbacks — the cache is not in your process and does not call you
//      back.
//
//  The reason to accept all that: several instances share one cache, so a
//  deploy does not cold-start every node, and one node's work helps the rest.
//
//  Walkthrough:
//  Four methods, and every one of them exists because the interface only
//  speaks bytes.
//
//  **Serialisation is yours, and it is not free.** `SetStringAsync` plus
//  `JsonSerializer` is the ordinary choice; every hit costs a serialise or a
//  deserialise on top of the network round trip. That is the trade: a
//  distributed cache is slower per hit than an in-process one and shared
//  across every instance, so it is worth it for expensive values and a bad
//  deal for cheap ones. Caching an integer in Redis is slower than computing
//  it.
//
//  **No object identity, and this is the part that breaks working code.** The
//  fourth and fifth tests make it concrete: what comes back is a new object,
//  and mutating it changes nothing anywhere. With `IMemoryCache` the cached
//  object IS the object you stored, so `cached.Roles.Add(...)` silently
//  edits what every other caller sees. Swap the implementation behind the
//  same-looking API and that code changes meaning without changing shape.
//
//  Which is an argument for storing immutable values in either cache: then
//  the two implementations behave identically and nothing depends on which
//  one is wired up.
//
//  **Every call is I/O**, so the whole interface is async and every call can
//  fail. A cache that is down should degrade to a miss, not an error — in
//  real code `Load` would catch and return null rather than letting a Redis
//  timeout become a 500. The one thing worse than an uncached request is an
//  uncached request that also fails.
//
//  **`AddDistributedMemoryCache()` is the sharp edge.** It implements the
//  distributed INTERFACE with an in-process dictionary — ideal for tests and
//  local development, and silently per-instance if it reaches production.
//  Everything appears to work; the hit rate is just mysteriously bad and each
//  node warms its own copy. Register the real one explicitly per environment
//  rather than letting the fallback be the default.
//
//  **`GetOrAdd` here is deliberately not stampede-safe.** A lock would only
//  cover this process, and the point of a shared cache is that there are
//  several — so the honest answers are a short TTL, a per-key lock in
//  whichever store you are using, or accepting the duplicate work. Capstone
//  23/03 solves the single-process version; the distributed one is a
//  genuinely harder problem and it is worth knowing that this line does not
//  solve it.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;

// A provider with a distributed cache registered.
ServiceProvider BuildProvider()
{
    var services = new ServiceCollection();

    // The distributed INTERFACE, backed by an in-process dictionary. Fine
    // here; a per-instance cache pretending to be shared in production.
    services.AddDistributedMemoryCache();

    return services.BuildServiceProvider();
}

// Store `profile` as JSON under `key`, for 5 minutes absolute.
// Bytes only, so we choose the format and pay for it on every write.
Task Save(IDistributedCache cache, string key, Profile profile) =>
    cache.SetStringAsync(key, JsonSerializer.Serialize(profile),
        new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
        });

// Read it back, or null when there is nothing there.
async Task<Profile?> Load(IDistributedCache cache, string key)
{
    // A real implementation would catch here and return null: a cache that
    // is down should degrade to a miss, not to a 500.
    var json = await cache.GetStringAsync(key);

    return json is null ? null : JsonSerializer.Deserialize<Profile>(json);
}

// Cache-aside over the distributed cache: return the cached profile, or call
// `load`, store the result, and return it.
async Task<Profile> GetOrAdd(IDistributedCache cache, string key, Func<Profile> load)
{
    // Not stampede-safe, and deliberately so: a lock here would only cover
    // this process, and the whole point is that there are several.
    if (await Load(cache, key) is { } cached) return cached;

    var value = load();
    await Save(cache, key, value);

    return value;
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a value round-trips", async () =>
{
    using var provider = BuildProvider();
    var cache = provider.GetRequiredService<IDistributedCache>();

    await Save(cache, "ada", new Profile("ada", 36, ["admin"]));

    Eq((await Load(cache, "ada"))!.Name, "ada");
});

Test("a missing key is null, not an exception", async () =>
{
    using var provider = BuildProvider();
    var cache = provider.GetRequiredService<IDistributedCache>();

    Eq(await Load(cache, "nobody"), null);
});

Test("nested data survives the round trip", async () =>
{
    using var provider = BuildProvider();
    var cache = provider.GetRequiredService<IDistributedCache>();

    await Save(cache, "ada", new Profile("ada", 36, ["admin", "billing"]));

    Eq((await Load(cache, "ada"))!.Roles, new[] { "admin", "billing" });
});

Test("what comes back is a DIFFERENT object", async () =>
{
    // The difference from IMemoryCache that breaks code silently. Anything
    // that mutated a cached object and expected the change to stick was
    // relying on shared references.
    using var provider = BuildProvider();
    var cache = provider.GetRequiredService<IDistributedCache>();
    var original = new Profile("ada", 36, ["admin"]);

    await Save(cache, "ada", original);
    var loaded = await Load(cache, "ada");

    Ok(!ReferenceEquals(original, loaded), "it went through bytes, so it cannot be the same object");
    Eq(loaded!.Name, original.Name, "...but the CONTENTS came back intact");
    Eq(loaded.Roles, original.Roles);
});

Test("mutating the loaded copy does not change the cache", async () =>
{
    using var provider = BuildProvider();
    var cache = provider.GetRequiredService<IDistributedCache>();

    await Save(cache, "ada", new Profile("ada", 36, ["admin"]));

    var loaded = (await Load(cache, "ada"))!;
    loaded.Roles.Add("superuser");

    Eq((await Load(cache, "ada"))!.Roles.Count, 1, "the cache still holds the bytes we wrote");
});

Test("cache-aside loads once", async () =>
{
    using var provider = BuildProvider();
    var cache = provider.GetRequiredService<IDistributedCache>();
    var loads = 0;

    Profile Load() { loads++; return new Profile("ada", 36, []); }

    await GetOrAdd(cache, "ada", Load);
    await GetOrAdd(cache, "ada", Load);
    await GetOrAdd(cache, "ada", Load);

    Eq(loads, 1);
});

Test("cache-aside returns the right value on both paths", async () =>
{
    using var provider = BuildProvider();
    var cache = provider.GetRequiredService<IDistributedCache>();

    var first = await GetOrAdd(cache, "ada", () => new Profile("ada", 36, ["admin"]));
    var second = await GetOrAdd(cache, "ada", () => throw new InvalidOperationException("should not load"));

    Eq(first.Name, second.Name);
    Eq(first.Roles, second.Roles);
    Eq(second.Name, "ada");
});

Test("different keys do not collide", async () =>
{
    using var provider = BuildProvider();
    var cache = provider.GetRequiredService<IDistributedCache>();

    await Save(cache, "ada", new Profile("ada", 36, []));
    await Save(cache, "bob", new Profile("bob", 41, []));

    Eq((await Load(cache, "ada"))!.Age, 36);
    Eq((await Load(cache, "bob"))!.Age, 41);
});

Test("removing a key empties it", async () =>
{
    using var provider = BuildProvider();
    var cache = provider.GetRequiredService<IDistributedCache>();

    await Save(cache, "ada", new Profile("ada", 36, []));
    await cache.RemoveAsync("ada");

    Eq(await Load(cache, "ada"), null);
});

// ──────────────────────────── types ──────────────────────────────────────

// A record — but note that its generated Equals compares the List by
// REFERENCE, so two round-tripped profiles are never `==` even with identical
// contents. That is module 05/05's lesson showing up in practice, and it is
// why the tests above compare the members rather than the objects.
public sealed record Profile(string Name, int Age, List<string> Roles);
