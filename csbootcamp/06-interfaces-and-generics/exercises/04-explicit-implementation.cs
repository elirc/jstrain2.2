// ─────────────────────────────────────────────────────────────────────────
//  04 · explicit implementation                           ★★☆ core
//  concepts: name collisions · keeping plumbing off the public surface
//  run: dotnet run 04-explicit-implementation.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Normally you implement an interface member by writing a public method with
//  a matching signature. **Explicit** implementation names the interface
//  instead:
//
//      void IReader.Close() { … }        // no access modifier, no `override`
//
//  Such a member is NOT on the concrete type's public surface. You can only
//  call it through the interface — `((IReader)stream).Close()`. There are
//  three reasons to do it, and only three:
//
//   1. **Two interfaces demand the same signature with different meanings.**
//      One public method cannot be both.
//   2. **The interface member is plumbing.** `IDisposable.Dispose` on a type
//      whose real API is `Close()`, or a legacy `IComparable.CompareTo(object)`
//      alongside the typed `IComparable<T>` one.
//   3. **The interface's signature is wrong for your type** — a weaker return
//      type, an `object` parameter — and you want the good one public.
//
//  Otherwise it is a nuisance: users of your type will not find the member,
//  and they will be confused about why.
//
//  hint: the declarations are written for you — the exercise is the bodies
//        and, more importantly, what the tests prove about the consequences
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("the two interfaces disagree about what Close means", () =>
{
    var channel = new Channel();

    ((IReader)channel).Close();
    ((IWriter)channel).Close();

    Eq(channel.Log, new[] { "reader closed", "writer closed" });
});

Test("neither Close is on the concrete type", () =>
{
    // There is no channel.Close() to call. That is the point: the name is
    // ambiguous, so the type refuses to pick a winner.
    Eq(typeof(Channel).GetMethod("Close"), null);
});

Test("the typed CompareTo is public", () =>
    Ok(new Version2(1).CompareTo(new Version2(2)) < 0));

Test("the legacy object-based one is hidden but still works", () =>
{
    // Reachable through the interface, invisible to everyday callers, and
    // required because non-generic collections still call it.
    var legacy = (IComparable)new Version2(1);

    Ok(legacy.CompareTo(new Version2(2)) < 0);
});

Test("the legacy overload rejects the wrong type", () =>
    Throws<ArgumentException>(() => ((IComparable)new Version2(1)).CompareTo("two")));

Test("Dispose is plumbing; Close is the API", () =>
{
    var handle = new Handle();
    handle.Close();

    Ok(handle.Closed);
    Eq(typeof(Handle).GetMethod("Dispose"), null, "Dispose should not be public");
});

Test("using still finds the explicit Dispose", () =>
{
    // `using` binds to IDisposable, not to a public method — so hiding
    // Dispose costs nothing.
    var handle = new Handle();

    using (handle) { }

    Ok(handle.Closed);
});

Test("closing twice is harmless", () =>
{
    var handle = new Handle();

    handle.Close();
    handle.Close();

    Eq(handle.Closes, 1);
});

// ──────────────────────────── your code ──────────────────────────────────
//
// The declarations are given, because the SHAPE is what this exercise is
// about and you cannot compile the file without them. Note as you fill in
// the bodies: an explicit member has no `public`, and it is named after the
// interface. The tests then prove what that costs and what it buys.

public interface IReader { void Close(); }
public interface IWriter { void Close(); }

// Two interfaces, one signature, two meanings. Neither can be the public
// `Close`, so both are explicit.
public sealed class Channel : IReader, IWriter
{
    public List<string> Log { get; } = [];

    // Append "reader closed".
    void IReader.Close() => throw new NotImplementedException();

    // Append "writer closed".
    void IWriter.Close() => throw new NotImplementedException();
}

// The typed CompareTo is public; the legacy object-based one is explicit,
// because `object` is the wrong parameter type for this API and nobody
// should reach for it by accident.
public sealed class Version2(int number) : IComparable<Version2>, IComparable
{
    public int Number { get; } = number;

    public int CompareTo(Version2? other)
    {
        throw new NotImplementedException();
    }

    // Delegate to the typed one. ArgumentException for anything that is
    // not a Version2 — that is the documented contract of IComparable.
    int IComparable.CompareTo(object? obj) => throw new NotImplementedException();
}

// Close() is the API and Dispose is plumbing, so Dispose is explicit and
// delegates. Closing twice must only count once.
public sealed class Handle : IDisposable
{
    public bool Closed { get; private set; }
    public int Closes { get; private set; }

    public void Close()
    {
        throw new NotImplementedException();
    }

    void IDisposable.Dispose() => Close();
}
