# 28 · HTTP Client Resilience

Calling another service means deciding what happens when it fails. The naive
answer — retry three times — makes a real outage **worse**, because every
caller is now sending three requests instead of one, each waiting for a
timeout first.

## The mental model

**1. Retry only what might succeed next time.**

| Status | Retry? |
| --- | --- |
| 408, 429, 5xx, network errors | **yes** — transient |
| 400, 401, 403, 404, 422 | **no** — your fault; retrying is just latency |

**2. Retry only what is SAFE to repeat.**

`GET`, `PUT`, `DELETE`, `HEAD` are idempotent — twice has the same effect as
once. **`POST` is not.** A 503 on a POST does not mean it failed; it may have
succeeded and the *response* was lost. Retrying creates a second order.

To retry a POST safely, make it idempotent server-side: the client sends an
idempotency key, the server returns the original result for a repeat. That is
a server design, not a client policy.

**3. Back off exponentially, and add jitter.**

```
100ms → 200ms → 400ms, each ± a random 0–50ms
```

Backoff gives a struggling service room. **Jitter** stops every client that
failed during the same outage retrying at the same instant — a synchronised
spike that knocks the service over again just as it recovers. Same shape as
the cache stampede (module 20/01).

**4. A circuit breaker handles what retry cannot.**

| State | Behaviour |
| --- | --- |
| **closed** | normal; count **consecutive** failures |
| **open** | fail instantly — no call, no timeout wait, no load |
| **half-open** | after a cooldown, allow **one** probe |

A success closes it. A failed probe re-opens it immediately **and restarts
the cooldown**. Letting exactly one request through is what stops the whole
herd rushing back the moment the cooldown expires.

**5. They compose, in this order.**

The breaker sits **outside** the retry, so a burst of retries counts as the
failures it exists to notice. Retry handles a blip; the breaker handles an
outage.

## The details that bite

1. **`HttpRequestMessage` cannot be sent twice.** The second send throws
   `InvalidOperationException` — a confusing error the first time you write a
   retry loop. Clone per attempt.

2. **Count *consecutive* failures.** Three failures across an hour of healthy
   traffic is not an outage; three in a row is. A success resets the count.

3. **Don't translate the underlying exception.** While closed, the caller
   should see the real error. `CircuitOpenException` means something
   different — "I did not even try".

4. **A failed probe must restart the cooldown**, or a permanently dead
   service gets probed continuously.

5. **Honour `Retry-After`** on 429 and 503 when it is present. A fixed
   backoff policy will not do this for you, and the server is telling you the
   answer.

6. **Always set a timeout.** A retry policy on a request that hangs forever
   just multiplies the hang.

## In a real app

Use `Microsoft.Extensions.Http.Resilience` (or Polly) rather than hand-rolling:

```csharp
builder.Services.AddHttpClient<CatalogClient>()
       .AddStandardResilienceHandler();   // retry + breaker + timeout + limiter
```

And use `IHttpClientFactory` — `new HttpClient()` per call exhausts sockets,
while one static instance never notices DNS changes.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-retry-and-backoff.cs` | ★★★ | which failures to retry, which verbs, and why jitter matters |
| 02 | `02-circuit-breaker.cs` | ★★★ | closed → open → half-open, with an injected clock |

Do them in order. **01's POST test** is the one that changes how you write
clients — a retry policy that ignores the verb quietly duplicates orders.

---

**Stuck?** `cheatsheets/async.md` (cancellation, timeouts) · **Self-check:** `quizzes/12-async-await.md` · **Next:** `csbootcamp/29-write-the-test`
