// ─────────────────────────────────────────────────────────────────────────
//  02 · numeric types                                     ★☆☆ warm-up
//  concepts: int vs double vs decimal · casts · overflow
//  run: dotnet run 02-numeric-types.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  C# picks the type of an expression from its operands, not from where you
//  put the result. `7 / 2` is 3 — both sides are int, so it is integer
//  division, and assigning to a double afterwards is far too late.
//
//  Build three small things:
//
//      Average([1, 2])       → 1.5    (not 1)
//      Money(0.1m + 0.2m)    → 0.3m   (decimal is exact for money)
//      SafeAdd(int.MaxValue, 1) → null (it would overflow)
//
//  SafeAdd returns null instead of wrapping around. C# addition silently
//  wraps by default in a release build; you have to ask for the check.
//
//  hint: `checked { }` turns silent wraparound into OverflowException
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// The mean of the numbers, as a double. Empty input → 0.
double Average(int[] numbers)
{
    throw new NotImplementedException();
}

// Round a money amount to 2 decimal places, half away from zero
// (2.345m → 2.35m, which is what an invoice expects).
decimal Money(decimal amount)
{
    throw new NotImplementedException();
}

// a + b, or null if the result would not fit in an int.
int? SafeAdd(int a, int b)
{
    throw new NotImplementedException();
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
