// ─────────────────────────────────────────────────────────────────────────
//  03 · value vs reference                                ★★☆ core
//  concepts: struct vs class · copy semantics · aliasing
//  run: dotnet run 03-value-vs-reference.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A `struct` is copied on assignment. A `class` is not — you copy the
//  reference, and both names point at the same object. Almost every
//  "why did that change?" bug in C# is this one fact showing up somewhere
//  inconvenient.
//
//  Two types are declared for you at the bottom: PointStruct and PointClass,
//  with identical fields. Predict-then-verify by making these pass.
//
//      MoveCopy(struct)  → the original is UNCHANGED
//      MoveShared(class) → the original IS changed
//
//  Then fix the leak: SafeCopy must hand back a snapshot the caller cannot
//  use to mutate your list.
//
//  hint: `new List<int>(other)` copies the elements; assignment does not
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Take a copy, shift it by (dx, dy), return the shifted copy.
// The caller's value must not change.
PointStruct MoveCopy(PointStruct p, int dx, int dy)
{
    throw new NotImplementedException();
}

// Shift the object the caller handed you, in place. Return the same
// instance you were given.
PointClass MoveShared(PointClass p, int dx, int dy)
{
    throw new NotImplementedException();
}

// Return a snapshot of the list. Mutating the returned list must NOT
// affect the source list, and vice versa.
List<int> SafeCopy(List<int> source)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a struct argument is copied, so the original is untouched", () =>
{
    var original = new PointStruct { X = 1, Y = 1 };
    MoveCopy(original, 10, 10);
    Eq(original.X, 1);
    Eq(original.Y, 1);
});

Test("MoveCopy returns the shifted copy", () =>
{
    var moved = MoveCopy(new PointStruct { X = 1, Y = 1 }, 10, 20);
    Eq(moved.X, 11);
    Eq(moved.Y, 21);
});

Test("a class argument is shared, so the original does change", () =>
{
    var original = new PointClass { X = 1, Y = 1 };
    MoveShared(original, 10, 20);
    Eq(original.X, 11);
    Eq(original.Y, 21);
});

Test("MoveShared hands back the very same instance", () =>
{
    var original = new PointClass { X = 0, Y = 0 };
    Ok(ReferenceEquals(MoveShared(original, 1, 1), original));
});

Test("two structs with equal fields are equal by value", () =>
    Eq(new PointStruct { X = 2, Y = 3 }, new PointStruct { X = 2, Y = 3 }));

Test("SafeCopy has the same contents", () =>
    Eq(SafeCopy([1, 2, 3]), new[] { 1, 2, 3 }));

Test("mutating the copy does not touch the source", () =>
{
    var source = new List<int> { 1, 2, 3 };
    SafeCopy(source).Add(99);
    Eq(source, new[] { 1, 2, 3 });
});

Test("mutating the source does not touch the copy", () =>
{
    var source = new List<int> { 1, 2, 3 };
    var copy = SafeCopy(source);
    source.Add(99);
    Eq(copy, new[] { 1, 2, 3 });
});

// ──────────────────────────── types ──────────────────────────────────────

struct PointStruct
{
    public int X;
    public int Y;
}

class PointClass
{
    public int X;
    public int Y;
}
