// ─────────────────────────────────────────────────────────────────────────
//  08 · equality and ToString — SOLUTION                  ★★★ stretch
//  concepts: Equals/GetHashCode contract · operator == · records
//  run: dotnet run 08-equality-and-tostring.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Equals is written against `object?` because that is the virtual method
//  the framework calls. Pattern matching does the type test and the cast in
//  one step: `obj is Money other` fails for null AND for a string, which is
//  both of the negative cases the tests check.
//
//  GetHashCode must be derived from exactly the same members Equals uses —
//  that is the contract. HashCode.Combine does the mixing properly;
//  `Amount.GetHashCode() ^ Currency.GetHashCode()` is the classic wrong turn
//  because XOR is commutative, so (1,"USD") and ("USD",1)-shaped values
//  collide, and XOR of similar inputs clusters badly. Note the HashSet test
//  would still pass with a terrible hash — collisions fall back to Equals —
//  which is exactly why hash bugs hide until they show up as a performance
//  cliff instead of a wrong answer.
//
//  The operators must not use `==` on the operands themselves; that would
//  recurse forever. ReferenceEquals handles the both-null case, then an
//  explicit null check, then delegate to Equals.
//
//  And then the record does all of it in one line: value Equals, a matching
//  GetHashCode, == and !=, and a ToString of the form
//  `Name { Member = value }`. Unless you need custom semantics, this is the
//  right answer — the hand-written version above exists so you can recognise
//  what the compiler is generating for you.
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

    // `is Money other` rejects null and wrong types in one step.
    public override bool Equals(object? obj)
        => obj is Money other && Amount == other.Amount && Currency == other.Currency;

    // Same members as Equals — that is the contract, not a style choice.
    public override int GetHashCode() => HashCode.Combine(Amount, Currency);

    public override string ToString() => $"{Amount} {Currency}";

    public static bool operator ==(Money? left, Money? right)
    {
        if (ReferenceEquals(left, right)) return true;   // covers both-null
        if (left is null || right is null) return false;
        return left.Equals(right);                       // never `left == right`
    }

    public static bool operator !=(Money? left, Money? right) => !(left == right);
}

sealed record MoneyRecord(decimal Amount, string Currency);
