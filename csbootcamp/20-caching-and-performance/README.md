# 20 · Caching and Performance

Caching is the highest-leverage performance work available and the easiest to
get subtly wrong. Two layers matter for a web API: what you keep **in
process**, and what you let **clients and proxies** keep.

## The mental model

**1. Cache-aside is four lines and three traps.**

```csharp
if (cache.TryGet(key, out var hit)) return hit;
var value = await LoadExpensively(key);
cache.Set(key, value, ttl);
return value;
```

| Trap | What happens | Fix |
| --- | --- | --- |
| **Stampede** | on expiry, every concurrent request misses and loads | per-key lock + **double-check** |
| **No negative caching** | every lookup for a missing key hits the source forever | cache the null too (shorter TTL) |
| **Unbounded growth** | a memory leak with good branding | a capacity limit and eviction |

The double-check is what makes locking work: nineteen queued callers find the
value the first one stored and return without loading. Without it you have
merely *serialised* the stampede.

**2. One lock per key, never one for the cache.**

A single global lock makes a slow load for one key block every unrelated
key — a bottleneck under exactly the load the cache exists to relieve.

**3. The cheapest response is the one you do not send.**

```
GET /items/1                       → 200, ETag: "abc"
GET /items/1  If-None-Match: "abc" → 304, no body
```

Derive the ETag from the **content** (a hash) and it cannot go stale by
someone forgetting to bump a version.

**4. `Cache-Control` is a security setting, not just a performance one.**

| Directive | Who may store it |
| --- | --- |
| `no-store` | nobody — credentials, tokens, personal data |
| `no-cache` | store, but revalidate before every use |
| `private, max-age=60` | the end user's browser only |
| `public, max-age=60` | **shared proxies and CDNs too** |

Put `public` on a per-user response and a CDN will serve one user's data to
another. That is module 19's IDOR by another mechanism, and harder to spot
because your code is correct. **Default to `private`; justify `public`.**

## The details that bite

1. **ETags must be quoted.** `"abc"`, not `abc`. `If-None-Match` echoes the
   value verbatim, so an unquoted tag never matches — you serve 200s forever
   and nothing looks broken.

2. **A 304 must have no body.** That is the entire saving.

3. **Cache the negative result**, or a scraper hitting missing keys bypasses
   your cache completely. Give it a shorter TTL so new records appear soon.

4. **Expiry boundary: `>` or `>=`?** Decide deliberately and test both sides
   — with an injected clock (module 21/02) it costs nothing.

5. **Invalidation is the hard part.** A TTL is a promise about staleness; if
   you cannot tolerate any, you need explicit invalidation on write, and then
   you own the correctness problem.

6. **Do not cache before you measure.** A cache adds a coherence problem to
   every read. Earn it.

## In a real app

| Need | Use |
| --- | --- |
| In-process cache | `IMemoryCache` (`SizeLimit`, eviction callbacks) |
| Shared across instances | `IDistributedCache` (Redis) |
| Whole-response, server side | `app.UseOutputCache()` + `[OutputCache]` |
| Client-facing headers | `UseResponseCaching`, or set them yourself |
| Avoid the stampede | `HybridCache` (.NET 9+) — it does the double-check for you |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-in-memory-caching.cs` | ★★☆ | cache-aside with per-key locking, negative caching, a capacity bound |
| 02 | `02-http-caching.cs` | ★★★ | ETags, 304s, and `Cache-Control` as an access-control decision |
| 03 | `03-expiration-and-eviction.cs` | ★★☆ | absolute vs sliding, size limits, eviction reasons |
| 04 | `04-per-user-caching.cs` | ★★★ | the cache key as a design, and invalidation that works |
| 05 | `05-distributed-cache.cs` | ★★☆ | bytes, no object identity, and every call is I/O |
| 06 | `06-output-caching.cs` | ★★★ | caching the whole response, and what must never be cached |

**04 and 06 are the two caching bugs that are security incidents rather than
performance problems.** A key that omits the user serves one customer’s
dashboard to another; `.CacheOutput()` on an authenticated endpoint does the
same thing one layer up. Both look exactly like the cache working.

**03 is the boring one that prevents the outage**: a cache with no bound is a
memory leak, and sliding expiration alone never expires a hot key.

Do them in order. **01's stampede test** fires twenty concurrent callers at
one cold key and asserts the loader ran exactly once — the property that
separates a real cache from a hopeful one.

---

**Stuck?** `cheatsheets/aspnetcore-api.md` (status codes, headers) · **Self-check:** `quizzes/07-middleware-and-pipeline.md` · **Next:** `csbootcamp/21-testing-web-apps`
