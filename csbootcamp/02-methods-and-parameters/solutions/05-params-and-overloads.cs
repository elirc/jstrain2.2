// ─────────────────────────────────────────────────────────────────────────
//  05 · params and overloads — SOLUTION                   ★★☆ core
//  concepts: params arrays · overload resolution · ambiguity
//  run: dotnet run 05-params-and-overloads.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Nothing clever is needed in the bodies — the exercise is about which body
//  runs. `Describe(42)` has two applicable candidates: `Describe(int)` and
//  `Describe(params int[])` expanded to one element. The language says a
//  method applicable in NORMAL form always beats one applicable only in
//  EXPANDED form, so the int overload wins. Delete it and the same call
//  silently starts returning "many:1".
//
//  `Describe(new[] { 1, 2 })` shows the other direction: an int[] argument
//  matches the params parameter in normal form, no expansion needed. So
//  params methods can always be called either way, and `Describe()` with no
//  arguments passes a zero-length array rather than failing to compile.
//
//  Formatting uses InvariantCulture deliberately. `value.ToString()` on a
//  double would render 4.2 as "4,2" in a comma-decimal locale and the test
//  would fail on a German machine but pass on yours — the exact class of bug
//  module 01 warned about.
//
//  JoinNonEmpty is the practical payoff of params: callers write
//  `JoinNonEmpty(", ", street, city, postcode)` without building an array,
//  and the filter means missing address lines do not leave ", , " behind.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Globalization;

// ──────────────────────────── tests ──────────────────────────────────────

Test("an exact int match wins over params", () =>
    Eq(Describer.Describe(42), "int:42"));

Test("a double picks the double overload", () =>
    Eq(Describer.Describe(4.2), "double:4.2"));

Test("a string picks the string overload", () =>
    Eq(Describer.Describe("x"), "string:x"));

Test("several arguments expand into the params overload", () =>
    Eq(Describer.Describe(1, 2, 3), "many:3"));

Test("an explicit array also reaches the params overload", () =>
    Eq(Describer.Describe(new[] { 1, 2 }), "many:2"));

Test("no arguments at all is a zero-length params call", () =>
    Eq(Describer.Describe(), "many:0"));

Test("JoinNonEmpty skips blanks and joins the rest", () =>
    Eq(Describer.JoinNonEmpty(", ", "a", "", "  ", "b"), "a, b"));

Test("JoinNonEmpty with nothing to join is empty", () =>
    Eq(Describer.JoinNonEmpty(", "), ""));

// ──────────────────────────── types ──────────────────────────────────────

static class Describer
{
    public static string Describe(int value)
        => "int:" + value.ToString(CultureInfo.InvariantCulture);

    public static string Describe(double value)
        => "double:" + value.ToString(CultureInfo.InvariantCulture);

    public static string Describe(string value) => "string:" + value;

    public static string Describe(params int[] values) => "many:" + values.Length;

    public static string JoinNonEmpty(string separator, params string?[] parts)
        => string.Join(separator, parts.Where(p => !string.IsNullOrWhiteSpace(p)));
}
