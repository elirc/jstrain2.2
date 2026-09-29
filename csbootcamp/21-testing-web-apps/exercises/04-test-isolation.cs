// ─────────────────────────────────────────────────────────────────────────
//  04 · test isolation                                    ★★☆ core
//  concepts: shared state · fresh fixtures · order independence
//  run: dotnet run 04-test-isolation.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A test suite is only trustworthy if each test would pass ALONE. The
//  moment two tests share mutable state, you get the worst class of bug:
//
//    · passes alone, fails in the suite
//    · passes in the suite, fails when someone adds a test above it
//    · passes today, fails when the runner reorders or parallelises
//
//  `LeakyCounter` below uses a static field, so every test that touches it
//  inherits whatever the previous one left behind. `IsolatedCounter` must
//  behave identically for a single user and be immune to that.
//
//  The rule: **build your fixture inside the test**, not next to it. A
//  `static` or a field on the test class is shared; a local is not.
//
//  hint: the fix is not "reset it in a teardown" — that only works if you
//        never forget, and never run in parallel
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("the leaky version demonstrates the problem", () =>
{
    // Two separate objects, one shared static. This is the bug.
    var first = new LeakyCounter();
    var second = new LeakyCounter();

    first.Next();
    first.Next();

    Eq(second.Next(), 3);   // "3" from a counter that was never used
});

Test("a fresh counter starts at 1", () =>
    Eq(new IsolatedCounter().Next(), 1));

Test("a counter counts up within one instance", () =>
{
    var counter = new IsolatedCounter();
    Eq(counter.Next(), 1);
    Eq(counter.Next(), 2);
    Eq(counter.Next(), 3);
});

Test("two counters do not see each other", () =>
{
    var first = new IsolatedCounter();
    var second = new IsolatedCounter();

    first.Next();
    first.Next();

    Eq(second.Next(), 1);   // unaffected
});

Test("this test would fail if the previous one leaked", () =>
{
    // Deliberately ordered after heavy use above. It must still see 1.
    Eq(new IsolatedCounter().Next(), 1);
});

Test("a fresh registry is empty", () =>
{
    var registry = new IsolatedRegistry();
    Eq(registry.Count, 0);
    Ok(!registry.Has("ada"));
});

Test("adding reports whether it was new", () =>
{
    var registry = new IsolatedRegistry();

    Ok(registry.Add("ada"));
    Ok(!registry.Add("ada"));   // already there
    Eq(registry.Count, 1);
});

Test("a second registry does not inherit the first's entries", () =>
{
    var first = new IsolatedRegistry();
    first.Add("ada");
    first.Add("bob");

    var second = new IsolatedRegistry();
    Eq(second.Count, 0);
    Ok(!second.Has("ada"));
});

Test("each test builds its own fixture, so order cannot matter", () =>
{
    // Nothing above this line can change the result of this line.
    var registry = new IsolatedRegistry();
    registry.Add("solo");

    Eq(registry.Count, 1);
    Ok(registry.Has("solo"));
});

// ──────────────────────────── types ──────────────────────────────────────

// A per-instance counter. Two instances must not see each other's state.
// Next() returns 1, 2, 3… for THIS instance.
public class IsolatedCounter
{
    public int Next() => throw new NotImplementedException();
}

// A registry keyed by name. Each instance is independent.
//   Add(name)  → true if added, false if already present
//   Has(name)  → bool
//   Count      → how many
public class IsolatedRegistry
{
    public int Count => throw new NotImplementedException();

    public bool Add(string name) => throw new NotImplementedException();

    public bool Has(string name) => throw new NotImplementedException();
}

// The anti-pattern, for contrast. Do not fix this one.
public class LeakyCounter
{
    private static int _shared;          // ← shared by every instance
    public int Next() => ++_shared;
}
