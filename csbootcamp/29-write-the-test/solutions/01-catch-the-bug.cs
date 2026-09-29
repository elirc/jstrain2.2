// ─────────────────────────────────────────────────────────────────────────
//  01 · catch the bug — SOLUTION                          ★★★ stretch
//  concepts: edge cases · what a test suite must cover
//  run: dotnet run 01-catch-the-bug.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  This module inverts the usual exercise. The implementations are given —
//  one correct, several subtly broken — and YOU write the test.
//
//  `CheckTruncate` receives an implementation and must:
//
//      · return normally when it is CORRECT
//      · THROW when it is broken, for every broken version below
//
//  You are graded by a meta-test: your check is run against the correct
//  implementation and against each faulty one.
//
//  The spec for Truncate(text, maxLength):
//
//      · text shorter than or equal to maxLength → returned unchanged
//      · longer → cut and end with '…', total length EXACTLY maxLength
//      · maxLength <= 0 → empty string
//      · null text → empty string
//
//  Every broken version below satisfies the obvious happy-path test. Writing
//  a check that only tries `Truncate("hello world", 8)` will pass three of
//  them. That is the point: **a test suite is only as good as the cases it
//  thinks of.**
//
//  Walkthrough:
//  Six assertions, and each one exists because a specific broken
//  implementation would otherwise slip through. That mapping is the lesson:
//
//      "hello" fits, unchanged        catches AlwaysCuts
//      cut result is EXACTLY 8 long   catches OffByOne
//      cut result ends with '…'       catches NoEllipsis
//      exactly maxLength is untouched catches BoundaryOff
//      null text is ""                catches NullUnsafe
//      maxLength 0 and -1 are ""      catches NegativeUnsafe
//
//  Notice the shape of what is being tested. The happy path —
//  `Truncate("hello world", 8)` — is satisfied by **four of the six broken
//  versions**. Only the boundary and the degenerate inputs tell them apart.
//  That is true of real test suites too: the tests that earn their keep are
//  the ones at the edges, and a suite made of happy paths gives you coverage
//  numbers and no confidence.
//
//  Two edges are worth naming specifically.
//
//  `text.Length == maxLength` is the classic off-by-one seam. `<` and `<=`
//  both read fine and differ on exactly one input, which is why the spec
//  says which one and the test pins it.
//
//  The **length** assertion (`result.Length == maxLength`) is stronger than
//  asserting the exact string. It catches `OffByOne` without your test
//  needing to know what the right answer looks like — an assertion about an
//  invariant, not about a value. Where you can find one of those, it is worth
//  more than a dozen literal comparisons.
//
//  Finally: the check throws on failure rather than returning a bool. That is
//  what makes the diagnostic useful — `Ok(..., "message")` says which
//  property broke, where `return false` would only say "something".
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Throw (any exception) if `truncate` does not meet the spec above.
// Return normally if it does.
void CheckTruncate(Func<string?, int, string> truncate)
{
    // Fits: must be returned untouched.           (catches AlwaysCuts)
    Ok(truncate("hello", 10) == "hello", "a short string must be unchanged");

    // EXACTLY at the limit: still untouched.      (catches BoundaryOff)
    Ok(truncate("hello", 5) == "hello", "text exactly maxLength must be unchanged");

    // Too long: cut to exactly maxLength.         (catches OffByOne)
    var cut = truncate("hello world", 8);
    Ok(cut.Length == 8, $"expected length 8, got {cut.Length} ({cut})");

    // …and it must be marked as cut.              (catches NoEllipsis)
    Ok(cut.EndsWith('…'), $"a truncated string must end with an ellipsis: {cut}");

    // Degenerate inputs must not throw.           (catches NullUnsafe)
    Ok(truncate(null, 5) == "", "null text must give an empty string");

    //                                             (catches NegativeUnsafe)
    Ok(truncate("hello", 0) == "", "maxLength 0 must give an empty string");
    Ok(truncate("hello", -1) == "", "a negative maxLength must give an empty string");
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("the check accepts the correct implementation", () =>
    CheckTruncate(Correct));

Test("it catches the off-by-one (result is one char too long)", () =>
    Throws(() => CheckTruncate(OffByOne)));

Test("it catches the missing ellipsis", () =>
    Throws(() => CheckTruncate(NoEllipsis)));

Test("it catches the one that mangles short strings", () =>
    Throws(() => CheckTruncate(AlwaysCuts)));

Test("it catches the one that crashes on null", () =>
    Throws(() => CheckTruncate(NullUnsafe)));

Test("it catches the one that throws on a non-positive length", () =>
    Throws(() => CheckTruncate(NegativeUnsafe)));

Test("it catches the one that is off by one at the BOUNDARY", () =>
    Throws(() => CheckTruncate(BoundaryOff)));

// ──────────────────────────── implementations ────────────────────────────

// The reference implementation. Meets the spec.
static string Correct(string? text, int maxLength)
{
    if (maxLength <= 0 || string.IsNullOrEmpty(text)) return "";
    return text.Length <= maxLength ? text : text[..(maxLength - 1)] + "…";
}

// Forgets that the ellipsis counts toward the limit.
static string OffByOne(string? text, int maxLength)
{
    if (maxLength <= 0 || string.IsNullOrEmpty(text)) return "";
    return text.Length <= maxLength ? text : text[..maxLength] + "…";
}

// Cuts to the right length but never adds the ellipsis.
static string NoEllipsis(string? text, int maxLength)
{
    if (maxLength <= 0 || string.IsNullOrEmpty(text)) return "";
    return text.Length <= maxLength ? text : text[..maxLength];
}

// Truncates even when the text already fits.
static string AlwaysCuts(string? text, int maxLength)
{
    if (maxLength <= 0 || string.IsNullOrEmpty(text)) return "";
    return text[..Math.Min(text.Length, Math.Max(maxLength - 1, 0))] + "…";
}

// Correct except that null blows up.
static string NullUnsafe(string? text, int maxLength)
{
    if (maxLength <= 0) return "";
    return text!.Length <= maxLength ? text : text[..(maxLength - 1)] + "…";
}

// Correct except that a non-positive length throws.
static string NegativeUnsafe(string? text, int maxLength)
{
    if (string.IsNullOrEmpty(text)) return "";
    return text.Length <= maxLength ? text : text[..(maxLength - 1)] + "…";
}

// Cuts when the text is EXACTLY maxLength — it should be left alone.
static string BoundaryOff(string? text, int maxLength)
{
    if (maxLength <= 0 || string.IsNullOrEmpty(text)) return "";
    return text.Length < maxLength ? text : text[..(maxLength - 1)] + "…";
}
