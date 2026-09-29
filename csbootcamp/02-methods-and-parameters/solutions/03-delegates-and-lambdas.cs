// ─────────────────────────────────────────────────────────────────────────
//  03 · delegates and lambdas — SOLUTION                  ★★☆ core
//  concepts: Func/Action · closures · higher-order methods
//  run: dotnet run 03-delegates-and-lambdas.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  All three answers are the same idea: a local variable declared inside the
//  outer method, captured by a lambda that outlives the method. The compiler
//  moves that local onto the heap in a hidden class so it survives — that is
//  what a closure IS in C#, not a special language feature but a rewrite.
//
//  Memoize: the dictionary is created once per call to Memoize and captured
//  by the returned lambda. Every call through that lambda sees the same
//  dictionary. `GetOrAdd` does not exist on Dictionary, so TryGetValue-then-
//  store is the idiom; note this deliberately caches the RESULT, so an f that
//  throws is not cached, and an f with side effects only runs once — which is
//  why memoizing an impure function is a bug factory.
//
//  Counter is the same shape with an int instead of a dictionary. Because the
//  local is captured by reference, `count` genuinely mutates between calls.
//  Calling Counter() twice runs the method twice, creating two separate
//  captured locals — that is why the two counters are independent, and it is
//  the test that catches anyone tempted to use a static field.
//
//  Compose reads backwards from how it executes: `g(f(x))` applies f first.
//  Getting the order wrong is the classic mistake, and the (3+1)*2 test is
//  chosen so that the wrong order gives a different number.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

Func<TArg, TResult> Memoize<TArg, TResult>(Func<TArg, TResult> f)
    where TArg : notnull
{
    var cache = new Dictionary<TArg, TResult>();   // captured by the lambda
    return arg =>
    {
        if (cache.TryGetValue(arg, out var hit)) return hit;
        var result = f(arg);
        cache[arg] = result;
        return result;
    };
}

Func<TIn, TOut> Compose<TIn, TMid, TOut>(Func<TIn, TMid> f, Func<TMid, TOut> g)
    => x => g(f(x));

Func<int> Counter()
{
    var count = 0;          // one per call to Counter(), not one per program
    return () => ++count;
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("Memoize returns the same answers as the original", () =>
{
    var square = Memoize<int, int>(n => n * n);
    Eq(square(4), 16);
    Eq(square(5), 25);
});

Test("Memoize calls the underlying function once per distinct argument", () =>
{
    var calls = new Spy<int, int>(n => n * 2);
    var doubled = Memoize(calls.Func);
    doubled(3);
    doubled(3);
    doubled(4);
    Eq(calls.CallCount, 2);
});

Test("Memoize caches per argument, not globally", () =>
{
    var doubled = Memoize<int, int>(n => n * 2);
    Eq(doubled(1), 2);
    Eq(doubled(2), 4);
});

Test("Compose runs f before g", () =>
{
    var addThenDouble = Compose<int, int, int>(n => n + 1, n => n * 2);
    Eq(addThenDouble(3), 8);
});

Test("Compose can change type along the way", () =>
{
    var lengthThenEven = Compose<string, int, bool>(s => s.Length, n => n % 2 == 0);
    Ok(lengthThenEven("abcd"));
    Ok(!lengthThenEven("abc"));
});

Test("Counter counts up from 1", () =>
{
    var next = Counter();
    Eq(next(), 1);
    Eq(next(), 2);
    Eq(next(), 3);
});

Test("two counters do not share state", () =>
{
    var a = Counter();
    var b = Counter();
    a(); a(); a();
    Eq(b(), 1);
});
