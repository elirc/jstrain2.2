// ─────────────────────────────────────────────────────────────────────────
//  03 · delegates and lambdas                             ★★☆ core
//  concepts: Func/Action · closures · higher-order methods
//  run: dotnet run 03-delegates-and-lambdas.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A delegate is a typed reference to a method. You almost never declare one
//  by hand any more — the framework supplies the two you need:
//
//      Func<A, B>   takes an A, returns a B     (the LAST type is the return)
//      Action<A>    takes an A, returns nothing
//      Func<bool>   takes nothing, returns bool
//
//  Everything in LINQ, every ASP.NET endpoint handler, and every middleware
//  is one of these. Build three higher-order helpers:
//
//      Memoize(f)          → an f that caches by argument
//      Compose(f, g)       → x => g(f(x))         (f first, then g)
//      Counter()           → a fresh independent counter, closing over state
//
//  hint: Memoize's cache must live OUTSIDE the returned lambda but INSIDE
//        Memoize — that captured local is the whole trick
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Wrap f so that repeated calls with the same argument only run f once.
Func<TArg, TResult> Memoize<TArg, TResult>(Func<TArg, TResult> f)
    where TArg : notnull
{
    throw new NotImplementedException();
}

// Run f, then feed its result to g.
Func<TIn, TOut> Compose<TIn, TMid, TOut>(Func<TIn, TMid> f, Func<TMid, TOut> g)
{
    throw new NotImplementedException();
}

// Each call to Counter() returns a NEW counter that starts at 0 and returns
// 1, 2, 3… on successive invocations. Two counters must not share state.
Func<int> Counter()
{
    throw new NotImplementedException();
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
    Eq(addThenDouble(3), 8);          // (3+1)*2, not 3*2+1
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
