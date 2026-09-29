// ─────────────────────────────────────────────────────────────────────────
//  02 · generics and constraints                          ★★☆ core
//  concepts: type parameters · where clauses · generic math
//  run: dotnet run 02-generics-and-constraints.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A generic method works for many types while staying fully type-checked —
//  unlike `object`, which throws the type away and makes you cast it back.
//
//  A CONSTRAINT tells the compiler what `T` can do. Without one, `T` is
//  effectively `object` and you can barely touch it:
//
//      where T : class            a reference type
//      where T : struct           a non-nullable value type
//      where T : notnull          neither null nor a nullable type
//      where T : IComparable<T>   has CompareTo — so you can order it
//      where T : new()            can be constructed with no arguments
//      where T : SomeBase         derives from it
//      where T : INumber<T>       arithmetic (generic math, .NET 7+)
//
//  Constraints are not restrictions so much as *capabilities* — each one
//  unlocks the operations you are allowed to use.
//
//  hint: without `where T : IComparable<T>` you cannot write `a > b` or
//        `a.CompareTo(b)`, because `object` has neither
#:project ../../_lib/Check/Check.csproj

using System.Numerics;
using Bootcamp;
using static Bootcamp.Check;

// The larger of two values, for anything orderable.
T Larger<T>(T a, T b) where T : IComparable<T>
{
    throw new NotImplementedException();
}

// The sum of a sequence of numbers — ints, doubles, decimals, all one method.
T Total<T>(IEnumerable<T> values) where T : INumber<T>
{
    throw new NotImplementedException();
}

// A new T with its collection filled from `items`.
TBag FillBag<TBag, TItem>(IEnumerable<TItem> items)
    where TBag : ICollection<TItem>, new()
{
    throw new NotImplementedException();
}

// The first non-null value, or null if there is none.
T? FirstPresent<T>(params T?[] values) where T : class
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("Larger works on ints", () => Eq(Larger(3, 7), 7));

Test("Larger works on strings, using their ordering", () =>
    Eq(Larger("apple", "banana"), "banana"));

Test("Larger works on dates", () =>
    Eq(Larger(new DateOnly(2026, 1, 1), new DateOnly(2025, 1, 1)),
       new DateOnly(2026, 1, 1)));

Test("Larger returns either when they are equal", () => Eq(Larger(5, 5), 5));

Test("Total sums ints", () => Eq(Total([1, 2, 3]), 6));

Test("the SAME method sums doubles", () => Approx(Total([1.5, 2.5]), 4.0));

Test("and decimals, exactly", () => Eq(Total([0.1m, 0.2m]), 0.3m));

Test("Total of nothing is zero, whatever the type", () =>
{
    Eq(Total(Array.Empty<int>()), 0);
    Eq(Total(Array.Empty<decimal>()), 0m);
});

Test("FillBag constructs the collection it was asked for", () =>
{
    var list = FillBag<List<int>, int>([1, 2, 3]);
    Eq(list, new[] { 1, 2, 3 });
});

Test("FillBag can build a different collection from the same items", () =>
{
    var set = FillBag<HashSet<int>, int>([1, 2, 2, 3]);
    Eq(set.Count, 3);          // a set deduplicates
});

Test("FirstPresent skips nulls", () =>
    Eq(FirstPresent<string>(null, null, "found", "later"), "found"));

Test("FirstPresent returns null when everything is null", () =>
    Eq(FirstPresent<string>(null, null), null));

Test("FirstPresent with no arguments is null", () =>
    Eq(FirstPresent<string>(), null));
