// ─────────────────────────────────────────────────────────────────────────
//  02 · list patterns — SOLUTION                          ★★☆ core
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
//  Walkthrough:
//  `Parse` is a whole command parser with no length checks and no indexing.
//  Each arm states the shape it handles — `["set", var key, var value]` says
//  "exactly three words, the first literally set" — and binds what it needs
//  in the same breath.
//
//  Compare the version this replaces:
//
//      if (parts.Length == 0) ...
//      else if (parts.Length == 1 && parts[0] == "help") ...
//      else if (parts.Length == 3 && parts[0] == "set") ...
//
//  Every branch repeats the length check, every index is an off-by-one
//  waiting to happen, and adding a case means auditing all of them. The
//  pattern version cannot index out of range, because a pattern only binds
//  what it has already matched.
//
//  Arm order matters here as it did in exercise 01: `["set", var k, var v]`
//  must precede `["set", ..]`, or the specific case never runs. The
//  `["set", ..]` arm exists purely to give "too many arguments" a better
//  message than "unknown: set" — a small thing that makes a CLI feel
//  finished.
//
//  `Summarise` shows the slice pattern binding **both ends at once**:
//  `[var first, .., var last]` matches any sequence of two or more and gives
//  you the outermost elements without touching indices. Note it also matches
//  exactly two, which is why the `[var a, var b]` arm has to come first.
//
//  The whitespace test is a reminder that shape matching only works if you
//  normalised first — `Split` with `RemoveEmptyEntries` (module 01/04) is
//  what makes `"  get   name  "` the same shape as `"get name"`.
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
    // Normalise FIRST — shape matching only works on a clean split.
    var parts = input.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);

    return parts switch
    {
        [] => "empty",
        ["help"] => "help",
        ["get", var key] => $"get:{key}",
        // The specific three-word form must precede the catch-all "set".
        ["set", var key, var value] => $"set:{key}={value}",
        ["set", ..] => "too many arguments",
        [var verb, ..] => $"unknown: {verb}",
    };
}

// Summarise a sequence by shape:
//   []        → "none"
//   [x]       → "just x"
//   [a, b]    → "a and b"
//   [a, .., z] → "a through z (n items)"
string Summarise(int[] values) => values switch
{
    [] => "none",
    [var only] => $"just {only}",
    // Must precede the slice arm, which also matches exactly two.
    [var a, var b] => $"{a} and {b}",
    [var first, .., var last] => $"{first} through {last} ({values.Length} items)",
};

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
