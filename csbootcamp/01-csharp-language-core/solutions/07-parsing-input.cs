// ─────────────────────────────────────────────────────────────────────────
//  07 · parsing input — SOLUTION                          ★★☆ core
//  concepts: TryParse · CultureInfo · DateTimeOffset
//  run: dotnet run 07-parsing-input.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  All three follow the same shape: guard the null/blank case, TryParse with
//  an explicit culture, then apply the domain rule (non-negative). Returning
//  a nullable rather than throwing means the caller decides what a bad field
//  means — a 400 response, a default, a validation message.
//
//  The culture argument is the lesson. `decimal.TryParse(raw, out var d)`
//  uses CurrentCulture, so the de-DE test fails: German reads "1.50" as one
//  hundred fifty, because '.' is its thousands separator. Passing
//  CultureInfo.InvariantCulture makes the parse depend on the wire format
//  rather than on which datacentre the container landed in. NumberStyles
//  .Number without AllowExponent-style extras keeps "1e3" out.
//
//  ParseWhen uses DateTimeOffset, not DateTime, because an offset is part of
//  the value: DateTime silently loses it and leaves you with a Kind you have
//  to remember. AdjustToUniversal normalises +02:00 to UTC at the boundary,
//  so everything downstream compares apples to apples. Storing local times
//  and converting later is how you get bugs that only appear in October.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Globalization;

int? ParseQuantity(string? raw)
{
    if (string.IsNullOrWhiteSpace(raw)) return null;
    if (!int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n))
        return null;
    return n < 0 ? null : n;
}

decimal? ParsePrice(string? raw)
{
    if (string.IsNullOrWhiteSpace(raw)) return null;
    if (!decimal.TryParse(raw, NumberStyles.Number, CultureInfo.InvariantCulture, out var d))
        return null;
    return d < 0 ? null : d;
}

DateTimeOffset? ParseWhen(string? raw)
{
    if (string.IsNullOrWhiteSpace(raw)) return null;
    return DateTimeOffset.TryParse(
        raw,
        CultureInfo.InvariantCulture,
        DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal,
        out var when)
        ? when
        : null;
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
