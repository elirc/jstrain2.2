// ─────────────────────────────────────────────────────────────────────────
//  03 · behaviour, not shape — SOLUTION                   ★★★ stretch
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
//  Walkthrough:
//  Two assertions do all the work, and what they leave out matters as much as
//  what they say.
//
//      the result is ascending          — the order half
//      it is a permutation of the input — the contents half
//
//  **Neither half is sufficient alone.** `Deduplicated` produces a perfectly
//  ascending list and is missing an element; `Untouched` has exactly the right
//  contents in the wrong order. A check with only one of these assertions
//  passes one of those two bugs, and "it came back sorted" is the assertion
//  people actually write.
//
//  The permutation check is a **multiset** comparison, not a set comparison.
//  `input.Order().SequenceEqual(result.Order())` counts duplicates;
//  `new HashSet<int>(input).SetEquals(result)` does not, and lets
//  `Deduplicated` straight through. That distinction is the whole reason the
//  duplicate-dropping implementation is in the file.
//
//  **Now the part that is actually hard: what the check must NOT say.**
//
//      ReferenceEquals(result, input)     rejects NewList and ViaArray
//      !ReferenceEquals(result, input)    rejects InPlace
//      input is unchanged afterwards      rejects InPlace
//      the result is a List<int>, not an array, allocated once, …
//
//  Every one of those is true of some correct implementation and false of
//  another, because the contract never mentioned them. A test that pins them
//  does not catch bugs; it catches *refactors*. And a suite that goes red
//  every time somebody makes a correct change is a suite people learn to
//  ignore — which costs more than the bugs it was written to find.
//
//  This is the same idea as module 20/06's `SetVaryByQuery` and module
//  22/04's `Bind` versus `Get<T>`: say exactly what you mean, and say nothing
//  else, because everything extra becomes a promise somebody has to keep.
//
//  **A fresh input for every call.** `InPlace` sorts the caller's list, so
//  reusing one list across the assertions would mean the second assertion
//  runs against data the first one already sorted — and the check would pass
//  a sorter that only works on already-sorted input. `Fresh()` is not
//  tidiness; without it the tests share mutable state, which is exactly the
//  thing exercise 06 is about.
//
//  **`SmallOnly` is why the input is twelve elements and not three.** It is a
//  bubble sort with four passes: correct up to five elements, wrong above
//  that. A check built from `[3, 1, 2]` never sees it, and "works on the
//  example in the ticket" is how that bug reaches production.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Throw if `sort` breaks the contract. Return normally if it keeps it —
// whichever way it chooses to keep it.
void CheckSort(Func<List<int>, List<int>> sort)
{
    // A NEW list every time: InPlace sorts the caller's, and a shared
    // fixture would let a sorter pass by seeing already-sorted data.
    static List<int> Fresh() => [12, 4, 4, 9, 1, 7, 7, 3, 11, 2, 8, 5];

    void Holds(List<int> input, string what)
    {
        var original = input.ToList();
        var result = sort(input);

        // Order. On its own this passes the one that drops duplicates.
        for (var i = 0; i + 1 < result.Count; i++)
            Ok(result[i] <= result[i + 1],
               $"{what}: not ascending at {i} — {string.Join(",", result)}");

        // Contents, as a MULTISET. On its own this passes the one that does
        // not sort at all. A HashSet here would miss the duplicate bug.
        Eq(result.Order(), original.Order(),
           $"{what}: the result is not a permutation of the input");
    }

    Holds(Fresh(), "twelve mixed values");   // catches SmallOnly
    Holds([], "the empty list");             // catches EmptyUnsafe
    Holds([1], "one element");
    Holds([2, 2, 2], "all equal");
    Holds([5, 4, 3, 2, 1, 0], "reversed");

    // Nothing here asks whether the input was mutated, whether the result is
    // the same object, or how it was allocated. The contract does not say,
    // so the test does not either.
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
