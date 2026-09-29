// ─────────────────────────────────────────────────────────────────────────
//  01 · fizzbuzz range                                    ★☆☆ warm-up
//  concepts: control flow · string building · IEnumerable
//  run: dotnet run 01-fizzbuzz-range.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  The traditional first C# file, with one twist: return the values, don't
//  print them. Code that returns data is testable; code that prints is not.
//  That habit is worth building on line one.
//
//  Multiples of 3 → "Fizz", of 5 → "Buzz", of both → "FizzBuzz", else the
//  number as a string.
//
//      FizzBuzz(1, 5)  → ["1", "2", "Fizz", "4", "Buzz"]
//      FizzBuzz(14, 16) → ["14", "FizzBuzz", "16"]
//
//  Both ends are inclusive. If start > end, return an empty list.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

List<string> FizzBuzz(int start, int end)
{
    throw new NotImplementedException();
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
