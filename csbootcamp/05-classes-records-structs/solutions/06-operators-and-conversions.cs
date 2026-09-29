// ─────────────────────────────────────────────────────────────────────────
//  06 · operators and conversions — SOLUTION              ★★★ stretch
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
//  Walkthrough:
//  Every member is one line, and the decisions are all about which ones exist
//  at all.
//
//  **`implicit` from `int`, `explicit` to `decimal`.** That asymmetry is the
//  rule in action. Every `int` is a valid number of pence — the conversion
//  cannot fail, cannot lose anything, cannot mean something unexpected — so
//  it is safe to have it happen silently. Going the other way divides by 100
//  and changes the UNIT from pence to pounds, so the caller writes a cast and
//  the next reader sees it.
//
//  Get this backwards and the damage is quiet. An implicit conversion
//  participates in overload resolution, so `Log(amount)` might start
//  selecting `Log(decimal)` instead of `Log(object)` and silently report
//  pounds where the format string expects pence. Implicit conversions are a
//  promise that nothing interesting happens; keep it.
//
//  **`CompareTo` delegates to `int.CompareTo`.** Do not write
//  `left.Amount - right.Amount`: it is the classic overflow bug, because the
//  subtraction of two large ints wraps and reports the opposite order. The
//  wrapped type already has a correct comparison — use it.
//
//  **The four relational operators are given, and they all route through
//  `CompareTo`.** That is not busywork: C# requires `<` and `>` to be
//  declared as a pair, and `<=` with `>=`. Defining them independently is how
//  a type ends up where `a < b` and `b > a` disagree.
//
//  `==` and `!=` are NOT written here — `record struct` generates them from
//  the fields, and they are consistent with `CompareTo` because both reduce
//  to comparing `Amount`. Consistency between equality and ordering is part
//  of the `IComparable` contract, and breaking it makes sorted collections
//  behave unpredictably.
//
//  **`ToString` formats from the invariant culture on purpose.** `"£"` is
//  hard-coded and `F2` is applied to a decimal, so the output does not change
//  when the process runs in a different locale. A currency type that renders
//  differently on a German server is a bug report waiting to happen; if you
//  want culture-aware money, take the culture as a parameter rather than
//  reading ambient state.
//
//  The negative case is worth a look: `-£2.50`, not `£-2.50`. Formatting the
//  absolute value and placing the sign yourself is the only way to get that,
//  and it is the kind of detail that only shows up in a refund.
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
    public static Pence operator +(Pence left, Pence right) =>
        new(left.Amount + right.Amount);

    public static Pence operator -(Pence left, Pence right) =>
        new(left.Amount - right.Amount);

    public static Pence operator *(Pence amount, int count) =>
        new(amount.Amount * count);

    // Implicit: every int is a valid number of pence. Nothing can go wrong,
    // nothing is lost, so it may happen silently.
    public static implicit operator Pence(int amount) => new(amount);

    // Explicit: this divides by 100 and changes the UNIT. The caller says
    // so in writing, and the next reader sees it.
    public static explicit operator decimal(Pence amount) => amount.Amount / 100m;

    // Delegate. `Amount - other.Amount` is the classic overflow bug: for
    // large values the subtraction wraps and reports the opposite order.
    public int CompareTo(Pence other) => Amount.CompareTo(other.Amount);

    public static bool operator <(Pence left, Pence right) => left.CompareTo(right) < 0;
    public static bool operator >(Pence left, Pence right) => left.CompareTo(right) > 0;
    public static bool operator <=(Pence left, Pence right) => left.CompareTo(right) <= 0;
    public static bool operator >=(Pence left, Pence right) => left.CompareTo(right) >= 0;

    // "-£2.50", not "£-2.50": format the magnitude, place the sign.
    public override string ToString() =>
        (Amount < 0 ? "-£" : "£") + (Math.Abs(Amount) / 100m).ToString("F2",
            System.Globalization.CultureInfo.InvariantCulture);
}
