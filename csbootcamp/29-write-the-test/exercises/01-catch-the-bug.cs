// ─────────────────────────────────────────────────────────────────────────
//  01 · catch the bug                                     ★★★ stretch
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
//  hint: for each bug, ask "what input would tell these two apart?"
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Throw (any exception) if `truncate` does not meet the spec above.
// Return normally if it does.
void CheckTruncate(Func<string?, int, string> truncate)
{
    throw new NotImplementedException();
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
