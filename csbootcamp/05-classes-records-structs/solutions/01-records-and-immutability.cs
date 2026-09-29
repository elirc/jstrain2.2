// ─────────────────────────────────────────────────────────────────────────
//  01 · records and immutability — SOLUTION               ★★☆ core
//  concepts: with-expressions · value equality · shallow copies
//  run: dotnet run 01-records-and-immutability.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `MarkPaid` is the easy half: `order with { Status = "paid" }` copies every
//  member and replaces one. The original is untouched, which is the entire
//  value proposition of records — you can hand one to any caller without
//  defensive copying, because nobody can change it under you.
//
//  `AddTag` is the half that catches people. Written the obvious way:
//
//      order.Tags.Add(tag);           // mutates the ORIGINAL. Not a copy.
//      return order with { };         // …and the "copy" shares that list
//
//  `with` performs a **shallow** copy: value members are duplicated,
//  reference members are shared. So a `List<string>` inside a record is a
//  hole straight through the immutability, and the original changes when you
//  "copy and add". The last two tests exist to catch exactly that — one
//  checks the original's contents, the other checks the two lists are
//  different objects, because sharing can pass a contents check by accident.
//
//  The fix is to build a new list explicitly. There is no deep-copy
//  `with`; C# will not guess how deep you meant.
//
//  Which is why the first test is deliberately uncomfortable. Two `Order`s
//  with identical data are **not** equal, because the generated `Equals`
//  compares `Tags` by reference. Records give you value equality over their
//  members, and a member that compares by reference makes the whole record
//  compare by reference. `Point` — all value members — behaves the way people
//  expect.
//
//  The lesson: a record whose members are all immutable value types is a
//  genuine value. A record holding a mutable collection only looks like one.
//  If you need the real thing, use `ImmutableList<T>` (or expose
//  `IReadOnlyList<T>` and never hand out the mutable reference) — then `with`
//  is safe and equality means what you want.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

Order MarkPaid(Order order)
    // Copies every other member; the original is untouched.
    => order with { Status = "paid" };

Order AddTag(Order order, string tag)
    // A NEW list. `with` would share the existing one, and mutating that
    // would change the original too.
    => order with { Tags = [.. order.Tags, tag] };

// ──────────────────────────── tests ──────────────────────────────────────

Order Sample() => new("A-1", "pending", ["urgent"]);

Test("records compare by value, not identity", () =>
{
    Eq(new Order("A-1", "pending", ["urgent"]) == new Order("A-1", "pending", ["urgent"]),
       false);   // ← the list member is compared by REFERENCE
    Eq(new Point(1, 2), new Point(1, 2));
});

Test("a record with only value members really is value-equal", () =>
{
    Ok(new Point(1, 2) == new Point(1, 2));
    Ok(new Point(1, 2) != new Point(9, 9));
});

Test("equal records share a hash code", () =>
    Eq(new Point(1, 2).GetHashCode(), new Point(1, 2).GetHashCode()));

Test("ToString names the type and its members", () =>
    Eq(new Point(1, 2).ToString(), "Point { X = 1, Y = 2 }"));

Test("records deconstruct", () =>
{
    var (x, y) = new Point(3, 4);
    Eq(x, 3);
    Eq(y, 4);
});

Test("with produces a changed copy", () =>
    Eq(MarkPaid(Sample()).Status, "paid"));

Test("with leaves the original alone", () =>
{
    var original = Sample();
    MarkPaid(original);

    Eq(original.Status, "pending");
});

Test("with copies the members you did not name", () =>
{
    var updated = MarkPaid(Sample());
    Eq(updated.Reference, "A-1");
});

Test("AddTag adds the tag to the copy", () =>
    Eq(AddTag(Sample(), "rush").Tags, new[] { "urgent", "rush" }));

Test("AddTag does NOT change the original's tags", () =>
{
    var original = Sample();
    AddTag(original, "rush");

    Eq(original.Tags, new[] { "urgent" });
});

Test("the copy's list is a different object from the original's", () =>
{
    var original = Sample();
    var copy = AddTag(original, "rush");

    Ok(!ReferenceEquals(original.Tags, copy.Tags),
       "a shared list means the copy is not really independent");
});

// ──────────────────────────── types ──────────────────────────────────────

public record Point(int X, int Y);

public record Order(string Reference, string Status, List<string> Tags);
