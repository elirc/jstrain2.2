// ─────────────────────────────────────────────────────────────────────────
//  02 · circuit breaker                                   ★★★ stretch
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
//  hint: a SUCCESS while closed resets the failure count to zero — a
//        breaker counts CONSECUTIVE failures, not failures ever
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
    public string State => throw new NotImplementedException();

    public Task<T> Call<T>(Func<Task<T>> work) => throw new NotImplementedException();
}
