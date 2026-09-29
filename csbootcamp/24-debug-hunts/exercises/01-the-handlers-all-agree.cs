// ─────────────────────────────────────────────────────────────────────────
//  01 · the handlers all agree                            ★★☆ hunt
//  concepts: closures · loop variables
//  run: dotnet run 01-the-handlers-all-agree.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  THIS FILE SHIPS BROKEN. The tests are red on the first run, by design.
//
//  `BuildHandlers` should return one handler per name, each reporting the
//  name it was built for:
//
//      BuildHandlers("a", "b", "c")  →  ["handling a", "handling b", "handling c"]
//
//  Instead every handler reports the same thing. The code reads correctly,
//  compiles without a warning, and is wrong.
//
//  Find the bug and make the smallest fix that turns the tests green.
//  Do not rewrite the method — one line is enough.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// One handler per name. Each should capture its own name.
List<Func<string>> BuildHandlers(params string[] names)
{
    var handlers = new List<Func<string>>();

    for (var i = 0; i < names.Length; i++)
    {
        handlers.Add(() => $"handling {names[i]}");
    }

    return handlers;
}

// Register a callback per subscriber id, each remembering its own id.
Dictionary<int, Func<int>> BuildCallbacks(int count)
{
    var callbacks = new Dictionary<int, Func<int>>();

    for (var id = 1; id <= count; id++)
    {
        callbacks[id] = () => id * 10;
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
