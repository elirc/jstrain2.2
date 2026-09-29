// ─────────────────────────────────────────────────────────────────────────
//  06 · arrays and ranges                                 ★★☆ core
//  concepts: Index/Range · slicing · Span<T>
//  run: dotnet run 06-arrays-and-ranges.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  C# has real slicing syntax. `^` counts from the end, `..` makes a range,
//  and the end of a range is EXCLUSIVE:
//
//      items[^1]     the last element
//      items[1..3]   elements 1 and 2 — not 3
//      items[..^1]   everything except the last
//      items[^2..]   the last two
//
//  Build these, using ranges rather than manual index arithmetic:
//
//      Middle([1,2,3,4,5])       → [2, 3, 4]      (drop first and last)
//      LastN([1,2,3,4,5], 2)     → [4, 5]
//      Rotate([1,2,3,4,5], 2)    → [3, 4, 5, 1, 2]
//
//  LastN must clamp: asking for more than there is returns everything, and
//  asking for zero or fewer returns an empty array. Rotate must handle a
//  count larger than the array.
//
//  hint: for Rotate, `n % length` first — and remember the empty array
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Everything except the first and last element. Fewer than 3 items → empty.
int[] Middle(int[] items)
{
    throw new NotImplementedException();
}

// The last n items, clamped to what actually exists.
int[] LastN(int[] items, int n)
{
    throw new NotImplementedException();
}

// Move the first n items to the back.
int[] Rotate(int[] items, int n)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("Middle drops both ends", () =>
    Eq(Middle([1, 2, 3, 4, 5]), new[] { 2, 3, 4 }));

Test("Middle of a 2-element array is empty", () =>
    Eq(Middle([1, 2]), Array.Empty<int>()));

Test("Middle of an empty array is empty", () =>
    Eq(Middle([]), Array.Empty<int>()));

Test("LastN takes from the end", () =>
    Eq(LastN([1, 2, 3, 4, 5], 2), new[] { 4, 5 }));

Test("LastN clamps when n is too big", () =>
    Eq(LastN([1, 2], 10), new[] { 1, 2 }));

Test("LastN of zero is empty", () =>
    Eq(LastN([1, 2, 3], 0), Array.Empty<int>()));

Test("Rotate moves the front to the back", () =>
    Eq(Rotate([1, 2, 3, 4, 5], 2), new[] { 3, 4, 5, 1, 2 }));

Test("Rotate wraps when n exceeds the length", () =>
    Eq(Rotate([1, 2, 3], 4), new[] { 2, 3, 1 }));

Test("Rotate by zero is unchanged", () =>
    Eq(Rotate([1, 2, 3], 0), new[] { 1, 2, 3 }));

Test("Rotate of an empty array is empty", () =>
    Eq(Rotate([], 3), Array.Empty<int>()));
