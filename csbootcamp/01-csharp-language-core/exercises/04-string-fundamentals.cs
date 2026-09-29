// ─────────────────────────────────────────────────────────────────────────
//  04 · string fundamentals                               ★☆☆ warm-up
//  concepts: immutability · Split/Join/Trim · StringBuilder
//  run: dotnet run 04-string-fundamentals.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Strings in C# are immutable. Every "modification" allocates a new string
//  and leaves the old one alone, which is why building a string in a loop
//  with += is the classic performance trap — n concatenations allocate n
//  strings to produce one answer.
//
//      Slugify("  Hello   World! ")  → "hello-world"
//      Initials("ada lovelace")      → "AL"
//      Repeat("ab", 3)               → "ababab"
//
//  Slugify: trim, lowercase, drop anything that is not a letter, digit or
//  space, and join the remaining words with a single hyphen.
//
//  hint: Split with StringSplitOptions.RemoveEmptyEntries collapses runs
//        of whitespace for you
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text;

string Slugify(string input)
{
    throw new NotImplementedException();
}

// First letter of each whitespace-separated word, uppercased.
string Initials(string fullName)
{
    throw new NotImplementedException();
}

// Build the repeated string WITHOUT using string.Concat/Enumerable.Repeat —
// use a StringBuilder, so the allocation cost is one buffer, not n strings.
string Repeat(string text, int times)
{
    throw new NotImplementedException();
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
