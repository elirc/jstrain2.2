// ─────────────────────────────────────────────────────────────────────────
//  01 · retry and backoff                                 ★★★ stretch
//  concepts: which failures to retry · exponential backoff · jitter
//  run: dotnet run 01-retry-and-backoff.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Calling another service means deciding what to do when it fails, and the
//  naive answer — retry three times immediately — makes things worse.
//
//  **Retry only what might succeed next time.**
//
//      408, 429, 5xx, network errors   transient → retry
//      400, 401, 403, 404, 422         your fault → retrying is just latency
//
//  **Retry only what is SAFE to repeat.** GET, PUT and DELETE are
//  idempotent: doing them twice has the same effect as once. POST is not —
//  a retried "create order" can create two.
//
//  **Back off exponentially, and add jitter.** Without backoff you hammer a
//  service that is already struggling. Without jitter, every client that
//  failed at the same moment retries at the same moment — a synchronised
//  thundering herd that keeps the service down.
//
//  The delay function is injected so the tests run instantly.
//
//  hint: 429 and 503 may carry a Retry-After header — honouring it beats
//        guessing
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Net;

// Send the request, retrying transient failures up to `maxAttempts` total.
// Records each backoff delay in `delays` instead of sleeping.
async Task<HttpResponseMessage> SendWithRetry(
    HttpClient client, HttpRequestMessage request, int maxAttempts, List<TimeSpan> delays)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a success is returned with no retries", async () =>
{
    var handler = new FakeHandler(HttpStatusCode.OK);
    var delays = new List<TimeSpan>();

    var response = await SendWithRetry(New(handler), Get(), 3, delays);

    Eq((int)response.StatusCode, 200);
    Eq(handler.Calls, 1);
    Eq(delays.Count, 0);
});

Test("a 503 is retried and can succeed", async () =>
{
    var handler = new FakeHandler(HttpStatusCode.ServiceUnavailable,
                                  HttpStatusCode.ServiceUnavailable,
                                  HttpStatusCode.OK);
    var response = await SendWithRetry(New(handler), Get(), 3, []);

    Eq((int)response.StatusCode, 200);
    Eq(handler.Calls, 3);
});

Test("retries stop at maxAttempts and the last failure is returned", async () =>
{
    var handler = new FakeHandler(Enumerable.Repeat(HttpStatusCode.ServiceUnavailable, 9).ToArray());
    var response = await SendWithRetry(New(handler), Get(), 3, []);

    Eq((int)response.StatusCode, 503);
    Eq(handler.Calls, 3);
});

Test("a 404 is NOT retried — it will not become a 200", async () =>
{
    var handler = new FakeHandler(HttpStatusCode.NotFound, HttpStatusCode.OK);
    var response = await SendWithRetry(New(handler), Get(), 3, []);

    Eq((int)response.StatusCode, 404);
    Eq(handler.Calls, 1);           // no pointless second call
});

Test("a 400 is not retried either", async () =>
{
    var handler = new FakeHandler(HttpStatusCode.BadRequest, HttpStatusCode.OK);
    await SendWithRetry(New(handler), Get(), 3, []);

    Eq(handler.Calls, 1);
});

Test("a 429 IS retried", async () =>
{
    var handler = new FakeHandler(HttpStatusCode.TooManyRequests, HttpStatusCode.OK);
    var response = await SendWithRetry(New(handler), Get(), 3, []);

    Eq((int)response.StatusCode, 200);
    Eq(handler.Calls, 2);
});

Test("a network failure is retried", async () =>
{
    var handler = new FakeHandler { ThrowFirst = 2 };
    var response = await SendWithRetry(New(handler), Get(), 3, []);

    Eq((int)response.StatusCode, 200);
    Eq(handler.Calls, 3);
});

Test("a network failure that never clears is rethrown", async () =>
{
    var handler = new FakeHandler { ThrowFirst = 99 };

    await ThrowsAsync<HttpRequestException>(
        () => SendWithRetry(New(handler), Get(), 3, []));

    Eq(handler.Calls, 3);
});

Test("a POST is NOT retried — it is not idempotent", async () =>
{
    // Retrying a create can create two. Only retry safe verbs.
    var handler = new FakeHandler(HttpStatusCode.ServiceUnavailable, HttpStatusCode.OK);
    var request = new HttpRequestMessage(HttpMethod.Post, "/orders");

    var response = await SendWithRetry(New(handler), request, 3, []);

    Eq((int)response.StatusCode, 503);
    Eq(handler.Calls, 1);
});

Test("a PUT IS retried — it is idempotent", async () =>
{
    var handler = new FakeHandler(HttpStatusCode.ServiceUnavailable, HttpStatusCode.OK);
    var request = new HttpRequestMessage(HttpMethod.Put, "/items/1");

    var response = await SendWithRetry(New(handler), request, 3, []);

    Eq((int)response.StatusCode, 200);
    Eq(handler.Calls, 2);
});

Test("delays grow exponentially", async () =>
{
    var handler = new FakeHandler(Enumerable.Repeat(HttpStatusCode.ServiceUnavailable, 9).ToArray());
    var delays = new List<TimeSpan>();

    await SendWithRetry(New(handler), Get(), 4, delays);

    Eq(delays.Count, 3);            // one before each retry
    Ok(delays[1] > delays[0], $"expected growth, got {delays[0]} then {delays[1]}");
    Ok(delays[2] > delays[1]);
});

Test("delays carry jitter, so clients do not synchronise", async () =>
{
    // Identical failures in two clients must NOT produce identical delays,
    // or every client retries at the same instant.
    var runs = new List<TimeSpan>();

    for (var i = 0; i < 8; i++)
    {
        var handler = new FakeHandler(HttpStatusCode.ServiceUnavailable, HttpStatusCode.OK);
        var delays = new List<TimeSpan>();
        await SendWithRetry(New(handler), Get(), 3, delays);
        runs.Add(delays[0]);
    }

    Ok(runs.Distinct().Count() > 1, "every backoff was identical — no jitter");
});

// ──────────────────────────── helpers ────────────────────────────────────

HttpRequestMessage Get() => new(HttpMethod.Get, "/items");

HttpClient New(FakeHandler handler) => new(handler) { BaseAddress = new Uri("http://x") };

// ──────────────────────────── types ──────────────────────────────────────

// Returns the queued statuses in order, repeating the last one forever.
public class FakeHandler : HttpMessageHandler
{
    private readonly HttpStatusCode[] _statuses;

    public FakeHandler(params HttpStatusCode[] statuses)
        => _statuses = statuses.Length > 0 ? statuses : [HttpStatusCode.OK];

    public int Calls { get; private set; }

    // Throw a network-style error for the first N calls.
    public int ThrowFirst { get; init; }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        Calls++;
        if (Calls <= ThrowFirst) throw new HttpRequestException("connection refused");

        var index = Math.Min(Calls - 1, _statuses.Length - 1);
        return Task.FromResult(new HttpResponseMessage(_statuses[index]));
    }
}
