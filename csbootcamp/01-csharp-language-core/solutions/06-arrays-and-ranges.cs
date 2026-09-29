// ─────────────────────────────────────────────────────────────────────────
//  06 · arrays and ranges — SOLUTION                      ★★☆ core
//  concepts: Index/Range · slicing · Span<T>
//  run: dotnet run 06-arrays-and-ranges.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `items[1..^1]` reads as "from index 1 up to one-from-the-end", which is
//  exactly the definition of "drop both ends" — no length arithmetic, no
//  off-by-one to get wrong. It needs the length guard only because a range
//  whose start passes its end throws ArgumentOutOfRangeException.
//
//  LastN is where clamping matters. `items[^n..]` with n > Length throws, so
//  Math.Clamp pins n into [0, Length] before the slice. Clamping the INPUT
//  rather than special-casing each branch keeps it to one return statement —
//  and n=0 then produces items[^0..], which is the empty slice, correctly.
//
//  Rotate: `n % length` folds any count into range, and the array-index
//  version of a rotation is just two slices concatenated. Guard the empty
//  array first, because % 0 throws DivideByZeroException — that is the edge
//  case this exercise is really testing.
//
//  Slicing an array with .. allocates a new array. If you are in a hot path
//  and only reading, `items.AsSpan()[1..^1]` gives you the same window with
//  no allocation at all — same syntax, no copy.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

int[] Middle(int[] items)
    => items.Length < 3 ? [] : items[1..^1];

int[] LastN(int[] items, int n)
{
    var take = Math.Clamp(n, 0, items.Length);
    return items[^take..];
}

int[] Rotate(int[] items, int n)
{
    if (items.Length == 0) return [];
    var shift = ((n % items.Length) + items.Length) % items.Length;   // handles n<0 too
    return [.. items[shift..], .. items[..shift]];
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
