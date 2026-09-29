// ─────────────────────────────────────────────────────────────────────────
//  02 · generics and constraints — SOLUTION               ★★☆ core
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
//  Walkthrough:
//  Each constraint here exists because the body needs a specific capability,
//  and that is the way to think about them: not "what am I forbidding" but
//  "what am I allowed to do with T".
//
//  `Larger` needs ordering, so `IComparable<T>` unlocks `CompareTo`. Delete
//  the constraint and the method will not compile — `object` has no ordering
//  and the compiler will not guess. Note this one method then works for
//  `int`, `string` and `DateOnly` with no overloads, because all three
//  implement the interface.
//
//  `Total` uses **generic math** (`INumber<T>`, .NET 7+), which is the
//  interesting one. Before it existed there was no way to write "add these
//  numbers" generically — arithmetic operators were not expressible in a
//  constraint, so you wrote one overload per numeric type. `INumber<T>`
//  brings `+`, `T.Zero` and the rest into the type system. `T.Zero` is a
//  *static abstract* interface member, which is what makes the empty case
//  work for every numeric type at once.
//
//  `FillBag` needs `new()` to construct the collection and `ICollection<T>`
//  to add to it. Two constraints on one parameter, comma-separated, with
//  `new()` required to come last. This is the pattern behind factory-ish
//  generic helpers, and the test proves the payoff: the same method builds a
//  `List` or a `HashSet`, with the set deduplicating for free.
//
//  `FirstPresent` uses `where T : class` so `T?` means a nullable REFERENCE.
//  Without it, `T?` on an unconstrained parameter is ambiguous between
//  `Nullable<T>` and a nullable reference, and the compiler complains. If you
//  wanted value types too you would write a second overload constrained to
//  `struct` — one of the genuinely awkward corners of the type system.
#:project ../../_lib/Check/Check.csproj

using System.Numerics;
using Bootcamp;
using static Bootcamp.Check;

// The larger of two values, for anything orderable.
T Larger<T>(T a, T b) where T : IComparable<T>
    // CompareTo is available only because of the constraint.
    => a.CompareTo(b) >= 0 ? a : b;

// The sum of a sequence of numbers — ints, doubles, decimals, all one method.
T Total<T>(IEnumerable<T> values) where T : INumber<T>
{
    // T.Zero is a static abstract interface member — the right identity for
    // whichever numeric type T turns out to be.
    var sum = T.Zero;
    foreach (var value in values) sum += value;
    return sum;
}

// A new T with its collection filled from `items`.
TBag FillBag<TBag, TItem>(IEnumerable<TItem> items)
    where TBag : ICollection<TItem>, new()   // new() must come last
{
    var bag = new TBag();                     // allowed by the new() constraint
    foreach (var item in items) bag.Add(item);
    return bag;
}

// The first non-null value, or null if there is none.
T? FirstPresent<T>(params T?[] values) where T : class
    // `where T : class` is what makes T? mean "nullable reference".
    => values.FirstOrDefault(v => v is not null);

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
