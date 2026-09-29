// ─────────────────────────────────────────────────────────────────────────
//  04 · ordering and comparers — SOLUTION                 ★★☆ core
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
//  Walkthrough:
//  **`ThenBy` is the difference between a defined order and a lucky one.**
//  `Ranked` and `ByScoreOnly` return the same scores in the same buckets; only
//  one of them says what happens inside a bucket. The third test pins the
//  unspecified case on purpose, to show that "unspecified" here still means
//  "input order" — because `OrderBy` is stable.
//
//  Do not build on that. `OrderBy` is stable and `List<T>.Sort` is not, so
//  the same data through the same two-line "sort by score" gives different
//  answers depending on which one someone reached for. If the tiebreak
//  matters, write it.
//
//  **`OrderByDescending` reverses the comparison, not the sequence.** Zoe
//  came in before Bob and comes out before Bob, both on 50. People expect
//  descending to flip ties too, and it does not.
//
//  **`Comparer<T>.Create` saves a class.** Before it existed, every ad-hoc
//  ordering meant declaring a type that implemented `IComparer<T>` for one
//  call site. The contract of `Compare` is the only thing to get right:
//  negative if `a` sorts first, zero if they tie, positive otherwise.
//
//  It has to be **consistent** — if `Compare(a, b) < 0` then `Compare(b, a)`
//  must be `> 0`, and the relation has to be transitive. `Sort` on an
//  inconsistent comparer does not merely give a strange order; it can throw
//  `InvalidOperationException: IComparer.Compare() method returns
//  inconsistent results`, usually in production and never in your test.
//
//  **`string.CompareOrdinal` rather than `a.CompareTo(b)`.** `CompareTo` is
//  culture-aware, so its answer depends on the machine's locale — the classic
//  version of this bug is a Turkish machine where "I".ToLower() is not "i".
//  For anything a machine consumes, ordinal is the right answer; save
//  culture-aware comparison for text you are showing a person.
//
//  **The dictionary's comparer decides identity, not storage.**
//  `StringComparer.OrdinalIgnoreCase` makes "Ada" and "ADA" the same key, so
//  the count merges — but the stored key keeps the FIRST spelling, because
//  the dictionary has no reason to overwrite a key that already matches. That
//  is the last test, and it is a real source of "why does the export show the
//  wrong capitalisation".
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Highest score first; ties broken by name, ascending.
List<Player> Ranked(List<Player> players) =>
    players
        .OrderByDescending(player => player.Score)
        .ThenBy(player => player.Name, StringComparer.Ordinal)
        .ToList();

// Highest score first, and NOTHING else — no tiebreak. Used to show that
// equal elements keep their input order.
// No tiebreak — and because OrderBy is stable, ties come out in input
// order. True, and not something to build on.
List<Player> ByScoreOnly(List<Player> players) =>
    players.OrderByDescending(player => player.Score).ToList();

// A comparer that orders strings by LENGTH, then ordinally. Return it; the
// tests will hand it to Sort and to OrderBy.
IComparer<string> ByLengthThenText() =>
    Comparer<string>.Create((a, b) =>
        a.Length != b.Length
            ? a.Length.CompareTo(b.Length)
            // Ordinal, not CompareTo: culture-aware ordering varies by machine.
            : string.CompareOrdinal(a, b));

// Count the words, treating differently-cased spellings as the same word.
Dictionary<string, int> CountIgnoringCase(params string[] words)
{
    // The comparer decides which keys are EQUAL. It does not rewrite a key
    // that is already stored, so the first spelling is the one you get back.
    var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

    foreach (var word in words)
        counts[word] = counts.GetValueOrDefault(word) + 1;

    return counts;
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
