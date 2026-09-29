// ─────────────────────────────────────────────────────────────────────────
//  01 · fizzbuzz range — SOLUTION                         ★☆☆ warm-up
//  concepts: control flow · string building · IEnumerable
//  run: dotnet run 01-fizzbuzz-range.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The order of the checks is the whole exercise. Test %15 first, or test
//  %3 and %5 together first — either way the "both" case has to be decided
//  before the single cases, because 15 satisfies %3 too and whichever
//  branch runs first wins.
//
//  The classic wrong turn is `if (n % 3 == 0) "Fizz" else if (n % 5 == 0)`
//  with the FizzBuzz check last: 15 hits the Fizz branch and never reaches
//  it. Writing it as one switch expression makes the precedence visible
//  instead of implicit.
//
//  `for (var n = start; n <= end; n++)` with start > end runs zero times,
//  so the empty case needs no special handling — the loop condition is
//  already the guard.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

List<string> FizzBuzz(int start, int end)
{
    var result = new List<string>();
    for (var n = start; n <= end; n++)
    {
        result.Add((n % 3, n % 5) switch
        {
            (0, 0) => "FizzBuzz",
            (0, _) => "Fizz",
            (_, 0) => "Buzz",
            _ => n.ToString(),
        });
    }
    return result;
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("maps a plain number to its string", () =>
    Eq(FizzBuzz(1, 2), new[] { "1", "2" }));

Test("replaces multiples of 3 with Fizz", () =>
    Eq(FizzBuzz(3, 3), new[] { "Fizz" }));

Test("replaces multiples of 5 with Buzz", () =>
    Eq(FizzBuzz(5, 5), new[] { "Buzz" }));

Test("replaces multiples of both with FizzBuzz", () =>
    Eq(FizzBuzz(15, 15), new[] { "FizzBuzz" }));

Test("covers an inclusive range", () =>
    Eq(FizzBuzz(1, 5), new[] { "1", "2", "Fizz", "4", "Buzz" }));

Test("returns empty when start is past end", () =>
    Eq(FizzBuzz(5, 1), new List<string>()));

Test("handles a range that crosses 15", () =>
    Eq(FizzBuzz(14, 16), new[] { "14", "FizzBuzz", "16" }));
