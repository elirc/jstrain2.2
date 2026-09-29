// ─────────────────────────────────────────────────────────────────────────
//  01 · List and Dictionary — SOLUTION                    ★☆☆ warm-up
//  concepts: the two workhorses · TryGetValue · O(1) vs O(n)
//  run: dotnet run 01-list-and-dictionary.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `CountWords` uses `CollectionsMarshal`-free plain code: `TryGetValue` to
//  read and an indexer to write. The alternative everyone writes first —
//  `if (dict.ContainsKey(k)) dict[k]++ else dict[k] = 1` — hashes the key
//  **three** times for an existing word. `TryGetValue` hashes once, and the
//  assignment once. On a hot path that is the whole difference.
//
//  `StringComparer.OrdinalIgnoreCase` on the dictionary is better than
//  lowercasing every key by hand: no allocation per word, and the comparer
//  travels with the dictionary so a later `TryGetValue("ADA")` still works.
//  The test asserts the stored key is `"ada"` because the first spelling
//  seen becomes the stored one — worth knowing when you round-trip keys.
//
//  `Except` is the exercise. The obvious version:
//
//      all.Where(x => !exclude.Contains(x))     // O(n × m)
//
//  is correct and quadratic, because `List.Contains` scans. Converting
//  `exclude` to a `HashSet` first makes each lookup O(1), so the whole thing
//  is O(n + m). The last test uses 20k × 10k items — enough that the
//  quadratic version takes minutes and this one takes milliseconds. That is
//  the most common accidental O(n²) in C#, and it is invisible in review
//  because both versions read the same.
//
//  Note `Except` deliberately keeps duplicates. LINQ's own `Enumerable.Except`
//  also de-duplicates the result, which is a different operation and a common
//  surprise — if you want "remove these, keep everything else as-is", write
//  the filter.
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
    // The comparer travels with the dictionary — no per-word ToLower().
    var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

    foreach (var word in words)
    {
        // ONE hash to read, one to write. ContainsKey-then-indexer is three.
        counts.TryGetValue(word, out var seen);
        counts[word] = seen + 1;
    }
    return counts;
}

// The words appearing more than once, alphabetically.
List<string> Repeated(Dictionary<string, int> counts)
    => [.. counts.Where(kv => kv.Value > 1).Select(kv => kv.Key).OrderBy(k => k, StringComparer.Ordinal)];

// Everything in `all` that is NOT in `exclude`, order preserved.
// Must be O(n + m), not O(n × m).
List<string> Except(List<string> all, List<string> exclude)
{
    // O(m) to build, then O(1) per lookup → O(n + m) overall.
    // `exclude.Contains(x)` inside the filter would be O(n × m).
    var skip = new HashSet<string>(exclude);
    return [.. all.Where(x => !skip.Contains(x))];
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
