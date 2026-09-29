// ─────────────────────────────────────────────────────────────────────────
//  01 · data annotations — SOLUTION                       ★★☆ core
//  concepts: built-in validators · nested objects · collections · error keys
//  run: dotnet run 01-data-annotations.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Two defaults in `Validator` are traps, and both have a test here.
//
//  **`validateAllProperties: true` is not optional.** The three-argument
//  overload defaults it to *false*, which runs `[Required]` and skips every
//  other attribute. Your `[Range]`, `[EmailAddress]` and `[RegularExpression]`
//  sit there looking authoritative and never execute. The "non-Required
//  attributes are checked too" test exists purely to catch that.
//
//  **`TryValidateObject` does not recurse.** It validates the object's own
//  properties and stops. A parent with a perfectly invalid child reports
//  clean — which is how bad nested data reaches a database behind a model
//  that "was validated". So `ValidateNested` walks one level by hand,
//  prefixing paths (`Address.City`, `Items[1].Sku`) so the client can point
//  at the exact field.
//
//  That path format matters more than it looks. ASP.NET Core's own
//  `ValidationProblemDetails` keys its `errors` object the same way, so a
//  form on the other end can highlight the offending input without parsing
//  prose. Returning `["invalid order"]` is a support ticket; returning
//  `Items[1].Sku` is a red border on the right box.
//
//  Note the null-nested case: `Address = null` is caught by `[Required]` on
//  the parent, and the recursion skips nulls rather than crashing. Validation
//  code runs on hostile input by definition — it must never be the thing that
//  throws.
//
//  In a real ASP.NET Core app `[ApiController]` does all of this for the
//  request body, and it DOES recurse into nested models. You reach for
//  `Validator` directly for everything else: a config object at startup, a CSV
//  row, a message off a queue.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Collections;
using System.ComponentModel.DataAnnotations;

List<string> Validate(object model)
{
    var errors = new List<string>();
    ValidateNested(model, prefix: "", errors);
    errors.Sort(StringComparer.Ordinal);
    return errors;
}

void ValidateNested(object model, string prefix, List<string> errors)
{
    var results = new List<ValidationResult>();

    // validateAllProperties: true — without it ONLY [Required] runs.
    Validator.TryValidateObject(
        model, new ValidationContext(model), results, validateAllProperties: true);

    foreach (var result in results)
    {
        var member = result.MemberNames.FirstOrDefault() ?? "";
        errors.Add($"{prefix}{member}: {result.ErrorMessage}");
    }

    // TryValidateObject stops at this object, so walk children ourselves.
    foreach (var property in model.GetType().GetProperties())
    {
        var value = property.GetValue(model);
        if (value is null || value is string) continue;

        if (value is IEnumerable items and not string)
        {
            var index = 0;
            foreach (var item in items)
            {
                if (item is not null && !IsSimple(item.GetType()))
                    ValidateNested(item, $"{prefix}{property.Name}[{index}].", errors);
                index++;
            }
        }
        else if (!IsSimple(property.PropertyType))
        {
            ValidateNested(value, $"{prefix}{property.Name}.", errors);
        }
    }
}

static bool IsSimple(Type type)
    => type.IsPrimitive || type.IsEnum || type == typeof(string)
       || type == typeof(decimal) || type == typeof(DateTime)
       || type == typeof(DateTimeOffset) || type == typeof(Guid);

// ──────────────────────────── tests ──────────────────────────────────────

Order Valid() => new()
{
    Customer = "ada",
    Email = "ada@example.com",
    Quantity = 2,
    Address = new Address { City = "Paris", Postcode = "75001" },
    Items = [new Item { Sku = "ABC-123" }],
};

Test("a valid order produces no errors", () =>
    Eq(Validate(Valid()), new List<string>()));

Test("[Required] is reported", () =>
{
    var order = Valid();
    order.Customer = "";

    Eq(Validate(order), new[] { "Customer: Customer is required" });
});

Test("non-Required attributes are checked too", () =>
{
    var order = Valid();
    order.Email = "not-an-email";

    Eq(Validate(order), new[] { "Email: Email must be a valid address" });
});

Test("[Range] is enforced at both ends", () =>
{
    var low = Valid(); low.Quantity = 0;
    var high = Valid(); high.Quantity = 1000;

    Eq(Validate(low), new[] { "Quantity: Quantity must be between 1 and 100" });
    Eq(Validate(high), new[] { "Quantity: Quantity must be between 1 and 100" });
});

Test("several failures are all reported, sorted", () =>
{
    var order = Valid();
    order.Customer = "";
    order.Quantity = 0;

    Eq(Validate(order), new[]
    {
        "Customer: Customer is required",
        "Quantity: Quantity must be between 1 and 100",
    });
});

Test("a nested object is validated, with a dotted path", () =>
{
    var order = Valid();
    order.Address!.City = "";

    Eq(Validate(order), new[] { "Address.City: City is required" });
});

Test("collection items are validated, with an indexed path", () =>
{
    var order = Valid();
    order.Items[0].Sku = "nope";

    Eq(Validate(order), new[] { "Items[0].Sku: Sku must look like ABC-123" });
});

Test("the index in the path identifies WHICH item failed", () =>
{
    var order = Valid();
    order.Items = [new Item { Sku = "ABC-123" }, new Item { Sku = "bad" }];

    Eq(Validate(order), new[] { "Items[1].Sku: Sku must look like ABC-123" });
});

Test("errors from every level appear together", () =>
{
    var order = Valid();
    order.Customer = "";
    order.Address!.City = "";
    order.Items[0].Sku = "bad";

    Eq(Validate(order), new[]
    {
        "Address.City: City is required",
        "Customer: Customer is required",
        "Items[0].Sku: Sku must look like ABC-123",
    });
});

Test("a null nested object is caught by [Required], not a crash", () =>
{
    var order = Valid();
    order.Address = null;

    Eq(Validate(order), new[] { "Address: Address is required" });
});

// ──────────────────────────── types ──────────────────────────────────────

public class Order
{
    [Required(ErrorMessage = "Customer is required")]
    public string Customer { get; set; } = "";

    [EmailAddress(ErrorMessage = "Email must be a valid address")]
    public string Email { get; set; } = "";

    [Range(1, 100, ErrorMessage = "Quantity must be between 1 and 100")]
    public int Quantity { get; set; }

    [Required(ErrorMessage = "Address is required")]
    public Address? Address { get; set; }

    public List<Item> Items { get; set; } = [];
}

public class Address
{
    [Required(ErrorMessage = "City is required")]
    public string City { get; set; } = "";

    [Required(ErrorMessage = "Postcode is required")]
    public string Postcode { get; set; } = "";
}

public class Item
{
    [RegularExpression("^[A-Z]{3}-[0-9]{3}$",
        ErrorMessage = "Sku must look like ABC-123")]
    public string Sku { get; set; } = "";
}
