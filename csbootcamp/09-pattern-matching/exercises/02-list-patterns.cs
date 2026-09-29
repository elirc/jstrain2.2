// ─────────────────────────────────────────────────────────────────────────
//  02 · list patterns                                     ★★☆ core
//  concepts: [a, b] · slice patterns · exhaustive parsing
//  run: dotnet run 02-list-patterns.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  List patterns match on the SHAPE of a sequence:
//
//      []              empty
//      [var only]      exactly one, bound
//      [var a, var b]  exactly two
//      [var head, ..]  at least one; ignore the rest
//      [.., var last]  at least one; bind the last
//      [var a, .. var middle, var b]   first, rest, last
//      ["set", ..]     a literal in the first position
//
//  They turn "check the length, then index into it" into one readable line,
//  and the compiler checks that the arms cover the possibilities — so the
//  "what if it is empty" case cannot be forgotten.
//
//  Build a tiny command parser.
//
//  hint: `[var a, .. var rest]` binds `rest` as an array of what is left
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Parse a whitespace-separated command:
//   ""                    → "empty"
//   "help"                → "help"
//   "get key"             → "get:key"
//   "set key value"       → "set:key=value"
//   "set k v extra..."    → "too many arguments"
//   anything else         → "unknown: <first word>"
string Parse(string input)
{
    throw new NotImplementedException();
}

// Summarise a sequence by shape:
//   []        → "none"
//   [x]       → "just x"
//   [a, b]    → "a and b"
//   [a, .., z] → "a through z (n items)"
string Summarise(int[] values)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("an empty command", () =>
{
    Eq(Parse(""), "empty");
    Eq(Parse("   "), "empty");
});

Test("a one-word command", () => Eq(Parse("help"), "help"));

Test("a two-word command binds its argument", () =>
    Eq(Parse("get name"), "get:name"));

Test("a three-word command binds both", () =>
    Eq(Parse("set name ada"), "set:name=ada"));

Test("too many arguments is caught by shape, not by counting", () =>
    Eq(Parse("set name ada extra"), "too many arguments"));

Test("an unrecognised verb reports itself", () =>
{
    Eq(Parse("frobnicate x"), "unknown: frobnicate");
    Eq(Parse("wibble"), "unknown: wibble");
});

Test("extra whitespace does not change the shape", () =>
    Eq(Parse("  get   name  "), "get:name"));

Test("Summarise handles every length", () =>
{
    Eq(Summarise([]), "none");
    Eq(Summarise([7]), "just 7");
    Eq(Summarise([1, 2]), "1 and 2");
});

Test("a slice pattern binds first and last across any length", () =>
{
    Eq(Summarise([1, 2, 3]), "1 through 3 (3 items)");
    Eq(Summarise([1, 2, 3, 4, 5]), "1 through 5 (5 items)");
});
