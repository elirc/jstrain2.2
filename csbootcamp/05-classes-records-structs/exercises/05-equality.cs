// ─────────────────────────────────────────────────────────────────────────
//  05 · equality                                          ★★☆ core
//  concepts: the Equals/GetHashCode contract · IEquatable · reference vs value
//  run: dotnet run 05-equality.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  "Are these two things the same?" has three different answers in C# and
//  they do not always agree:
//
//      ReferenceEquals(a, b)   the same object
//      a.Equals(b)             the same VALUE, as the type defines it
//      a == b                  whatever the type's operator says — and for a
//                              plain class, that is reference identity
//
//  A `record` implements all of value equality for you. A `class` does not,
//  and this exercise is about doing it by hand once so you know what the
//  record generated.
//
//  **The contract** — break any of these and dictionaries and sets misbehave
//  in ways that look like corruption:
//
//   1. Equal objects MUST have equal hash codes. (The converse is not
//      required — collisions are legal.)
//   2. The hash code must not change while the object is a key in anything.
//      Which means: hash on IMMUTABLE fields only.
//   3. `Equals` must be reflexive, symmetric and transitive, and `x.Equals
//      (null)` must be false, never a throw.
//
//  Rule 2 is the one that bites: hash on a mutable property, put the object
//  in a `HashSet`, change the property, and the object is now invisible in
//  the set that contains it.
//
//  hint: `HashCode.Combine(a, b)` is the right way to mix fields — do not
//        add or XOR them by hand
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("two records with the same values are equal", () =>
{
    Ok(new PointRecord(1, 2) == new PointRecord(1, 2));
    Ok(new PointRecord(1, 2).Equals(new PointRecord(1, 2)));
});

Test("two plain classes with the same values are NOT", () =>
{
    var a = new PlainPoint(1, 2);
    var b = new PlainPoint(1, 2);

    Ok(!a.Equals(b), "a plain class compares by reference");
    Ok(!ReferenceEquals(a, b));
});

Test("Sku implements value equality by hand", () =>
{
    Ok(new Sku("A", 1).Equals(new Sku("A", 1)));
    Ok(!new Sku("A", 1).Equals(new Sku("A", 2)));
    Ok(!new Sku("A", 1).Equals(new Sku("B", 1)));
});

Test("equal Skus have equal hash codes", () =>
    Eq(new Sku("A", 1).GetHashCode(), new Sku("A", 1).GetHashCode()));

Test("Sku works as a dictionary key and in a set", () =>
{
    // This is what the contract is FOR. Without both halves, the second Add
    // succeeds and the lookup fails.
    var set = new HashSet<Sku> { new("A", 1), new("A", 1), new("B", 2) };
    var index = new Dictionary<Sku, string> { [new("A", 1)] = "widget" };

    Eq(set.Count, 2);
    Eq(index[new Sku("A", 1)], "widget");
});

Test("== on Sku agrees with Equals", () =>
{
    Ok(new Sku("A", 1) == new Sku("A", 1));
    Ok(new Sku("A", 1) != new Sku("A", 2));
});

Test("comparing to null is false, not an exception", () =>
{
    Ok(!new Sku("A", 1).Equals(null));
    Ok(!(new Sku("A", 1) == null));
    Ok(new Sku("A", 1) != null);
});

Test("equality is symmetric across the type boundary", () =>
    Ok(!new Sku("A", 1).Equals("A1"), "a Sku is not equal to a string"));

Test("a record containing a LIST does not compare deeply", () =>
{
    // The generated Equals compares each member with that member's OWN
    // equality — and List<T> is a class, so two distinct lists never match.
    var a = new Basket("ada", ["milk"]);
    var b = new Basket("ada", ["milk"]);

    Ok(a != b, "records give value equality over members, not deep equality");
    Ok(a.Items.SequenceEqual(b.Items), "the CONTENTS are the same, though");
});

Test("hashing a mutable field loses the object", () =>
{
    // Rule 2, demonstrated. Mutable hashes on Key. Put it in a HashSet,
    // change Key, and the set can no longer find the object it contains.
    var mutable = new Mutable { Key = "a" };
    var set = new HashSet<Mutable> { mutable };
    var before = mutable.GetHashCode();

    mutable.Key = "bb";

    Ok(mutable.GetHashCode() != before, "the hash moved while it was a key");
    Ok(!set.Contains(mutable), "it is still IN the set — just unreachable");
    Eq(set.Count, 1);
});

// ──────────────────────────── your code ──────────────────────────────────

// Value equality, written out by hand. Implement IEquatable<Sku>, override
// Equals(object?) and GetHashCode(), and provide == and !=.
public sealed class Sku(string code, int revision) : IEquatable<Sku>
{
    public string Code { get; } = code;
    public int Revision { get; } = revision;

    public bool Equals(Sku? other)
    {
        throw new NotImplementedException();
    }

    public override bool Equals(object? obj)
    {
        throw new NotImplementedException();
    }

    public override int GetHashCode()
    {
        throw new NotImplementedException();
    }

    public static bool operator ==(Sku? left, Sku? right)
    {
        throw new NotImplementedException();
    }

    public static bool operator !=(Sku? left, Sku? right) => !(left == right);
}

// ──────────────────────────── given ──────────────────────────────────────

public record PointRecord(int X, int Y);
public record Basket(string Owner, List<string> Items);

public sealed class PlainPoint(int x, int y)
{
    public int X { get; } = x;
    public int Y { get; } = y;
}

// Hashes on a MUTABLE property. Do not do this.
// (The hash is Key.Length rather than Key.GetHashCode() only so that the
// test above is deterministic rather than depending on which bucket a
// randomised string hash lands in.)
public sealed class Mutable
{
    public string Key { get; set; } = "";

    public override int GetHashCode() => Key.Length;
    public override bool Equals(object? obj) => obj is Mutable other && other.Key == Key;
}
