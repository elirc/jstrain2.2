// ─────────────────────────────────────────────────────────────────────────
//  05 · the distributed cache                             ★★☆ core
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
//  hint: `AddDistributedMemoryCache()` registers an in-process implementation
//        of the DISTRIBUTED interface — perfect for tests, and a real trap in
//        production if you forget to swap it
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
    throw new NotImplementedException();
}

// Store `profile` as JSON under `key`, for 5 minutes absolute.
Task Save(IDistributedCache cache, string key, Profile profile)
{
    throw new NotImplementedException();
}

// Read it back, or null when there is nothing there.
Task<Profile?> Load(IDistributedCache cache, string key)
{
    throw new NotImplementedException();
}

// Cache-aside over the distributed cache: return the cached profile, or call
// `load`, store the result, and return it.
Task<Profile> GetOrAdd(IDistributedCache cache, string key, Func<Profile> load)
{
    throw new NotImplementedException();
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
