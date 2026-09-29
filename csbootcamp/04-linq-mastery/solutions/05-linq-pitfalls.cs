// ─────────────────────────────────────────────────────────────────────────
//  05 · LINQ pitfalls — SOLUTION                          ★★☆ core
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
//  Walkthrough:
//  Four traps, and the fix for each is one decision rather than one technique.
//
//  **`Summarise` materialises once.** `numbers.Count()` followed by
//  `numbers.Sum()` reads the source twice. In memory that is merely wasteful;
//  against `IQueryable` it is two SQL round trips for one screen, and if the
//  underlying data changed in between, a count and a total that do not agree
//  with each other. `ToList()` — or a single `foreach` — makes it one pass.
//
//  The general rule: **an `IEnumerable<T>` parameter is a promise you can
//  enumerate it, not a promise it is cheap.** If you need it more than once,
//  materialise it at the top of the method and work from that.
//
//  **`DoubleAndRecord` returns a `List`, not a query.** With a lazy `Select`
//  carrying the side effect, `seen` stays empty until somebody iterates —
//  and fills up twice if two people do, which is what the sixth test checks.
//  Side effects belong in a `foreach`, where the number of times they happen
//  is written down in the code.
//
//  This is why `Select` with a `Console.WriteLine` or a database write inside
//  is a smell: `Select` means "transform", and its laziness makes "when" and
//  "how often" someone else's decision.
//
//  **`Single` over `First`.** They differ only when the data is wrong, which
//  is exactly when you want to hear about it. `First` on a duplicated email
//  picks one silently and the second row sits there for a year;
//  `SingleOrDefault` throws the moment the invariant breaks. The cost is one
//  extra row read to prove uniqueness.
//
//  Here `Single` (not `SingleOrDefault`) is right because a missing user is
//  also a problem — the caller asked for a specific address. Choose the
//  `OrDefault` variants when "nothing" is a legitimate answer, not to avoid
//  an exception you have not thought about.
//
//  **`Cast<int?>()` makes "nothing" representable.** `FirstOrDefault` on
//  `List<int>` returns `0`, and `0` is a perfectly good id. Casting to `int?`
//  first means the default becomes `null`, which no real element can be. The
//  alternative — `ids.Any() ? ids[0] : null` — reads the source twice.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// The count AND the total, touching the source exactly ONCE.
(int Count, int Total) Summarise(IEnumerable<int> numbers)
{
    // ONE pass. Count() then Sum() would be two — two SQL queries, against
    // a database, for one screen.
    var materialised = numbers.ToList();

    return (materialised.Count, materialised.Sum());
}

// Double every number and record each one in `seen`, exactly once each,
// eagerly — the caller must not have to enumerate to make it happen.
List<int> DoubleAndRecord(IEnumerable<int> numbers, List<int> seen)
{
    // A foreach, not a Select with a side effect in it: here "how many times
    // this happens" is written down rather than left to the caller.
    var doubled = new List<int>();

    foreach (var number in numbers)
    {
        seen.Add(number);
        doubled.Add(number * 2);
    }

    return doubled;
}

// The one user with this email. Throw if there is more than one.
// Single, not First: a duplicate email is a bug and this is where it
// surfaces. Not SingleOrDefault, because "no such user" is also wrong here.
User TheUserWith(List<User> users, string email) =>
    users.Single(user => user.Email == email);

// The first id, or null when there is none — distinguishable from an id of 0.
// Cast first, so the default is null rather than a perfectly plausible 0.
int? FirstIdOrNull(List<int> ids) => ids.Cast<int?>().FirstOrDefault();

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
