// ─────────────────────────────────────────────────────────────────────────
//  02 · the shared basket — SOLUTION                      ★★☆ hunt
//  concepts: reference aliasing · shared mutable state
//  run: dotnet run 02-the-shared-basket.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  **Bug class: a shared mutable "empty" default.**
//
//  `Empty` is ONE static list. `Add` assigns it as the starting basket for
//  every new customer — so every customer's basket is the *same object*, and
//  `basket.Add(item)` mutates the shared instance. Add one item and everyone
//  has it, including customers who have never been seen, because `For`
//  returns that same list too.
//
//  Worse, the corruption is permanent for the process: `Empty` is `static`,
//  so a brand-new `BasketService` inherits the items — which is what the
//  "fresh service" test catches. The `readonly` on the field is no help at
//  all; it stops the *reference* being reassigned and says nothing about the
//  contents (module 01/03).
//
//  The fix is one line: `basket = [];` — a NEW list per customer.
//
//  `For` also has to stop handing out the shared instance. Returning
//  `Array.Empty<string>().ToList()`, or better `IReadOnlyList<string>` and
//  `[]`, means a caller cannot mutate what they were given either.
//
//  How to recognise it: a `static` mutable collection used as a default, or
//  any `readonly` collection field that is handed out from a method. The
//  giveaway phrase is "shared empty" — an empty *immutable* value is safe to
//  share, an empty `List<T>` is not.
//
//  The same shape appears as a default parameter value, a cached "empty
//  result" DTO, and a singleton service holding a list (module 12/01).
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("a new customer starts with an empty basket", () =>
    Eq(new BasketService().For("ada"), new List<string>()));

Test("adding an item shows up for that customer", () =>
{
    var baskets = new BasketService();
    baskets.Add("ada", "widget");

    Eq(baskets.For("ada"), new[] { "widget" });
});

Test("another customer's basket stays empty", () =>
{
    var baskets = new BasketService();
    baskets.Add("ada", "widget");

    Eq(baskets.For("bob"), new List<string>());
});

Test("two customers keep separate baskets", () =>
{
    var baskets = new BasketService();
    baskets.Add("ada", "widget");
    baskets.Add("bob", "gadget");

    Eq(baskets.For("ada"), new[] { "widget" });
    Eq(baskets.For("bob"), new[] { "gadget" });
});

Test("each customer's basket is a different object", () =>
{
    var baskets = new BasketService();
    baskets.Add("ada", "widget");
    baskets.Add("bob", "gadget");

    Ok(!ReferenceEquals(baskets.For("ada"), baskets.For("bob")));
});

Test("a fresh service does not inherit a previous one's items", () =>
{
    var first = new BasketService();
    first.Add("ada", "widget");

    Eq(new BasketService().For("ada"), new List<string>());
});

Test("counts are per customer", () =>
{
    var baskets = new BasketService();
    baskets.Add("ada", "a");
    baskets.Add("ada", "b");
    baskets.Add("bob", "c");

    Eq(baskets.Count("ada"), 2);
    Eq(baskets.Count("bob"), 1);
});

// ──────────────────────────── types ──────────────────────────────────────

public class BasketService
{
    private readonly Dictionary<string, List<string>> _baskets = [];

    // A fresh empty list, so a caller cannot mutate a shared one.
    public List<string> For(string customer)
        => _baskets.TryGetValue(customer, out var basket) ? basket : [];

    public void Add(string customer, string item)
    {
        if (!_baskets.TryGetValue(customer, out var basket))
        {
            // A NEW list per customer. Assigning a shared static one here
            // made every basket the same object.
            basket = [];
            _baskets[customer] = basket;
        }

        basket.Add(item);
    }

    public int Count(string customer) => For(customer).Count;
}
