// ─────────────────────────────────────────────────────────────────────────
//  02 · the Result pattern — SOLUTION                     ★★★ stretch
//  concepts: expected failure in the type · composition · no exceptions
//  run: dotnet run 02-the-result-pattern.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  An exception says "this should not have happened". But a user typing a
//  bad email, a lookup missing, a payment declined — those are ordinary
//  outcomes, and modelling them as exceptions has three costs:
//
//    · they are invisible in the signature (nothing says what can throw)
//    · the caller can forget to handle them, and the compiler will not care
//    · they are slow, which matters on a hot path
//
//  A `Result<T>` puts the failure IN THE TYPE. The caller cannot get at the
//  value without acknowledging that there might not be one.
//
//      Result<int>.Ok(42)
//      Result<int>.Fail("not a number")
//
//  Then it composes: `Map` transforms a success and leaves a failure alone,
//  `Then` chains another operation that can itself fail. A failure
//  short-circuits the rest of the chain — like `?.` for errors.
//
//  Walkthrough:
//  `Map` and `Then` differ by one thing: whether the function you pass can
//  itself fail.
//
//      Map:  T -> U           wrap the answer back up as a success
//      Then: T -> Result<U>   the function decides success or failure
//
//  Use `Map` for a transformation that cannot fail (formatting, arithmetic).
//  Use `Then` for another fallible step (parsing, a lookup, a validation).
//  Using `Map` where you needed `Then` gives you `Result<Result<U>>`, which
//  is the compiler telling you which one you wanted.
//
//  Both **short-circuit**: on a failure the function is never invoked and the
//  original error passes straight through. The two "never runs" tests exist
//  to pin that down, because it is the property that makes chains readable —
//  `Describe` reads as a straight line with no error handling in the middle,
//  and the first failure wins.
//
//  Compare with the exception version of the same pipeline: the happy path
//  reads the same, but *nothing in the signature* tells a caller that
//  `ParseAge` can fail, and forgetting a `try` is silent until production.
//  With `Result<T>`, `.Value` on a failure throws — so the only way to get
//  the value is to check first, and the compiler keeps the failure in view.
//
//  Trade-offs worth being honest about. `Result` is right for **expected**
//  failures at a boundary you control. It is wrong for genuine bugs — a null
//  reference or a broken invariant should throw, loudly. And it is viral:
//  once a method returns `Result<T>`, its callers must handle it, which is
//  the point and also the cost.
//
//  Real projects usually reach for a library (`FluentResults`,
//  `ErrorOr`, `OneOf`) or model the error as a type rather than a string, so
//  callers can switch on it. This is the mechanism, in forty lines.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Globalization;

// Parse, failing with "not a number: {input}".
Result<int> ParseAge(string input)
    => int.TryParse(input, NumberStyles.Integer, CultureInfo.InvariantCulture, out var age)
        ? Result<int>.Ok(age)
        : Result<int>.Fail($"not a number: {input}");

// Fail with "age must be 0..130" when out of range.
Result<int> CheckRange(int age)
    => age is >= 0 and <= 130
        ? Result<int>.Ok(age)
        : Result<int>.Fail("age must be 0..130");

// Parse then range-check, in one expression. The first failure wins.
Result<string> Describe(string input)
    // Reads as a straight line; the first failure short-circuits the rest.
    => ParseAge(input)
        .Then(CheckRange)
        .Map(age => $"age {age}");

// ──────────────────────────── tests ──────────────────────────────────────

Test("a success carries its value", () =>
{
    var result = Result<int>.Ok(42);

    Ok(result.IsSuccess);
    Eq(result.Value, 42);
});

Test("a failure carries its error and has no value", () =>
{
    var result = Result<int>.Fail("nope");

    Ok(!result.IsSuccess);
    Eq(result.Error, "nope");
    Throws<InvalidOperationException>(() => _ = result.Value);
});

Test("parsing succeeds", () => Eq(ParseAge("36").Value, 36));

Test("parsing fails with a useful message", () =>
{
    var result = ParseAge("abc");

    Ok(!result.IsSuccess);
    Eq(result.Error, "not a number: abc");
});

Test("Map transforms a success", () =>
    Eq(Result<int>.Ok(2).Map(n => n * 10).Value, 20));

Test("Map leaves a failure alone — the function never runs", () =>
{
    var ran = false;
    var result = Result<int>.Fail("bad").Map(n => { ran = true; return n * 10; });

    Ok(!result.IsSuccess);
    Eq(result.Error, "bad");
    Ok(!ran, "Map must not run its function on a failure");
});

Test("Then chains an operation that can itself fail", () =>
    Eq(Result<int>.Ok(36).Then(CheckRange).Value, 36));

Test("Then propagates the SECOND failure", () =>
{
    var result = Result<int>.Ok(500).Then(CheckRange);

    Ok(!result.IsSuccess);
    Eq(result.Error, "age must be 0..130");
});

Test("Then short-circuits on the FIRST failure", () =>
{
    var ran = false;
    var result = Result<int>.Fail("earlier").Then(n => { ran = true; return CheckRange(n); });

    Eq(result.Error, "earlier");
    Ok(!ran);
});

Test("the whole pipeline succeeds", () =>
    Eq(Describe("36").Value, "age 36"));

Test("a parse failure stops the pipeline", () =>
    Eq(Describe("abc").Error, "not a number: abc"));

Test("a range failure stops the pipeline", () =>
    Eq(Describe("500").Error, "age must be 0..130"));

Test("nothing here throws for an expected failure", () =>
{
    // Every bad input above produced a VALUE describing the failure.
    // The compiler made the caller look at it.
    Ok(!Describe("abc").IsSuccess);
    Ok(!Describe("500").IsSuccess);
});

// ──────────────────────────── types ──────────────────────────────────────

public class Result<T>
{
    private readonly T _value;

    private Result(bool success, T value, string error)
        => (IsSuccess, _value, Error) = (success, value, error);

    public bool IsSuccess { get; }
    public string Error { get; }

    // Reading the value of a failure is a BUG, so it throws.
    public T Value => IsSuccess
        ? _value
        : throw new InvalidOperationException($"no value: {Error}");

    public static Result<T> Ok(T value) => new(true, value, "");
    public static Result<T> Fail(string error) => new(false, default!, error);

    // T → U. Wraps the result back up as a success.
    public Result<U> Map<U>(Func<T, U> f)
        => IsSuccess ? Result<U>.Ok(f(_value)) : Result<U>.Fail(Error);

    // T → Result<U>. The function decides success or failure itself.
    public Result<U> Then<U>(Func<T, Result<U>> f)
        => IsSuccess ? f(_value) : Result<U>.Fail(Error);
}
