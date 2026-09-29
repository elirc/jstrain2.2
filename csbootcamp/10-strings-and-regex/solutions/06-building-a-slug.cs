// ─────────────────────────────────────────────────────────────────────────
//  06 · building a slug — SOLUTION                        ★★★ stretch
//  concepts: Unicode normalization · combining marks · StringBuilder
//  run: dotnet run 06-building-a-slug.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Turn a title into a URL slug: `"Café Life — Part 2!"` → `"cafe-life-part-2"`.
//
//  Which sounds like a `Replace` chain and is actually the one place a
//  working programmer meets Unicode normalization.
//
//  `é` can be stored two ways: as a single code point U+00E9, or as `e`
//  followed by U+0301 COMBINING ACUTE ACCENT. Both render identically and
//  neither is "wrong". `FormD` normalization decomposes to the second form,
//  which is what lets you strip accents:
//
//      text.Normalize(NormalizationForm.FormD)     é → e + ́
//      then drop every char whose UnicodeCategory
//      is NonSpacingMark                           → e
//
//  Without that step, `é` is a single character that is neither a letter you
//  recognise nor an ASCII one, and it either survives into the URL or gets
//  replaced by a dash.
//
//  The rules for the slug:
//
//      lowercase (invariantly)
//      ASCII letters and digits survive — a-z and 0-9, nothing else
//      accents are stripped to their base letter
//      everything else becomes a single dash
//      no leading, trailing or repeated dashes
//      an input with nothing usable in it gives ""
//
//  Walkthrough:
//  One loop, and four rules that each collapse into a single condition.
//
//  **`FormD` then drop `NonSpacingMark` is the accent-stripping idiom.**
//  Normalization form D decomposes every precomposed character into a base
//  letter plus its combining marks, so `é` becomes `e` + U+0301. The marks
//  are all in the `NonSpacingMark` Unicode category, so skipping that
//  category leaves the base letters behind. Three lines, and it handles every
//  accent rather than the six you thought of.
//
//  It also makes the two spellings of `é` produce the same slug — the
//  seventh test. Those two strings are genuinely different (`!=` is true) and
//  render identically, and text arriving from a Mac filesystem is often
//  decomposed where the same text from a form is composed. A slug generator
//  that did not normalise would give you two different URLs for what a user
//  sees as one title.
//
//  **`char.ToLowerInvariant`, not `ToLower`.** Same Turkish-I reason as
//  exercise 05: on a Turkish machine `ToLower('I')` gives a dotless `ı`,
//  which is not in `a`–`z` and would be dropped. The eighth test runs under
//  `tr-TR` specifically to catch that.
//
//  **The dash rule is enforced at append time, not cleaned up afterwards.**
//  `builder.Length > 0 && builder[^1] != '-'` refuses to write a leading dash
//  and refuses to write a second one in a row, so runs collapse and the
//  leading case never happens. That leaves exactly one thing to fix at the
//  end — a possible trailing dash — and `TrimEnd('-')` does it. The
//  alternative (append freely, then collapse with a regex and trim both ends)
//  is two more passes and a regex to get wrong.
//
//  **`is >= 'a' and <= 'z' or >= '0' and <= '9'`** is a range pattern, and it
//  is deliberately ASCII-only rather than `char.IsLetterOrDigit`. That is why
//  `"日本語 title"` becomes `"title"`: those characters ARE letters, so
//  `IsLetterOrDigit` would keep them and produce a URL that every system
//  downstream then percent-encodes into noise.
//
//  Dropping them is a defensible choice as long as it is a choice. A real
//  slug generator transliterates — `Slugify`, `AnyAscii` and similar
//  libraries carry the tables — and the empty-string result for an entirely
//  non-Latin title is the signal that you need one. Which is also why the
//  "nothing usable" case returns `""` rather than something invented: an
//  empty slug is a decision the caller has to make, and hiding it behind a
//  generated id would hide the problem too.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Globalization;
using System.Text;

string Slug(string title)
{
    // FormD splits é into e + combining acute, so the accent becomes a
    // separate character we can drop.
    var normalized = title.Normalize(NormalizationForm.FormD);
    var builder = new StringBuilder(normalized.Length);

    foreach (var character in normalized)
    {
        // The accents, now that they are separate.
        if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
            continue;

        // Invariant: ToLower() would turn 'I' into a dotless 'ı' in tr-TR.
        var lower = char.ToLowerInvariant(character);

        if (lower is >= 'a' and <= 'z' or >= '0' and <= '9')
            builder.Append(lower);

        // No leading dash, and never two in a row — enforced here rather
        // than cleaned up in a second pass.
        else if (builder.Length > 0 && builder[^1] != '-')
            builder.Append('-');
    }

    // The only case the append-time rule cannot prevent.
    return builder.ToString().TrimEnd('-');
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a simple title", () =>
    Eq(Slug("Hello World"), "hello-world"));

Test("punctuation becomes a separator", () =>
    Eq(Slug("Hello, World!"), "hello-world"));

Test("runs of rubbish collapse to ONE dash", () =>
    Eq(Slug("Hello   ---  World"), "hello-world"));

Test("no leading or trailing dashes", () =>
{
    Eq(Slug("  Hello World  "), "hello-world");
    Eq(Slug("!!!Hello!!!"), "hello");
});

Test("digits survive", () =>
    Eq(Slug("Part 2 of 3"), "part-2-of-3"));

Test("accents are stripped to their base letter", () =>
{
    Eq(Slug("Café Life"), "cafe-life");
    Eq(Slug("Crème Brûlée"), "creme-brulee");
    Eq(Slug("Ångström"), "angstrom");
});

Test("both encodings of the same accent give the same slug", () =>
{
    // "é" as one code point, and as "e" + combining acute. They look
    // identical and are different strings; the slug must not care.
    var composed = "Café";
    var decomposed = "Café";

    Ok(composed != decomposed, "these really are different strings");
    Eq(Slug(composed), Slug(decomposed));
    Eq(Slug(composed), "cafe");
});

Test("case folding is invariant", () =>
{
    var previous = CultureInfo.CurrentCulture;
    CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("tr-TR");

    try
    {
        // ToLower() on a Turkish machine turns "I" into a dotless "ı",
        // which is not an ASCII letter and would vanish.
        Eq(Slug("TITLE I"), "title-i");
    }
    finally
    {
        CultureInfo.CurrentCulture = previous;
    }
});

Test("an input with nothing usable is empty", () =>
{
    Eq(Slug("!!!"), "");
    Eq(Slug("   "), "");
    Eq(Slug(""), "");
});

Test("non-Latin script is dropped rather than mangled", () =>
{
    // A real slug generator would transliterate. This one keeps ASCII
    // letters and digits only, which is a defensible choice as long as it
    // is a CHOICE — the empty result is what tells you to think about it.
    Eq(Slug("日本語 title"), "title");
});
