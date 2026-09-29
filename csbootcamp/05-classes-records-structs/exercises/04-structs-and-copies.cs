// ─────────────────────────────────────────────────────────────────────────
//  04 · structs and copies                                ★★★ stretch
//  concepts: value semantics · mutable structs · readonly · boxing
//  run: dotnet run 04-structs-and-copies.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A struct is copied on **every** assignment, argument pass and return. That
//  is the whole of it, and every surprise below follows from that one fact.
//
//      var b = a;          b is a COPY
//      Move(a);            the method got a copy
//      list[0]             the indexer RETURNED a copy
//      array[0]            the indexer returned a REFERENCE
//
//  The last two differing is why mutable structs are a mistake rather than a
//  trade-off: identical-looking code behaves differently depending on the
//  container it is in, and neither the compiler nor a code review will
//  reliably notice.
//
//  `readonly struct` is the fix. The compiler then refuses any mutation, and
//  as a bonus it stops making **defensive copies** — with a non-readonly
//  struct, calling a method through a `readonly` field or an `in` parameter
//  copies the whole struct first, in case the method mutates it.
//
//  And boxing: putting a struct in an `object`, or in a non-generic
//  collection, allocates a box on the heap and copies the value into it.
//  Mutating "it" afterwards mutates the box or the original, depending on
//  which one you reached.
//
//  hint: `Moved` returns a new Point rather than changing one — a
//        `readonly record struct` leaves you no other option, and that is
//        the feature, not the limitation
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Add `by` to the point and return the RESULT. Do not mutate the argument.
Point Moved(Point point, int by)
{
    throw new NotImplementedException();
}

// Total the X values without boxing anything: take the sequence by its
// concrete type so the enumerator is a struct too.
int TotalX(List<Point> points)
{
    throw new NotImplementedException();
}

// Return a NEW counter one higher. Counter is a readonly struct, so this is
// the only way to "increment" it.
Counter Bumped(Counter counter)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("assignment copies a struct", () =>
{
    var a = new Loose(1);
    var b = a;
    b.Value = 99;

    Eq(a.Value, 1, "a should be untouched — b was a copy");
    Eq(b.Value, 99);
});

Test("a struct passed to a method is a copy", () =>
{
    var a = new Loose(1);
    Mutate.Bump(a);

    Eq(a.Value, 1, "the method mutated its own copy");
});

Test("a class passed to a method is not", () =>
{
    // The contrast. Same shape, opposite behaviour, and the only difference
    // is the word `class`.
    var box = new LooseBox { Value = 1 };
    Mutate.Bump(box);

    Eq(box.Value, 2);
});

Test("a List indexer hands back a copy", () =>
{
    var list = new List<Loose> { new(1) };
    var taken = list[0];
    taken.Value = 99;

    Eq(list[0].Value, 1);
});

Test("an ARRAY indexer does not — same code, different answer", () =>
{
    // This is the case that makes mutable structs indefensible: the
    // behaviour depends on the container, and nothing warns you.
    var array = new Loose[] { new(1) };
    array[0].Value = 99;

    Eq(array[0].Value, 99);
});

Test("Moved returns a new point and leaves the original alone", () =>
{
    var origin = new Point(1, 2);
    var moved = Moved(origin, 10);

    Eq((moved.X, moved.Y), (11, 12));
    Eq((origin.X, origin.Y), (1, 2));
});

Test("TotalX adds them up", () =>
    Eq(TotalX([new(1, 0), new(2, 0), new(3, 0)]), 6));

Test("boxing copies the value into the box", () =>
{
    var original = new Loose(1);
    object boxed = original;      // a heap allocation, and a copy

    original.Value = 99;

    Eq(((Loose)boxed).Value, 1, "the box holds a snapshot, not a reference");
});

Test("a readonly struct can only be replaced, never changed", () =>
{
    var counter = new Counter(1);
    var bumped = Bumped(counter);

    Eq(counter.Value, 1);
    Eq(bumped.Value, 2);
});

Test("record structs compare by value", () =>
{
    Ok(new Point(1, 2) == new Point(1, 2));
    Ok(new Point(1, 2) != new Point(1, 3));
});

// ──────────────────────────── types ──────────────────────────────────────

// Local functions cannot be overloaded, so these live in a class — which
// also keeps the two calls below looking identical, which is the point.
static class Mutate
{
    public static void Bump(Loose loose) => loose.Value++;
    public static void Bump(LooseBox box) => box.Value++;
}

// Deliberately mutable, deliberately a struct. Do not write these.
public struct Loose(int value)
{
    public int Value = value;
}

public sealed class LooseBox
{
    public int Value;
}

public readonly record struct Point(int X, int Y);

public readonly struct Counter(int value)
{
    public int Value { get; } = value;
}
