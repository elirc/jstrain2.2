// ─────────────────────────────────────────────────────────────────────────
//  01 · interfaces — SOLUTION                             ★★☆ core
//  concepts: contracts · explicit implementation · default members
//  run: dotnet run 01-interfaces.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  An interface is a contract with no state. Its value is that callers depend
//  on the SHAPE rather than the class — which is what made every seam in
//  module 21 possible, and what lets DI substitute implementations.
//
//  Two features worth knowing beyond the basics:
//
//  **Explicit implementation** — `void IFoo.Bar()` — makes the member
//  reachable ONLY through the interface. Use it when two interfaces demand
//  the same signature with different meanings, or to keep a required-but-ugly
//  member off your public surface.
//
//  **Default interface members** let an interface ship an implementation, so
//  you can add a member without breaking every implementor. The catch: it is
//  callable only through the interface, not through the concrete type.
//
//  Walkthrough:
//  `MemoryRepository` is ordinary implicit implementation: the members are
//  public on the class AND satisfy the interface. That is the default and the
//  right choice almost always.
//
//  `DualCounter` is why explicit implementation exists. Two interfaces both
//  declare `Reset()`, and they mean different things — one zeroes, one steps
//  back. A single public `Reset()` cannot be both. Writing
//  `void ICounter.Reset()` gives each interface its own body, selected by
//  which interface you are holding the object through.
//
//  Note the side effect the test pins down: an explicitly implemented member
//  is **not on the class surface**. `counter.Reset()` does not compile; you
//  must cast first. That is occasionally the whole point — it keeps a
//  required-but-noisy member (`IDisposable.Dispose` on a type where disposal
//  is an implementation detail, say) out of IntelliSense.
//
//  `IsEmpty` is a **default interface member**: the interface ships a body,
//  so `MemoryRepository` implements nothing and still gets it. That is how
//  you add a member to a published interface without breaking every
//  implementor — genuinely useful for library authors.
//
//  Its limitation is the fourth test: the member lives on the *interface*, so
//  `new MemoryRepository<string>().IsEmpty` does not compile. Default members
//  are a versioning tool, not a way to share implementation — for that you
//  still want an abstract base class or, better, composition.
//
//  The second test is the real argument for interfaces at all: `Fill` works
//  against any `IRepository<int>` and has no idea `MemoryRepository` exists.
//  Swap in a SQL-backed one and `Fill` does not change. That is the same
//  seam module 21 built its fakes on.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("a class implements an interface implicitly", () =>
{
    IRepository<string> repo = new MemoryRepository<string>();
    repo.Add("a");

    Eq(repo.Count, 1);
});

Test("the interface is the contract callers depend on", () =>
{
    // The function knows nothing about MemoryRepository.
    static int Fill(IRepository<int> repo)
    {
        repo.Add(1);
        repo.Add(2);
        return repo.Count;
    }

    Eq(Fill(new MemoryRepository<int>()), 2);
});

Test("a default interface member works without the class implementing it", () =>
{
    IRepository<string> repo = new MemoryRepository<string>();
    Ok(repo.IsEmpty);          // supplied BY THE INTERFACE

    repo.Add("a");
    Ok(!repo.IsEmpty);
});

Test("a default member is reachable only through the interface", () =>
{
    // `new MemoryRepository<string>().IsEmpty` would not compile — the
    // member lives on the interface, not on the class.
    var concrete = new MemoryRepository<string>();
    Ok(typeof(MemoryRepository<string>).GetProperty("IsEmpty") is null);
    Ok(((IRepository<string>)concrete).IsEmpty);
});

Test("explicit implementation hides the member from the class surface", () =>
{
    var counter = new DualCounter();

    // Not reachable as counter.Reset() — the class has no such method.
    Ok(typeof(DualCounter).GetMethod("Reset") is null);
});

Test("each interface gets its own explicit implementation", () =>
{
    var counter = new DualCounter();
    counter.Bump();
    counter.Bump();
    counter.Bump();                       // 3

    ((IRewindable)counter).Reset();       // "step back by one"
    Eq(counter.Value, 2);

    ((ICounter)counter).Reset();          // "reset to zero"
    Eq(counter.Value, 0);
});

Test("a type can be used as either interface", () =>
{
    var counter = new DualCounter();

    Ok(counter is ICounter);
    Ok(counter is IRewindable);
});

Test("the repository reports what it holds", () =>
{
    var repo = new MemoryRepository<string>();
    repo.Add("a");
    repo.Add("b");

    Eq(repo.All(), new[] { "a", "b" });
});

// ──────────────────────────── types ──────────────────────────────────────

public interface IRepository<T>
{
    void Add(T item);
    int Count { get; }
    IReadOnlyList<T> All();

    // A DEFAULT member: implementors get it free, and may override it.
    bool IsEmpty => Count == 0;
}

public class MemoryRepository<T> : IRepository<T>
{
    private readonly List<T> _items = [];

    public void Add(T item) => _items.Add(item);

    public int Count => _items.Count;

    // A read-only VIEW, so callers cannot mutate the internals (module 01/03).
    public IReadOnlyList<T> All() => _items.AsReadOnly();
}

public interface ICounter
{
    // Reset to zero.
    void Reset();
}

public interface IRewindable
{
    // Step back by one.
    void Reset();
}

// Implements BOTH Reset methods, with different meanings. Only possible
// with explicit implementation.
public class DualCounter : ICounter, IRewindable
{
    public int Value { get; private set; }

    public void Bump() => Value++;

    // Two interfaces, one signature, two meanings — only explicit
    // implementation can express this.
    void ICounter.Reset() => Value = 0;

    void IRewindable.Reset() => Value--;
}
