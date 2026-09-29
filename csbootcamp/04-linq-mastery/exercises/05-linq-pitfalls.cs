// ─────────────────────────────────────────────────────────────────────────
//  05 · LINQ pitfalls                                     ★★☆ core
//  concepts: multiple enumeration · side effects · First vs Single · defaults
//  run: dotnet run 05-linq-pitfalls.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Four ways a correct-looking LINQ query goes wrong. Every one of them
//  compiles, and none of them is caught by a type.
//
//   1. **Multiple enumeration.** A query is a recipe. Enumerating it twice
//      runs it twice — twice the work in memory, two round trips against a
//      database, and two different answers if the source moved in between.
//
//   2. **Side effects in `Select`.** `Select` is for transforming, and it is
//      lazy. Put a write in one and it happens some unknown number of times,
//      at some unknown point, or never.
//
//   3. **`First` where you meant `Single`.** `First` says "there may be
//      several"; `Single` says "there is exactly one and tell me if I am
//      wrong". Using the wrong one turns a data bug into silence.
//
//   4. **`FirstOrDefault` on a value type.** `default(int)` is `0`, which is
//      indistinguishable from a real zero.
//
//  hint: the `Counter` given below records how often the source was touched —
//        the tests use it to catch enumeration you did not mean to do
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// The count AND the total, touching the source exactly ONCE.
(int Count, int Total) Summarise(IEnumerable<int> numbers)
{
    throw new NotImplementedException();
}

// Double every number and record each one in `seen`, exactly once each,
// eagerly — the caller must not have to enumerate to make it happen.
List<int> DoubleAndRecord(IEnumerable<int> numbers, List<int> seen)
{
    throw new NotImplementedException();
}

// The one user with this email. Throw if there is more than one.
User TheUserWith(List<User> users, string email)
{
    throw new NotImplementedException();
}

// The first id, or null when there is none — distinguishable from an id of 0.
int? FirstIdOrNull(List<int> ids)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("Summarise gets the right answer", () =>
    Eq(Summarise([1, 2, 3, 4]), (4, 10)));

Test("...touching the source only once", () =>
{
    // `numbers.Count()` then `numbers.Sum()` is two passes. Against a
    // database that is two queries for one screen.
    var counter = new Counter();
    Summarise(counter.Watch([1, 2, 3, 4]));

    Eq(counter.Passes, 1, "the source was enumerated " + counter.Passes + " times");
});

Test("Summarise handles an empty source", () =>
    Eq(Summarise([]), (0, 0)));

Test("DoubleAndRecord doubles", () =>
    Eq(DoubleAndRecord([1, 2, 3], []), new[] { 2, 4, 6 }));

Test("the recording happens once per item, without the caller enumerating", () =>
{
    // A lazy `Select` with a side effect records nothing until someone
    // iterates, and records twice if two people do.
    var seen = new List<int>();
    DoubleAndRecord([1, 2, 3], seen);

    Eq(seen, new[] { 1, 2, 3 });
});

Test("...and does not record twice when the result is read twice", () =>
{
    var seen = new List<int>();
    var doubled = DoubleAndRecord([1, 2, 3], seen);

    _ = doubled.Count;
    _ = doubled.Sum();

    Eq(seen, new[] { 1, 2, 3 });
});

Test("TheUserWith finds the one", () =>
    Eq(TheUserWith([new(1, "ada@x.com"), new(2, "bob@x.com")], "bob@x.com").Id, 2));

Test("a duplicate is an error, not a coin toss", () =>
{
    // This is the whole argument for Single. With First, the duplicate rows
    // sit in the database for a year and one of them silently wins.
    var users = new List<User> { new(1, "ada@x.com"), new(2, "ada@x.com") };

    Throws<InvalidOperationException>(() => TheUserWith(users, "ada@x.com"));
});

Test("no match is also an error here", () =>
    Throws<InvalidOperationException>(() => TheUserWith([], "nobody@x.com")));

Test("a real zero is distinguishable from no result", () =>
{
    Eq(FirstIdOrNull([0, 1, 2]), 0);
    Eq(FirstIdOrNull([]), null);
    Ok(FirstIdOrNull([]) != FirstIdOrNull([0]), "0 and 'nothing' must differ");
});

// ──────────────────────────── given ──────────────────────────────────────

public record User(int Id, string Email);

// Counts how many times a sequence was enumerated from the start.
public sealed class Counter
{
    public int Passes { get; private set; }

    public IEnumerable<int> Watch(IEnumerable<int> source)
    {
        Passes++;

        foreach (var item in source)
            yield return item;
    }
}
