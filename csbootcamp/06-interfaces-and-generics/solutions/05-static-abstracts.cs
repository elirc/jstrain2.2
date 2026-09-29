// ─────────────────────────────────────────────────────────────────────────
//  05 · static abstracts and generic math — SOLUTION      ★★★ stretch
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
//  Walkthrough:
//  **`T.Zero` is the line worth staring at.** `T` is a type parameter, and
//  you are calling a static member on it. That was impossible before C# 11 —
//  static members were not part of any interface contract, so a generic
//  method could not reach them. `static abstract` puts them in the contract,
//  and the JIT resolves `T.Zero` to `int.Zero` or `decimal.Zero` at the point
//  where `T` is known.
//
//  What that buys: `Sum` is written once. The pre-C#-11 version of this file
//  is five near-identical overloads, and the sixth numeric type your codebase
//  meets does not work at all.
//
//  **`T.CreateChecked(count)`** converts the `int` count into whatever `T`
//  is — checked, so a value that will not fit throws rather than wrapping.
//  There is a `CreateSaturating` (clamp to the range) and a
//  `CreateTruncating` (wrap) when you want the other behaviours; picking the
//  checked one by default is the right instinct.
//
//  **`Mean` materialises before it counts.** `values.Count()` followed by a
//  second pass to sum would enumerate twice — module 04/05's lesson, and it
//  matters more here because the caller may hand in a query. The
//  `as ICollection<T>` check avoids the copy when the caller already gave us
//  a list or an array.
//
//  **The self-referencing constraint is what makes `ParseAll` useful.**
//  `where TSelf : IFromString<TSelf>` means `TSelf` is "the implementing
//  type", so `T.Parse` returns a `Sku` and the result is a `List<Sku>` —
//  not a `List<IFromString<Sku>>` that every caller then has to cast. The
//  seventh test only compiles because of it.
//
//  It looks circular and is not: it is a constraint saying "T must implement
//  this interface AT T", which the compiler can check perfectly well. The
//  BCL uses it everywhere — `IEquatable<T>`, `IComparable<T>`, `INumber<T>`,
//  `IParsable<T>`.
//
//  **The validation lives in the type that knows the rule.** `Sku.Parse`
//  knows what a sku looks like; `Codes.Parse<T>` knows nothing and does not
//  need to. That is the same argument as module 07/06's constructor guard —
//  put the invariant at the only door in, and nothing downstream has to
//  re-check it.
//
//  In real code, `IParsable<TSelf>` already exists in the BCL with a
//  `Parse(string, IFormatProvider?)` and a `TryParse`. `IFromString` here is
//  the stripped-down version so the shape is visible.
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
        // T.Zero — a static member, on a type parameter. That is the whole
        // point of static abstracts.
        var total = T.Zero;

        foreach (var value in values)
            total += value;

        return total;
    }

    // The arithmetic mean. An empty sequence is T.Zero, not a crash.
    // `T.CreateChecked(count)` turns the int count into a T.
    public static T Mean<T>(IEnumerable<T> values) where T : INumber<T>
    {
        // Materialise once: Count() then Sum() would enumerate twice, and
        // the caller may have handed us a query.
        var items = values as ICollection<T> ?? values.ToList();

        if (items.Count == 0) return T.Zero;

        // CreateChecked: an int that will not fit in T throws rather than
        // silently wrapping.
        return Sum(items) / T.CreateChecked(items.Count);
    }
}

public static class Codes
{
    // Call the static abstract Parse on whichever T was supplied.
    public static T Parse<T>(string text) where T : IFromString<T> => T.Parse(text);

    // Returns List<T>, not List<IFromString<T>> — the self-referencing
    // constraint is what makes that true.
    public static List<T> ParseAll<T>(IEnumerable<string> texts) where T : IFromString<T> =>
        texts.Select(text => T.Parse(text)).ToList();
}

// The self-referencing constraint: TSelf means "the implementing type".
public interface IFromString<TSelf> where TSelf : IFromString<TSelf>
{
    static abstract TSelf Parse(string text);
}

// A sku looks like "A-1": one letter, a dash, digits.
public sealed record Sku(string Code) : IFromString<Sku>
{
    // The rule lives with the type that knows it.
    public static Sku Parse(string text) =>
        text.Length >= 3 && char.IsLetter(text[0]) && text[1] == '-'
            && text[2..].All(char.IsDigit)
                ? new Sku(text)
                : throw new FormatException($"'{text}' is not a sku");

    public override string ToString() => Code;
}

// A postcode here is just "something with a space in it", 4 chars or more.
public sealed record Postcode(string Value) : IFromString<Postcode>
{
    public static Postcode Parse(string text) =>
        text.Length >= 4 && text.Contains(' ')
            ? new Postcode(text)
            : throw new FormatException($"'{text}' is not a postcode");

    public override string ToString() => Value;
}
