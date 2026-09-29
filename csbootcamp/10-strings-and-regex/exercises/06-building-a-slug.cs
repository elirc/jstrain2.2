// ─────────────────────────────────────────────────────────────────────────
//  06 · building a slug                                   ★★★ stretch
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
//  hint: build with a StringBuilder and never append a dash if the last
//        thing you appended was one — that removes the collapse pass entirely
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Globalization;
using System.Text;

string Slug(string title)
{
    throw new NotImplementedException();
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
