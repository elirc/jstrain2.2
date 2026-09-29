// ─────────────────────────────────────────────────────────────────────────
//  02 · out, ref and in — SOLUTION                        ★★☆ core
//  concepts: out parameters · ref semantics · the TryX pattern
//  run: dotnet run 02-out-and-ref.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  TryDivide assigns `quotient = 0` on the failure path before returning
//  false. That is not politeness — it is required. An `out` parameter is
//  "definitely assigned" on every path out of the method, and the compiler
//  rejects the version that returns false without touching it. That rule is
//  what makes `out var` safe to read at the call site.
//
//  The TryX shape is worth internalising: return a bool, hand the value back
//  through out, never throw for the expected failure. Compare with returning
//  `int?` — the nullable version is often cleaner in modern C#, but TryX
//  costs zero allocation and is what the BCL standardised on, so you will
//  read it constantly.
//
//  Swap<T> works for both value and reference types because `ref T` passes
//  the STORAGE LOCATION, not the value or the reference. Without `ref`, the
//  method would swap its own two local copies and the caller would see
//  nothing change — which is the single most common misunderstanding here.
//
//  Bump returns `++counter` (pre-increment): increment first, then yield the
//  new value. `counter++` would hand back 41 and store 42, which is exactly
//  what the last test is there to catch.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

bool TryDivide(int numerator, int divisor, out int quotient)
{
    if (divisor == 0)
    {
        quotient = 0;      // required: out must be assigned on every path
        return false;
    }
    quotient = numerator / divisor;
    return true;
}

void Swap<T>(ref T a, ref T b) => (a, b) = (b, a);

int Bump(ref int counter) => ++counter;   // pre-increment: new value, not old

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
