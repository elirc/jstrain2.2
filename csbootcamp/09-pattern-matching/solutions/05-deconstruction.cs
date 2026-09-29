// ─────────────────────────────────────────────────────────────────────────
//  05 · deconstruction — SOLUTION                         ★★☆ core
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
//  Walkthrough:
//  **`Deconstruct` is convention, not an interface.** There is no
//  `IDeconstructable`. The compiler looks for an accessible method named
//  `Deconstruct` whose parameters are all `out` and whose count matches the
//  pattern, and that is the entire contract — which is why it can be added to
//  a type you do not own, as an extension method.
//
//  One method, and three separate features light up: `var (a, b) = money`,
//  positional patterns `money is (0m, _)`, and `foreach (var (k, v) in dict)`
//  (`KeyValuePair<K,V>` has had one since .NET Core 2.0).
//
//  **`Classify`'s arm order is the spec.** 2000 GBP satisfies both "sterling"
//  and "large", and the requirement says sterling — so the sterling arm goes
//  first. No `when`, no extra condition: precedence is expressed by position.
//  It is worth being deliberate about this, because it means reordering arms
//  is a behavioural change that no test-free refactor will catch.
//
//  **The nested pattern reaches two levels down with no dots.**
//  `(_, (_, var currency))` deconstructs the Order, discards the customer,
//  deconstructs the Money inside it, discards the amount, and binds the
//  currency. Compare `order.Total.Currency` — shorter, but it does not fold
//  into a `switch` arm alongside a dozen other shapes, and it does not
//  null-check as it goes. Patterns short-circuit on any null in the path.
//
//  **`(a, b) = (b, a)` is a real swap**, not a trick. The right-hand side is
//  evaluated into a temporary tuple first, then destructured — so both reads
//  happen before either write. That is also why `(x, y) = (y, x + y)` works
//  for a Fibonacci step and the two-statement version does not.
//
//  **`_` binds nothing.** A discard is not a variable named underscore; it
//  allocates nothing and cannot be read. Use it wherever a position exists
//  but does not matter, rather than inventing `unused1`.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Money's Deconstruct is stubbed at the bottom of the file. Write it first —
// every positional pattern below goes through it.

// "free" when the amount is 0, "sterling" for any GBP amount, "large" for
// over 1000 in any currency, otherwise "ordinary". Use positional patterns.
// Note the ORDER those rules have to be tried in.
string Classify(Money money) => money switch
{
    (0m, _) => "free",
    // Before "large": 2000 GBP is both, and the spec says sterling wins.
    (_, "GBP") => "sterling",
    ( > 1000m, _) => "large",
    _ => "ordinary",
};

// The currency of the order's total, via a NESTED positional pattern —
// no property access with dots.
// Two levels of deconstruction, no dots, and it short-circuits on a null
// anywhere in the path.
string CurrencyOf(Order order) => order is (_, (_, var currency)) ? currency : "";

// Swap, using tuple deconstruction rather than a temporary variable.
// The right-hand side is built as a tuple first, so both reads happen
// before either write.
(int, int) Swap(int a, int b) => (b, a);

// "ada=1, bob=2" — deconstruct each pair in the foreach.
string Render(Dictionary<string, int> scores)
{
    var parts = new List<string>();

    // KeyValuePair has had a Deconstruct since .NET Core 2.0.
    foreach (var (name, score) in scores)
        parts.Add($"{name}={score}");

    return string.Join(", ", parts);
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
        => (amount, currency) = (Amount, Currency);
}

public record Order(string Customer, Money Total);
