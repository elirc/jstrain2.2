// ─────────────────────────────────────────────────────────────────────────
//  05 · mutating while iterating                          ★★☆ core
//  concepts: the modification exception · RemoveAll · snapshots · the silent case
//  run: dotnet run 05-mutating-while-iterating.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Removing from a collection while you `foreach` over it throws
//  `InvalidOperationException: Collection was modified`. Everyone meets this
//  one early.
//
//  What is less well known is that there is a version which does **not**
//  throw. A `for` loop by index does not consult the enumerator's version
//  number, so removing an item shifts everything down and the loop skips the
//  next element. No exception, no warning, and the wrong answer — which is
//  strictly worse than the crash.
//
//      for (var i = 0; i < list.Count; i++)
//          if (Drop(list[i])) list.RemoveAt(i);      // skips one every time
//
//  Build the safe versions here, and prove the unsafe one is unsafe.
//
//  The ways out, best first:
//
//      list.RemoveAll(predicate)          one call, no loop, no bug
//      list.Where(…).ToList()             a new list; leaves the original
//      for (var i = list.Count - 1; …)    backwards, when you must mutate
//      foreach (var key in d.Keys.ToList())  a snapshot of the keys
//
//  hint: iterating backwards works because removing at index i only moves
//        elements you have already passed
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Remove every expired item IN PLACE, using one call.
void DropExpired(List<Item> items)
{
    throw new NotImplementedException();
}

// The same result as a NEW list, leaving the original untouched.
List<Item> WithoutExpired(List<Item> items)
{
    throw new NotImplementedException();
}

// Remove in place by walking BACKWARDS. Same result as DropExpired; this one
// exists so you can see why the direction matters.
void DropExpiredBackwards(List<Item> items)
{
    throw new NotImplementedException();
}

// Remove every entry whose value is 0, from the dictionary itself.
void DropZeroes(Dictionary<string, int> counts)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

static List<Item> Sample() =>
[
    new("a", false), new("b", true), new("c", true), new("d", false),
];

Test("DropExpired removes them in place", () =>
{
    var items = Sample();
    DropExpired(items);

    Eq(items.Select(i => i.Name), new[] { "a", "d" });
});

Test("WithoutExpired leaves the original alone", () =>
{
    var items = Sample();
    var kept = WithoutExpired(items);

    Eq(kept.Select(i => i.Name), new[] { "a", "d" });
    Eq(items.Count, 4);
});

Test("the backwards loop gets the same answer", () =>
{
    var items = Sample();
    DropExpiredBackwards(items);

    Eq(items.Select(i => i.Name), new[] { "a", "d" });
});

Test("ADJACENT removals are where the forwards loop breaks", () =>
{
    // "b" and "c" are next to each other. Remove "b" at index 1, "c" slides
    // into index 1, the loop moves to index 2, and "c" is never examined.
    var items = Sample();
    ForwardsAndBroken(items);

    Eq(items.Select(i => i.Name), new[] { "a", "c", "d" });
    Ok(items.Any(i => i.Expired), "the broken loop is supposed to miss one");
});

Test("...and it does it silently", () =>
{
    // No exception. That is the whole problem: the crash you get from
    // foreach is a gift by comparison.
    var items = Sample();
    ForwardsAndBroken(items);

    Ok(items.Count == 3);
});

Test("foreach + Remove throws instead", () =>
{
    var items = Sample();
    Throws<InvalidOperationException>(() => ForeachAndThrows(items));
});

Test("DropZeroes clears the empty counts", () =>
{
    var counts = new Dictionary<string, int> { ["a"] = 1, ["b"] = 0, ["c"] = 2, ["d"] = 0 };
    DropZeroes(counts);

    Eq(counts.Keys.OrderBy(k => k), new[] { "a", "c" });
});

Test("DropZeroes on an all-zero dictionary empties it", () =>
{
    var counts = new Dictionary<string, int> { ["a"] = 0, ["b"] = 0 };
    DropZeroes(counts);

    Eq(counts.Count, 0);
});

// ──────────────────────────── given ──────────────────────────────────────

// The bug, preserved so the tests can point at it.
static void ForwardsAndBroken(List<Item> items)
{
    for (var i = 0; i < items.Count; i++)
        if (items[i].Expired)
            items.RemoveAt(i);
}

static void ForeachAndThrows(List<Item> items)
{
    foreach (var item in items)
        if (item.Expired)
            items.Remove(item);
}

public record Item(string Name, bool Expired);
