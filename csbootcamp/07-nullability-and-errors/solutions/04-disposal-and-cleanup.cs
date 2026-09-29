// ─────────────────────────────────────────────────────────────────────────
//  04 · disposal and cleanup — SOLUTION                   ★★☆ core
//  concepts: using · IDisposable · IAsyncDisposable · ordering · finally
//  run: dotnet run 04-disposal-and-cleanup.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `using` is `try`/`finally` with the boilerplate removed, and `finally` is
//  the only place cleanup reliably happens — it runs on success, on an
//  exception, and on the way out of a `return`.
//
//      using (var a = Open("a"))        // block form
//      using var b = Open("b");         // declaration form, disposed at the
//                                       // end of the ENCLOSING scope
//
//  Two things worth knowing before you start:
//
//   · Nested/stacked `using`s dispose in **reverse** order, like a stack.
//     That is what you want: the thing opened last usually depends on the
//     thing opened first.
//   · `IAsyncDisposable` exists because `Dispose()` cannot await. A type that
//     flushes to a network or a file wants `await using`, and calling plain
//     `Dispose()` on one either blocks a thread or silently skips the flush.
//
//  You are given a `Resource` that records what happened to it. Build the
//  three methods below so the recorded order proves the rules.
//
//  Walkthrough:
//  Nine lines of code, and every one of them is `using` doing the work.
//
//  **Stacked `using` declarations dispose in reverse.** `a` then `b` on the
//  way in, `b` then `a` on the way out — the compiler nests them, so it is a
//  stack, not a queue. That ordering is not an accident of implementation: it
//  is the only order that is safe when `b` was built from `a`.
//
//  **`ThrowsWhileOpen` has no `try` in it at all.** `using` *is* the
//  `try`/`finally` — it compiles to one — so the resource is released on the
//  way out and the exception carries on unchanged. Writing the `try` yourself
//  is how people end up accidentally swallowing it: a `catch` where they
//  meant a `finally`, and a crash becomes a silent success.
//
//  **`await using` is not decoration.** `DisposeAsync` returns a `ValueTask`,
//  and the whole reason it exists is that `Dispose()` has nowhere to await a
//  flush. Call the synchronous one on an `IAsyncDisposable` and you get one
//  of two bad outcomes: a blocked thread, or — as the sixth test shows — the
//  flush quietly skipped and the buffered data gone. Nothing throws. Nothing
//  logs. The data is simply not there.
//
//  **Dispose is idempotent.** The `_disposed` flag is not defensive
//  programming for its own sake: `using` inside a method whose caller also
//  disposes is completely ordinary, and a second call that threw would turn
//  cleanup into the failure it was supposed to prevent.
//
//  The scope rule is worth saying once more, because it is the one that
//  surprises people: a `using` declaration disposes at the end of the
//  **enclosing block**, not at the end of the statement. Inside an `if`, that
//  is the closing brace of the `if` — which is usually what you want and
//  occasionally very much not.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Open "a" then "b", append "work" to the log, and let both be disposed.
// Use `using` — do not call Dispose yourself.
void OpenTwo(List<string> log)
{
    using var a = new Resource("a", log);
    using var b = new Resource("b", log);

    log.Add("work");
    // b is disposed here, then a — reverse order, like a stack.
}

// Open "a", append "work", then throw InvalidOperationException("boom").
// "a" must still be disposed.
void ThrowsWhileOpen(List<string> log)
{
    // No try/catch: `using` IS the try/finally, and the exception passes
    // straight through it once the resource has been released.
    using var a = new Resource("a", log);

    log.Add("work");

    throw new InvalidOperationException("boom");
}

// Open an AsyncResource named "a", append "work", and dispose it
// ASYNCHRONOUSLY so its flush is awaited.
async Task OpenAsync(List<string> log)
{
    // `await using`, so DisposeAsync's flush is actually awaited.
    await using var a = new AsyncResource("a", log);

    log.Add("work");
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("both resources are opened and both are disposed", () =>
{
    var log = new List<string>();
    OpenTwo(log);

    Ok(log.Contains("open:a") && log.Contains("open:b"), string.Join(",", log));
    Ok(log.Contains("dispose:a") && log.Contains("dispose:b"), string.Join(",", log));
});

Test("disposal happens in REVERSE order", () =>
{
    var log = new List<string>();
    OpenTwo(log);

    Eq(log, new[] { "open:a", "open:b", "work", "dispose:b", "dispose:a" });
});

Test("an exception still disposes what was open", () =>
{
    var log = new List<string>();
    Throws<InvalidOperationException>(() => ThrowsWhileOpen(log), "boom");

    Eq(log, new[] { "open:a", "work", "dispose:a" });
});

Test("the exception is not swallowed by the cleanup", () =>
{
    // A `finally` that does not rethrow, or a catch-all around the using,
    // would turn a crash into a silent success. It must still escape.
    var log = new List<string>();
    var ex = Throws<InvalidOperationException>(() => ThrowsWhileOpen(log));

    Eq(ex.Message, "boom");
});

Test("await using awaits the flush", async () =>
{
    var log = new List<string>();
    await OpenAsync(log);

    Eq(log, new[] { "open:a", "work", "flush:a", "dispose:a" });
});

Test("a synchronous Dispose would skip the flush", () =>
{
    // The point of IAsyncDisposable, demonstrated: this is what `using`
    // instead of `await using` gets you.
    var log = new List<string>();
    var resource = new AsyncResource("a", log);
    ((IDisposable)resource).Dispose();

    Eq(log, new[] { "open:a", "dispose:a" });
    Ok(!log.Contains("flush:a"), "the flush should NOT have happened");
});

Test("disposing twice is harmless", () =>
{
    // Dispose must be idempotent — plenty of code paths call it twice, and
    // a second call that throws turns cleanup into the failure.
    var log = new List<string>();
    var resource = new Resource("a", log);

    resource.Dispose();
    resource.Dispose();

    Eq(log.Count(entry => entry == "dispose:a"), 1);
});

// ──────────────────────────── types ──────────────────────────────────────

public sealed class Resource : IDisposable
{
    private readonly string _name;
    private readonly List<string> _log;
    private bool _disposed;

    public Resource(string name, List<string> log)
    {
        (_name, _log) = (name, log);
        _log.Add("open:" + name);
    }

    public void Dispose()
    {
        if (_disposed) return;

        _disposed = true;
        _log.Add("dispose:" + _name);
    }
}

public sealed class AsyncResource : IAsyncDisposable, IDisposable
{
    private readonly string _name;
    private readonly List<string> _log;
    private bool _disposed;

    public AsyncResource(string name, List<string> log)
    {
        (_name, _log) = (name, log);
        _log.Add("open:" + name);
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;

        _disposed = true;
        await Task.Yield();
        _log.Add("flush:" + _name);
        _log.Add("dispose:" + _name);
    }

    // The synchronous path cannot await, so it cannot flush.
    void IDisposable.Dispose()
    {
        if (_disposed) return;

        _disposed = true;
        _log.Add("dispose:" + _name);
    }
}
