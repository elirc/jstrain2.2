// ─────────────────────────────────────────────────────────────────────────
//  03 · value vs reference — SOLUTION                     ★★☆ core
//  concepts: struct vs class · copy semantics · aliasing
//  run: dotnet run 03-value-vs-reference.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  MoveCopy mutates `p` and returns it — and that is safe precisely because
//  `p` is already a copy. Passing a struct by value copies all its fields at
//  the call site, so the parameter is the caller's data in name only.
//
//  MoveShared mutates the object behind the reference. Both the caller's
//  variable and the parameter name the same heap object, so the change is
//  visible from both. ReferenceEquals proves they are one object, not two
//  equal ones.
//
//  SafeCopy is the point of the exercise: `return source;` compiles, passes
//  the "same contents" test, and is a bug. You have handed the caller a live
//  handle on your own list. `new List<int>(source)` allocates a new backing
//  array and copies the elements into it, so the two lists go their separate
//  ways. (For a list of a REFERENCE type this is still a shallow copy — the
//  elements would be shared. Depth is a choice you make on purpose.)
//
//  The struct equality test passes without you writing anything: structs get
//  memberwise Equals for free. It is worth knowing that this default uses
//  reflection and is slow — real code overrides Equals, or uses a record
//  struct, which generates a fast one.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

PointStruct MoveCopy(PointStruct p, int dx, int dy)
{
    // p is already a private copy — mutating it cannot reach the caller.
    p.X += dx;
    p.Y += dy;
    return p;
}

PointClass MoveShared(PointClass p, int dx, int dy)
{
    // p refers to the caller's object; this edit is visible to them.
    p.X += dx;
    p.Y += dy;
    return p;
}

List<int> SafeCopy(List<int> source) => new(source);

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
