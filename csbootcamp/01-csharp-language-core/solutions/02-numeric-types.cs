// ─────────────────────────────────────────────────────────────────────────
//  02 · numeric types — SOLUTION                          ★☆☆ warm-up
//  concepts: int vs double vs decimal · casts · overflow
//  run: dotnet run 02-numeric-types.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Average: `numbers.Sum()` is an int and `numbers.Length` is an int, so
//  dividing them is integer division no matter what the return type says.
//  Casting ONE side to double promotes the other automatically. The classic
//  wrong turn is `(double)(sum / count)` — that divides first and casts the
//  already-truncated answer.
//
//  Money: `Math.Round` defaults to banker's rounding (MidpointRounding
//  .ToEven), so 2.345m would come out 2.34m. Invoices expect half-away-
//  from-zero, so you have to pass it explicitly. decimal, not double,
//  because decimal stores base-10 fractions exactly — 0.1m + 0.2m really is
//  0.3m, while 0.1 + 0.2 as doubles is 0.30000000000000004.
//
//  SafeAdd: `checked` makes overflow throw instead of wrapping. Wrapping is
//  the default in a release build, which is how int.MaxValue + 1 silently
//  becomes int.MinValue — a negative total nobody ordered.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

double Average(int[] numbers)
{
    if (numbers.Length == 0) return 0;
    // (double) on one operand promotes the whole expression to double.
    return (double)numbers.Sum() / numbers.Length;
}

decimal Money(decimal amount)
    => Math.Round(amount, 2, MidpointRounding.AwayFromZero);

int? SafeAdd(int a, int b)
{
    try
    {
        checked { return a + b; }
    }
    catch (OverflowException)
    {
        return null;
    }
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("Average does not truncate", () =>
    Approx(Average([1, 2]), 1.5));

Test("Average of an empty array is 0", () =>
    Approx(Average([]), 0));

Test("Average handles negatives", () =>
    Approx(Average([-2, 2, -4]), -4.0 / 3.0, 1e-9));

Test("Money rounds half away from zero", () =>
{
    Eq(Money(2.345m), 2.35m);
    Eq(Money(-2.345m), -2.35m);
});

Test("Money is exact where double is not", () =>
    Eq(Money(0.1m + 0.2m), 0.30m));

Test("SafeAdd adds normally", () =>
    Eq(SafeAdd(2, 3), 5));

Test("SafeAdd returns null on overflow instead of wrapping", () =>
    Eq(SafeAdd(int.MaxValue, 1), null));

Test("SafeAdd returns null on underflow too", () =>
    Eq(SafeAdd(int.MinValue, -1), null));
