// ─────────────────────────────────────────────────────────────────────────
//  04 · one reason to fail — SOLUTION                     ★★☆ core
//  concepts: diagnostic quality · what a failure message owes the reader
//  run: dotnet run 04-one-reason-to-fail.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `Assert.True(false)` tells you a test failed. It does not tell you what
//  broke, and the person reading it at 9am is not the person who wrote it.
//
//  A good failure names the RULE that was violated. That is mostly a matter
//  of writing one assertion per rule rather than one assertion that checks
//  five things at once — and this exercise makes it explicit by asking you to
//  return the name.
//
//  The contract for `Initials(fullName)`:
//
//      "Ada Lovelace"        → "AL"
//      "Ada King Lovelace"   → "AL"    first and LAST, never the middle
//      "ada lovelace"        → "AL"    always uppercase
//      "  Ada Lovelace  "    → "AL"    surrounding space is ignored
//      "Ada"                 → "A"     one name gives one letter
//      ""  /  "   "          → ""      and never a throw
//
//  `Diagnose` returns the name of the FIRST rule an implementation breaks,
//  checked in this exact order — so an implementation that breaks two rules
//  reports the earlier one:
//
//      "blank"    empty or whitespace input is not handled
//      "single"   a single name does not give exactly one letter
//      "case"     the result is not uppercased
//      "last"     three names do not give first + LAST
//      "spaces"   surrounding whitespace changes the answer
//      ""         nothing is wrong
//
//  Walkthrough:
//  Five checks, in the documented order, each with its own label and its own
//  `return`. The structure IS the lesson.
//
//  **One assertion per rule.** The tempting version is one big condition:
//
//      if (i("") != "" || i("Ada") != "A" || i("ada lovelace") != "AL") …
//
//  It is shorter, it catches exactly the same bugs, and when it fails it
//  tells you nothing. Split it and each failure names itself. In a normal
//  test suite the same principle is one `Assert` per rule rather than one
//  compound boolean — you lose nothing and gain a message.
//
//  **Order has to be documented, not incidental.** `LowercaseAndMiddle`
//  breaks two rules; the answer is "case" only because the contract fixes the
//  order. Without that, the diagnosis depends on which check you happened to
//  write first, and it changes under a refactor that reorders them. Any tool
//  that reports "the first problem" owes its users a defined first.
//
//  **A throw is a broken rule, not a broken diagnosis.** `Try(...)` wraps
//  each call so that `BlankThrows` reports `"blank"` rather than taking the
//  whole diagnostic down with it. This matters far beyond the exercise: a
//  test helper that itself explodes turns one clear failure into an
//  unrelated stack trace, and the reader now has two problems.
//
//  Returning a sentinel — `"\u0000throw"` here — rather than null keeps the
//  comparison simple, and it can never equal a real result.
//
//  **What each check is pinned to.** The `case` rule compares against the
//  literal `"AL"` rather than against `result == result.ToUpperInvariant()`.
//  The literal is stronger: the self-comparison version passes for an
//  implementation that returns `"XY"`, which is uppercase and wrong.
//
//  The general habit worth taking away: when you catch yourself writing an
//  assertion that compares a value to a transformation of itself, check
//  whether it can actually fail for the bug you have in mind. A surprising
//  number of them cannot.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// The label of the first broken rule, or "" when the implementation is
// correct. A rule that throws counts as broken.
string Diagnose(Func<string, string> initials)
{
    // A throw is a broken rule, not a broken diagnosis — so each call is
    // wrapped and a sentinel stands in for "it fell over".
    string Try(string input)
    {
        try { return initials(input); }
        catch { return "\u0000throw"; }
    }

    // One check per rule, in the documented order, each returning its own
    // label. A combined condition would catch the same bugs and name none.
    if (Try("") != "" || Try("   ") != "") return "blank";
    if (Try("Ada").Length != 1) return "single";
    if (Try("ada lovelace") != "AL") return "case";
    if (Try("Ada King Lovelace") != "AL") return "last";
    if (Try("  Ada Lovelace  ") != "AL") return "spaces";

    return "";
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a correct implementation reports nothing", () =>
    Eq(Diagnose(Correct), ""));

Test("it names the blank case", () =>
    Eq(Diagnose(BlankThrows), "blank"));

Test("it names the single-name case", () =>
    Eq(Diagnose(SingleNameEmpty), "single"));

Test("it names the casing rule", () =>
    Eq(Diagnose(NoUppercase), "case"));

Test("it names the first-and-last rule", () =>
    Eq(Diagnose(FirstTwo), "last"));

Test("it names the whitespace rule", () =>
    Eq(Diagnose(NoTrim), "spaces"));

Test("a throw is a broken rule, not a crashed diagnosis", () =>
    // Diagnose must catch it and report the rule it was checking. A
    // diagnostic tool that itself falls over tells you nothing.
    Eq(Diagnose(ThrowsOnThreeNames), "last"));

Test("two broken rules report the EARLIER one", () =>
{
    // Deterministic ordering matters: a diagnosis that depends on which
    // check happened to run first is not a diagnosis.
    Eq(Diagnose(LowercaseAndMiddle), "case");
});

Test("the order is the documented one, not the convenient one", () =>
{
    Eq(Diagnose(BlankAndCase), "blank");
    Eq(Diagnose(SingleAndSpaces), "single");
});

// ──────────────────────────── implementations ────────────────────────────

static string Correct(string fullName)
{
    var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);

    return parts.Length switch
    {
        0 => "",
        1 => parts[0][..1].ToUpperInvariant(),
        _ => (parts[0][..1] + parts[^1][..1]).ToUpperInvariant(),
    };
}

// Indexes before checking whether there is anything there.
static string BlankThrows(string fullName)
{
    var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);

    return parts.Length == 1
        ? parts[0][..1].ToUpperInvariant()
        : (parts[0][..1] + parts[^1][..1]).ToUpperInvariant();
}

// Handles blank, then gives up on a single name.
static string SingleNameEmpty(string fullName)
{
    var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);

    return parts.Length < 2 ? "" : (parts[0][..1] + parts[^1][..1]).ToUpperInvariant();
}

// Right letters, wrong case.
static string NoUppercase(string fullName)
{
    var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);

    return parts.Length switch
    {
        0 => "",
        1 => parts[0][..1],
        _ => parts[0][..1] + parts[^1][..1],
    };
}

// First two names rather than first and last.
static string FirstTwo(string fullName)
{
    var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);

    return parts.Length switch
    {
        0 => "",
        1 => parts[0][..1].ToUpperInvariant(),
        _ => (parts[0][..1] + parts[1][..1]).ToUpperInvariant(),
    };
}

// Splits without dropping the empty entries surrounding space produces.
static string NoTrim(string fullName)
{
    var parts = fullName.Split(' ');
    var named = parts.Where(part => part.Length > 0).ToArray();

    if (named.Length == 0) return "";
    if (parts[0].Length == 0 || parts[^1].Length == 0) return "";

    return named.Length == 1
        ? named[0][..1].ToUpperInvariant()
        : (named[0][..1] + named[^1][..1]).ToUpperInvariant();
}

// Correct until it meets a middle name, then it falls over.
static string ThrowsOnThreeNames(string fullName)
{
    var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);

    if (parts.Length > 2) throw new IndexOutOfRangeException("middle names");

    return Correct(fullName);
}

// Two rules broken at once: casing and first-and-last.
static string LowercaseAndMiddle(string fullName)
{
    var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);

    return parts.Length switch
    {
        0 => "",
        1 => parts[0][..1],
        _ => parts[0][..1] + parts[1][..1],
    };
}

// Blank AND casing.
static string BlankAndCase(string fullName)
{
    var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);

    return parts.Length == 1 ? parts[0][..1] : parts[0][..1] + parts[^1][..1];
}

// Single-name AND whitespace.
static string SingleAndSpaces(string fullName)
{
    var parts = fullName.Split(' ');
    var named = parts.Where(part => part.Length > 0).ToArray();

    if (named.Length < 2) return "";
    if (parts[0].Length == 0 || parts[^1].Length == 0) return "";

    return (named[0][..1] + named[^1][..1]).ToUpperInvariant();
}
