// ─────────────────────────────────────────────────────────────────────────
//  02 · testing time                                      ★★☆ core
//  concepts: TimeProvider · deterministic clocks · no Thread.Sleep
//  run: dotnet run 02-testing-time.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `DateTime.UtcNow` is a hidden global dependency. Code that calls it
//  cannot be tested for anything time-dependent without either waiting in
//  real time or accepting a flaky test:
//
//      · "expires in 15 minutes"  → your test sleeps 15 minutes, or lies
//      · "not valid before 9am"   → passes until CI runs at 08:59
//      · "rate limit per minute"  → sleeps 60s, or is flaky at the boundary
//
//  The fix is the same as exercise 01: make it a seam. .NET ships
//  `TimeProvider` for exactly this — `TimeProvider.System` in production, a
//  controllable one in tests.
//
//  Build a session store where expiry is decided by an injected clock, and a
//  `FakeClock` you can wind forward instantly.
//
//      clock.Advance(TimeSpan.FromMinutes(16));   // no waiting, no flake
//
//  hint: `TimeProvider.GetUtcNow()` returns a DateTimeOffset; your fake
//        overrides it
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("a fresh session is valid", () =>
{
    var clock = new FakeClock(new DateTimeOffset(2026, 1, 1, 9, 0, 0, TimeSpan.Zero));
    var sessions = new SessionStore(clock, TimeSpan.FromMinutes(15));

    var id = sessions.Create("ada");
    Eq(sessions.GetUser(id), "ada");
});

Test("a session survives right up to the limit", () =>
{
    var clock = new FakeClock(new DateTimeOffset(2026, 1, 1, 9, 0, 0, TimeSpan.Zero));
    var sessions = new SessionStore(clock, TimeSpan.FromMinutes(15));
    var id = sessions.Create("ada");

    clock.Advance(TimeSpan.FromMinutes(15));   // exactly at the boundary
    Eq(sessions.GetUser(id), "ada");
});

Test("a session expires one tick past the limit", () =>
{
    var clock = new FakeClock(new DateTimeOffset(2026, 1, 1, 9, 0, 0, TimeSpan.Zero));
    var sessions = new SessionStore(clock, TimeSpan.FromMinutes(15));
    var id = sessions.Create("ada");

    // 15 real minutes, tested in microseconds.
    clock.Advance(TimeSpan.FromMinutes(15) + TimeSpan.FromTicks(1));
    Eq(sessions.GetUser(id), null);
});

Test("an unknown session id is null, not an exception", () =>
{
    var clock = new FakeClock(DateTimeOffset.UnixEpoch);
    var sessions = new SessionStore(clock, TimeSpan.FromMinutes(15));

    Eq(sessions.GetUser("no-such-id"), null);
});

Test("touching a session slides its expiry", () =>
{
    var clock = new FakeClock(new DateTimeOffset(2026, 1, 1, 9, 0, 0, TimeSpan.Zero));
    var sessions = new SessionStore(clock, TimeSpan.FromMinutes(15));
    var id = sessions.Create("ada");

    clock.Advance(TimeSpan.FromMinutes(10));
    Ok(sessions.Touch(id));                     // resets the countdown
    clock.Advance(TimeSpan.FromMinutes(10));    // 20 total, but only 10 idle

    Eq(sessions.GetUser(id), "ada");
});

Test("touching an already-expired session fails and does not revive it", () =>
{
    var clock = new FakeClock(new DateTimeOffset(2026, 1, 1, 9, 0, 0, TimeSpan.Zero));
    var sessions = new SessionStore(clock, TimeSpan.FromMinutes(15));
    var id = sessions.Create("ada");

    clock.Advance(TimeSpan.FromMinutes(20));

    Ok(!sessions.Touch(id));
    Eq(sessions.GetUser(id), null);
});

Test("sweeping removes only the expired ones", () =>
{
    var clock = new FakeClock(new DateTimeOffset(2026, 1, 1, 9, 0, 0, TimeSpan.Zero));
    var sessions = new SessionStore(clock, TimeSpan.FromMinutes(15));

    var old = sessions.Create("ada");
    clock.Advance(TimeSpan.FromMinutes(10));
    var recent = sessions.Create("bob");
    clock.Advance(TimeSpan.FromMinutes(10));    // old is 20m, recent is 10m

    Eq(sessions.Sweep(), 1);
    Eq(sessions.Count, 1);
    Eq(sessions.GetUser(recent), "bob");
    Eq(sessions.GetUser(old), null);
});

Test("the whole suite runs instantly — no test waited 15 minutes", () =>
{
    // The point of the exercise. A clock you control turns a 15-minute
    // scenario into a microsecond one, with no Thread.Sleep anywhere.
    var clock = new FakeClock(DateTimeOffset.UnixEpoch);
    var sessions = new SessionStore(clock, TimeSpan.FromDays(365));
    var id = sessions.Create("ada");

    clock.Advance(TimeSpan.FromDays(400));
    Eq(sessions.GetUser(id), null);
});

// ──────────────────────────── types ──────────────────────────────────────

// A TimeProvider you can wind forward. `TimeProvider.System` is the real one.
public class FakeClock(DateTimeOffset start) : TimeProvider
{
    private DateTimeOffset _now = start;

    public override DateTimeOffset GetUtcNow() => _now;

    public void Advance(TimeSpan by) => _now += by;
}

// Sessions expire after `idleTimeout` of inactivity, measured by the clock.
//   Create(user)  → a new id
//   GetUser(id)   → the user, or null if unknown or expired
//   Touch(id)     → true if it was live (and slides expiry); false otherwise
//   Sweep()       → removes expired sessions, returns how many
//   Count         → how many are stored (expired-but-unswept still count)
public class SessionStore(TimeProvider clock, TimeSpan idleTimeout)
{
    private readonly Dictionary<string, Session> _sessions = [];

    public int Count => _sessions.Count;

    public string Create(string user)
    {
        var id = Guid.NewGuid().ToString();
        _sessions[id] = new Session(user, clock.GetUtcNow());
        return id;
    }

    // A read, and only a read — expired entries are reported gone but not
    // removed. Sweep is the one place that mutates.
    public string? GetUser(string id)
        => _sessions.TryGetValue(id, out var s) && !IsExpired(s) ? s.User : null;

    public bool Touch(string id)
    {
        if (!_sessions.TryGetValue(id, out var s) || IsExpired(s)) return false;

        _sessions[id] = s with { LastSeen = clock.GetUtcNow() };   // slide it
        return true;
    }

    public int Sweep()
    {
        var dead = _sessions.Where(kv => IsExpired(kv.Value)).Select(kv => kv.Key).ToList();
        foreach (var id in dead) _sessions.Remove(id);
        return dead.Count;
    }

    // Strictly greater: exactly at the timeout is still live.
    private bool IsExpired(Session s) => clock.GetUtcNow() - s.LastSeen > idleTimeout;

    private record Session(string User, DateTimeOffset LastSeen);
}
