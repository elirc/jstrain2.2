// ─────────────────────────────────────────────────────────────────────────
//  03 · behaviour, not shape                              ★★★ stretch
//  concepts: over-specified tests · what the contract actually promises
//  run: dotnet run 03-behaviour-not-shape.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A test can fail in two ways. It can miss a bug — exercises 01 and 02 were
//  about that. Or it can **fail on code that is perfectly correct**, which is
//  the failure mode nobody warns you about and the one that makes people stop
//  trusting the suite.
//
//  The cause is almost always the same: the test pinned something the
//  contract never promised.
//
//  Here the contract is exactly this:
//
//      List<int> Sort(List<int> input)
//          returns the input's elements in ascending order
//
//  And that is ALL. It does not say whether you get a new list or the same
//  one back. It does not say whether `input` is left alone. It does not say
//  which algorithm. Three correct implementations below disagree about every
//  one of those, and your check has to accept all three.
//
//  Then it has to reject five that are genuinely wrong — including one that
//  returns a perfectly sorted list. "Sorted" is not the whole contract:
//  `[1, 1, 2]` sorted and deduplicated is `[1, 2]`, which is still sorted and
//  has quietly lost an element.
//
//  hint: two assertions carry this. One about ORDER, one about CONTENTS —
//        and neither of them may mention identity, mutation or allocation
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Throw if `sort` breaks the contract. Return normally if it keeps it —
// whichever way it chooses to keep it.
void CheckSort(Func<List<int>, List<int>> sort)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("it accepts the version that returns a NEW list", () =>
    CheckSort(NewList));

Test("it accepts the version that sorts IN PLACE", () =>
    // Same contract, opposite memory behaviour. A check that asserted the
    // input was untouched would reject this one.
    CheckSort(InPlace));

Test("it accepts the version that round-trips through an array", () =>
    CheckSort(ViaArray));

Test("it catches the one that does not sort at all", () =>
    Throws(() => CheckSort(Untouched)));

Test("it catches the one that sorts DESCENDING", () =>
    Throws(() => CheckSort(Descending)));

Test("it catches the one that drops duplicates", () =>
    // The interesting one. Its output IS sorted — it is just missing an
    // element, so an order-only assertion lets it through.
    Throws(() => CheckSort(Deduplicated)));

Test("it catches the one that loses the last element", () =>
    Throws(() => CheckSort(LosesLast)));

Test("it catches the one that throws on an empty list", () =>
    Throws(() => CheckSort(EmptyUnsafe)));

Test("it catches the one that only works on small inputs", () =>
    // Correct for three elements and wrong for thirty. A check built from
    // one hand-written example never notices.
    Throws(() => CheckSort(SmallOnly)));

// ──────────────────────────── implementations ────────────────────────────

// Correct. Allocates a new list; leaves the input alone.
static List<int> NewList(List<int> input) => input.OrderBy(n => n).ToList();

// Correct. Sorts the caller's list and hands the SAME list back.
static List<int> InPlace(List<int> input)
{
    input.Sort();

    return input;
}

// Correct. A different algorithm again, and a different allocation pattern.
static List<int> ViaArray(List<int> input)
{
    var array = input.ToArray();
    Array.Sort(array);

    return [.. array];
}

// Returns the input unchanged.
static List<int> Untouched(List<int> input) => input;

// Sorted, and backwards.
static List<int> Descending(List<int> input) =>
    input.OrderByDescending(n => n).ToList();

// Sorted, and one element short whenever anything repeats.
static List<int> Deduplicated(List<int> input) =>
    input.Distinct().OrderBy(n => n).ToList();

// An off-by-one in a hand-rolled copy.
static List<int> LosesLast(List<int> input) =>
    input.OrderBy(n => n).Take(Math.Max(input.Count - 1, 0)).ToList();

// Correct except for the degenerate case.
static List<int> EmptyUnsafe(List<int> input)
{
    var sorted = input.OrderBy(n => n).ToList();
    _ = sorted[0];               // throws when there is nothing to sort

    return sorted;
}

// A bubble sort with too few passes: right for tiny inputs, wrong past four.
static List<int> SmallOnly(List<int> input)
{
    var items = input.ToList();

    for (var pass = 0; pass < Math.Min(items.Count, 4); pass++)
        for (var i = 0; i + 1 < items.Count; i++)
            if (items[i] > items[i + 1])
                (items[i], items[i + 1]) = (items[i + 1], items[i]);

    return items;
}
