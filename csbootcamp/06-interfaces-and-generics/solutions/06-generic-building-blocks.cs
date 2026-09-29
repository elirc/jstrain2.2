// ─────────────────────────────────────────────────────────────────────────
//  06 · generic building blocks — SOLUTION                ★★☆ core
//  concepts: constraints that earn their keep · inference · notnull
//  run: dotnet run 06-generic-building-blocks.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Generics stop being abstract the moment you write something you would
//  actually use. Here that is an in-memory repository, of the shape every
//  web project grows within a week.
//
//  The constraints are the design:
//
//      where TKey : notnull                a dictionary key cannot be null
//      where TEntity : IHasId<TKey>        the repository can ASK for the id
//                                          instead of being handed one
//
//  Without the second constraint, `Add` needs a `Func<TEntity, TKey>`
//  parameter at every call site, or the repository stores things it cannot
//  find again. A constraint is how you move a requirement from documentation
//  into the compiler.
//
//  Two things to notice as you go:
//
//   · **Type inference works on arguments, not on return types.**
//     `repo.Add(sku)` infers nothing extra, but a free function
//     `First(items, predicate)` infers `T` from `items`. A method that only
//     mentions `T` in its return type must be called as `Method<T>()`.
//   · **`default(T)` is not null for a value type.** It is `0`, `false`,
//     an empty struct. `TryGet` returns a bool for exactly this reason.
//
//  Walkthrough:
//  Every method is one line. The design is entirely in the two constraints.
//
//  **`where TEntity : IHasId<TKey>` is what makes `Add(entity)` possible.**
//  Without it the repository has no way to ask an entity for its key, so
//  every call site has to supply one — `Add(sku.Code, sku)` — and nothing
//  stops someone filing a product under the wrong id. The constraint moves
//  that requirement out of the documentation and into the compiler.
//
//  **`where TKey : notnull` is not decoration either.** `Dictionary<TKey,
//  TValue>` declares the same constraint, so without it this class does not
//  compile. Constraints propagate: if you use a constrained type, you inherit
//  its constraints.
//
//  **`TryGet` returns a bool because `default(T)` is ambiguous.** For a class
//  entity, `default` is null and you could just return that — but for a
//  struct entity it is a zero-filled value indistinguishable from a real one.
//  The `Try` pattern is the framework's answer to that, and it is why
//  `Dictionary.TryGetValue` exists rather than an indexer that returns null.
//
//  `Remove` returns a bool for the same family of reasons: "there was nothing
//  to remove" and "I removed it" are different facts, and a caller that wants
//  to return 404 on the first needs to be told which happened. `Dictionary
//  .Remove` already reports it, so this is one line.
//
//  **`All()` promises no order.** A `Dictionary` enumerates in whatever order
//  its internal buckets happen to give, and although in practice a
//  never-removed-from dictionary comes out in insertion order, that is an
//  implementation detail and has changed between versions. The test sorts
//  before comparing for exactly that reason — a test that pinned insertion
//  order would be asserting something the type never promised.
//
//  **`FirstMatching` infers `T` from `items`.** Type inference reads
//  arguments, never the return type — which is why `FirstMatching(products,
//  …)` needs no type argument, but a hypothetical `Create<T>()` with no
//  parameters must always be written `Create<Product>()`.
//
//  **`IHasId<out TKey>` is covariant** because `TKey` only ever comes out of
//  it. That makes an `IHasId<string>` usable as an `IHasId<object>` — free,
//  and the compiler enforces that you have not put `TKey` in an input
//  position. Module 03 of this module set is the long version.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("add and get back by id", () =>
{
    var repo = new Repository<string, Product>();
    repo.Add(new Product("A-1", "widget"));

    Ok(repo.TryGet("A-1", out var found));
    Eq(found!.Name, "widget");
});

Test("a missing id is false, not an exception", () =>
{
    var repo = new Repository<string, Product>();

    Ok(!repo.TryGet("nope", out var found));
    Eq(found, null);
});

Test("the same repository type works with an int key", () =>
{
    var repo = new Repository<int, Order>();
    repo.Add(new Order(7, 19.99m));

    Ok(repo.TryGet(7, out var found));
    Eq(found!.Total, 19.99m);
});

Test("a missing int key gives default(T), which is why TryGet returns a bool", () =>
{
    // Order is a class here so `found` is null — but for a struct entity
    // `default` would be a perfectly plausible zero-filled value. The bool
    // is the only reliable answer.
    var repo = new Repository<int, Order>();

    Ok(!repo.TryGet(99, out _));
});

Test("adding the same id twice replaces", () =>
{
    var repo = new Repository<string, Product>();
    repo.Add(new Product("A-1", "widget"));
    repo.Add(new Product("A-1", "gadget"));

    Eq(repo.Count, 1);
    repo.TryGet("A-1", out var found);
    Eq(found!.Name, "gadget");
});

Test("remove reports whether there was anything to remove", () =>
{
    var repo = new Repository<string, Product>();
    repo.Add(new Product("A-1", "widget"));

    Ok(repo.Remove("A-1"));
    Ok(!repo.Remove("A-1"));
    Eq(repo.Count, 0);
});

Test("All returns everything that was added", () =>
{
    var repo = new Repository<string, Product>();
    repo.Add(new Product("B", "second"));
    repo.Add(new Product("A", "first"));

    // Sorted deliberately: a Dictionary makes no ordering promise, so a
    // test that assumed one would be pinning an implementation detail.
    Eq(repo.All().Select(item => item.Name).OrderBy(name => name),
       new[] { "first", "second" });
});

Test("FirstMatching infers T from the argument", () =>
{
    // No <Product> at the call site: inference reads it off `items`.
    var products = new[] { new Product("A", "widget"), new Product("B", "gadget") };

    Eq(Find.FirstMatching(products, p => p.Name.StartsWith('g'))!.Id, "B");
    Eq(Find.FirstMatching(products, p => p.Name == "nothing"), null);
});

Test("FirstMatching works on any sequence at all", () =>
    Eq(Find.FirstMatching(new[] { 1, 2, 3, 4 }, n => n > 2), 3));

// ──────────────────────────── your code ──────────────────────────────────

// Anything the repository can store must be able to say what its id is.
public interface IHasId<out TKey> { TKey Id { get; } }

// An in-memory store. TKey must be usable as a dictionary key; TEntity must
// be able to report an id of that type.
public sealed class Repository<TKey, TEntity>
    where TKey : notnull
    where TEntity : IHasId<TKey>
{
    private readonly Dictionary<TKey, TEntity> _items = [];

    public int Count => _items.Count;

    // Adds or replaces, keyed on the entity's own id.
    // The entity supplies its own key — that is what the constraint bought.
    public void Add(TEntity entity) => _items[entity.Id] = entity;

    // A bool, because `default(TEntity)` cannot mean "missing" for a struct.
    public bool TryGet(TKey id, out TEntity? entity)
    {
        var found = _items.TryGetValue(id, out var value);
        entity = found ? value : default;

        return found;
    }

    // True when something was removed.
    // "Nothing to remove" and "removed" are different facts; a caller
    // returning 404 needs to know which.
    public bool Remove(TKey id) => _items.Remove(id);

    // Every stored entity, in no particular order.
    public IEnumerable<TEntity> All() => _items.Values;
}

public static class Find
{
    // The first match, or default. T is inferred from `items`.
    // T is inferred from `items` — inference reads arguments, never the
    // return type.
    public static T? FirstMatching<T>(IEnumerable<T> items, Func<T, bool> match)
    {
        foreach (var item in items)
            if (match(item))
                return item;

        return default;
    }
}

// ──────────────────────────── given ──────────────────────────────────────

public sealed record Product(string Id, string Name) : IHasId<string>;
public sealed record Order(int Id, decimal Total) : IHasId<int>;
