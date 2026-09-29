// ─────────────────────────────────────────────────────────────────────────
//  02 · circuit breaker — SOLUTION                        ★★★ stretch
//  concepts: fail fast · half-open probing · retry storms
//  run: dotnet run 02-circuit-breaker.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Retry (exercise 01) helps with a blip. It makes a real outage WORSE: the
//  dependency is down, and every caller is now sending three requests
//  instead of one, each waiting for a timeout first.
//
//  A circuit breaker notices the pattern and stops trying:
//
//      CLOSED     normal. Count consecutive failures.
//      OPEN       too many failures → fail INSTANTLY without calling.
//                 No timeout wait, no load on the dying service.
//      HALF-OPEN  after a cooldown, allow ONE probe.
//                 It succeeds → close. It fails → open again.
//
//  The half-open state is the important one: it is how the breaker recovers
//  on its own, and letting only *one* request through is what stops the
//  whole herd rushing back the instant the cooldown expires.
//
//  The clock is injected, so cooldowns are tested instantly (module 21/02).
//
//  Walkthrough:
//  `State` is computed rather than stored, which is what makes the
//  transitions correct without a scheduler. Open plus "the cooldown has
//  elapsed" IS half-open — there is no timer to fire and nothing to keep in
//  sync.
//
//  The failure count is **consecutive**. A success while closed resets it to
//  zero, because three failures spread across an hour of healthy traffic is
//  not an outage; three in a row is. Counting failures ever would trip the
//  breaker on a service that is merely imperfect.
//
//  The half-open state is the interesting one. After the cooldown, exactly
//  one call is allowed through as a probe:
//
//    · it succeeds → close, and normal traffic resumes
//    · it fails → open again **immediately**, and restart the cooldown
//
//  That second rule is why a failed probe does not need to reach the
//  threshold again: you already know the service is unwell, and the probe
//  just confirmed it. The "restarts the cooldown" test pins that down —
//  without it, a permanently dead service would be probed continuously once
//  the first cooldown passed.
//
//  Letting only ONE request through is the whole point of half-open. Open
//  the gates fully at the end of the cooldown and every waiting caller
//  arrives at once, re-flattening a service that had just started to
//  recover — the same thundering-herd shape as the missing jitter in
//  exercise 01 and the cache stampede in module 20/01.
//
//  Note the breaker **rethrows the original exception** while closed. It
//  observes failures; it does not translate them. Only when it is open does
//  the caller see a `CircuitOpenException`, and that is a genuinely
//  different fact: "I did not even try."
//
//  Retry and circuit breaking compose, in that order: retry handles a blip,
//  the breaker handles an outage, and the breaker must sit OUTSIDE the retry
//  so a burst of retries counts as the failures it is meant to notice.
//  `AddStandardResilienceHandler()` wires exactly that up for you.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("a healthy call passes straight through", async () =>
{
    var breaker = New(out _);
    Eq(await breaker.Call(() => Task.FromResult("ok")), "ok");
    Eq(breaker.State, "closed");
});

Test("failures below the threshold keep it closed", async () =>
{
    var breaker = New(out _, threshold: 3);

    await Fail(breaker);
    await Fail(breaker);

    Eq(breaker.State, "closed");
});

Test("a success RESETS the consecutive-failure count", async () =>
{
    // A breaker counts consecutive failures, not failures ever.
    var breaker = New(out _, threshold: 3);

    await Fail(breaker);
    await Fail(breaker);
    await breaker.Call(() => Task.FromResult("ok"));
    await Fail(breaker);
    await Fail(breaker);

    Eq(breaker.State, "closed");
});

Test("reaching the threshold opens it", async () =>
{
    var breaker = New(out _, threshold: 3);

    await Fail(breaker);
    await Fail(breaker);
    await Fail(breaker);

    Eq(breaker.State, "open");
});

Test("an open breaker fails INSTANTLY without calling the service", async () =>
{
    var breaker = New(out _, threshold: 2);
    await Fail(breaker);
    await Fail(breaker);

    var called = false;
    await ThrowsAsync<CircuitOpenException>(
        () => breaker.Call(() => { called = true; return Task.FromResult("ok"); }));

    Ok(!called, "an open breaker must not call the service at all");
});

Test("it stays open for the whole cooldown", async () =>
{
    var breaker = New(out var clock, threshold: 2, cooldownSeconds: 30);
    await Fail(breaker);
    await Fail(breaker);

    clock.Advance(TimeSpan.FromSeconds(29));

    await ThrowsAsync<CircuitOpenException>(() => breaker.Call(() => Task.FromResult("ok")));
});

Test("after the cooldown it goes half-open and allows ONE probe", async () =>
{
    var breaker = New(out var clock, threshold: 2, cooldownSeconds: 30);
    await Fail(breaker);
    await Fail(breaker);

    clock.Advance(TimeSpan.FromSeconds(31));

    Eq(await breaker.Call(() => Task.FromResult("recovered")), "recovered");
});

Test("a successful probe closes the breaker", async () =>
{
    var breaker = New(out var clock, threshold: 2, cooldownSeconds: 30);
    await Fail(breaker);
    await Fail(breaker);

    clock.Advance(TimeSpan.FromSeconds(31));
    await breaker.Call(() => Task.FromResult("recovered"));

    Eq(breaker.State, "closed");
});

Test("a FAILED probe opens it again immediately", async () =>
{
    // One failure re-opens; it does not need to reach the threshold again.
    var breaker = New(out var clock, threshold: 2, cooldownSeconds: 30);
    await Fail(breaker);
    await Fail(breaker);

    clock.Advance(TimeSpan.FromSeconds(31));
    await Fail(breaker);

    Eq(breaker.State, "open");
    await ThrowsAsync<CircuitOpenException>(() => breaker.Call(() => Task.FromResult("ok")));
});

Test("a failed probe restarts the cooldown", async () =>
{
    var breaker = New(out var clock, threshold: 2, cooldownSeconds: 30);
    await Fail(breaker);
    await Fail(breaker);

    clock.Advance(TimeSpan.FromSeconds(31));
    await Fail(breaker);                       // probe fails at t=31
    clock.Advance(TimeSpan.FromSeconds(29));   // t=60, only 29s since the probe

    await ThrowsAsync<CircuitOpenException>(() => breaker.Call(() => Task.FromResult("ok")));
});

Test("the underlying failure is not swallowed", async () =>
{
    // While closed, the caller sees the REAL exception, not a breaker one.
    var breaker = New(out _, threshold: 5);

    var error = await ThrowsAsync<HttpRequestException>(
        () => breaker.Call<string>(() => throw new HttpRequestException("upstream down")));

    Eq(error.Message, "upstream down");
});

// ──────────────────────────── helpers ────────────────────────────────────

Breaker New(out FakeClock clock, int threshold = 3, int cooldownSeconds = 30)
{
    clock = new FakeClock();
    return new Breaker(clock, threshold, TimeSpan.FromSeconds(cooldownSeconds));
}

async Task Fail(Breaker breaker)
{
    try { await breaker.Call<string>(() => throw new HttpRequestException("down")); }
    catch (HttpRequestException) { }
}

// ──────────────────────────── types ──────────────────────────────────────

public class FakeClock : TimeProvider
{
    private DateTimeOffset _now = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
    public override DateTimeOffset GetUtcNow() => _now;
    public void Advance(TimeSpan by) => _now += by;
}

public class CircuitOpenException() : Exception("circuit is open");

// State is "closed", "open" or "half-open".
public class Breaker(TimeProvider clock, int threshold, TimeSpan cooldown)
{
    private int _consecutiveFailures;
    private DateTimeOffset? _openedAt;

    // Computed, not stored: "open and the cooldown has elapsed" IS
    // half-open, so there is no timer to keep in sync.
    public string State
    {
        get
        {
            if (_openedAt is null) return "closed";
            return clock.GetUtcNow() - _openedAt.Value >= cooldown ? "half-open" : "open";
        }
    }

    public async Task<T> Call<T>(Func<Task<T>> work)
    {
        var state = State;

        // Fail fast: no call, no timeout wait, no load on a dying service.
        if (state == "open") throw new CircuitOpenException();

        try
        {
            var result = await work();

            // Success closes it — from half-open (the probe worked) or
            // closed (reset the CONSECUTIVE count).
            _openedAt = null;
            _consecutiveFailures = 0;
            return result;
        }
        catch (Exception) when (state == "half-open")
        {
            // A failed probe re-opens immediately and RESTARTS the cooldown.
            _openedAt = clock.GetUtcNow();
            throw;                       // the caller still sees the real error
        }
        catch (Exception)
        {
            if (++_consecutiveFailures >= threshold) _openedAt = clock.GetUtcNow();
            throw;                       // observe, do not translate
        }
    }
}
