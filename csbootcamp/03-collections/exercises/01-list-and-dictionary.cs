// ─────────────────────────────────────────────────────────────────────────
//  01 · List and Dictionary                               ★☆☆ warm-up
//  concepts: the two workhorses · TryGetValue · O(1) vs O(n)
//  run: dotnet run 01-list-and-dictionary.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Ninety percent of C# collection code is `List<T>` and
//  `Dictionary<TKey, TValue>`. Knowing exactly what each costs is most of
//  what separates code that scales from code that looks identical and
//  doesn't:
//
//      list.Contains(x)      O(n)   — scans every element
//      dict.ContainsKey(x)   O(1)   — one hash lookup
//      list[i]               O(1)
//      list.Insert(0, x)     O(n)   — shifts everything right
//
//  A `List.Contains` inside a loop over another list is O(n²), and it is the
//  most common accidental quadratic in the language.
//
//  Build a small word index.
//
//  hint: `TryGetValue` does ONE lookup; `ContainsKey` then `[key]` does two
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Count how many times each word appears. Case-insensitive.
Dictionary<string, int> CountWords(params string[] words)
{
    throw new NotImplementedException();
}

// The words appearing more than once, alphabetically.
List<string> Repeated(Dictionary<string, int> counts)
{
    throw new NotImplementedException();
}

// Everything in `all` that is NOT in `exclude`, order preserved.
// Must be O(n + m), not O(n × m).
List<string> Except(List<string> all, List<string> exclude)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("counts each distinct word", () =>
    Eq(CountWords("a", "b", "a"), new Dictionary<string, int> { ["a"] = 2, ["b"] = 1 }));

Test("counting is case-insensitive, and the FIRST spelling is the key", () =>
{
    // An ignore-case comparer matches on lookup but stores whichever
    // spelling was inserted first — worth knowing when you round-trip keys.
    var counts = CountWords("Ada", "ada", "ADA");

    Eq(counts.Count, 1);
    Eq(counts["ADA"], 3);              // any spelling finds it
    Eq(counts.Keys.Single(), "Ada");   // but "Ada" is what is stored
});

Test("no words is an empty dictionary, not null", () =>
    Eq(CountWords(), new Dictionary<string, int>()));

Test("Repeated finds words seen more than once", () =>
    Eq(Repeated(CountWords("b", "a", "b", "c", "a")), new[] { "a", "b" }));

Test("Repeated is empty when everything is unique", () =>
    Eq(Repeated(CountWords("a", "b")), new List<string>()));

Test("Except removes the excluded words", () =>
    Eq(Except(["a", "b", "c"], ["b"]), new[] { "a", "c" }));

Test("Except preserves the original order", () =>
    Eq(Except(["c", "a", "b"], ["a"]), new[] { "c", "b" }));

Test("Except with nothing to exclude returns everything", () =>
    Eq(Except(["a", "b"], []), new[] { "a", "b" }));

Test("Except keeps duplicates that are not excluded", () =>
    Eq(Except(["a", "a", "b"], ["b"]), new[] { "a", "a" }));

Test("Except does not do a linear scan per item", () =>
{
    // A List.Contains inside the loop would be O(n × m). With 20k items
    // that is 400 million comparisons — this test would crawl.
    var all = Enumerable.Range(0, 20_000).Select(n => n.ToString()).ToList();
    var exclude = Enumerable.Range(0, 20_000).Where(n => n % 2 == 0)
                            .Select(n => n.ToString()).ToList();

    Eq(Except(all, exclude).Count, 10_000);
});
