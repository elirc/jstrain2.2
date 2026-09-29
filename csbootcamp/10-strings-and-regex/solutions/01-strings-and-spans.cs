// ─────────────────────────────────────────────────────────────────────────
//  01 · strings and spans — SOLUTION                      ★★☆ core
//  concepts: StringBuilder · ReadOnlySpan · comparison rules
//  run: dotnet run 01-strings-and-spans.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Strings are immutable, so every "change" allocates. Three tools stop that
//  from mattering:
//
//      StringBuilder      one growable buffer instead of n strings
//      ReadOnlySpan<char> a WINDOW over existing text — zero allocation
//      string.Create      build exactly once, in place
//
//  And one rule about comparison that catches everyone: **the default is not
//  ordinal.** `"a".CompareTo("B")` uses the current culture, so sorting can
//  differ between machines, and `ToLower()` in Turkish famously turns `I`
//  into a dotless `ı`. For anything internal — keys, identifiers, protocol
//  tokens — say `Ordinal` explicitly.
//
//  Walkthrough:
//  `JoinNonEmpty` appends the separator only when the buffer already has
//  content — the standard way to avoid a leading or trailing separator
//  without trimming afterwards. `StringBuilder` keeps one growable buffer, so
//  n parts cost one allocation rather than n intermediate strings.
//
//  `ParsePair` is the span exercise. `AsSpan()` gives a WINDOW over the
//  existing string: slicing and trimming it move indices rather than copying
//  characters, so the whole parse allocates nothing until the two
//  `ToString()` calls at the end — where a real string is genuinely needed.
//  With `Split` you allocate an array plus a string per part and throw most
//  of it away.
//
//  Note `IndexOf` rather than `Split`: the value may itself contain `=`
//  (a URL query string), so you want the FIRST separator only. `Split('=')`
//  would give three parts and the naive fix — `parts[1]` — silently truncates
//  the value.
//
//  `CountWords` walks the span with a small state machine and never
//  allocates. `text.ToString().Split(...)` gives the same answer, allocates a
//  string and an array, and is what you would reach for first. On a hot path
//  parsing millions of lines, this is the difference.
//
//  `SameIdentifier` is the one that bites in production.
//  `StringComparison.OrdinalIgnoreCase` compares by code point. The default
//  overload of `string.Equals(a, b)` is ordinal, but `ToLower()`,
//  `CompareTo`, and `string.Compare` are **culture-sensitive** — and in
//  Turkish, uppercase `i` is `Ä°` and lowercase `I` is `Ä±`, so a
//  culture-aware comparison decides `"ID"` and `"id"` are different words.
//  The last test forces `tr-TR` to prove the ordinal version survives it.
//
//  Rule: `Ordinal`/`OrdinalIgnoreCase` for anything internal — keys,
//  identifiers, protocol tokens, file paths. Culture-aware comparison is for
//  text you are showing to a human, and mainly for sorting.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text;

// Join the parts with `separator`, skipping null/blank ones, using a
// StringBuilder (not string.Join and not +=).
string JoinNonEmpty(string separator, params string?[] parts)
{
    var builder = new StringBuilder();

    foreach (var part in parts)
    {
        if (string.IsNullOrWhiteSpace(part)) continue;

        // Separator only when there is already something to separate from.
        if (builder.Length > 0) builder.Append(separator);
        builder.Append(part);
    }

    return builder.ToString();
}

// Parse "key=value" WITHOUT allocating substrings for the halves until the
// very end. Returns null for a malformed line.
KeyValuePair<string, string>? ParsePair(string line)
{
    var span = line.AsSpan();

    // FIRST separator only — the value may contain more.
    var at = span.IndexOf('=');
    if (at < 0) return null;

    // Slicing and trimming a span moves indices; nothing is copied.
    var key = span[..at].Trim();
    var value = span[(at + 1)..].Trim();
    if (key.IsEmpty) return null;

    // Materialise only now, when a real string is actually required.
    return new KeyValuePair<string, string>(key.ToString(), value.ToString());
}

// Count words separated by whitespace, without allocating an array.
int CountWords(ReadOnlySpan<char> text)
{
    var words = 0;
    var inWord = false;

    foreach (var c in text)
    {
        if (char.IsWhiteSpace(c)) { inWord = false; continue; }
        if (!inWord) { words++; inWord = true; }
    }

    return words;
}

// True when the two identifiers are the same, ignoring case, in a way that
// cannot vary by machine culture.
bool SameIdentifier(string a, string b)
    // Ordinal: compares code points, so no culture can reinterpret it.
    => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

// ──────────────────────────── tests ──────────────────────────────────────

Test("joins the parts", () =>
    Eq(JoinNonEmpty(", ", "a", "b", "c"), "a, b, c"));

Test("skips null, empty and whitespace parts", () =>
    Eq(JoinNonEmpty(", ", "a", null, "", "  ", "b"), "a, b"));

Test("one part has no separator", () => Eq(JoinNonEmpty(", ", "solo"), "solo"));

Test("nothing to join is an empty string", () =>
{
    Eq(JoinNonEmpty(", "), "");
    Eq(JoinNonEmpty(", ", null, "  "), "");
});

Test("parses a key=value pair", () =>
{
    var pair = ParsePair("host=localhost");

    Eq(pair?.Key, "host");
    Eq(pair?.Value, "localhost");
});

Test("trims around the separator", () =>
{
    var pair = ParsePair("  host  =  localhost  ");

    Eq(pair?.Key, "host");
    Eq(pair?.Value, "localhost");
});

Test("a value may itself contain =", () =>
    Eq(ParsePair("url=http://x/?a=b")?.Value, "http://x/?a=b"));

Test("a malformed line is null, not an exception", () =>
{
    Eq(ParsePair("no separator here"), null);
    Eq(ParsePair(""), null);
    Eq(ParsePair("=novalue"), null);      // empty key
});

Test("counts words over a span", () =>
{
    Eq(CountWords("one two three"), 3);
    Eq(CountWords("  padded   out  "), 2);
    Eq(CountWords("solo"), 1);
});

Test("an empty or blank span has no words", () =>
{
    Eq(CountWords(""), 0);
    Eq(CountWords("   "), 0);
});

Test("identifier comparison ignores case", () =>
{
    Ok(SameIdentifier("Host", "host"));
    Ok(SameIdentifier("HOST", "host"));
    Ok(!SameIdentifier("host", "hostname"));
});

Test("comparison does not depend on the machine's culture", () =>
{
    // The Turkish-I problem: a culture-sensitive comparison can decide
    // "I" and "i" are different letters. An ordinal one cannot.
    var previous = System.Globalization.CultureInfo.CurrentCulture;
    System.Globalization.CultureInfo.CurrentCulture =
        new System.Globalization.CultureInfo("tr-TR");
    try
    {
        Ok(SameIdentifier("ID", "id"));
    }
    finally
    {
        System.Globalization.CultureInfo.CurrentCulture = previous;
    }
});
