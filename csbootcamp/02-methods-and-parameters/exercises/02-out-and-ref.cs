// ─────────────────────────────────────────────────────────────────────────
//  02 · out, ref and in                                   ★★☆ core
//  concepts: out parameters · ref semantics · the TryX pattern
//  run: dotnet run 02-out-and-ref.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Three modifiers, three different contracts:
//
//      out  the method MUST assign it; the caller's prior value is ignored
//      ref  passes the variable itself; the method may read and write it
//      in   passes by reference for speed, but read-only
//
//  `out` is how .NET expresses "this might fail, and here is the result if it
//  didn't" without allocating anything — the TryParse / TryGetValue shape you
//  have already been using. Write your own.
//
//      TryDivide(10, 2, out var q)  → true,  q == 5
//      TryDivide(10, 0, out var q)  → false, q == 0
//      Swap(ref a, ref b)           → a and b trade places
//      Bump(ref counter)            → counter goes up by 1, returns the new value
//
//  hint: on the failure path you still have to assign the out parameter —
//        the compiler will not let you return without it
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// True and the quotient, or false and 0 when the divisor is 0.
bool TryDivide(int numerator, int divisor, out int quotient)
{
    throw new NotImplementedException();
}

// Exchange the two variables in place.
void Swap<T>(ref T a, ref T b)
{
    throw new NotImplementedException();
}

// Increment the caller's counter and return its new value.
int Bump(ref int counter)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("TryDivide reports success and the quotient", () =>
{
    Ok(TryDivide(10, 2, out var q));
    Eq(q, 5);
});

Test("TryDivide truncates like integer division", () =>
{
    TryDivide(7, 2, out var q);
    Eq(q, 3);
});

Test("TryDivide fails on divide by zero instead of throwing", () =>
{
    Ok(!TryDivide(10, 0, out var q));
    Eq(q, 0);
});

Test("Swap exchanges two ints", () =>
{
    var (a, b) = (1, 2);
    Swap(ref a, ref b);
    Eq(a, 2);
    Eq(b, 1);
});

Test("Swap is generic over reference types too", () =>
{
    var (a, b) = ("first", "second");
    Swap(ref a, ref b);
    Eq(a, "second");
    Eq(b, "first");
});

Test("Bump mutates the caller's variable", () =>
{
    var counter = 0;
    Bump(ref counter);
    Bump(ref counter);
    Eq(counter, 2);
});

Test("Bump returns the new value, not the old one", () =>
{
    var counter = 41;
    Eq(Bump(ref counter), 42);
});
