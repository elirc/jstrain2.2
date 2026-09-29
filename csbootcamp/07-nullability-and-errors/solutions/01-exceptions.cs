// ─────────────────────────────────────────────────────────────────────────
//  01 · exceptions — SOLUTION                             ★★☆ core
//  concepts: custom exceptions · rethrow · filters · finally
//  run: dotnet run 01-exceptions.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Exceptions are for the EXCEPTIONAL — a broken invariant, a failed I/O, a
//  bug. They are not a control-flow mechanism for expected outcomes: a user
//  typing a bad email is normal (module 16), and an exception per bad field
//  on a busy endpoint is an availability problem.
//
//  Three things people get wrong:
//
//      throw ex;      RESETS the stack trace — you lose where it came from
//      throw;         preserves it. Almost always what you want.
//      catch (X) when (filter)   decides WITHOUT unwinding the stack
//
//  An exception filter runs *before* the stack unwinds, so a debugger still
//  shows the original throw site — which a `catch` + `if` + rethrow does not.
//
//  Walkthrough:
//  `OrderNotFoundException` carries the **id**, not just a formatted message.
//  That is the difference between a caller being able to act on the failure
//  and a caller parsing English out of `ex.Message` — which breaks the day
//  someone localises it. Put the data on the exception.
//
//  `Process` shows the wrap-but-do-not-double-wrap pattern. Catching
//  `ProcessingException` first and rethrowing with a bare `throw;` preserves
//  the original stack trace. Writing `throw ex;` instead RESETS it, so the
//  trace starts at your catch block and the actual throw site is gone —
//  which is how a stack trace ends up pointing at a helper that did nothing
//  wrong.
//
//  Wrapping also keeps the original as `InnerException`. Losing that (a bare
//  `throw new ProcessingException("failed")`) discards everything about the
//  real cause, and is the reason so many logs say "processing failed" and
//  nothing else.
//
//  `RetryTransient` uses an **exception filter** — `catch (Exception e) when
//  (e is TransientException && ...)`. A filter is evaluated BEFORE the stack
//  unwinds, so if it returns false the exception continues on its way with
//  its original context intact and a debugger still breaks at the real throw
//  site. The alternative — catch everything, check the type, rethrow — has
//  already unwound by the time you decide, which loses that.
//
//  The filter also expresses "retry only this kind of failure" declaratively.
//  The test with `InvalidOperationException` proves it: one call, no retries,
//  straight out. Retrying a permanent failure five times is just five times
//  the latency before the same error.
//
//  `finally` in `WithCleanup` runs on the success path, the exception path,
//  and on the way out of a `return`. It is what `using` compiles to, and it
//  is the only reliable place for cleanup.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Look up the order. Throw OrderNotFoundException (carrying the id) when it
// is missing.
Order Find(Dictionary<int, Order> orders, int id)
    => orders.TryGetValue(id, out var order)
        ? order
        : throw new OrderNotFoundException(id);

// Call `work`. If it throws anything, wrap it in ProcessingException with
// the message "processing failed" and the original as InnerException.
// A ProcessingException must pass through unwrapped.
string Process(Func<string> work)
{
    try
    {
        return work();
    }
    catch (ProcessingException)
    {
        throw;      // bare throw PRESERVES the stack trace; `throw ex;` resets it
    }
    catch (Exception e)
    {
        // Keep the original as InnerException — losing it loses the cause.
        throw new ProcessingException("processing failed", e);
    }
}

// Run `work`, always appending "closed" to `log` afterwards — whether it
// succeeded, threw, or returned early.
string WithCleanup(Func<string> work, List<string> log)
{
    try
    {
        return work();
    }
    finally
    {
        // Runs on success, on throw, and on the way out of the return.
        log.Add("closed");
    }
}

// Retry `work` up to `attempts` times, but ONLY for TransientException.
// Anything else propagates immediately. Uses an exception filter.
string RetryTransient(Func<string> work, int attempts)
{
    for (var attempt = 1; ; attempt++)
    {
        try
        {
            return work();
        }
        // A FILTER: evaluated before the stack unwinds, so a non-transient
        // exception keeps its original context on its way out.
        catch (TransientException) when (attempt < attempts)
        {
            // swallow and go round again
        }
    }
}

// ──────────────────────────── tests ──────────────────────────────────────

Dictionary<int, Order> Orders() => new() { [1] = new(1, "widget") };

Test("a found order is returned", () => Eq(Find(Orders(), 1).Item, "widget"));

Test("a missing order throws a specific exception", () =>
    Throws<OrderNotFoundException>(() => Find(Orders(), 99)));

Test("the exception carries the id, not just a message", () =>
{
    // Data on the exception beats parsing the message later.
    var error = Throws<OrderNotFoundException>(() => Find(Orders(), 99));
    Eq(error.OrderId, 99);
});

Test("Process passes a success straight through", () =>
    Eq(Process(() => "done"), "done"));

Test("Process wraps a foreign exception", () =>
{
    var error = Throws<ProcessingException>(
        () => Process(() => throw new InvalidOperationException("inner boom")));

    Eq(error.Message, "processing failed");
    Eq(error.InnerException?.Message, "inner boom");
});

Test("Process does not double-wrap its own exception type", () =>
{
    var error = Throws<ProcessingException>(
        () => Process(() => throw new ProcessingException("already wrapped")));

    Eq(error.Message, "already wrapped");
    Eq(error.InnerException, null);
});

Test("cleanup runs on success", () =>
{
    var log = new List<string>();
    Eq(WithCleanup(() => "ok", log), "ok");
    Eq(log, new[] { "closed" });
});

Test("cleanup runs on failure too", () =>
{
    var log = new List<string>();
    Throws<InvalidOperationException>(
        () => WithCleanup(() => throw new InvalidOperationException("x"), log));

    Eq(log, new[] { "closed" });
});

Test("retry gives up transient failures a second chance", () =>
{
    var calls = 0;
    var result = RetryTransient(() =>
    {
        calls++;
        if (calls < 3) throw new TransientException("try again");
        return "eventually";
    }, attempts: 5);

    Eq(result, "eventually");
    Eq(calls, 3);
});

Test("retry does NOT swallow a non-transient failure", () =>
{
    // A filter is how you retry one kind of failure and not another.
    var calls = 0;
    Throws<InvalidOperationException>(() => RetryTransient(() =>
    {
        calls++;
        throw new InvalidOperationException("permanent");
    }, attempts: 5));

    Eq(calls, 1);   // no retries
});

Test("retry rethrows the transient failure once attempts run out", () =>
{
    var calls = 0;
    Throws<TransientException>(() => RetryTransient(() =>
    {
        calls++;
        throw new TransientException("always");
    }, attempts: 3));

    Eq(calls, 3);
});

// ──────────────────────────── types ──────────────────────────────────────

public record Order(int Id, string Item);

// Carries DATA, not just a message.
public class OrderNotFoundException(int orderId)
    : Exception($"order {orderId} was not found")
{
    public int OrderId { get; } = orderId;
}

public class ProcessingException : Exception
{
    public ProcessingException(string message) : base(message) { }
    public ProcessingException(string message, Exception inner) : base(message, inner) { }
}

public class TransientException(string message) : Exception(message);
