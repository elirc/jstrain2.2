// ─────────────────────────────────────────────────────────────────────────
//  01 · records and immutability                          ★★☆ core
//  concepts: with-expressions · value equality · shallow copies
//  run: dotnet run 01-records-and-immutability.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A `record` is a class the compiler fills in for you: value equality, a
//  matching hash code, `==`/`!=`, a readable `ToString`, a `Deconstruct`,
//  and — the useful one — a `with` expression for non-destructive updates.
//
//      var updated = original with { Status = "paid" };
//
//  That creates a NEW record copying every other member. The original is
//  untouched, which is what makes records safe to share.
//
//  The catch, and it is a real one: **`with` is a SHALLOW copy.** Reference
//  -typed members are shared between the original and the copy, so a mutable
//  list inside a record is a hole straight through the immutability.
//
//  Build an order type that survives that.
//
//  hint: to copy deeply you have to do it yourself — `with` will not
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Return a copy with the status changed. Do not mutate the original.
Order MarkPaid(Order order)
{
    throw new NotImplementedException();
}

// Return a copy with `tag` appended — WITHOUT the copy and the original
// sharing a tag list.
Order AddTag(Order order, string tag)
{
    throw new NotImplementedException();
}

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
    // The shallow-copy trap: a naive `with` shares the list.
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

// Tags is a MUTABLE reference type — that is the interesting part.
public record Order(string Reference, string Status, List<string> Tags);
