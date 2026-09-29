// ─────────────────────────────────────────────────────────────────────────
//  04 · explicit implementation — SOLUTION                ★★☆ core
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
//  Walkthrough:
//  Three types, three of the legitimate reasons to implement explicitly.
//
//  **`Channel`: the collision.** `IReader.Close` and `IWriter.Close` have the
//  same signature and different meanings. One public `Close()` would have to
//  be both, so neither is public — and `typeof(Channel).GetMethod("Close")`
//  returns null, which the second test pins. A caller has to say which
//  contract they are speaking through, and that is the correct outcome: the
//  ambiguity is real, so making it explicit at the call site is honest rather
//  than annoying.
//
//  **`Version2`: the wrong signature.** `IComparable.CompareTo(object?)`
//  predates generics. Keeping it public would put a method on the type that
//  accepts a string and throws — so it goes explicit, and the typed
//  `CompareTo(Version2?)` is the one people find. Both exist because
//  non-generic collections and older APIs still call the object-based one.
//
//  Note the two contract details in it: **null sorts first** (comparing
//  anything to null returns positive), and a wrong type is
//  `ArgumentException`, not `InvalidCastException`. Both are specified by
//  `IComparable`, and both are the kind of thing you only discover by
//  reading the docs or by a sort behaving strangely.
//
//  **`Handle`: plumbing.** `Dispose` is how the language and the framework
//  talk to the type; `Close` is how a person does. Hiding `Dispose` costs
//  nothing, because `using` binds to `IDisposable` and not to a public
//  method — which the seventh test proves. What it buys is one obvious way
//  to close a handle instead of two.
//
//  The idempotence flag is the same rule as module 07/04: cleanup gets called
//  twice in perfectly ordinary code, and the second call must be free.
//
//  **When NOT to do this.** If none of the three reasons applies, explicit
//  implementation is a trap for your callers — they will look at IntelliSense,
//  not find the method, and conclude your type does not have it. Reach for it
//  deliberately, not as a default.
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

    void IReader.Close() => Log.Add("reader closed");

    void IWriter.Close() => Log.Add("writer closed");
}

// The typed CompareTo is public; the legacy object-based one is explicit,
// because `object` is the wrong parameter type for this API and nobody
// should reach for it by accident.
public sealed class Version2(int number) : IComparable<Version2>, IComparable
{
    public int Number { get; } = number;

    // Null sorts first — comparing anything to null returns positive.
    // That is IComparable's contract, not a choice.
    public int CompareTo(Version2? other) =>
        other is null ? 1 : Number.CompareTo(other.Number);

    // ArgumentException, NOT InvalidCastException — again the documented
    // contract, and the reason a bad Sort throws what it throws.
    int IComparable.CompareTo(object? obj) => obj switch
    {
        null => 1,
        Version2 other => CompareTo(other),
        _ => throw new ArgumentException("expected a Version2", nameof(obj)),
    };
}

// Close() is the API and Dispose is plumbing, so Dispose is explicit and
// delegates. Closing twice must only count once.
public sealed class Handle : IDisposable
{
    public bool Closed { get; private set; }
    public int Closes { get; private set; }

    public void Close()
    {
        // Idempotent: cleanup gets called twice in ordinary code, and the
        // second call must be free.
        if (Closed) return;

        Closed = true;
        Closes++;
    }

    void IDisposable.Dispose() => Close();
}
