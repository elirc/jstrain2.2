// ─────────────────────────────────────────────────────────────────────────
//  05 · static abstracts and generic math                 ★★★ stretch
//  concepts: static abstract members · INumber<T> · self-referencing types
//  run: dotnet run 05-static-abstracts.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Before C# 11 you could not put `+`, or a constructor, or a `Parse` into an
//  interface — interfaces only described INSTANCE members, so a generic
//  method had no way to say "T can be added" or "T can be created from a
//  string". Every generic numeric helper ended up as five overloads.
//
//  `static abstract` fixes it:
//
//      interface IFromString<TSelf> where TSelf : IFromString<TSelf>
//      {
//          static abstract TSelf Parse(string text);
//      }
//
//  The `where TSelf : IFromString<TSelf>` is the **curiously recurring**
//  pattern: it makes `TSelf` mean "the type implementing this", so `Parse`
//  can return the concrete type rather than the interface.
//
//  The BCL's version of this is `INumber<T>`, which every numeric type
//  implements. One generic method now works for `int`, `double`, `decimal`
//  and anything else that satisfies the constraint:
//
//      static T Sum<T>(IEnumerable<T> values) where T : INumber<T>
//
//  `T.Zero`, `T.One`, `T.CreateChecked(n)` — the interface's static members
//  are called on the TYPE PARAMETER, which is the part that looks strange
//  the first time.
//
//  hint: inside a generic method, `T.Zero` is legal and means "the Zero of
//        whatever T turned out to be"
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Numerics;

// ──────────────────────────── tests ──────────────────────────────────────

Test("Sum works for int", () =>
    Eq(Maths.Sum([1, 2, 3]), 6));

Test("the SAME method works for double and decimal", () =>
{
    Eq(Maths.Sum([1.5, 2.5]), 4.0);
    Eq(Maths.Sum([1.10m, 2.20m]), 3.30m);
});

Test("an empty sequence sums to that type's zero", () =>
{
    Eq(Maths.Sum(Array.Empty<int>()), 0);
    Eq(Maths.Sum(Array.Empty<decimal>()), 0m);
});

Test("Mean divides by the count", () =>
{
    Eq(Maths.Mean([2.0, 4.0, 6.0]), 4.0);
    Eq(Maths.Mean([1m, 2m]), 1.5m);
});

Test("the mean of nothing is zero, not a divide-by-zero", () =>
    Eq(Maths.Mean(Array.Empty<double>()), 0.0));

Test("Parse goes through the static abstract member", () =>
{
    Eq(Codes.Parse<Sku>("A-1").ToString(), "A-1");
    Eq(Codes.Parse<Postcode>("SW1A 1AA").ToString(), "SW1A 1AA");
});

Test("ParseAll returns the concrete type, not the interface", () =>
{
    // The self-referencing constraint is what makes this a List<Sku> rather
    // than a List<IFromString<Sku>>.
    List<Sku> skus = Codes.ParseAll<Sku>(["A-1", "B-2"]);

    Eq(skus.Count, 2);
    Eq(skus[1].Code, "B-2");
});

Test("a bad code is rejected by the type that knows the rule", () =>
{
    Throws<FormatException>(() => Codes.Parse<Sku>("nope"));
    Throws<FormatException>(() => Codes.Parse<Postcode>("A"));
});

// ──────────────────────────── your code ──────────────────────────────────

public static class Maths
{
    // Total, using T.Zero as the seed.
    public static T Sum<T>(IEnumerable<T> values) where T : INumber<T>
    {
        throw new NotImplementedException();
    }

    // The arithmetic mean. An empty sequence is T.Zero, not a crash.
    // `T.CreateChecked(count)` turns the int count into a T.
    public static T Mean<T>(IEnumerable<T> values) where T : INumber<T>
    {
        throw new NotImplementedException();
    }
}

public static class Codes
{
    // Call the static abstract Parse on whichever T was supplied.
    public static T Parse<T>(string text) where T : IFromString<T>
    {
        throw new NotImplementedException();
    }

    public static List<T> ParseAll<T>(IEnumerable<string> texts) where T : IFromString<T>
    {
        throw new NotImplementedException();
    }
}

// The self-referencing constraint: TSelf means "the implementing type".
public interface IFromString<TSelf> where TSelf : IFromString<TSelf>
{
    static abstract TSelf Parse(string text);
}

// A sku looks like "A-1": one letter, a dash, digits.
public sealed record Sku(string Code) : IFromString<Sku>
{
    public static Sku Parse(string text)
    {
        throw new NotImplementedException();
    }

    public override string ToString() => Code;
}

// A postcode here is just "something with a space in it", 4 chars or more.
public sealed record Postcode(string Value) : IFromString<Postcode>
{
    public static Postcode Parse(string text)
    {
        throw new NotImplementedException();
    }

    public override string ToString() => Value;
}
