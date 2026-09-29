// ─────────────────────────────────────────────────────────────────────────
//  05 · collecting errors                                 ★★☆ core
//  concepts: accumulate vs fail-fast · one error per field · error order
//  run: dotnet run 05-collecting-errors.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 02's `Result<T>` short-circuits: the first failure wins and the
//  rest of the chain never runs. That is exactly right for a pipeline where
//  step 3 needs step 2's output.
//
//  It is exactly wrong for validating a form. Three bad fields become three
//  round trips, and the user fixes their email only to be told about their
//  password. **Validation accumulates; pipelines short-circuit.** Knowing
//  which one you are writing is the whole lesson.
//
//  Build both here, on the same input, so the difference is visible.
//
//  The rules for a Signup:
//
//      Email      required, and must contain '@'
//      Password   at least 8 characters
//      Age        between 13 and 120 inclusive
//
//  And two rules about the errors themselves, which matter more than they
//  look:
//
//   1. **One error per field, most specific first.** A blank email is
//      "email is required", not that AND "email must contain @". Reporting
//      both for one empty box reads as noise.
//   2. **Field order, not discovery order.** Email, then password, then age —
//      the order they appear on the form, every time. A caller rendering the
//      list next to the inputs depends on it.
//
//  hint: build the list, then decide — do not try to write one method that
//        does both modes with a flag
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Every problem with the input, in field order. Empty means valid.
IReadOnlyList<string> Validate(Signup input)
{
    throw new NotImplementedException();
}

// Wrap the input up with its errors. Value is null when there are any —
// an invalid Signup must not be reachable from a Validated.
Validated<Signup> Assess(Signup input)
{
    throw new NotImplementedException();
}

// The fail-fast version: the FIRST problem, or null when there are none.
// This is here to be compared against, not because it is better.
string? FirstProblem(Signup input)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

var good = new Signup("ada@example.com", "hunter2!!", 36);
var allBad = new Signup("", "short", 4);

Test("a valid signup has no errors", () =>
    Eq(Validate(good), Array.Empty<string>()));

Test("a valid signup comes back usable", () =>
{
    var result = Assess(good);

    Ok(result.IsValid);
    Eq(result.Value?.Email, "ada@example.com");
});

Test("every problem is reported at once", () =>
    Eq(Validate(allBad).Count, 3));

Test("errors come back in FIELD order, not discovery order", () =>
{
    var errors = Validate(allBad);

    Ok(errors[0].Contains("email", StringComparison.OrdinalIgnoreCase), errors[0]);
    Ok(errors[1].Contains("password", StringComparison.OrdinalIgnoreCase), errors[1]);
    Ok(errors[2].Contains("age", StringComparison.OrdinalIgnoreCase), errors[2]);
});

Test("a blank email gives ONE error, not two", () =>
{
    // "required" and "must contain @" are both true of "". Only the first
    // is useful.
    var errors = Validate(new Signup("", "hunter2!!", 36));

    Eq(errors.Count, 1);
    Ok(errors[0].Contains("required"), errors[0]);
});

Test("a present but malformed email gives the specific error", () =>
{
    var errors = Validate(new Signup("ada.example.com", "hunter2!!", 36));

    Eq(errors.Count, 1);
    Ok(errors[0].Contains("@"), errors[0]);
});

Test("the age boundaries are inclusive", () =>
{
    Eq(Validate(good with { Age = 13 }), Array.Empty<string>());
    Eq(Validate(good with { Age = 120 }), Array.Empty<string>());
    Eq(Validate(good with { Age = 12 }).Count, 1);
    Eq(Validate(good with { Age = 121 }).Count, 1);
});

Test("an invalid signup is not reachable through Validated", () =>
{
    var result = Assess(allBad);

    Ok(!result.IsValid);
    Eq(result.Value, null);
    Eq(result.Errors.Count, 3);
});

Test("fail-fast reports one problem where accumulating reports three", () =>
{
    // The same input, two strategies. Three round trips versus one — which
    // is why every form validator you have used accumulates.
    Eq(Validate(allBad).Count, 3);
    Eq(FirstProblem(allBad), Validate(allBad)[0]);
    Eq(FirstProblem(good), null);
});

// ──────────────────────────── types ──────────────────────────────────────

public record Signup(string Email, string Password, int Age);

public sealed record Validated<T>(T? Value, IReadOnlyList<string> Errors)
{
    public bool IsValid => Errors.Count == 0;
}
