// ─────────────────────────────────────────────────────────────────────────
//  06 · tests that do not flake                           ★★★ stretch
//  concepts: determinism · one input is not a test · asserting on luck
//  run: dotnet run 06-tests-that-do-not-flake.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A test that passes 90% of the time is worse than no test. It fails on
//  somebody else's branch, gets re-run until green, and within a month the
//  team's response to a red build is "just run it again" — which is the point
//  at which the suite stops working entirely.
//
//  Two habits prevent nearly all of it:
//
//   1. **Never assert on something that is merely likely.** "Two random
//      samples differ" is true almost always, and almost always is not a
//      test.
//   2. **One input is not a test when the input space matters.** A bug that
//      only appears for some seeds is invisible if you only ever try seed 1.
//
//  The subject is a sampler:
//
//      IReadOnlyList<int> Sample(source, count, seed)
//
//          · returns exactly `count` items
//          · all distinct
//          · every one of them drawn from `source`
//          · the SAME seed always gives the SAME result
//
//  Note what the contract does NOT say: nothing about different seeds giving
//  different results, and nothing about the order. An implementation that
//  returns the first `count` items whatever the seed is boring and correct,
//  and your check has to accept it.
//
//  You are graded twice over. Once on catching the broken samplers — and one
//  of them only misbehaves on seeds divisible by four. And once on
//  **stability**: your check is run thirty times, and it has to give the same
//  verdict every single time.
//
//  hint: sweep a range of seeds rather than picking one, and assert
//        reproducibility by calling with the same seed twice
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Throw if `sample` breaks the contract. Return normally if it keeps it.
void CheckSample(Func<IReadOnlyList<int>, int, int, IReadOnlyList<int>> sample)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("it accepts the correct sampler", () =>
    CheckSample(Correct));

Test("it accepts a correct-but-boring sampler", () =>
    // Seed-insensitive, ordered, entirely predictable — and it breaks no
    // rule in the contract. A check asserting that two seeds differ
    // rejects this one, which is asserting on luck twice over.
    CheckSample(FirstNItems));

Test("it catches the one that returns duplicates", () =>
    Throws(() => CheckSample(AlwaysDuplicates)));

Test("it catches the one that returns the wrong count", () =>
    Throws(() => CheckSample(OneShort)));

Test("it catches the one that invents values", () =>
    Throws(() => CheckSample(OutsideSource)));

Test("it catches the one that ignores the seed", () =>
    // Same seed, different answer. Nothing built on it can be reproduced,
    // and every test that uses it is flaky by construction.
    Throws(() => CheckSample(Unreproducible)));

Test("it catches the one that only misbehaves on SOME seeds", () =>
    // Duplicates when the seed divides by four. A check that tries seed 1
    // and stops will never see it.
    Throws(() => CheckSample(SometimesDuplicates)));

Test("the verdict on a correct sampler is stable over thirty runs", () =>
{
    // If any assertion in your check depends on chance, this is where it
    // shows up — not on your machine, on somebody's Friday afternoon.
    foreach (var _ in Enumerable.Range(0, 30))
        CheckSample(Correct);
});

Test("the verdict on a sometimes-broken sampler is stable too", () =>
{
    // "Catches it usually" is not catching it. Thirty runs, thirty throws.
    foreach (var run in Enumerable.Range(0, 30))
        Throws(() => CheckSample(SometimesDuplicates), message: "run " + run + " let it through");
});

// ──────────────────────────── implementations ────────────────────────────

static IReadOnlyList<int> Correct(IReadOnlyList<int> source, int count, int seed)
{
    var pool = source.ToList();
    var random = new Random(seed);
    var picked = new List<int>();

    for (var i = 0; i < count; i++)
    {
        var index = random.Next(pool.Count);
        picked.Add(pool[index]);
        pool.RemoveAt(index);
    }

    return picked;
}

// Correct, and completely uninteresting. Still correct.
static IReadOnlyList<int> FirstNItems(IReadOnlyList<int> source, int count, int seed) =>
    source.Take(count).ToList();

// Never removes what it picked, and here that always shows: the same item,
// `count` times. Right count, all from the source, not distinct.
static IReadOnlyList<int> AlwaysDuplicates(IReadOnlyList<int> source, int count, int seed) =>
    Enumerable.Repeat(source[0], count).ToList();

static IReadOnlyList<int> OneShort(IReadOnlyList<int> source, int count, int seed) =>
    Correct(source, Math.Max(count - 1, 0), seed);

static IReadOnlyList<int> OutsideSource(IReadOnlyList<int> source, int count, int seed) =>
    Correct(source, count, seed).Select(value => value + 1000).ToList();

// Ignores the seed and shifts on every call, so no two calls agree.
// Every other rule is kept: right count, distinct, all from the source.
static IReadOnlyList<int> Unreproducible(IReadOnlyList<int> source, int count, int seed)
{
    var call = Interlocked.Increment(ref Calls.Made);
    var pool = source.ToList();

    return Enumerable.Range(0, count).Select(i => pool[(i + call) % pool.Count]).ToList();
}

// Correct except on every fourth seed.
static IReadOnlyList<int> SometimesDuplicates(IReadOnlyList<int> source, int count, int seed) =>
    seed % 4 == 0
        ? AlwaysDuplicates(source, count, seed)
        : Correct(source, count, seed);

static class Calls
{
    public static int Made;
}
