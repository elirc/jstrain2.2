// ─────────────────────────────────────────────────────────────────────────
//  03 · formatting and culture — SOLUTION                 ★★☆ core
//  concepts: format strings · InvariantCulture · round-tripping
//  run: dotnet run 03-formatting-and-culture.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Every `ToString()` and every `Parse` without an explicit culture reads
//  ambient state — `CultureInfo.CurrentCulture`, which comes from the
//  operating system. So the same code produces `1.5` on one machine and
//  `1,5` on another, and the second one fails to parse on the first.
//
//  This is the single most common "works on my machine" bug in .NET, and it
//  has one rule:
//
//      **Machine-readable → `CultureInfo.InvariantCulture`, always.**
//      Human-readable → the user's culture, deliberately chosen.
//
//  JSON, CSV, URLs, log lines, database values, anything you will parse back:
//  invariant. A price on a page: the user's culture.
//
//  Format strings worth knowing:
//
//      "F2"   fixed, 2 decimals        "N0"   thousands separators, 0 dp
//      "P1"   percent, 1 dp            "X"    hex
//      "O"    round-trip date/time     "R"    round-trip number
//      "yyyy-MM-dd"                    a custom date pattern
//
//  Walkthrough:
//  Five one-liners, and the only decision in each is which culture.
//
//  **The two tests that set `CurrentCulture` to German are the point of the
//  file.** They fail against any implementation that omitted the culture
//  argument — which is exactly what happens when the code is written on an
//  en-GB laptop, tested on an en-GB laptop, and deployed to a container whose
//  locale came from the base image.
//
//  **`ParseMachine` uses an explicit `NumberStyles`, not `NumberStyles
//  .Number`.** That is the subtle half. `Number` includes `AllowThousands`,
//  and the invariant thousands separator is a comma — so `decimal.Parse
//  ("1234,50", NumberStyles.Number, InvariantCulture)` succeeds and returns
//  **123450**. A German-formatted price, parsed as invariant, silently
//  becomes a hundred times too large. Restricting the styles to a sign and a
//  decimal point makes it fail instead, which is the only safe outcome.
//
//  This is the general shape of the culture bug: not a crash, a wrong number.
//
//  **`"O"` is the round-trip format**, and it is the right default for any
//  timestamp you will read back — it keeps the offset and all seven
//  fractional-second digits. `"yyyy-MM-dd HH:mm:ss"` looks tidier and throws
//  away up to a second, which turns an equality assertion into an
//  intermittent failure and a "duplicate detection" feature into a
//  coin toss.
//
//  **`"C"` for currency takes the symbol, the separator and the placement
//  from the culture you pass**, which is why `ForPerson` takes one as a
//  parameter rather than reading `CurrentCulture`. A web request knows its
//  user's culture; a background job does not, and ambient state is how a
//  nightly report ends up formatted for whoever last logged in.
//
//  The rule, once more, because it is the whole module: **anything you will
//  parse back is invariant; anything a person reads is theirs.**
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Globalization;

// A price for a machine to read back: two decimals, a dot, no separators.
string ForMachine(decimal amount) => amount.ToString("F2", CultureInfo.InvariantCulture);

// The same amount for a person in the given culture, as currency.
// The culture is a PARAMETER, not ambient state — a background job has no
// business formatting for whoever last logged in.
string ForPerson(decimal amount, CultureInfo culture) => amount.ToString("C", culture);

// Parse a machine-written amount. Returns null when it is not a number.
decimal? ParseMachine(string text) =>
    // NOT NumberStyles.Number: that allows thousands separators, and the
    // invariant one is a comma — so "1234,50" would parse as 123450.
    decimal.TryParse(text,
                     NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint,
                     CultureInfo.InvariantCulture,
                     out var value)
        ? value
        : null;

// A date as "2026-09-02", regardless of where this runs.
string IsoDate(DateOnly date) => date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

// A DateTimeOffset written so it can be parsed back EXACTLY, offset included.
// "O" keeps the offset AND all seven fractional digits. Anything shorter
// loses precision and turns equality assertions into flaky ones.
string RoundTrip(DateTimeOffset moment) => moment.ToString("O", CultureInfo.InvariantCulture);

// ──────────────────────────── tests ──────────────────────────────────────

var german = CultureInfo.GetCultureInfo("de-DE");
var american = CultureInfo.GetCultureInfo("en-US");

Test("machine format is a plain dotted number", () =>
{
    Eq(ForMachine(1234.5m), "1234.50");
    Eq(ForMachine(0.5m), "0.50");
    Eq(ForMachine(-2m), "-2.00");
});

Test("machine format does not change with the culture", () =>
{
    // The whole point. Run this on a German machine and it must not become
    // "1234,50" — something is going to parse it back.
    var previous = CultureInfo.CurrentCulture;
    CultureInfo.CurrentCulture = german;

    try
    {
        Eq(ForMachine(1234.5m), "1234.50");
    }
    finally
    {
        CultureInfo.CurrentCulture = previous;
    }
});

Test("human format follows the culture it is given", () =>
{
    Ok(ForPerson(1234.5m, american).Contains('$'), ForPerson(1234.5m, american));
    Ok(ForPerson(1234.5m, german).Contains('€'), ForPerson(1234.5m, german));
});

Test("machine output round-trips through the parser", () =>
{
    Eq(ParseMachine(ForMachine(1234.5m)), 1234.50m);
    Eq(ParseMachine(ForMachine(-0.05m)), -0.05m);
});

Test("parsing is invariant too, so a comma-decimal is NOT accepted", () =>
{
    // "1234,50" is a valid German number and invalid invariant input.
    // Accepting it silently would turn 1234.50 into 123450 — so the parse
    // has to refuse group separators as well as choose the culture.
    Eq(ParseMachine("1234,50"), null);
    Eq(ParseMachine("nonsense"), null);
    Eq(ParseMachine(""), null);
});

Test("the ISO date is fixed, whatever the culture", () =>
{
    var previous = CultureInfo.CurrentCulture;
    CultureInfo.CurrentCulture = german;

    try
    {
        Eq(IsoDate(new DateOnly(2026, 9, 2)), "2026-09-02");
    }
    finally
    {
        CultureInfo.CurrentCulture = previous;
    }
});

Test("the round-trip format keeps the offset", () =>
{
    var moment = new DateTimeOffset(2026, 9, 2, 13, 30, 0, TimeSpan.FromHours(2));
    var text = RoundTrip(moment);

    Eq(DateTimeOffset.Parse(text, CultureInfo.InvariantCulture), moment);
    Ok(text.Contains("+02:00"), text);
});

Test("a round-tripped moment survives being parsed back exactly", () =>
{
    var moment = DateTimeOffset.UtcNow;
    var parsed = DateTimeOffset.Parse(RoundTrip(moment), CultureInfo.InvariantCulture);

    // "O" keeps all seven fractional digits. A format that drops them —
    // "yyyy-MM-dd HH:mm:ss" — loses up to a second, and the equality test
    // that used to pass starts failing at random.
    Eq(parsed, moment);
});
