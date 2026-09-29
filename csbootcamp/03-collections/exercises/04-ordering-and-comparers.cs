// ─────────────────────────────────────────────────────────────────────────
//  04 · ordering and comparers                            ★★☆ core
//  concepts: stable sorts · IComparer · equality comparers · ThenBy
//  run: dotnet run 04-ordering-and-comparers.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Two different jobs, two different interfaces, and mixing them up is a
//  common source of "why is this collection behaving oddly":
//
//      IComparer<T>           ORDER   — is a before b?      sorting
//      IEqualityComparer<T>   IDENTITY — is a the same as b? sets, dictionaries
//
//  Three facts about ordering in .NET that decide most of this exercise:
//
//   1. **`OrderBy` is stable.** Elements that compare equal keep their
//      original relative order. `List<T>.Sort()` is NOT — it is an unstable
//      introsort, and equal elements can come out in any order.
//   2. **`OrderByDescending` does not reverse ties.** It reverses the
//      comparison, not the sequence, so equal elements stay in input order.
//   3. **String comparison has a culture.** `"a".CompareTo("B")` differs
//      between ordinal and culture-aware comparison, and the culture one
//      differs between machines. For anything a machine reads, use
//      `StringComparer.Ordinal`.
//
//  hint: `Comparer<T>.Create((a, b) => …)` turns a lambda into an IComparer
//        without declaring a class
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Highest score first; ties broken by name, ascending.
List<Player> Ranked(List<Player> players)
{
    throw new NotImplementedException();
}

// Highest score first, and NOTHING else — no tiebreak. Used to show that
// equal elements keep their input order.
List<Player> ByScoreOnly(List<Player> players)
{
    throw new NotImplementedException();
}

// A comparer that orders strings by LENGTH, then ordinally. Return it; the
// tests will hand it to Sort and to OrderBy.
IComparer<string> ByLengthThenText()
{
    throw new NotImplementedException();
}

// Count the words, treating differently-cased spellings as the same word.
Dictionary<string, int> CountIgnoringCase(params string[] words)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

var players = new List<Player>
{
    new("Zoe", 50), new("Ada", 90), new("Bob", 50), new("Cy", 90),
};

Test("ranking is by score descending", () =>
    Eq(Ranked(players).Select(p => p.Score), new[] { 90, 90, 50, 50 }));

Test("ties are broken by name", () =>
    Eq(Ranked(players).Select(p => p.Name), new[] { "Ada", "Cy", "Bob", "Zoe" }));

Test("without a tiebreak, equal elements keep their INPUT order", () =>
{
    // OrderByDescending reverses the comparison, not the sequence. Zoe was
    // before Bob going in, so she is before Bob coming out.
    Eq(ByScoreOnly(players).Select(p => p.Name), new[] { "Ada", "Cy", "Zoe", "Bob" });
});

Test("the comparer orders by length first", () =>
{
    var words = new List<string> { "pear", "fig", "apple", "kiwi" };
    words.Sort(ByLengthThenText());

    Eq(words, new[] { "fig", "kiwi", "pear", "apple" });
});

Test("the same comparer works with OrderBy", () =>
    Eq(new[] { "bb", "a", "cc" }.OrderBy(w => w, ByLengthThenText()),
       new[] { "a", "bb", "cc" }));

Test("equal lengths fall back to ordinal order", () =>
    Eq(new[] { "cat", "ant", "bee" }.OrderBy(w => w, ByLengthThenText()),
       new[] { "ant", "bee", "cat" }));

Test("case-insensitive counting merges the spellings", () =>
{
    var counts = CountIgnoringCase("Ada", "ada", "ADA", "bob");

    Eq(counts.Count, 2);
    Eq(counts["ada"], 3);
    Eq(counts["ADA"], 3);
});

Test("the stored key is the FIRST spelling seen", () =>
{
    // The comparer decides which keys are equal. It does not rewrite a key
    // that is already there — so the capitalisation you get back is
    // whichever one arrived first.
    var counts = CountIgnoringCase("Ada", "ada", "ADA");

    Eq(counts.Keys.Single(), "Ada");
});

// ──────────────────────────── types ──────────────────────────────────────

public record Player(string Name, int Score);
