# 16 · Validation and Binding

Everything a client sends is a string until you decide otherwise. This module
is about the two decisions at that boundary: **what type is this?** (binding)
and **is it acceptable?** (validation) — and about the fact that C# will
happily let you skip both while looking like you didn't.

The through-line: **validation attributes only describe rules. Something has
to run them.** Under `[ApiController]` that something exists. In minimal APIs
it does not. In `Validator.TryValidateObject` it exists but defaults to
skipping most of your attributes.

## The mental model

**1. Attributes are inert until an engine runs them.**

| Where | Who runs it | If you do nothing |
| --- | --- | --- |
| Controller + `[ApiController]` | a built-in filter, before the action | automatic 400 |
| Controller without it | **you** | invalid data reaches your action |
| Minimal API | **you** | invalid data reaches your handler |
| Anything else (config, CSV, queue) | **you**, via `Validator` | nothing is checked |

**2. `Validator` has two defaults that will burn you.**

```csharp
Validator.TryValidateObject(model, ctx, results, validateAllProperties: true);
//                                                ^^^^ defaults to FALSE
```

- `validateAllProperties: false` runs **only `[Required]`**. Your `[Range]`,
  `[EmailAddress]`, `[RegularExpression]` sit there and never execute.
- It **does not recurse** into nested objects or collections. A clean-looking
  parent can hold an invalid child.

**3. One value → attribute. Several fields → `IValidatableObject`.**

```csharp
class FutureDateAttribute : ValidationAttribute { … }        // one value
class Booking : IValidatableObject {                          // across fields
    public IEnumerable<ValidationResult> Validate(ValidationContext ctx) {
        if (CheckOut <= CheckIn)
            yield return new ValidationResult("…", [nameof(CheckOut)]);
    }
}
```

An attribute on `CheckIn` receives the CheckIn value and nothing else — it
*cannot* compare it to `CheckOut`. That is why `IValidatableObject` exists.

`IValidatableObject.Validate` runs **only after every property attribute has
passed**. Fix the shape, then check the meaning.

**4. Binding is convention-driven, so your own types can bind.**

```csharp
static bool TryParse(string?, IFormatProvider?, out T)   // ONE route/query value
static ValueTask<T?> BindAsync(HttpContext)              // the WHOLE request
```

No attribute, no registration. `(DateRange range)` in the signature means a
malformed value is a **framework 400 before your code runs** — and the domain
rule (`From <= To`) can live in the parser, so a `DateRange` that exists is
always valid.

**5. Normalise → validate → store. In that order.**

Validating one string and storing a different one is how a "validated" record
ends up invalid. `"  "` passes `[MinLength(2)]` and lands as `""`.

## The details that bite

1. **`[property: Required]` on a positional record.** Without the `property:`
   target the attribute lands on the constructor *parameter*, where
   `Validator` cannot see it. Silent no-op, looks perfectly correct.

2. **Minimal APIs validate nothing by default.** Same DTO, same attributes,
   `200 OK` on garbage. Write a `ValidationFilter<T>` and apply it to the
   group.

3. **Match the framework's error shape.** `Results.ValidationProblem(errors)`
   produces the same `application/problem+json` with an `errors` object keyed
   by property that `[ApiController]` produces. Two error shapes in one API
   means every client has a bug waiting.

4. **Key errors by property path** (`Items[1].Sku`, `Address.City`). A form
   can then put a red border on the right box. `["invalid order"]` is a
   support ticket.

5. **`TryParse` must never throw.** It runs on hostile input by definition;
   throwing turns a free 400 into a 500 that tells an attacker their input
   reached your parser.

6. **Decide what bad input *means*.** `BindAsync` returning null → 400.
   Returning a clamped default → the request proceeds. `?page=0` is a broken
   link, not an attack; a malformed date range is neither. Both are policy,
   and now you get to choose.

7. **Canonical form is what makes uniqueness mean anything.** Without
   lowercasing, `Ada@Example.com` and `ada@example.com` are two accounts —
   and the password reset goes to the wrong one.

8. **Collapse *internal* whitespace, not just the ends.** `"Ada  Lovelace"`
   and `"Ada Lovelace"` sort, search and `GROUP BY` as different people.

9. **Normalising is not sanitising.** Trimming does nothing about SQL
   injection (use parameters) or XSS (encode on *output*). Stripping
   "dangerous" characters on input corrupts real data — people are named
   O'Brien — and still doesn't protect you.

## Built-in attributes

`[Required]` `[MinLength(n)]` `[MaxLength(n)]` `[StringLength(n)]`
`[Range(a,b)]` `[EmailAddress]` `[Url]` `[Phone]` `[CreditCard]`
`[RegularExpression(p)]` `[Compare(nameof(Other))]` `[AllowedValues(…)]`
`[DeniedValues(…)]` `[Length(min,max)]`

All take `ErrorMessage`. All are inert until something runs them.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-data-annotations.cs` | ★★☆ | a validator that recurses and reports property paths |
| 02 | `02-custom-validators.cs` | ★★☆ | a `ValidationAttribute` and an `IValidatableObject` |
| 03 | `03-custom-binding.cs` | ★★☆ | `TryParse` and `BindAsync` for your own types |
| 04 | `04-validation-over-http.cs` | ★★★ | a reusable endpoint filter + `ValidationProblemDetails` |
| 05 | `05-normalise-before-validate.cs` | ★★☆ | canonical form first, then validate, then store |

Do them in order. **04 is the one that matters most in a minimal-API
codebase** — its last test accepts `email: "nope"` with a 200 to prove that
nothing validates unless you make it.

---

**Stuck?** `cheatsheets/aspnetcore-api.md` (binding sources, validation attributes, ProblemDetails) · **Self-check:** `quizzes/08-controllers-and-validation.md` · **Next:** `csbootcamp/17-ef-core-fundamentals`
