// ─────────────────────────────────────────────────────────────────────────
//  05 · properties, not examples                          ★★★ stretch
//  concepts: round-trip · idempotence · finding your own counterexamples
//  run: dotnet run 05-properties-not-examples.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  An example test says "this input gives that output". A **property** says
//  something that must hold for EVERY input, which means you no longer have
//  to guess which inputs matter.
//
//  The three that pay for themselves immediately:
//
//      round-trip     Decode(Encode(x)) == x                for all x
//      idempotence    f(f(x)) == f(x)                       for all x
//      oracle         fast(x) == obviously_correct_slow(x)  for all x
//
//  This file is about the first two. Run-length encoding compresses runs:
//
//      "aaabbc"   →  "a3b2c1"
//      "abc"      →  "a1b1c1"
//
//  **Every broken pair below round-trips those two, and "a" and "aab" too.**
//  Those are the four examples people actually write, so a check built from
//  examples passes all four broken implementations.
//
//  What catches them is inputs nobody would write by hand — and each one
//  needs a DIFFERENT kind:
//
//      a run of twelve       ·  the same letter in two separate runs
//      the empty string      ·  more runs than anyone tests with
//
//  Which is the argument for generating inputs instead of listing them: you
//  cannot enumerate the cases you have not thought of, but you can cover them.
//
//  hint: when a property fails, put the counterexample in the message — a
//        property that fails without saying on WHAT is worse than an example
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text;

// Throw unless Decode(Encode(x)) == x for every x you can produce.
// Return normally when the pair round-trips.
void CheckRoundTrip(Func<string, string> encode, Func<string, string> decode)
{
    throw new NotImplementedException();
}

// Throw unless collapse(collapse(x)) == collapse(x) for every x.
void CheckIdempotent(Func<string, string> collapse)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("the correct pair round-trips", () =>
    CheckRoundTrip(Encode, Decode));

Test("it catches the decoder that reads only ONE digit", () =>
    // Needs a run of ten or more. Nobody writes "aaaaaaaaaaaa" by hand.
    Throws(() => CheckRoundTrip(Encode, DecodeSingleDigit)));

Test("it catches the encoder that merges non-adjacent runs", () =>
    // Needs the same letter twice with something in between — "aba".
    Throws(() => CheckRoundTrip(EncodeMergesNonAdjacent, Decode)));

Test("it catches the pair that mishandles the empty string", () =>
    // Needs "", which is the example everyone means to write and forgets.
    Throws(() => CheckRoundTrip(EncodeEmptyBroken, Decode)));

Test("it catches the decoder that stops after three runs", () =>
    // Needs an input with four or more runs. "aaabbc" has exactly three.
    Throws(() => CheckRoundTrip(Encode, DecodeStopsAfterThree)));

Test("the four hand-written examples pass for EVERY broken pair", () =>
{
    // The premise of the exercise, checked rather than asserted. If your
    // CheckRoundTrip only tries these, all four bugs ship.
    foreach (var example in new[] { "a", "aab", "aaabbc", "abc" })
    {
        Eq(DecodeSingleDigit(Encode(example)), example, example);
        Eq(Decode(EncodeMergesNonAdjacent(example)), example, example);
        Eq(Decode(EncodeEmptyBroken(example)), example, example);
        Eq(DecodeStopsAfterThree(Encode(example)), example, example);
    }
});

Test("the correct collapse is idempotent", () =>
    CheckIdempotent(Collapse));

Test("it catches a collapse that changes the answer every pass", () =>
    Throws(() => CheckIdempotent(CollapseAndTrimEachTime)));

Test("it catches a collapse that only settles after several passes", () =>
    // "a    b" needs more than one pass, so f(f(x)) != f(x).
    Throws(() => CheckIdempotent(CollapseOnePass)));

Test("a correct-but-different collapse is still accepted", () =>
    // Underscores rather than spaces: different output, same property.
    // A property test does not care what the answer looks like.
    CheckIdempotent(CollapseToUnderscore));

// ──────────────────────────── implementations ────────────────────────────

static string Encode(string text)
{
    var builder = new StringBuilder();

    for (var i = 0; i < text.Length;)
    {
        var run = 1;
        while (i + run < text.Length && text[i + run] == text[i]) run++;

        builder.Append(text[i]).Append(run);
        i += run;
    }

    return builder.ToString();
}

static string Decode(string encoded)
{
    var builder = new StringBuilder();

    for (var i = 0; i < encoded.Length;)
    {
        var symbol = encoded[i++];
        var digits = 0;
        while (i + digits < encoded.Length && char.IsDigit(encoded[i + digits])) digits++;

        builder.Append(symbol, int.Parse(encoded.Substring(i, digits)));
        i += digits;
    }

    return builder.ToString();
}

// Assumes every count is one character wide.
static string DecodeSingleDigit(string encoded)
{
    var builder = new StringBuilder();

    for (var i = 0; i + 1 < encoded.Length; i += 2)
        builder.Append(encoded[i], encoded[i + 1] - '0');

    return builder.ToString();
}

// Counts every occurrence of a character rather than each adjacent run.
static string EncodeMergesNonAdjacent(string text)
{
    var builder = new StringBuilder();
    var seen = new HashSet<char>();

    foreach (var character in text)
        if (seen.Add(character))
            builder.Append(character).Append(text.Count(other => other == character));

    return builder.ToString();
}

// Returns a marker for the empty string that the decoder does not know.
static string EncodeEmptyBroken(string text) => text.Length == 0 ? "-" : Encode(text);

// A loop bound that was written against a three-run example.
static string DecodeStopsAfterThree(string encoded)
{
    var builder = new StringBuilder();
    var runs = 0;

    for (var i = 0; i < encoded.Length && runs < 3; runs++)
    {
        var symbol = encoded[i++];
        var digits = 0;
        while (i + digits < encoded.Length && char.IsDigit(encoded[i + digits])) digits++;

        builder.Append(symbol, int.Parse(encoded.Substring(i, digits)));
        i += digits;
    }

    return builder.ToString();
}

// Collapses every run of whitespace to one space, and trims. Stable.
static string Collapse(string text)
{
    var builder = new StringBuilder();
    var lastWasSpace = true;              // so a leading space is dropped

    foreach (var character in text)
    {
        if (char.IsWhiteSpace(character))
        {
            if (!lastWasSpace) builder.Append(' ');
            lastWasSpace = true;
        }
        else
        {
            builder.Append(character);
            lastWasSpace = false;
        }
    }

    return builder.ToString().TrimEnd();
}

// Also strips the first character, every time it runs.
static string CollapseAndTrimEachTime(string text) =>
    Collapse(text) is { Length: > 0 } collapsed ? collapsed[1..] : "";

// Removes one space from each run per pass, so it needs several passes.
static string CollapseOnePass(string text) => text.Replace("  ", " ").Trim();

// Different output, same property.
static string CollapseToUnderscore(string text) => Collapse(text).Replace(' ', '_');
