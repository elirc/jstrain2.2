// ─────────────────────────────────────────────────────────────────────────
//  05 · properties, not examples — SOLUTION               ★★★ stretch
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
//  Walkthrough:
//  Both checks are the same three lines repeated over a generated corpus:
//  build an input, state the property, name the counterexample if it breaks.
//
//  **The corpus is the exercise.** Look at what each bug needs:
//
//      DecodeSingleDigit        a run of ten or more
//      EncodeMergesNonAdjacent  the same letter in two separate runs
//      EncodeEmptyBroken        ""
//      DecodeStopsAfterThree    four or more runs
//
//  Four bugs, four different shapes of input, and no overlap with the four
//  examples anybody writes by hand. That is not a coincidence in this file —
//  it is what real bugs look like. The cases you think of are the cases you
//  already coded correctly.
//
//  So the corpus is built rather than listed: the degenerate inputs first
//  (empty, one character), then a deliberate long run, then a hundred
//  pseudo-random strings over a small alphabet. The small alphabet matters —
//  three letters produce repeats and long runs constantly, where a 26-letter
//  alphabet mostly produces runs of one and would miss both run-length bugs.
//  **Generating uniformly is not the same as generating usefully.**
//
//  **The seed is fixed.** `new Random(20260902)` gives a different hundred
//  strings from a hand-written list and the SAME hundred on every run — so a
//  failure is reproducible and the test cannot go red on somebody else's
//  branch for reasons nobody can reconstruct. That is exercise 06's rule
//  applied here: random inputs are fine, unreproducible ones are not.
//
//  **The counterexample goes in the message.** `Eq(back, original, original)`
//  passes the input as the failure text, so a red test reads
//  `expected "abcd", received "abc"` rather than `property failed`. A
//  property test without this is genuinely worse than an example test: it
//  tells you something is wrong across an input space you cannot see.
//  (Real property-based frameworks go further and *shrink* the
//  counterexample to the smallest failing input; naming it is the cheap
//  version of the same idea.)
//
//  **Idempotence catches a whole class of bug that examples miss.**
//  `CollapseOnePass` produces a correct-looking answer for every input with
//  at most two consecutive spaces. Nothing about a single call reveals the
//  problem; only running it twice does. Normalisers, formatters, migrations
//  and anything with "clean" or "fix" in the name should be idempotent, and
//  it is one assertion to find out.
//
//  And note `CollapseToUnderscore` in the accepted set: a completely
//  different output, same property, and the property test does not care.
//  That is the payoff for testing a law instead of a value.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text;

// Throw unless Decode(Encode(x)) == x for every x you can produce.
// Return normally when the pair round-trips.
void CheckRoundTrip(Func<string, string> encode, Func<string, string> decode)
{
    foreach (var original in Corpus())
    {
        // The property, once. The corpus does the work.
        var back = decode(encode(original));

        // The counterexample goes in the MESSAGE — otherwise a failure
        // says "the property broke" and leaves you to find out where.
        Eq(back, original, $"round trip failed for \"{original}\"");
    }
}

// Throw unless collapse(collapse(x)) == collapse(x) for every x.
void CheckIdempotent(Func<string, string> collapse)
{
    foreach (var original in Corpus(withSpaces: true))
    {
        var once = collapse(original);
        var twice = collapse(once);

        Eq(twice, once, $"not idempotent for \"{original}\"");
    }
}

// Degenerate cases, then the shapes the bugs need, then a hundred generated
// strings over a SMALL alphabet — three letters produce long runs and
// repeats constantly, where 26 letters would produce almost none.
IEnumerable<string> Corpus(bool withSpaces = false)
{
    yield return "";
    yield return "a";
    yield return "aa";
    yield return "ab";
    yield return "aba";                       // non-adjacent repeat
    yield return new string('a', 12);         // a run past nine
    yield return "abcdefgh";                  // more runs than anyone tests
    yield return new string('z', 105);        // a three-digit count

    var alphabet = withSpaces ? "ab  " : "abc";
    // A FIXED seed: random inputs are fine, unreproducible ones are not.
    var random = new Random(20260902);

    for (var i = 0; i < 100; i++)
    {
        var length = random.Next(0, 30);
        var text = new string(Enumerable.Range(0, length)
            .Select(_ => alphabet[random.Next(alphabet.Length)])
            .ToArray());

        yield return text;
    }
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
