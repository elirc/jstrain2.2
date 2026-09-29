// ─────────────────────────────────────────────────────────────────────────
//  04 · string fundamentals — SOLUTION                    ★☆☆ warm-up
//  concepts: immutability · Split/Join/Trim · StringBuilder
//  run: dotnet run 04-string-fundamentals.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Slugify is a filter-then-split-then-join pipeline. Filtering FIRST turns
//  "what's" into "whats" — one word. Splitting first would leave the
//  apostrophe inside a token and you would have to clean up afterwards.
//  Punctuation becomes a space rather than nothing only where you want a
//  word break; here dropping it entirely is what the tests ask for, so
//  "what's" stays one word.
//
//  RemoveEmptyEntries is what makes "  Hello   World! " work without a
//  separate Trim: a run of three spaces produces empty tokens, and the
//  option discards them. That also makes the all-whitespace case fall out
//  as an empty array, and string.Join over an empty array is "".
//
//  Repeat uses StringBuilder because += in a loop allocates a fresh string
//  every iteration — O(n²) copying for what should be O(n). StringBuilder
//  keeps one growable buffer and produces the string once, at ToString().
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text;

string Slugify(string input)
{
    var cleaned = new string(input
        .Where(c => char.IsLetterOrDigit(c) || char.IsWhiteSpace(c))
        .ToArray());

    var words = cleaned.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
    return string.Join("-", words).ToLowerInvariant();
}

string Initials(string fullName)
{
    var words = fullName.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
    return string.Concat(words.Select(w => char.ToUpperInvariant(w[0])));
}

string Repeat(string text, int times)
{
    var sb = new StringBuilder(text.Length * Math.Max(times, 0));
    for (var i = 0; i < times; i++) sb.Append(text);
    return sb.ToString();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("Slugify lowercases and hyphenates", () =>
    Eq(Slugify("Hello World"), "hello-world"));

Test("Slugify trims and collapses whitespace", () =>
    Eq(Slugify("  Hello   World! "), "hello-world"));

Test("Slugify drops punctuation but keeps digits", () =>
    Eq(Slugify("C# 12: what's new?"), "c-12-whats-new"));

Test("Slugify of an empty string is empty", () =>
    Eq(Slugify("   "), ""));

Test("Initials takes the first letter of each word", () =>
    Eq(Initials("ada lovelace"), "AL"));

Test("Initials handles a single name", () =>
    Eq(Initials("prince"), "P"));

Test("Repeat concatenates n times", () =>
    Eq(Repeat("ab", 3), "ababab"));

Test("Repeat zero times is empty", () =>
    Eq(Repeat("ab", 0), ""));
