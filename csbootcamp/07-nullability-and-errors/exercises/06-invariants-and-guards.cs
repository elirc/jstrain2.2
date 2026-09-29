// ─────────────────────────────────────────────────────────────────────────
//  06 · invariants and guards                             ★★☆ core
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
//  hint: `ObjectDisposedException.ThrowIf(condition, this)` names the type
//        for you — the second argument is the instance, not a string
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
        throw new NotImplementedException();
    }
}

// Balance starts at `opening` and is NEVER negative.
public sealed class Account : IDisposable
{
    private decimal _balance;
#pragma warning disable CS0414   // used once you write the guards
    private bool _disposed;
#pragma warning restore CS0414

    public Account(decimal opening) => _balance = opening;

    // Throws ObjectDisposedException once disposed.
    public decimal Balance => throw new NotImplementedException();

    // ArgumentOutOfRangeException for a negative amount.
    // InvalidOperationException when there is not enough money — and the
    // balance must be UNCHANGED when that happens.
    // ObjectDisposedException once disposed.
    public void Withdraw(decimal amount)
    {
        throw new NotImplementedException();
    }

    public void Dispose() => _disposed = true;
}
