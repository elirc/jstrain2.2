// ─────────────────────────────────────────────────────────────────────────
//  06 · invariants and guards — SOLUTION                  ★★☆ core
//  concepts: throw helpers · validate before you mutate · ObjectDisposed
//  run: dotnet run 06-invariants-and-guards.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  An **invariant** is something that is true of an object for its whole
//  life. A `Percentage` is between 0 and 100. An account balance is never
//  negative. A disposed connection is never used again.
//
//  You keep an invariant by checking it in exactly two places — the
//  constructor, and every method that can break it — and by checking it
//  BEFORE you change anything. That second half is the one people miss:
//
//      _balance -= amount;                      // wrong
//      if (_balance < 0) throw new …;           // too late, already changed
//
//  A failed operation must leave the object exactly as it was. Otherwise the
//  caller catches the exception, carries on, and works with a corrupted
//  object — which is strictly worse than crashing.
//
//  Modern .NET has throw helpers that make the guards one line each:
//
//      ArgumentOutOfRangeException.ThrowIfNegative(amount);
//      ArgumentOutOfRangeException.ThrowIfGreaterThan(value, 100);
//      ObjectDisposedException.ThrowIf(_disposed, this);
//
//  All of them fill in the parameter name from the call site, so there is no
//  string literal to get out of sync with a rename.
//
//  Walkthrough:
//  Two types, six guards, and one ordering rule that does all the work.
//
//  **Check, then change.** `Withdraw` runs all three guards before it touches
//  `_balance`, so a rejected withdrawal leaves the account byte-for-byte as
//  it was. Written the other way round — subtract, then notice the balance
//  went negative, then throw — the caller catches the exception, decides to
//  carry on, and is now holding an account with a negative balance that no
//  code path ever created deliberately. A crash you can debug; a corrupted
//  object propagates.
//
//  This is the same rule as capstone 23/01, where validation runs before the
//  database write rather than letting a foreign-key violation escape as a
//  500. Same shape, different layer.
//
//  **Three failures, three exception types, and the difference is who is at
//  fault.** A negative amount is the CALLER's mistake, so
//  `ArgumentOutOfRangeException`. Not enough money is a legitimate request
//  against a state that cannot serve it, so `InvalidOperationException` —
//  the argument was fine, the moment was wrong. Using a disposed object is
//  `ObjectDisposedException`, which is its own type precisely because "you
//  are holding something dead" is worth telling apart from either.
//
//  A caller can act on that distinction: retry after a deposit, fix the
//  argument, or stop using the handle. Collapse all three into
//  `InvalidOperationException` and none of those decisions is available.
//
//  **The throw helpers fill in the names.** `ThrowIfNegative(amount)` sets
//  `ParamName` to "amount" through `[CallerArgumentExpression]`, and
//  `ObjectDisposedException.ThrowIf(_disposed, this)` reads the type name off
//  the instance. Neither has a string literal in it, so neither goes stale in
//  a rename.
//
//  **The constructor is a guard too.** `Percentage` cannot exist holding 101,
//  so no method on it ever has to check. That is what an invariant buys: the
//  validation happens once, at the only door in, and every reader downstream
//  gets to assume it. Compare a plain `int percent` threaded through six
//  methods, each of which either re-checks or quietly trusts.
//
//  `Balance` guards as well, which looks fussy until you remember that a
//  disposed object's fields are whatever they last were — readable, stale,
//  and completely plausible.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("a valid percentage is constructed", () =>
    Eq(new Percentage(42).Value, 42));

Test("the boundaries are inclusive", () =>
{
    Eq(new Percentage(0).Value, 0);
    Eq(new Percentage(100).Value, 100);
});

Test("out of range is an ArgumentOutOfRangeException that names the parameter", () =>
{
    Eq(Throws<ArgumentOutOfRangeException>(() => new Percentage(-1)).ParamName, "value");
    Eq(Throws<ArgumentOutOfRangeException>(() => new Percentage(101)).ParamName, "value");
});

Test("a withdrawal reduces the balance", () =>
{
    var account = new Account(100m);
    account.Withdraw(30m);

    Eq(account.Balance, 70m);
});

Test("overdrawing throws", () =>
{
    var account = new Account(100m);
    Throws<InvalidOperationException>(() => account.Withdraw(150m));
});

Test("a FAILED withdrawal leaves the balance untouched", () =>
{
    // The whole point. Check first, mutate second — otherwise the caller
    // catches the exception and carries on with a corrupted object.
    var account = new Account(100m);
    Throws<InvalidOperationException>(() => account.Withdraw(150m));

    Eq(account.Balance, 100m);
});

Test("a negative withdrawal is rejected as bad input, not as an overdraft", () =>
{
    // Different problem, different exception: -50 is the caller's mistake,
    // and letting it through would be a deposit with extra steps.
    var account = new Account(100m);
    Throws<ArgumentOutOfRangeException>(() => account.Withdraw(-50m));

    Eq(account.Balance, 100m);
});

Test("the invariant holds across a whole sequence", () =>
{
    var account = new Account(100m);

    foreach (var amount in new[] { 40m, 40m, 40m, 10m, 10m })
        try { account.Withdraw(amount); } catch (InvalidOperationException) { }

    Ok(account.Balance >= 0m, "balance went negative: " + account.Balance);
    Eq(account.Balance, 0m);
});

Test("using a disposed account throws ObjectDisposedException", () =>
{
    var account = new Account(100m);
    account.Dispose();

    var ex = Throws<ObjectDisposedException>(() => account.Withdraw(10m));
    Ok(ex.ObjectName.Contains("Account"), "the exception should name the type: " + ex.ObjectName);
});

Test("reading the balance of a disposed account also throws", () =>
{
    var account = new Account(100m);
    account.Dispose();

    Throws<ObjectDisposedException>(() => _ = account.Balance);
});

// ──────────────────────────── your code ──────────────────────────────────

// Between 0 and 100 inclusive, for its whole life. Reject anything else in
// the constructor with ArgumentOutOfRangeException naming `value`.
public readonly record struct Percentage
{
    public int Value { get; }

    public Percentage(int value)
    {
        // Both helpers name the parameter for you.
        ArgumentOutOfRangeException.ThrowIfNegative(value);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(value, 100);

        Value = value;
    }
}

// Balance starts at `opening` and is NEVER negative.
public sealed class Account : IDisposable
{
    private decimal _balance;
    private bool _disposed;

    public Account(decimal opening) => _balance = opening;

    // A disposed object's fields are stale, not empty — reading them would
    // hand back a plausible-looking lie.
    public decimal Balance
    {
        get
        {
            ObjectDisposedException.ThrowIf(_disposed, this);

            return _balance;
        }
    }

    // ArgumentOutOfRangeException for a negative amount.
    // InvalidOperationException when there is not enough money — and the
    // balance must be UNCHANGED when that happens.
    // ObjectDisposedException once disposed.
    public void Withdraw(decimal amount)
    {
        // Every guard runs BEFORE the mutation, so a rejected withdrawal
        // leaves the account exactly as it was.
        ObjectDisposedException.ThrowIf(_disposed, this);
        ArgumentOutOfRangeException.ThrowIfNegative(amount);

        // The caller's argument was fine; the state cannot serve it.
        if (amount > _balance)
            throw new InvalidOperationException(
                $"cannot withdraw {amount:F2} from a balance of {_balance:F2}");

        _balance -= amount;
    }

    public void Dispose() => _disposed = true;
}
