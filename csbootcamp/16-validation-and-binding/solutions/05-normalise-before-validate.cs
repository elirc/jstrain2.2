// ─────────────────────────────────────────────────────────────────────────
//  05 · normalise before you validate — SOLUTION          ★★☆ core
//  concepts: trimming · canonical form · validate the stored value
//  run: dotnet run 05-normalise-before-validate.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `Process` does three things in a fixed order, and the order is the whole
//  exercise: **normalise → validate → return the normalised value.**
//
//  Get that order wrong in either direction and you get a real bug:
//
//    · validate-then-normalise means you validated a string you did not
//      store. `"  "` passes `[MinLength(2)]` and lands in the database as
//      `""` after trimming — a "validated" record that is invalid.
//    · normalise-then-store-the-raw-value is the same bug wearing a hat.
//
//  The "fails Required, not MinLength" test pins this down. `"   "`
//  normalises to `""` **first**, so `[Required]` is what rejects it. Validate
//  the raw string and a length rule would pass on three spaces — technically
//  correct, completely wrong.
//
//  `NormaliseEmail` lowercases because email local parts are case-insensitive
//  in every system anyone actually runs. Skip it and `Ada@Example.com` and
//  `ada@example.com` become two accounts — then a password reset goes to one
//  and the login checks the other. Canonical form is what makes a uniqueness
//  constraint mean something.
//
//  Collapsing *internal* whitespace matters as much as trimming. `"Ada
//  Lovelace"` with two spaces is a different string from `"Ada Lovelace"`,
//  so a search, a sort, or a `GROUP BY` will treat them as different people.
//  `Split` with `RemoveEmptyEntries` and a null separator handles tabs and
//  newlines too, which a chain of `.Replace("  ", " ")` calls does not.
//
//  Worth knowing where this stops: normalising is *not* sanitising. Trimming
//  a string does nothing about SQL injection (parameterised queries) or XSS
//  (encode on output, not on input). Stripping "dangerous" characters on the
//  way in corrupts legitimate data — there are people named O'Brien — and
//  still does not protect you. Normalise for correctness; use the right tool
//  at the right boundary for safety.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.ComponentModel.DataAnnotations;

string Normalise(string? value)
{
    if (string.IsNullOrWhiteSpace(value)) return "";

    // Null separator splits on ALL whitespace — spaces, tabs, newlines —
    // and RemoveEmptyEntries collapses the runs.
    return string.Join(" ",
        value.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
}

string NormaliseEmail(string? value) => Normalise(value).ToLowerInvariant();

(Signup? Value, List<string> Errors) Process(string? name, string? email)
{
    // 1. Canonical form FIRST.
    var candidate = new Signup(Normalise(name), NormaliseEmail(email));

    // 2. Validate what we are actually going to store.
    var results = new List<ValidationResult>();
    Validator.TryValidateObject(
        candidate, new ValidationContext(candidate), results,
        validateAllProperties: true);

    if (results.Count == 0) return (candidate, []);

    var errors = results
        .Select(r => $"{r.MemberNames.FirstOrDefault() ?? ""}: {r.ErrorMessage}")
        .ToList();
    errors.Sort(StringComparer.Ordinal);

    // 3. Never return the raw input as if it had been checked.
    return (null, errors);
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
    Eq(NormaliseEmail("ADA@EXAMPLE.COM"), NormaliseEmail(" ada@example.com ")));

Test("a good signup comes back cleaned", () =>
{
    var (value, errors) = Process("  Ada  Lovelace ", "  Ada@Example.COM ");

    Eq(errors, new List<string>());
    Eq(value, new Signup("Ada Lovelace", "ada@example.com"));
});

Test("the STORED value is the normalised one", () =>
{
    var (value, _) = Process("Ada\tLovelace", "ADA@EXAMPLE.COM");

    Eq(value!.Name, "Ada Lovelace");
    Eq(value.Email, "ada@example.com");
});

Test("whitespace-only input fails Required, not MinLength", () =>
{
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
