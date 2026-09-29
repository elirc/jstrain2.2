// ─────────────────────────────────────────────────────────────────────────
//  01 · the handlers all agree — SOLUTION                 ★★☆ hunt
//  concepts: closures · loop variables
//  run: dotnet run 01-the-handlers-all-agree.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  **Bug class: capturing a loop variable.**
//
//  A lambda captures the VARIABLE, not its value at the moment it was
//  written. In a `for` loop there is exactly ONE `i` for the whole loop, so
//  all three lambdas close over the same storage location. By the time any of
//  them runs, the loop has finished and `i == names.Length` — hence the
//  `IndexOutOfRangeException` rather than a wrong-but-plausible answer.
//
//  The fix is to give each iteration its own variable. Copying into a local
//  declared INSIDE the loop body does it: a fresh `name` per iteration, each
//  captured separately.
//
//  The reason this is worth its own hunt: **`foreach` does not have this
//  problem.** C# 5 changed the `foreach` iteration variable to be per
//  iteration precisely because this bug was so common. `for` was left alone,
//  because changing it would have altered the meaning of correct code. So
//  the same-looking loop is safe in one form and broken in the other, and no
//  warning tells you which you are in.
//
//  `BuildCallbacks` is the second instance, and it fails more quietly —
//  `id` ends at `count + 1`, so every callback returns 40 instead of
//  10/20/30. No exception, just wrong numbers, which is the version you
//  actually ship.
//
//  How to recognise it: a lambda inside a `for` loop that mentions the loop
//  variable. If the lambda outlives the iteration — stored in a list,
//  registered as a handler, passed to `Task.Run` — copy the variable first.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// One handler per name. Each should capture its own name.
List<Func<string>> BuildHandlers(params string[] names)
{
    var handlers = new List<Func<string>>();

    for (var i = 0; i < names.Length; i++)
    {
        // ONE variable per iteration. `i` is shared by the whole loop, so
        // capturing it directly means every lambda sees its final value.
        var name = names[i];
        handlers.Add(() => $"handling {name}");
    }

    return handlers;
}

// Register a callback per subscriber id, each remembering its own id.
Dictionary<int, Func<int>> BuildCallbacks(int count)
{
    var callbacks = new Dictionary<int, Func<int>>();

    for (var id = 1; id <= count; id++)
    {
        var captured = id;
        callbacks[id] = () => captured * 10;
    }

    return callbacks;
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("one handler per name", () =>
    Eq(BuildHandlers("a", "b", "c").Count, 3));

Test("each handler reports ITS OWN name", () =>
    Eq(BuildHandlers("a", "b", "c").Select(h => h()),
       new[] { "handling a", "handling b", "handling c" }));

Test("the first handler is not the last one", () =>
{
    var handlers = BuildHandlers("first", "second");
    Ok(handlers[0]() != handlers[1](), "the two handlers returned the same thing");
});

Test("a single handler works", () =>
    Eq(BuildHandlers("solo")[0](), "handling solo"));

Test("no names gives no handlers", () =>
    Eq(BuildHandlers().Count, 0));

Test("each callback remembers its own id", () =>
{
    var callbacks = BuildCallbacks(3);
    Eq(callbacks.Keys.OrderBy(k => k), new[] { 1, 2, 3 });
    Eq(callbacks[1](), 10);
    Eq(callbacks[2](), 20);
    Eq(callbacks[3](), 30);
});

Test("calling a handler twice is stable", () =>
{
    var handler = BuildHandlers("a", "b")[0];
    Eq(handler(), handler());
    Eq(handler(), "handling a");
});
