// ─────────────────────────────────────────────────────────────────────────
//  05 · normalise before you validate                     ★★☆ core
//  concepts: trimming · canonical form · validate the stored value
//  run: dotnet run 05-normalise-before-validate.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Users type `"  Ada@Example.COM "`. Three separate bugs follow if you just
//  validate it and move on:
//
//    · `"ada@example.com"` and `"Ada@Example.COM"` become two accounts
//    · `[MinLength(2)]` passes for `"  "` — two characters, no content
//    · a lookup by the trimmed value later misses the stored untrimmed one
//
//  The rule: **normalise into canonical form FIRST, then validate, then
//  store the normalised value.** Validating one string and storing a
//  different one is how a "validated" record ends up invalid.
//
//  Build a normaliser and a pipeline:
//
//      Normalise("  Ada@Example.COM ")  → "ada@example.com"
//      Normalise("  Ada  Lovelace  ")   → "Ada Lovelace"   (inner runs
//                                          collapsed, not just trimmed)
//      Process(raw)                     → Ok(normalised) or the error list
//
//  `Process` must validate the NORMALISED value, and report errors against
//  it — so a whitespace-only name fails [Required], not [MinLength].
//
//  hint: string.Join(" ", s.Split(default(char[]),
//        StringSplitOptions.RemoveEmptyEntries)) collapses inner runs
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.ComponentModel.DataAnnotations;

// Trim, collapse internal whitespace runs to a single space. Null → "".
string Normalise(string? value)
{
    throw new NotImplementedException();
}

// Lowercase for case-insensitive identifiers, after normalising.
string NormaliseEmail(string? value)
{
    throw new NotImplementedException();
}

// Normalise the input, validate the RESULT, and return either the cleaned
// signup or the sorted error messages.
(Signup? Value, List<string> Errors) Process(string? name, string? email)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("Normalise trims", () =>
    Eq(Normalise("  Ada  "), "Ada"));

Test("Normalise collapses internal runs", () =>
    Eq(Normalise("  Ada    Lovelace  "), "Ada Lovelace"));

Test("Normalise handles tabs and newlines, not just spaces", () =>
    Eq(Normalise("Ada\t\n  Lovelace"), "Ada Lovelace"));

Test("Normalise of null or blank is empty", () =>
{
    Eq(Normalise(null), "");
    Eq(Normalise("   "), "");
});

Test("NormaliseEmail lowercases and trims", () =>
    Eq(NormaliseEmail("  Ada@Example.COM "), "ada@example.com"));

Test("two spellings of one email normalise to the same key", () =>
{
    // Otherwise they become two accounts.
    Eq(NormaliseEmail("ADA@EXAMPLE.COM"), NormaliseEmail(" ada@example.com "));
});

Test("a good signup comes back cleaned", () =>
{
    var (value, errors) = Process("  Ada  Lovelace ", "  Ada@Example.COM ");

    Eq(errors, new List<string>());
    Eq(value, new Signup("Ada Lovelace", "ada@example.com"));
});

Test("the STORED value is the normalised one", () =>
{
    var (value, _) = Process("Ada\tLovelace", "ADA@EXAMPLE.COM");

    // Not the raw input — validating one string and storing another is the
    // bug this exercise exists to prevent.
    Eq(value!.Name, "Ada Lovelace");
    Eq(value.Email, "ada@example.com");
});

Test("whitespace-only input fails Required, not MinLength", () =>
{
    // "  " normalises to "" first, so [Required] is what catches it.
    var (value, errors) = Process("   ", "ada@example.com");

    Eq(value, null);
    Eq(errors, new[] { "Name: Name is required" });
});

Test("an invalid email is reported after normalising", () =>
{
    var (_, errors) = Process("Ada", "  NOT-AN-EMAIL ");

    Eq(errors, new[] { "Email: Email must be a valid address" });
});

Test("several errors are reported together, sorted", () =>
{
    var (value, errors) = Process("", "nope");

    Eq(value, null);
    Eq(errors, new[]
    {
        "Email: Email must be a valid address",
        "Name: Name is required",
    });
});

// ──────────────────────────── types ──────────────────────────────────────

public record Signup(
    [property: Required(ErrorMessage = "Name is required")]
    string Name,

    [property: Required(ErrorMessage = "Email is required")]
    [property: EmailAddress(ErrorMessage = "Email must be a valid address")]
    string Email);
