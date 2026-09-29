// ─────────────────────────────────────────────────────────────────────────
//  03 · variance                                          ★★★ stretch
//  concepts: out/in type parameters · covariance · contravariance
//  run: dotnet run 03-variance.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A `Dog` is an `Animal`. Is a `List<Dog>` a `List<Animal>`?
//
//  **No** — and for a good reason: if it were, you could add a `Cat` to it
//  through the `List<Animal>` reference, and the `List<Dog>` would contain a
//  cat. Mutable collections must be INVARIANT or the type system lies.
//
//  But a READ-ONLY sequence is safe, because nothing can be put in:
//
//      IEnumerable<Dog> → IEnumerable<Animal>     ✓  covariant   (`out T`)
//
//  And a consumer works the other way round. Something that can handle ANY
//  animal can certainly handle a dog:
//
//      Action<Animal> → Action<Dog>               ✓  contravariant (`in T`)
//
//  The rule: `out T` for types that only PRODUCE T, `in T` for types that
//  only CONSUME T. The compiler enforces it — that is why `IEnumerable<out T>`
//  has no `Add`.
//
//  hint: you cannot mark a parameter `out` if any member takes a T as input
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Count the animals. Must accept IEnumerable<Dog> as well.
int CountAnimals(IEnumerable<Animal> animals)
{
    throw new NotImplementedException();
}

// Apply an Animal-handler to every dog. Must accept Action<Animal>.
void HandleAll(IEnumerable<Dog> dogs, Action<Animal> handler)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

List<Dog> Dogs() => [new("rex"), new("fido")];

Test("IEnumerable is covariant — a dog sequence IS an animal sequence", () =>
{
    // No cast, no conversion. `out T` makes this legal.
    Eq(CountAnimals(Dogs()), 2);
});

Test("covariance works through LINQ too", () =>
{
    IEnumerable<Animal> animals = Dogs();
    Eq(animals.Select(a => a.Name), new[] { "rex", "fido" });
});

Test("a List is INVARIANT — this is why", () =>
{
    // List<Dog> is not List<Animal>. If it were, the line below could put a
    // Cat into a List<Dog>. The type system refuses, correctly.
    Ok(!typeof(List<Animal>).IsAssignableFrom(typeof(List<Dog>)));

    // The read-only view IS assignable, because nothing can be added.
    Ok(typeof(IEnumerable<Animal>).IsAssignableFrom(typeof(IEnumerable<Dog>)));
});

Test("Action is contravariant — an animal handler handles dogs", () =>
{
    var seen = new List<string>();
    Action<Animal> handler = a => seen.Add(a.Name);

    HandleAll(Dogs(), handler);
    Eq(seen, new[] { "rex", "fido" });
});

Test("a custom covariant producer", () =>
{
    IProducer<Dog> dogs = new Kennel();
    IProducer<Animal> animals = dogs;      // `out T` allows this

    Eq(animals.Produce().Name, "rex");
});

Test("a custom contravariant consumer", () =>
{
    IConsumer<Animal> anyAnimal = new Vet();
    IConsumer<Dog> dogsOnly = anyAnimal;   // `in T` allows this

    Eq(dogsOnly.Consume(new Dog("fido")), "treated fido");
});

Test("a covariant interface can be used in a collection of the base", () =>
{
    List<IProducer<Animal>> producers = [new Kennel()];
    Eq(producers[0].Produce().Name, "rex");
});

Test("variance does not apply to value types", () =>
{
    // Variance needs a reference conversion; int → object is boxing.
    Ok(!typeof(IEnumerable<object>).IsAssignableFrom(typeof(IEnumerable<int>)));
});

// ──────────────────────────── types ──────────────────────────────────────

public record Animal(string Name);
public record Dog(string Name) : Animal(Name);
public record Cat(string Name) : Animal(Name);

// Only PRODUCES T, so it can be covariant.
public interface IProducer<out T>
{
    T Produce();
}

// Only CONSUMES T, so it can be contravariant.
public interface IConsumer<in T>
{
    string Consume(T item);
}

public class Kennel : IProducer<Dog>
{
    public Dog Produce() => throw new NotImplementedException();
}

public class Vet : IConsumer<Animal>
{
    public string Consume(Animal item) => throw new NotImplementedException();
}
