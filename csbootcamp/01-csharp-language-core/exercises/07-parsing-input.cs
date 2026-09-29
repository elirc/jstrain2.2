// ─────────────────────────────────────────────────────────────────────────
//  07 · parsing input                                     ★★☆ core
//  concepts: TryParse · CultureInfo · DateTimeOffset
//  run: dotnet run 07-parsing-input.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Every web request arrives as text. Turning that text into typed values is
//  the boundary where most production bugs are born, and there are exactly
//  two rules:
//
//    1. Use TryParse, not Parse. Bad input from a user is normal, not
//       exceptional — an exception per bad form field is a DoS vector.
//    2. Pass a culture. `double.Parse("1,5")` is 15 in the US and 1.5 in
//       Germany. On a server, always InvariantCulture, or you get a bug that
//       only reproduces on machines in the wrong country.
//
//      ParseQuantity("42")     → 42
//      ParseQuantity("-1")     → null   (must be >= 0)
//      ParsePrice("1.50")      → 1.50m  (always invariant, never local)
//      ParseWhen("2026-03-01T12:00:00Z") → that instant, in UTC
//
//  hint: decimal.TryParse has an overload taking NumberStyles and
//        IFormatProvider — CultureInfo.InvariantCulture is the provider
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Globalization;

// A non-negative whole quantity, or null if it is not one.
int? ParseQuantity(string? raw)
{
    throw new NotImplementedException();
}

// A price, parsed the same way regardless of the machine's locale.
// Must reject negatives and blank input.
decimal? ParsePrice(string? raw)
{
    throw new NotImplementedException();
}

// An ISO-8601 timestamp, normalised to UTC. Null if unparseable.
DateTimeOffset? ParseWhen(string? raw)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("ParseQuantity accepts a whole number", () =>
    Eq(ParseQuantity("42"), 42));

Test("ParseQuantity accepts zero", () =>
    Eq(ParseQuantity("0"), 0));

Test("ParseQuantity rejects negatives", () =>
    Eq(ParseQuantity("-1"), null));

Test("ParseQuantity rejects junk, null and blank", () =>
{
    Eq(ParseQuantity("12abc"), null);
    Eq(ParseQuantity(null), null);
    Eq(ParseQuantity("  "), null);
});

Test("ParsePrice reads a decimal point", () =>
    Eq(ParsePrice("1.50"), 1.50m));

Test("ParsePrice is invariant, not locale-dependent", () =>
{
    // Simulate a server booted in a comma-decimal locale. A culture-naive
    // parse would read "1.50" as 150 here.
    var previous = CultureInfo.CurrentCulture;
    CultureInfo.CurrentCulture = new CultureInfo("de-DE");
    try
    {
        Eq(ParsePrice("1.50"), 1.50m);
    }
    finally
    {
        CultureInfo.CurrentCulture = previous;
    }
});

Test("ParsePrice rejects negatives and blanks", () =>
{
    Eq(ParsePrice("-3.00"), null);
    Eq(ParsePrice(""), null);
});

Test("ParseWhen reads an ISO instant as UTC", () =>
{
    var when = ParseWhen("2026-03-01T12:00:00Z");
    Eq(when?.UtcDateTime, new DateTime(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc));
});

Test("ParseWhen normalises an offset to UTC", () =>
{
    var when = ParseWhen("2026-03-01T14:00:00+02:00");
    Eq(when?.UtcDateTime, new DateTime(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc));
});

Test("ParseWhen rejects junk", () =>
    Eq(ParseWhen("last tuesday"), null));
