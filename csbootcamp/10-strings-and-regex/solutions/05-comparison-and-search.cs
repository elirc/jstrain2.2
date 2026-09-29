// ─────────────────────────────────────────────────────────────────────────
//  05 · comparison and search — SOLUTION                  ★★☆ core
//  concepts: StringComparison · ordinal vs culture · the Turkish I
//  run: dotnet run 05-comparison-and-search.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Every string comparison in .NET takes an optional `StringComparison`, and
//  the default is not the same for every method. `==` and `Equals` are
//  ordinal; `StartsWith`, `EndsWith`, `IndexOf` and `Compare` are **culture-
//  aware** unless you say otherwise. That inconsistency is the source of a
//  whole family of bugs.
//
//      Ordinal                  byte-for-byte. Fast, exact, culture-proof.
//      OrdinalIgnoreCase        the same, case-folded invariantly.
//      InvariantCulture         linguistic rules, fixed everywhere.
//      CurrentCulture           linguistic rules from the OS. Varies.
//
//  **Use Ordinal for identifiers**: file paths, URLs, header names, ids,
//  anything a machine produced. Use a culture-aware comparison only for text
//  you are sorting or searching for a person to read.
//
//  The classic failure is the **Turkish I**: in `tr-TR`, `"I".ToLower()` is
//  `"ı"` (dotless) and `"i".ToUpper()` is `"İ"` (dotted). So
//  `"FILE".ToLower() == "file"` is FALSE on a Turkish machine, and a
//  security check written that way lets something through.
//
//  Walkthrough:
//  Five one-liners, and every one of them is a `StringComparison` or a
//  `StringComparer` argument that most code omits.
//
//  **The Turkish test is not a curiosity.** In `tr-TR`, `"I".ToLower()` is
//  `"ı"` — a dotless i, a different character. So the extremely common
//  `a.ToLower() == b.ToLower()` returns false for `"FILE"` and `"file"` on a
//  Turkish machine. That pattern has shipped in authentication code, in file
//  extension checks, and in header parsing, and it fails only for users whose
//  locale you never tested.
//
//  `StringComparison.OrdinalIgnoreCase` does not case-fold linguistically —
//  it maps ASCII case pairs directly — so it is immune. `ToLowerInvariant()`
//  is the other safe spelling when you genuinely need a folded string rather
//  than a comparison.
//
//  **The defaults are inconsistent, which is the real trap.** `==` and
//  `Equals(string)` are ordinal. `StartsWith`, `EndsWith`, `IndexOf` and
//  `Compare` are **culture-aware by default**. So swapping `s == "x"` for
//  `s.StartsWith("x")` quietly changes which rules apply, and nothing in the
//  code says so. Passing the comparison explicitly on every one of these
//  calls is not verbosity; it is the only way to know what the code does.
//
//  Culture-aware comparison can also do things you would not expect at all —
//  in some cultures certain characters compare as equal to a two-character
//  sequence, and an `IndexOf` can return a match of a different length than
//  the needle.
//
//  **`HasExtension` uses `EndsWith`, not `Contains`.** The third test —
//  `"report.pdf.exe"` — is the reason. A `Contains` check there returns true,
//  and "this file is a PDF" is exactly the kind of conclusion that a
//  double-extension attack is built on.
//
//  **The two sorts show the trade honestly.** `SortedForMachines` puts `"B"`,
//  `"Z"`, `"a"` in that order, because that is the order of the code points —
//  correct, stable everywhere, and obviously wrong to a human reader.
//  `SortedForPeople` gives `Apple, banana, cherry`, which is what a person
//  expects and depends on a culture. Neither is the right default; the
//  question is always who is reading.
//
//  `FindOrdinal("Hello", "")` returning `0` is the documented behaviour of
//  `IndexOf`: the empty string occurs at every position, and the first one is
//  zero. Worth knowing because a search box that submits nothing then matches
//  everything.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Globalization;

// Case-insensitive equality that is safe for identifiers.
// OrdinalIgnoreCase, never a.ToLower() == b.ToLower(): the latter is the
// Turkish-I bug.
bool SameIdentifier(string a, string b) =>
    string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

// Does the path end with this extension? Case-insensitive, culture-proof.
// EndsWith, not Contains — "report.pdf.exe" is not a PDF.
bool HasExtension(string path, string extension) =>
    path.EndsWith(extension, StringComparison.OrdinalIgnoreCase);

// The index of the first occurrence, case-insensitive and ordinal.
// -1 when there is none.
// IndexOf defaults to CULTURE-aware. This one says otherwise, explicitly.
int FindOrdinal(string haystack, string needle) =>
    haystack.IndexOf(needle, StringComparison.OrdinalIgnoreCase);

// Sort names the way a person in this culture expects.
List<string> SortedForPeople(List<string> names, CultureInfo culture) =>
    names.OrderBy(name => name, StringComparer.Create(culture, ignoreCase: false)).ToList();

// Sort ids the way a machine expects: stable everywhere, ordinal.
// Stable on every machine, and deliberately not what a person expects.
List<string> SortedForMachines(List<string> ids) =>
    ids.OrderBy(id => id, StringComparer.Ordinal).ToList();

// ──────────────────────────── tests ──────────────────────────────────────

Test("identifiers compare case-insensitively", () =>
{
    Ok(SameIdentifier("Content-Type", "content-type"));
    Ok(SameIdentifier("FILE", "file"));
    Ok(!SameIdentifier("file", "files"));
});

Test("...and survive a Turkish machine", () =>
{
    // ToLower() here would give "fıle" and the comparison would fail. This
    // is a real bug class, and it has shipped in real authentication code.
    var previous = CultureInfo.CurrentCulture;
    CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("tr-TR");

    try
    {
        Ok(SameIdentifier("FILE", "file"), "the Turkish I broke it");
        Ok(HasExtension("REPORT.PDF", ".pdf"));
    }
    finally
    {
        CultureInfo.CurrentCulture = previous;
    }
});

Test("extensions match regardless of case", () =>
{
    Ok(HasExtension("report.PDF", ".pdf"));
    Ok(HasExtension("report.pdf", ".PDF"));
    Ok(!HasExtension("report.pdf.exe", ".pdf"), "it must be the END of the name");
});

Test("FindOrdinal finds and reports -1", () =>
{
    Eq(FindOrdinal("Hello World", "world"), 6);
    Eq(FindOrdinal("Hello World", "HELLO"), 0);
    Eq(FindOrdinal("Hello", "z"), -1);
});

Test("an empty needle is found at 0", () =>
    Eq(FindOrdinal("Hello", ""), 0));

Test("people-sorting is linguistic", () =>
{
    // Ordinal would put every capital letter before every lowercase one,
    // because that is the order the code points happen to be in.
    Eq(SortedForPeople(["banana", "Apple", "cherry"], CultureInfo.InvariantCulture),
       new[] { "Apple", "banana", "cherry" });
});

Test("machine-sorting is ordinal, and looks wrong to a person", () =>
{
    // "Z" (90) sorts before "a" (97). That is correct for a machine and
    // completely wrong for a name list — which is the whole distinction.
    Eq(SortedForMachines(["a", "Z", "B"]), new[] { "B", "Z", "a" });
});

Test("machine-sorting does not move when the culture does", () =>
{
    var previous = CultureInfo.CurrentCulture;
    CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("tr-TR");

    try
    {
        Eq(SortedForMachines(["a", "Z", "B"]), new[] { "B", "Z", "a" });
    }
    finally
    {
        CultureInfo.CurrentCulture = previous;
    }
});
