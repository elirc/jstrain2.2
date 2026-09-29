// ─────────────────────────────────────────────────────────────────────────
//  02 · custom validators — SOLUTION                      ★★☆ core
//  concepts: ValidationAttribute · IValidatableObject · cross-field rules
//  run: dotnet run 02-custom-validators.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The split is the whole lesson. An attribute decorating `CheckIn` receives
//  the CheckIn value and nothing else — it physically cannot compare it to
//  `CheckOut`. So:
//
//    · one value, reusable anywhere  → `ValidationAttribute`
//    · several fields of one type    → `IValidatableObject`
//
//  Trying to force a cross-field rule into an attribute is where people end
//  up reflecting over `context.ObjectInstance` and hard-coding property
//  names — brittle, untestable, and silently broken by a rename.
//
//  `IsValid` returns `ValidationResult.Success` (which is `null` under the
//  hood) to pass, and a `ValidationResult` to fail. Passing
//  `[context.MemberName]` as the member names is what makes the error land on
//  the right field instead of the object as a whole; without it the client
//  gets an error it cannot attach to an input.
//
//  `ErrorMessage` comes from wherever the attribute was applied, so the
//  message stays with the usage rather than baked into the rule.
//  `?? "…"` supplies a default for a caller who did not set one.
//
//  The last test pins down ordering, and it surprises people: `TryValidateObject`
//  runs the property attributes first and only calls `IValidatableObject
//  .Validate` **if they all passed**. That is deliberate and correct — a
//  cross-field rule reading a field that failed its own format check would be
//  comparing garbage. Fix the shape, then check the meaning. The practical
//  consequence is that a user can fix one error and immediately be shown a
//  second one they could not have seen before; that is not a bug.
//
//  Note the fixed `Today` constant. A validator that reads `DateTime.Now` is
//  untestable — the test either depends on when it runs or has to freeze the
//  clock. Injecting time (here as a constant, in real code as a
//  `TimeProvider`) is what makes date rules verifiable.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.ComponentModel.DataAnnotations;

List<string> Validate(object model)
{
    var results = new List<ValidationResult>();
    Validator.TryValidateObject(
        model, new ValidationContext(model), results, validateAllProperties: true);

    var errors = results
        .Select(r => $"{r.MemberNames.FirstOrDefault() ?? ""}: {r.ErrorMessage}")
        .ToList();
    errors.Sort(StringComparer.Ordinal);
    return errors;
}

// ──────────────────────────── tests ──────────────────────────────────────

Booking Valid() => new()
{
    CheckIn = new DateOnly(2026, 6, 1),
    CheckOut = new DateOnly(2026, 6, 5),
    Guests = 2,
    RoomCapacity = 4,
};

Test("a valid booking has no errors", () =>
    Eq(Validate(Valid()), new List<string>()));

Test("the custom attribute rejects a past date", () =>
{
    var booking = Valid();
    booking.CheckIn = new DateOnly(2019, 1, 1);

    Ok(Validate(booking).Contains("CheckIn: CheckIn must be in the future"));
});

Test("the custom attribute accepts a future date", () =>
{
    var booking = Valid();
    booking.CheckIn = new DateOnly(2030, 1, 1);
    booking.CheckOut = new DateOnly(2030, 1, 2);

    Eq(Validate(booking), new List<string>());
});

Test("the boundary is strict — equal to the cutoff is rejected", () =>
{
    var booking = Valid();
    booking.CheckIn = FutureDateAttribute.Today;

    Ok(Validate(booking).Contains("CheckIn: CheckIn must be in the future"));
});

Test("a cross-field rule catches checkout before checkin", () =>
{
    var booking = Valid();
    booking.CheckOut = booking.CheckIn.AddDays(-1);

    Eq(Validate(booking), new[] { "CheckOut: CheckOut must be after CheckIn" });
});

Test("equal dates are rejected too — a zero-night stay is not a booking", () =>
{
    var booking = Valid();
    booking.CheckOut = booking.CheckIn;

    Eq(Validate(booking), new[] { "CheckOut: CheckOut must be after CheckIn" });
});

Test("a cross-field rule catches too many guests", () =>
{
    var booking = Valid();
    booking.Guests = 9;

    Eq(Validate(booking), new[] { "Guests: Guests exceeds the room capacity of 4" });
});

Test("exactly at capacity is allowed", () =>
{
    var booking = Valid();
    booking.Guests = 4;

    Eq(Validate(booking), new List<string>());
});

Test("both cross-field rules can fail at once", () =>
{
    var booking = Valid();
    booking.CheckOut = booking.CheckIn;
    booking.Guests = 9;

    Eq(Validate(booking), new[]
    {
        "CheckOut: CheckOut must be after CheckIn",
        "Guests: Guests exceeds the room capacity of 4",
    });
});

Test("IValidatableObject does not run while an attribute is failing", () =>
{
    var booking = Valid();
    booking.CheckIn = new DateOnly(2019, 1, 1);
    booking.Guests = 9;

    var errors = Validate(booking);
    Ok(errors.Contains("CheckIn: CheckIn must be in the future"));
    Ok(!errors.Any(e => e.StartsWith("Guests:")),
       "cross-field validation should not have run yet");
});

// ──────────────────────────── types ──────────────────────────────────────

public class FutureDateAttribute : ValidationAttribute
{
    public static readonly DateOnly Today = new(2026, 1, 1);

    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        // Strictly after — equal to the cutoff is not "in the future".
        if (value is DateOnly date && date > Today)
            return ValidationResult.Success;

        // MemberName is what attaches the error to the right input.
        return new ValidationResult(
            ErrorMessage ?? "must be a date in the future",
            context.MemberName is null ? [] : [context.MemberName]);
    }
}

public class Booking : IValidatableObject
{
    [FutureDate(ErrorMessage = "CheckIn must be in the future")]
    public DateOnly CheckIn { get; set; }

    public DateOnly CheckOut { get; set; }

    [Range(1, 20)]
    public int Guests { get; set; }

    public int RoomCapacity { get; set; }

    // Runs only after every property attribute has passed.
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (CheckOut <= CheckIn)
            yield return new ValidationResult(
                "CheckOut must be after CheckIn", [nameof(CheckOut)]);

        if (Guests > RoomCapacity)
            yield return new ValidationResult(
                $"Guests exceeds the room capacity of {RoomCapacity}", [nameof(Guests)]);
    }
}
