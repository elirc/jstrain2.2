// ─────────────────────────────────────────────────────────────────────────
//  03 · grouping and lookups                              ★★☆ core
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
//  hint: a Lookup indexer never throws — that is the whole reason to prefer
//        it over a Dictionary of Lists you have to build by hand
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Group employees by department, departments sorted, names sorted within.
List<string> ByDepartment(List<Employee> staff)
{
    throw new NotImplementedException();
}

// A lookup from department to employee names.
ILookup<string, string> NamesByDepartment(List<Employee> staff)
{
    throw new NotImplementedException();
}

// Map each employee id to the employee. Throws if two share an id.
Dictionary<int, Employee> ById(List<Employee> staff)
{
    throw new NotImplementedException();
}

// Headcount per department, sorted by department.
List<string> Headcount(List<Employee> staff)
{
    throw new NotImplementedException();
}

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
