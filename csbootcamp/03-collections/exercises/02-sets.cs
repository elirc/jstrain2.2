// ─────────────────────────────────────────────────────────────────────────
//  02 · sets                                              ★★☆ core
//  concepts: HashSet · set algebra · custom equality
//  run: dotnet run 02-sets.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A `HashSet<T>` answers one question fast: "have I seen this?" O(1), and
//  `Add` returns false when the item was already there — which makes it a
//  deduplicator and a seen-check in one call.
//
//  It also does set algebra in place:
//
//      UnionWith        everything in either
//      IntersectWith    only what is in both
//      ExceptWith       remove these
//      SymmetricExceptWith   in one or the other, not both
//      IsSubsetOf / Overlaps    questions, no mutation
//
//  The catch: membership uses `GetHashCode`/`Equals` (module 01/08). Put a
//  class without value equality in a set and every instance is distinct.
//
//  hint: `Add` returning false IS the duplicate check — no Contains needed
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Items appearing more than once in `items`, in first-seen order, each
// reported once.
List<string> FindDuplicates(params string[] items)
{
    throw new NotImplementedException();
}

// Tags on BOTH lists, sorted.
List<string> Shared(List<string> a, List<string> b)
{
    throw new NotImplementedException();
}

// Tags on exactly one of the two lists, sorted.
List<string> OnlyOnOneSide(List<string> a, List<string> b)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("finds items seen more than once", () =>
    Eq(FindDuplicates("a", "b", "a", "c", "b"), new[] { "a", "b" }));

Test("reports each duplicate only once, however many times it repeats", () =>
    Eq(FindDuplicates("a", "a", "a"), new[] { "a" }));

Test("preserves first-seen order, not alphabetical order", () =>
    Eq(FindDuplicates("z", "m", "z", "a", "m"), new[] { "z", "m" }));

Test("no duplicates is an empty list", () =>
    Eq(FindDuplicates("a", "b", "c"), new List<string>()));

Test("Shared finds the intersection", () =>
    Eq(Shared(["a", "b", "c"], ["b", "c", "d"]), new[] { "b", "c" }));

Test("Shared is empty when nothing overlaps", () =>
    Eq(Shared(["a"], ["b"]), new List<string>()));

Test("OnlyOnOneSide is the symmetric difference", () =>
    Eq(OnlyOnOneSide(["a", "b", "c"], ["b", "c", "d"]), new[] { "a", "d" }));

Test("OnlyOnOneSide is empty for identical sets", () =>
    Eq(OnlyOnOneSide(["a", "b"], ["b", "a"]), new List<string>()));

Test("a set of records deduplicates by VALUE", () =>
{
    // Records have value equality, so these two are the same member.
    var set = new HashSet<Point> { new(1, 2), new(1, 2), new(3, 4) };
    Eq(set.Count, 2);
});

Test("a set of plain classes does NOT — every instance is distinct", () =>
{
    // No Equals/GetHashCode override, so identity is reference identity.
    var set = new HashSet<LooseP> { new(1, 2), new(1, 2) };
    Eq(set.Count, 2);
});

// ──────────────────────────── types ──────────────────────────────────────

public record Point(int X, int Y);

public class LooseP(int x, int y)
{
    public int X { get; } = x;
    public int Y { get; } = y;
}
