// ─────────────────────────────────────────────────────────────────────────
//  08 · equality and ToString                             ★★★ stretch
//  concepts: Equals/GetHashCode contract · operator == · records
//  run: dotnet run 08-equality-and-tostring.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  By default two class instances are equal only if they are the SAME
//  object. That is rarely what a value like Money means, and getting it
//  wrong quietly breaks Dictionary, HashSet, Distinct and Contains — all of
//  which look at GetHashCode first.
//
//  The contract you must not break:
//    · equal objects MUST return the same hash code
//    · unequal objects MAY collide (it is a hash, not an id)
//    · Equals must be reflexive, symmetric, and stable while the object is
//      in a hash-based collection
//
//  Give Money value equality: same amount AND same currency. Then write
//  ToString so debugging output is readable ("9.99 USD").
//
//  A record does all of this for you — the second half of the exercise is to
//  prove that, by making the same tests pass for MoneyRecord, which you
//  declare in ONE line.
//
//  hint: HashCode.Combine(a, b) is the correct way to mix hash codes;
//        XOR-ing them by hand collides far more than you would guess
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("two Money values with the same parts are equal", () =>
    Ok(new Money(9.99m, "USD").Equals(new Money(9.99m, "USD"))));

Test("a different amount is not equal", () =>
    Ok(!new Money(9.99m, "USD").Equals(new Money(1.00m, "USD"))));

Test("a different currency is not equal", () =>
    Ok(!new Money(9.99m, "USD").Equals(new Money(9.99m, "EUR"))));

Test("equal values agree on their hash code", () =>
    Eq(new Money(9.99m, "USD").GetHashCode(), new Money(9.99m, "USD").GetHashCode()));

Test("== and != follow Equals", () =>
{
    Ok(new Money(5m, "GBP") == new Money(5m, "GBP"));
    Ok(new Money(5m, "GBP") != new Money(6m, "GBP"));
});

Test("Money is not equal to null or to another type", () =>
{
    Ok(!new Money(5m, "GBP").Equals(null));
    Ok(!new Money(5m, "GBP").Equals("5 GBP"));
});

Test("a HashSet deduplicates equal Money values", () =>
{
    var set = new HashSet<Money>
    {
        new(9.99m, "USD"),
        new(9.99m, "USD"),
        new(9.99m, "EUR"),
    };
    Eq(set.Count, 2);
});

Test("ToString is readable", () =>
    Eq(new Money(9.99m, "USD").ToString(), "9.99 USD"));

Test("the record gets all of that for free", () =>
{
    Ok(new MoneyRecord(9.99m, "USD") == new MoneyRecord(9.99m, "USD"));
    Eq(new MoneyRecord(9.99m, "USD").GetHashCode(),
       new MoneyRecord(9.99m, "USD").GetHashCode());
    Eq(new HashSet<MoneyRecord> { new(1m, "USD"), new(1m, "USD") }.Count, 1);
});

Test("the record's generated ToString names the type and members", () =>
    Eq(new MoneyRecord(9.99m, "USD").ToString(),
       "MoneyRecord { Amount = 9.99, Currency = USD }"));

// ──────────────────────────── types ──────────────────────────────────────

sealed class Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
        => (Amount, Currency) = (amount, currency);

    public override bool Equals(object? obj) => throw new NotImplementedException();

    public override int GetHashCode() => throw new NotImplementedException();

    public override string ToString() => throw new NotImplementedException();

    public static bool operator ==(Money? left, Money? right)
        => throw new NotImplementedException();

    public static bool operator !=(Money? left, Money? right)
        => throw new NotImplementedException();
}

// Declare this as a record with the same two members, in one line, and the
// last two tests pass without you writing any of the above.
sealed record MoneyRecord(decimal Amount, string Currency);
