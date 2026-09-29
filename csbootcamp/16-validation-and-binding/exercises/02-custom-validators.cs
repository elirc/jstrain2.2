// ─────────────────────────────────────────────────────────────────────────
//  02 · custom validators                                 ★★☆ core
//  concepts: ValidationAttribute · IValidatableObject · cross-field rules
//  run: dotnet run 02-custom-validators.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  The built-in attributes run out quickly. Two ways to extend, and picking
//  the right one is the lesson:
//
//    · **`ValidationAttribute`** — a rule about ONE value, reusable anywhere.
//      "must be in the future", "must be a valid ISO currency".
//    · **`IValidatableObject`** — a rule ACROSS fields, belonging to one
//      type. "end must be after start", "postcode required when country is
//      GB".
//
//  A cross-field rule cannot live in an attribute on a property, because an
//  attribute sees only the value it decorates. That is the whole reason
//  `IValidatableObject` exists.
//
//  Implement:
//
//    · `FutureDateAttribute`   — the value must be a DateOnly strictly after
//                                a date the caller supplies (so tests don't
//                                depend on the wall clock)
//    · `Booking.Validate(...)` — CheckOut must be after CheckIn, and
//                                Guests must not exceed the room's capacity
//
//  hint: return `ValidationResult.Success` to pass; a `new ValidationResult(
//        message, [nameof(Prop)])` names the offending field
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.ComponentModel.DataAnnotations;

// Validate and return "Path: message" strings, sorted. Uses the same engine
// as exercise 01; IValidatableObject runs automatically AFTER the attributes
// — and only if the attributes all passed.
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
    booking.CheckIn = FutureDateAttribute.Today;   // not strictly after

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
    // The engine short-circuits: fix the shape before checking the meaning.
    var booking = Valid();
    booking.CheckIn = new DateOnly(2019, 1, 1);   // attribute fails
    booking.Guests = 9;                            // cross-field would fail

    var errors = Validate(booking);
    Ok(errors.Contains("CheckIn: CheckIn must be in the future"));
    Ok(!errors.Any(e => e.StartsWith("Guests:")),
       "cross-field validation should not have run yet");
});

// ──────────────────────────── types ──────────────────────────────────────

// A rule about ONE value. Reusable on any DateOnly property.
public class FutureDateAttribute : ValidationAttribute
{
    // Fixed so tests never depend on the wall clock.
    public static readonly DateOnly Today = new(2026, 1, 1);

    protected override ValidationResult? IsValid(object? value, ValidationContext context)
        => throw new NotImplementedException();
}

// Rules ACROSS fields belong to the type, not to a property.
public class Booking : IValidatableObject
{
    [FutureDate(ErrorMessage = "CheckIn must be in the future")]
    public DateOnly CheckIn { get; set; }

    public DateOnly CheckOut { get; set; }

    [Range(1, 20)]
    public int Guests { get; set; }

    public int RoomCapacity { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        => throw new NotImplementedException();
}
