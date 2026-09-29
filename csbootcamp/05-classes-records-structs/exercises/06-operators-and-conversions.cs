// ─────────────────────────────────────────────────────────────────────────
//  06 · operators and conversions                         ★★★ stretch
//  concepts: operator overloading · IComparable · implicit vs explicit
//  run: dotnet run 06-operators-and-conversions.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A domain type that wraps a number — money, a duration, a temperature — is
//  worth the effort mainly because it can refuse to do the wrong thing. The
//  operators are how you say what "the wrong thing" is.
//
//      operator +          adding two of them
//      IComparable<T>      ordering, which is what Sort and OrderBy use
//      implicit operator   a conversion that can NEVER fail or surprise
//      explicit operator   one that can lose information, so the caller
//                          must ask for it in writing
//
//  **The implicit/explicit rule is the one to internalise.** Implicit
//  conversions happen silently, in overload resolution, in places you did not
//  write them. Make one implicit only if it cannot throw, cannot lose data,
//  and cannot change meaning. Everything else is explicit — a cast is the
//  caller acknowledging the risk.
//
//  Here: `int → Pence` is implicit (every int is a valid amount of pence).
//  `Pence → decimal` in POUNDS is explicit, because it divides by 100 and a
//  reader should see that happening.
//
//  hint: `CompareTo` returns negative / zero / positive, and the easiest
//        correct implementation is to delegate to the wrapped value's
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("two amounts add up", () =>
    Eq((new Pence(150) + new Pence(99)).Amount, 249));

Test("subtraction works and can go negative", () =>
    Eq((new Pence(100) - new Pence(150)).Amount, -50));

Test("multiplying by a count scales the amount", () =>
    Eq((new Pence(150) * 3).Amount, 450));

Test("an int converts implicitly", () =>
{
    // No cast at the call site: every int is a valid number of pence, so
    // this conversion cannot surprise anyone.
    Pence amount = 250;

    Eq(amount.Amount, 250);
    Eq((amount + 50).Amount, 300);
});

Test("pounds require an explicit cast", () =>
{
    // Explicit, because it divides by 100 — a reader should see it.
    Eq((decimal)new Pence(1999), 19.99m);
    Eq((decimal)new Pence(5), 0.05m);
});

Test("CompareTo reports all three outcomes", () =>
{
    Ok(new Pence(100).CompareTo(new Pence(200)) < 0);
    Ok(new Pence(200).CompareTo(new Pence(100)) > 0);
    Eq(new Pence(100).CompareTo(new Pence(100)), 0);
});

Test("comparison operators follow CompareTo", () =>
{
    Ok(new Pence(100) < new Pence(200));
    Ok(new Pence(200) > new Pence(100));
    Ok(new Pence(100) <= new Pence(100));
    Ok(new Pence(100) >= new Pence(100));
});

Test("Min and Max use the same ordering", () =>
{
    // Anything that orders a sequence goes through CompareTo — including
    // Sort and OrderBy, which are not used here only because they wrap a
    // failing comparer in InvalidOperationException and would hide the
    // `todo` marker.
    var amounts = new[] { new Pence(300), new Pence(100), new Pence(200) };

    Eq(amounts.Min().Amount, 100);
    Eq(amounts.Max().Amount, 300);
});

Test("ToString renders as pounds", () =>
{
    Eq(new Pence(1999).ToString(), "£19.99");
    Eq(new Pence(5).ToString(), "£0.05");
    Eq(new Pence(-250).ToString(), "-£2.50");
});

Test("the record struct still compares by value", () =>
{
    Ok(new Pence(100) == new Pence(100));
    Ok(new Pence(100) != new Pence(200));
});

// ──────────────────────────── your code ──────────────────────────────────

// A whole number of pence. Add the operators the tests ask for.
//
//   +  -            two Pence
//   *               Pence and an int count
//   implicit        from int
//   explicit        to decimal, in POUNDS
//   IComparable     and the four relational operators
//   ToString        "£19.99", "£0.05", "-£2.50"
//
// `==` and `!=` come free from `record struct` — do not write them.
public readonly record struct Pence(int Amount) : IComparable<Pence>
{
    public static Pence operator +(Pence left, Pence right)
    {
        throw new NotImplementedException();
    }

    public static Pence operator -(Pence left, Pence right)
    {
        throw new NotImplementedException();
    }

    public static Pence operator *(Pence amount, int count)
    {
        throw new NotImplementedException();
    }

    public static implicit operator Pence(int amount)
    {
        throw new NotImplementedException();
    }

    public static explicit operator decimal(Pence amount)
    {
        throw new NotImplementedException();
    }

    public int CompareTo(Pence other)
    {
        throw new NotImplementedException();
    }

    public static bool operator <(Pence left, Pence right) => left.CompareTo(right) < 0;
    public static bool operator >(Pence left, Pence right) => left.CompareTo(right) > 0;
    public static bool operator <=(Pence left, Pence right) => left.CompareTo(right) <= 0;
    public static bool operator >=(Pence left, Pence right) => left.CompareTo(right) >= 0;

    public override string ToString()
    {
        throw new NotImplementedException();
    }
}
