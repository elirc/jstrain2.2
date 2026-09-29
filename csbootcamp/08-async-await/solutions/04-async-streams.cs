// ─────────────────────────────────────────────────────────────────────────
//  04 · async streams — SOLUTION                          ★★☆ core
//  concepts: IAsyncEnumerable · await foreach · streaming vs buffering
//  run: dotnet run 04-async-streams.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `ReadAll` is module 02's deferred iterator with `await` allowed in the
//  body. The loop fetches ONE page, yields its items, and only then asks for
//  the next — because `yield return` suspends the method until the consumer
//  comes back for more. Nothing is buffered.
//
//  That laziness is what the two counting tests are really checking. The
//  "items arrive one at a time" test asserts that after the FIRST item, the
//  producer has not yet fetched all five pages — which is the entire benefit
//  over `Task<List<T>>`: first-byte latency, and memory proportional to a
//  page rather than to the whole result set.
//
//  `FirstN` shows composition. It stops consuming at `count`, and because the
//  producer only advances when pulled, the `await foreach` simply stops
//  asking — so 3 items cost 2 pages, not 10. Note the `break` disposes the
//  enumerator, which runs the producer's `finally` blocks. That is how a
//  streaming database cursor or HTTP response gets closed properly when a
//  consumer walks away early.
//
//  `[EnumeratorCancellation]` is the subtle bit, and it is easy to get
//  wrong. A token passed to `ReadAll(api, token)` works. But
//  `ReadAll(api).WithCancellation(token)` — the natural spelling at the call
//  site — has no way to reach your parameter unless it is marked with that
//  attribute. Leave it off and the code compiles, the token is ignored, and
//  cancellation silently does nothing. The compiler warns (CS8425); believe
//  it.
//
//  `ReadEverything` exists as the contrast: `ToListAsync`-style buffering.
//  Same data, one line shorter, and it waits for everything before producing
//  anything. Reach for it when the result is small and you need it all;
//  stream when it is large, unbounded, or the consumer might stop early.
//
//  In ASP.NET Core, returning `IAsyncEnumerable<T>` from an endpoint streams
//  the JSON array to the client as items are produced.
//  `Task<List<T>>` says "wait for ALL of it, then here is everything".
//  `IAsyncEnumerable<T>` says "here is the next one, as it arrives".
//
//      async IAsyncEnumerable<int> Pages() {
//          for (var p = 1; ; p++) {
//              var page = await FetchPage(p);
//              if (page.Count == 0) yield break;
//              foreach (var item in page) yield return item;
//          }
//      }
//
//      await foreach (var item in Pages()) { … }
//
//  Same `yield return` as module 02's iterators, now with `await` allowed in
//  the body. The payoff is memory and latency: a paged API with 10,000
//  results is processed one page at a time and the first item is usable
//  immediately, instead of buffering all 10,000 first.
//
//  It also composes lazily — `Take(3)` stops the producer after 3.
//
//  Build a paged reader and two consumers.
//
//  hint: `[EnumeratorCancellation]` on the token parameter is what makes
//        `WithCancellation(token)` at the call site actually reach your loop
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Runtime.CompilerServices;

async IAsyncEnumerable<string> ReadAll(
    PagedApi api,
    // Without this attribute, WithCancellation(token) at the call site
    // cannot reach this parameter and is silently ignored.
    [EnumeratorCancellation] CancellationToken token = default)
{
    for (var page = 1; ; page++)
    {
        token.ThrowIfCancellationRequested();

        var items = await api.GetPageAsync(page, token);
        if (items.Count == 0) yield break;      // an empty page ends it

        foreach (var item in items)
        {
            token.ThrowIfCancellationRequested();
            yield return item;                   // suspends until pulled again
        }
    }
}

async Task<List<string>> FirstN(PagedApi api, int count)
{
    var results = new List<string>();
    if (count <= 0) return results;

    await foreach (var item in ReadAll(api))
    {
        results.Add(item);
        // Stop asking; the producer never advances again.
        if (results.Count == count) break;
    }
    return results;
}

async Task<List<string>> ReadEverything(PagedApi api)
{
    // The buffering contrast: nothing is usable until all of it has arrived.
    var results = new List<string>();
    await foreach (var item in ReadAll(api)) results.Add(item);
    return results;
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("it streams every item across every page", async () =>
{
    var api = new PagedApi(pages: 3, perPage: 2);
    Eq(await ReadEverything(api), new[] { "1", "2", "3", "4", "5", "6" });
});

Test("it stops at the empty page", async () =>
{
    var api = new PagedApi(pages: 2, perPage: 2);
    Eq(await ReadEverything(api), new[] { "1", "2", "3", "4" });

    // 2 pages of data + 1 empty page to learn it is over.
    Eq(api.PagesFetched, 3);
});

Test("an empty source yields nothing", async () =>
{
    var api = new PagedApi(pages: 0, perPage: 2);
    Eq(await ReadEverything(api), new List<string>());
});

Test("items arrive one at a time, before the source is exhausted", async () =>
{
    var api = new PagedApi(pages: 5, perPage: 2);
    var seen = new List<string>();

    await foreach (var item in ReadAll(api))
    {
        seen.Add(item);
        if (seen.Count == 1)
            // The whole point: usable output before everything is fetched.
            Ok(api.PagesFetched < 5, $"buffered all {api.PagesFetched} pages first");
    }

    Eq(seen.Count, 10);
});

Test("taking 3 does not fetch every page", async () =>
{
    var api = new PagedApi(pages: 10, perPage: 2);
    Eq(await FirstN(api, 3), new[] { "1", "2", "3" });

    // 2 pages covers 4 items — enough for 3. Not 10.
    Ok(api.PagesFetched <= 2, $"fetched {api.PagesFetched} pages for 3 items");
});

Test("asking for more than exists returns what there is", async () =>
{
    var api = new PagedApi(pages: 2, perPage: 2);
    Eq(await FirstN(api, 99), new[] { "1", "2", "3", "4" });
});

Test("asking for zero fetches nothing", async () =>
{
    var api = new PagedApi(pages: 10, perPage: 2);
    Eq(await FirstN(api, 0), new List<string>());
});

Test("cancellation stops the stream", async () =>
{
    var api = new PagedApi(pages: 50, perPage: 2);
    using var cts = new CancellationTokenSource();
    var seen = 0;

    await ThrowsAsync<OperationCanceledException>(async () =>
    {
        await foreach (var _ in ReadAll(api).WithCancellation(cts.Token))
        {
            if (++seen == 3) await cts.CancelAsync();
        }
    });

    Ok(api.PagesFetched < 50, $"should have stopped early, fetched {api.PagesFetched}");
});

// ──────────────────────────── types ──────────────────────────────────────

// A paged endpoint. Page numbers are 1-based; an out-of-range page comes
// back empty, which is how you learn there is no more.
public class PagedApi(int pages, int perPage)
{
    public int PagesFetched { get; private set; }

    public async Task<List<string>> GetPageAsync(int page, CancellationToken token = default)
    {
        await Task.Delay(5, token);
        PagesFetched++;

        if (page > pages) return [];

        var start = (page - 1) * perPage + 1;
        return [.. Enumerable.Range(start, perPage).Select(n => n.ToString())];
    }
}
