// ─────────────────────────────────────────────────────────────────────────
//  05 · mutating while iterating — SOLUTION               ★★☆ core
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
//  Walkthrough:
//  Four methods, and three of them are one line. The content is in the two
//  broken versions the tests point at.
//
//  **`RemoveAll` is the answer almost every time.** One pass, no index
//  arithmetic, no enumerator, and it returns how many it removed. Reaching
//  for a loop at all is usually the mistake that leads to the rest.
//
//  **The forwards loop is the dangerous one, because it does not throw.**
//  Remove "b" at index 1 and "c" slides down into index 1, but the loop has
//  already moved on to index 2. "c" is never examined. The result is a list
//  that still contains an expired item, no exception, no log line — and it
//  only shows up when two items to delete are ADJACENT, which is exactly the
//  case a quick manual test does not have.
//
//  Compare that to `foreach` + `Remove`, which throws
//  `InvalidOperationException` immediately. The enumerator carries a version
//  number, the collection bumps it on every structural change, and `MoveNext`
//  compares them. That crash is a gift: it fails at the mistake, every time,
//  in the first test anyone writes.
//
//  (There is a nastier variant of the `foreach` case worth knowing about:
//  remove the second-to-last element and enumeration can end *without*
//  throwing, because the check happens on the move that never comes.
//  `List<T>` does not guarantee the exception, only that you must not rely on
//  the behaviour.)
//
//  **Backwards works because of what a removal moves.** Deleting at index `i`
//  shifts down everything ABOVE `i` — all of which a descending loop has
//  already visited. Nothing below `i` moves, and that is where the loop is
//  going next. It is the right tool when you must mutate in place and
//  `RemoveAll` cannot express the condition.
//
//  **`.ToList()` on the keys is a snapshot.** `counts.Keys` is a live view
//  over the dictionary, so removing through it while enumerating it has the
//  same problem. Materialising the keys first gives you a list that no longer
//  cares what happens to the dictionary. (.NET also lets you assign through
//  `d[key] = value` during enumeration — changing a value is not a structural
//  change — but adding or removing is.)
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Remove every expired item IN PLACE, using one call.
// One call, no loop, nothing to get wrong.
void DropExpired(List<Item> items) => items.RemoveAll(item => item.Expired);

// The same result as a NEW list, leaving the original untouched.
List<Item> WithoutExpired(List<Item> items) =>
    items.Where(item => !item.Expired).ToList();

// Remove in place by walking BACKWARDS. Same result as DropExpired; this one
// exists so you can see why the direction matters.
void DropExpiredBackwards(List<Item> items)
{
    // Removing at i shifts down only what is ABOVE i — all of it already
    // visited. Nothing below i moves, and that is where we are going.
    for (var i = items.Count - 1; i >= 0; i--)
        if (items[i].Expired)
            items.RemoveAt(i);
}

// Remove every entry whose value is 0, from the dictionary itself.
void DropZeroes(Dictionary<string, int> counts)
{
    // .Keys is a LIVE view over the dictionary; ToList() snapshots it so the
    // loop no longer cares what happens underneath.
    var empty = counts.Where(pair => pair.Value == 0).Select(pair => pair.Key).ToList();

    foreach (var key in empty)
        counts.Remove(key);
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
