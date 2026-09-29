// ─────────────────────────────────────────────────────────────────────────
//  05 · comparison and search                             ★★☆ core
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
//  hint: `ToLowerInvariant()` exists precisely so that "case-fold for
//        comparison" and "case-fold for display" are different calls
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Globalization;

// Case-insensitive equality that is safe for identifiers.
bool SameIdentifier(string a, string b)
{
    throw new NotImplementedException();
}

// Does the path end with this extension? Case-insensitive, culture-proof.
bool HasExtension(string path, string extension)
{
    throw new NotImplementedException();
}

// The index of the first occurrence, case-insensitive and ordinal.
// -1 when there is none.
int FindOrdinal(string haystack, string needle)
{
    throw new NotImplementedException();
}

// Sort names the way a person in this culture expects.
List<string> SortedForPeople(List<string> names, CultureInfo culture)
{
    throw new NotImplementedException();
}

// Sort ids the way a machine expects: stable everywhere, ordinal.
List<string> SortedForMachines(List<string> ids)
{
    throw new NotImplementedException();
}

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
