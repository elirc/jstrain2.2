// ─────────────────────────────────────────────────────────────────────────
//  02 · regex                                             ★★☆ core
//  concepts: named groups · anchors · source generation · ReDoS
//  run: dotnet run 02-regex.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Three things separate a regex that works from one that ships safely:
//
//  **Anchors.** `IsMatch("abc123def")` against `\d+` is TRUE — the pattern
//  matches *somewhere*. Validation almost always wants `^...$`, or the check
//  passes for input that merely contains something valid.
//
//  **Named groups.** `(?<year>\d{4})` beats `groups[1]`, which breaks the day
//  someone adds a group in the middle.
//
//  **Compilation.** `[GeneratedRegex]` compiles the pattern at BUILD time —
//  no parsing at startup, no runtime codegen, and a compile error if the
//  pattern is malformed rather than an exception on first use.
//
//  And one hazard: **catastrophic backtracking**. Nested quantifiers over
//  overlapping character classes — `(a+)+$` — can take exponential time on a
//  non-matching input. That is a denial-of-service vector if the pattern
//  touches user input. Always set a timeout, or write a pattern that cannot
//  backtrack.
//
//  hint: `Regex.IsMatch(input, pattern)` re-parses every call; a static
//        readonly field or [GeneratedRegex] does it once
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text.RegularExpressions;

// True only when the WHOLE string is a valid SKU: three uppercase letters,
// a hyphen, four digits. "ABC-1234".
bool IsSku(string input)
{
    throw new NotImplementedException();
}

// Pull the parts out of an ISO date "2026-03-01" using NAMED groups.
// Null when it does not match.
(int Year, int Month, int Day)? ParseDate(string input)
{
    throw new NotImplementedException();
}

// Every hashtag in the text, without the '#', in order, no duplicates.
List<string> Hashtags(string text)
{
    throw new NotImplementedException();
}

// Replace every run of whitespace with a single space, and trim.
string Squash(string text)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a valid SKU matches", () => Ok(IsSku("ABC-1234")));

Test("anchors reject a SKU embedded in other text", () =>
{
    // Without ^ and $ these would all pass, because the pattern matches
    // SOMEWHERE inside them.
    Ok(!IsSku("xABC-1234"));
    Ok(!IsSku("ABC-1234x"));
    Ok(!IsSku("say ABC-1234 please"));
});

Test("the shape is enforced exactly", () =>
{
    Ok(!IsSku("AB-1234"));      // too few letters
    Ok(!IsSku("ABC-123"));      // too few digits
    Ok(!IsSku("abc-1234"));     // wrong case
    Ok(!IsSku(""));
});

Test("named groups extract the date parts", () =>
{
    var parsed = ParseDate("2026-03-01");

    Eq(parsed?.Year, 2026);
    Eq(parsed?.Month, 3);
    Eq(parsed?.Day, 1);
});

Test("a non-date is null", () =>
{
    Eq(ParseDate("not a date"), null);
    Eq(ParseDate("2026-3-1"), null);     // not zero-padded
});

Test("finds every hashtag", () =>
    Eq(Hashtags("hello #csharp and #dotnet"), new[] { "csharp", "dotnet" }));

Test("hashtags are deduplicated, keeping first-seen order", () =>
    Eq(Hashtags("#b #a #b #c"), new[] { "b", "a", "c" }));

Test("text with no hashtags gives an empty list", () =>
    Eq(Hashtags("nothing here"), new List<string>()));

Test("a lone # is not a hashtag", () =>
    Eq(Hashtags("# #ok"), new[] { "ok" }));

Test("Squash collapses whitespace runs", () =>
{
    Eq(Squash("a   b\t\tc"), "a b c");
    Eq(Squash("  padded  "), "padded");
    Eq(Squash("already fine"), "already fine");
});

Test("Squash handles empty and blank input", () =>
{
    Eq(Squash(""), "");
    Eq(Squash("   "), "");
});

Test("a compiled pattern is reused, not re-parsed per call", () =>
{
    // Correctness check on the same instance being used repeatedly.
    for (var i = 0; i < 1000; i++) Ok(IsSku("ABC-1234"));
});
