// ─────────────────────────────────────────────────────────────────────────
//  01 · data annotations                                  ★★☆ core
//  concepts: built-in validators · nested objects · collections · error keys
//  run: dotnet run 01-data-annotations.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Validation attributes describe the RULES; something else has to enforce
//  them. Under `[ApiController]` that something is a filter that runs before
//  your action (module 15). Here you drive the same engine directly, which
//  is what you need for validating anything that did not arrive as a request
//  body.
//
//      var results = new List<ValidationResult>();
//      Validator.TryValidateObject(model, context, results, validateAllProperties: true);
//
//  Two things bite immediately, and both are in the tests:
//
//    · `validateAllProperties: false` (the DEFAULT of the 3-arg overload)
//      checks ONLY [Required]. Every other attribute is silently skipped.
//    · `TryValidateObject` does NOT recurse into nested objects or
//      collections. A valid-looking parent can hold an invalid child.
//
//  Build a validator that reports errors as "PropertyPath: message",
//  sorted, and that DOES recurse one level into a nested object and a
//  collection.
//
//  hint: ValidationResult.MemberNames gives you the property; for the
//        nested cases you call the validator again and prefix the path
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.ComponentModel.DataAnnotations;

// Validate `model` and return "Path: ErrorMessage" strings, sorted.
// Empty list = valid. Must check EVERY attribute, not just [Required].
// Must recurse into a nested Address and into the Items collection,
// prefixing paths like "Address.City" and "Items[0].Sku".
List<string> Validate(object model)
{
    throw new NotImplementedException();
}

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
    // The classic miss: validateAllProperties defaults to false, and then
    // only [Required] runs.
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
