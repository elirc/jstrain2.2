// ─────────────────────────────────────────────────────────────────────────
//  02 · the shared basket                                 ★★☆ hunt
//  concepts: reference aliasing · shared mutable state
//  run: dotnet run 02-the-shared-basket.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  THIS FILE SHIPS BROKEN. The tests are red on the first run, by design.
//
//  `BasketService` gives each customer their own basket. Adding an item to
//  one customer's basket should not affect anybody else's.
//
//  It does. Every customer sees every item.
//
//  The bug is one line and it looks completely reasonable. Find it and make
//  the smallest fix.
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
    private static readonly List<string> Empty = [];

    private readonly Dictionary<string, List<string>> _baskets = [];

    public List<string> For(string customer)
        => _baskets.TryGetValue(customer, out var basket) ? basket : Empty;

    public void Add(string customer, string item)
    {
        if (!_baskets.TryGetValue(customer, out var basket))
        {
            basket = Empty;
            _baskets[customer] = basket;
        }

        basket.Add(item);
    }

    public int Count(string customer) => For(customer).Count;
}
