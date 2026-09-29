// ─────────────────────────────────────────────────────────────────────────
//  01 · strings and spans                                 ★★☆ core
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
//  hint: `AsSpan()` slices without copying, so `Trim` on a span costs nothing
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text;

// Join the parts with `separator`, skipping null/blank ones, using a
// StringBuilder (not string.Join and not +=).
string JoinNonEmpty(string separator, params string?[] parts)
{
    throw new NotImplementedException();
}

// Parse "key=value" WITHOUT allocating substrings for the halves until the
// very end. Returns null for a malformed line.
KeyValuePair<string, string>? ParsePair(string line)
{
    throw new NotImplementedException();
}

// Count words separated by whitespace, without allocating an array.
int CountWords(ReadOnlySpan<char> text)
{
    throw new NotImplementedException();
}

// True when the two identifiers are the same, ignoring case, in a way that
// cannot vary by machine culture.
bool SameIdentifier(string a, string b)
{
    throw new NotImplementedException();
}

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
