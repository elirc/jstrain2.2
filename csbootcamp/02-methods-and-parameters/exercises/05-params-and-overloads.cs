// ─────────────────────────────────────────────────────────────────────────
//  05 · params and overloads                              ★★☆ core
//  concepts: params arrays · overload resolution · ambiguity
//  run: dotnet run 05-params-and-overloads.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `params` lets a caller pass loose arguments instead of building an array:
//
//      Sum(1, 2, 3)            // params int[] numbers
//      Sum(new[] { 1, 2, 3 })  // the same call, spelled explicitly
//
//  Overload resolution then picks the "most specific applicable" method, and
//  a params method is always the LAST resort — the compiler prefers an exact
//  match, then an implicit conversion, and only then expands params. Knowing
//  that ordering is how you predict which overload actually runs.
//
//  Build a small formatting helper with three overloads and one params
//  method, then make the resolution tests pass.
//
//      Describe(42)          → "int:42"
//      Describe(4.2)         → "double:4.2"
//      Describe("x")         → "string:x"
//      Describe(1, 2, 3)     → "many:3"
//
//  hint: `Describe(42)` must NOT hit the params overload — an exact int
//        match beats expanding a params array
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
    public static string Describe(int value) => throw new NotImplementedException();

    public static string Describe(double value) => throw new NotImplementedException();

    public static string Describe(string value) => throw new NotImplementedException();

    // "many:" followed by how many arguments arrived.
    public static string Describe(params int[] values) => throw new NotImplementedException();

    // Join the parts with the separator, dropping null/empty/whitespace ones.
    public static string JoinNonEmpty(string separator, params string?[] parts)
        => throw new NotImplementedException();
}
