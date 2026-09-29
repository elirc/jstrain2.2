// ─────────────────────────────────────────────────────────────────────────
//  02 · regex — SOLUTION                                  ★★☆ core
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
//  Walkthrough:
//  The anchor test is the one that matters most. `^[A-Z]{3}-[0-9]{4}$`
//  without the `^` and `$` matches `"say ABC-1234 please"` — because
//  `IsMatch` asks whether the pattern occurs ANYWHERE, not whether the input
//  IS the pattern. A validator missing its anchors accepts everything that
//  merely contains something valid, which is how a "validated" SKU column
//  ends up full of sentences.
//
//  Named groups (`(?<year>\d{4})`) survive edits. Positional `groups[1]`
//  silently shifts the day someone adds a group earlier in the pattern, and
//  nothing fails — you just start reading the wrong capture.
//
//  The patterns are `static readonly Regex` fields, built once. The static
//  helpers (`Regex.IsMatch(input, pattern)`) re-parse the pattern on every
//  call — there is an internal cache, but it is small and keyed by pattern
//  string, so a hot loop can thrash it. In real .NET 7+ code, prefer
//  `[GeneratedRegex]` on a partial method: the matcher is generated at BUILD
//  time, so there is no startup parse, no runtime codegen, and a malformed
//  pattern is a compile error rather than an exception on first use. (This
//  file uses fields because a file-based app has no partial class to hang the
//  attribute on.)
//
//  Note the **timeout** on every pattern. Catastrophic backtracking —
//  nested quantifiers over overlapping classes, like `(a+)+$` — can take
//  exponential time on a non-matching input, which is a denial-of-service
//  vector whenever the pattern touches user input. The patterns here are
//  linear and cannot backtrack badly, but the timeout costs nothing and is
//  the difference between a slow request and a pinned CPU.
//
//  `Squash` shows the other use of regex: `Replace` with `\s+` collapses
//  runs in one pass. Module 01/04 did the same job with `Split` +
//  `string.Join`, which is faster for this specific case — regex earns its
//  keep when the pattern is genuinely irregular, not for every string job.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text.RegularExpressions;

// True only when the WHOLE string is a valid SKU: three uppercase letters,
// a hyphen, four digits. "ABC-1234".
bool IsSku(string input) => Patterns.Sku.IsMatch(input);

// Pull the parts out of an ISO date "2026-03-01" using NAMED groups.
// Null when it does not match.
(int Year, int Month, int Day)? ParseDate(string input)
{
    var match = Patterns.IsoDate.Match(input);
    if (!match.Success) return null;

    // Named groups survive someone adding a group earlier in the pattern.
    return (int.Parse(match.Groups["year"].Value),
            int.Parse(match.Groups["month"].Value),
            int.Parse(match.Groups["day"].Value));
}

// Every hashtag in the text, without the '#', in order, no duplicates.
List<string> Hashtags(string text)
{
    var seen = new HashSet<string>();
    var tags = new List<string>();

    foreach (Match match in Patterns.Hashtag.Matches(text))
    {
        var tag = match.Groups[1].Value;
        if (seen.Add(tag)) tags.Add(tag);   // dedupe, keep first-seen order
    }

    return tags;
}

// Replace every run of whitespace with a single space, and trim.
string Squash(string text) => Patterns.WhitespaceRun.Replace(text, " ").Trim();

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

// ──────────────────────────── types ──────────────────────────────────────

// Compiled ONCE. Top-level statements cannot declare static fields, so the
// patterns live in a static class — which is also how you would share them
// across a real codebase. In a normal project prefer [GeneratedRegex] on a
// partial method: the matcher is built at COMPILE time.
static class Patterns
{
    private static readonly TimeSpan Limit = TimeSpan.FromSeconds(1);

    // ^...$ is what makes this a validator rather than a "contains" check.
    public static readonly Regex Sku =
        new(@"^[A-Z]{3}-[0-9]{4}$", RegexOptions.None, Limit);

    public static readonly Regex IsoDate =
        new(@"^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$", RegexOptions.None, Limit);

    public static readonly Regex Hashtag = new(@"#(\w+)", RegexOptions.None, Limit);

    public static readonly Regex WhitespaceRun = new(@"\s+", RegexOptions.None, Limit);
}
