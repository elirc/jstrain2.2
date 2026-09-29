// ─────────────────────────────────────────────────────────────────────────
//  02 · the Result pattern                                ★★★ stretch
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
//  hint: Map takes T → U; Then takes T → Result<U>. That difference is the
//        whole distinction between them
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Globalization;

// Parse, failing with "not a number: {input}".
Result<int> ParseAge(string input)
{
    throw new NotImplementedException();
}

// Fail with "age must be 0..130" when out of range.
Result<int> CheckRange(int age)
{
    throw new NotImplementedException();
}

// Parse then range-check, in one expression. The first failure wins.
Result<string> Describe(string input)
{
    throw new NotImplementedException();
}

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
    public Result<U> Map<U>(Func<T, U> f) => throw new NotImplementedException();

    // T → Result<U>. The function decides success or failure itself.
    public Result<U> Then<U>(Func<T, Result<U>> f) => throw new NotImplementedException();
}
