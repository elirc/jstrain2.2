// ─────────────────────────────────────────────────────────────────────────
//  03 · grouping and lookups — SOLUTION                   ★★☆ core
//  concepts: GroupBy · ToLookup · ToDictionary · the duplicate-key trap
//  run: dotnet run 03-grouping-and-lookups.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Three ways to reshape a flat list into a keyed one, and choosing wrong
//  is a runtime exception or a silent O(n²):
//
//      ToDictionary(k)   one value per key — THROWS on a duplicate key
//      ToLookup(k)       many values per key — never throws
//      GroupBy(k)        lazy grouping, one pass, ordered by first appearance
//
//  `ToDictionary` on data you do not control is a crash waiting for the day
//  two rows share a key. `ToLookup` is the safe default when keys repeat, and
//  it returns an EMPTY sequence for a missing key rather than throwing.
//
//  Walkthrough:
//  `GroupBy` yields `IGrouping<TKey, TElement>` — a key with a sequence
//  attached — so `g.Key` and iterating `g` are both available. It is lazy and
//  single-pass, and it preserves first-appearance order of the groups, which
//  is why the sort is explicit rather than assumed.
//
//  `ToLookup` is the one people under-use. It is an immutable
//  `Dictionary<K, IEnumerable<V>>` built in one pass, and its indexer
//  **returns an empty sequence for a missing key instead of throwing**. That
//  removes the `TryGetValue`-then-null-check dance you would otherwise write
//  around a `Dictionary<string, List<string>>`, and it removes the bug where
//  you forget it.
//
//  `ToDictionary` is the sharp one. It demands exactly one value per key and
//  throws `ArgumentException` on a duplicate — which is correct for an id
//  column and a crash for anything user-supplied. The test uses two employees
//  with id 1 because that is precisely the data you get the week after
//  shipping. If duplicates are possible, you wanted `ToLookup`; if they are
//  genuinely impossible, `ToDictionary` documents that and fails loudly when
//  the assumption breaks, which is the point.
//
//  `CountBy` (.NET 9+) does headcount in one call without materialising the
//  groups; `GroupBy(...).Select(g => g.Count())` is the portable spelling and
//  is what this uses.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Group employees by department, departments sorted, names sorted within.
List<string> ByDepartment(List<Employee> staff)
    => [.. staff
        .GroupBy(e => e.Department)
        .OrderBy(g => g.Key, StringComparer.Ordinal)
        .Select(g => $"{g.Key}: {string.Join(", ", g.Select(e => e.Name).OrderBy(n => n, StringComparer.Ordinal))}")];

// A lookup from department to employee names.
ILookup<string, string> NamesByDepartment(List<Employee> staff)
    // Missing keys give an empty sequence, never a throw.
    => staff.ToLookup(e => e.Department, e => e.Name);

// Map each employee id to the employee. Throws if two share an id.
Dictionary<int, Employee> ById(List<Employee> staff)
    // Throws ArgumentException on a duplicate key — correct for an id, and a
    // crash for anything you do not control.
    => staff.ToDictionary(e => e.Id);

// Headcount per department, sorted by department.
List<string> Headcount(List<Employee> staff)
    => [.. staff
        .GroupBy(e => e.Department)
        .OrderBy(g => g.Key, StringComparer.Ordinal)
        .Select(g => $"{g.Key}={g.Count()}")];

// ──────────────────────────── tests ──────────────────────────────────────

List<Employee> Staff() =>
[
    new(1, "ada", "eng"),
    new(2, "bob", "sales"),
    new(3, "cleo", "eng"),
];

Test("groups and sorts both levels", () =>
    Eq(ByDepartment(Staff()), new[] { "eng: ada, cleo", "sales: bob" }));

Test("an empty staff list groups to nothing", () =>
    Eq(ByDepartment([]), new List<string>()));

Test("a lookup returns every name for a key", () =>
    Eq(NamesByDepartment(Staff())["eng"].OrderBy(n => n), new[] { "ada", "cleo" }));

Test("a lookup returns EMPTY for a missing key — it does not throw", () =>
{
    // The reason to prefer a lookup over a Dictionary<K, List<V>>.
    Eq(NamesByDepartment(Staff())["nope"].Count(), 0);
});

Test("a lookup knows whether it contains a key", () =>
{
    var lookup = NamesByDepartment(Staff());
    Ok(lookup.Contains("eng"));
    Ok(!lookup.Contains("nope"));
});

Test("ById maps every employee", () =>
{
    var byId = ById(Staff());
    Eq(byId.Count, 3);
    Eq(byId[2].Name, "bob");
});

Test("ToDictionary THROWS on a duplicate key", () =>
{
    // The trap. On data you do not control, this is a crash in waiting.
    var dupes = new List<Employee> { new(1, "ada", "eng"), new(1, "bob", "sales") };

    Throws<ArgumentException>(() => ById(dupes));
});

Test("headcount per department", () =>
    Eq(Headcount(Staff()), new[] { "eng=2", "sales=1" }));

Test("headcount of an empty list is empty", () =>
    Eq(Headcount([]), new List<string>()));

// ──────────────────────────── types ──────────────────────────────────────

public record Employee(int Id, string Name, string Department);
