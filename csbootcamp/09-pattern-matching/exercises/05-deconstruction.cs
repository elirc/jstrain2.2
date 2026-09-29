// ─────────────────────────────────────────────────────────────────────────
//  05 · deconstruction                                    ★★☆ core
//  concepts: Deconstruct · positional patterns · nesting · discards
//  run: dotnet run 05-deconstruction.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Records get a `Deconstruct` for free from their positional parameters,
//  which is what makes `var (x, y) = point` work. Any type can have one —
//  write the method and both deconstruction and POSITIONAL PATTERNS light up:
//
//      public void Deconstruct(out decimal amount, out string currency)
//          => (amount, currency) = (Amount, Currency);
//
//      money is (0m, _)                       // positional pattern
//      money is (> 100m, "GBP")               // with relational + constant
//      order is (_, (var amount, "GBP"))      // nested
//
//  `_` in a positional pattern is a **discard**: matches anything, binds
//  nothing. It is how you say "I do not care about this position" without
//  inventing a name nobody reads.
//
//  One caveat worth knowing: a positional pattern needs a `Deconstruct` with
//  the right ARITY. A type can have several — `Deconstruct(out a, out b)` and
//  `Deconstruct(out a, out b, out c)` — and the pattern picks by count.
//
//  hint: `Deconstruct` is found by convention, not by an interface. The name,
//        the `out` parameters and the arity are the whole contract.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Money's Deconstruct is stubbed at the bottom of the file. Write it first —
// every positional pattern below goes through it.

// "free" when the amount is 0, "sterling" for any GBP amount, "large" for
// over 1000 in any currency, otherwise "ordinary". Use positional patterns.
// Note the ORDER those rules have to be tried in.
string Classify(Money money)
{
    throw new NotImplementedException();
}

// The currency of the order's total, via a NESTED positional pattern —
// no property access with dots.
string CurrencyOf(Order order)
{
    throw new NotImplementedException();
}

// Swap, using tuple deconstruction rather than a temporary variable.
(int, int) Swap(int a, int b)
{
    throw new NotImplementedException();
}

// "ada=1, bob=2" — deconstruct each pair in the foreach.
string Render(Dictionary<string, int> scores)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("Money deconstructs into its two parts", () =>
{
    var (amount, currency) = new Money(9.99m, "GBP");

    Eq(amount, 9.99m);
    Eq(currency, "GBP");
});

Test("zero is free, whatever the currency", () =>
{
    Eq(Classify(new Money(0m, "GBP")), "free");
    Eq(Classify(new Money(0m, "USD")), "free");
});

Test("sterling is recognised", () =>
    Eq(Classify(new Money(50m, "GBP")), "sterling"));

Test("large beats ordinary but not sterling", () =>
{
    // 2000 GBP is both large and sterling. The arm that comes first wins,
    // and the spec says sterling — so ordering is the answer, not a `when`.
    Eq(Classify(new Money(2000m, "USD")), "large");
    Eq(Classify(new Money(2000m, "GBP")), "sterling");
});

Test("everything else is ordinary", () =>
    Eq(Classify(new Money(50m, "USD")), "ordinary"));

Test("a nested positional pattern reaches the currency", () =>
    Eq(CurrencyOf(new Order("ada", new Money(50m, "EUR"))), "EUR"));

Test("swap needs no temporary", () =>
    Eq(Swap(1, 2), (2, 1)));

Test("a dictionary deconstructs pair by pair", () =>
    Eq(Render(new Dictionary<string, int> { ["ada"] = 1, ["bob"] = 2 }),
       "ada=1, bob=2"));

// ──────────────────────────── types ──────────────────────────────────────

// A plain class, on purpose — records get Deconstruct for free and this one
// does not. Add it.
public sealed class Money(decimal amount, string currency)
{
    public decimal Amount { get; } = amount;
    public string Currency { get; } = currency;

    public void Deconstruct(out decimal amount, out string currency)
    {
        throw new NotImplementedException();
    }
}

public record Order(string Customer, Money Total);
