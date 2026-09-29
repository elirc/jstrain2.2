// ─────────────────────────────────────────────────────────────────────────
//  01 · retry and backoff — SOLUTION                      ★★★ stretch
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
//  Walkthrough:
//  Three decisions, and each has a test that fails if you skip it.
//
//  **Is it worth retrying?** A 404 will still be a 404 in two seconds. So
//  will a 400 or a 401. Retrying them adds latency and load and changes
//  nothing — the two "not retried" tests assert exactly one call. Only
//  408/429/5xx and network exceptions get another attempt.
//
//  **Is it SAFE to retry?** This is the one people miss. A 503 on a POST
//  does not mean the request failed — it may have succeeded and the
//  *response* was lost. Retrying creates a second order. GET, PUT, DELETE
//  and HEAD are idempotent by definition, so repeating them is harmless;
//  POST and PATCH are not. Hence `IsIdempotent`, and the POST test asserting
//  a single call.
//
//  (If you must retry a POST, make it idempotent yourself: have the client
//  send an idempotency key and have the server return the original result
//  for a repeat. That is a server-side design, not a client-side retry
//  policy.)
//
//  **How long to wait?** Exponential backoff — 100ms, 200ms, 400ms — gives a
//  struggling service room to recover instead of hammering it. And the
//  **jitter** is not a nicety: without it, every client that failed during
//  the same outage retries at the same instant, producing a synchronised
//  spike that knocks the service over again just as it comes back. The last
//  test runs the same scenario eight times and requires the delays to
//  differ.
//
//  Note the request is **cloned** per attempt. `HttpRequestMessage` cannot be
//  sent twice — the second send throws `InvalidOperationException` — which
//  is a genuinely confusing error the first time you write a retry loop.
//
//  In production, use `Microsoft.Extensions.Http.Resilience` (or Polly)
//  rather than hand-rolling: `AddStandardResilienceHandler()` gives you
//  retry, circuit breaker, timeout and rate limiting, correctly composed.
//  This is what it is doing, so you can tell when its defaults are wrong for
//  you — and honouring a `Retry-After` header, which a fixed policy will not
//  do for you, beats guessing.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Net;

// Send the request, retrying transient failures up to `maxAttempts` total.
// Records each backoff delay in `delays` instead of sleeping.
async Task<HttpResponseMessage> SendWithRetry(
    HttpClient client, HttpRequestMessage request, int maxAttempts, List<TimeSpan> delays)
{
    var retryable = IsIdempotent(request.Method);

    for (var attempt = 1; ; attempt++)
    {
        try
        {
            // A request message cannot be sent twice — clone per attempt.
            var response = await client.SendAsync(Clone(request));

            if (!retryable || !IsTransient(response.StatusCode) || attempt >= maxAttempts)
                return response;
        }
        catch (HttpRequestException) when (retryable && attempt < maxAttempts)
        {
            // Transient network failure: fall through to the backoff below.
            // The filter means a final attempt, or a non-idempotent verb,
            // rethrows with its original stack intact (module 07/01).
        }

        var delay = Backoff(attempt);
        delays.Add(delay);
        // A real client would `await Task.Delay(delay)` here; the tests
        // record it instead so they run instantly.
    }
}

// Safe to repeat: doing it twice has the same effect as once.
static bool IsIdempotent(HttpMethod method)
    => method == HttpMethod.Get || method == HttpMethod.Put
    || method == HttpMethod.Delete || method == HttpMethod.Head;

// Might succeed next time. A 404 will not.
static bool IsTransient(HttpStatusCode status)
    => status == HttpStatusCode.RequestTimeout
    || status == HttpStatusCode.TooManyRequests
    || (int)status >= 500;

// Exponential, plus JITTER so clients that failed together do not retry
// together and re-flatten the service.
static TimeSpan Backoff(int attempt)
{
    var baseMs = 100 * Math.Pow(2, attempt - 1);
    return TimeSpan.FromMilliseconds(baseMs + Random.Shared.Next(0, 51));
}

static HttpRequestMessage Clone(HttpRequestMessage request)
    => new(request.Method, request.RequestUri) { Content = request.Content };

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
