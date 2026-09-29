// ─────────────────────────────────────────────────────────────────────────
//  04 · extension methods                                 ★★☆ core
//  concepts: static class extensions · `this` parameter · null receivers
//  run: dotnet run 04-extension-methods.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  An extension method looks like an instance method and compiles to a static
//  call. It is how LINQ adds `.Where()` to every collection ever written
//  without touching those types, and how ASP.NET adds `.AddSwagger()` to
//  IServiceCollection.
//
//      public static class StringExtensions {
//          public static bool IsBlank(this string? s) => …
//      }
//      "  ".IsBlank()   // reads as an instance call, compiles to a static one
//
//  Because it is really a static call, the receiver is allowed to be null —
//  `((string?)null).IsBlank()` does NOT throw. That is a genuinely useful
//  property and a genuinely surprising one.
//
//  Fill in the four extensions at the bottom of the file.
//
//  hint: extension methods must live in a static, non-nested class, and the
//        first parameter carries `this`
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("IsBlank is true for null, empty and whitespace", () =>
{
    Ok(((string?)null).IsBlank());
    Ok("".IsBlank());
    Ok("   ".IsBlank());
});

Test("IsBlank is false for real content", () =>
    Ok(!"  x  ".IsBlank()));

Test("Truncate leaves short strings alone", () =>
    Eq("hello".Truncate(10), "hello"));

Test("Truncate cuts and appends an ellipsis", () =>
    Eq("hello world".Truncate(8), "hello w…"));

Test("Truncate counts the ellipsis inside the limit", () =>
    Eq("hello world".Truncate(8).Length, 8));

Test("OrEmpty turns a null sequence into an empty one", () =>
    Eq(((List<int>?)null).OrEmpty(), Array.Empty<int>()));

Test("OrEmpty passes a real sequence through", () =>
    Eq(new List<int> { 1, 2 }.OrEmpty(), new[] { 1, 2 }));

Test("Batch splits into fixed-size chunks", () =>
    Eq(new[] { 1, 2, 3, 4, 5 }.Batch(2).Select(b => b.ToList()),
       new[] { new[] { 1, 2 }, new[] { 3, 4 }, new[] { 5 } }));

Test("Batch of an empty sequence yields nothing", () =>
    Eq(Array.Empty<int>().Batch(3).Count(), 0));

// ──────────────────────────── types ──────────────────────────────────────

static class Extensions
{
    // True when the string is null, empty, or only whitespace.
    public static bool IsBlank(this string? s)
        => throw new NotImplementedException();

    // At most maxLength characters. If it has to cut, the result ends with
    // '…' and is exactly maxLength characters long.
    public static string Truncate(this string s, int maxLength)
        => throw new NotImplementedException();

    // The sequence, or an empty sequence when it is null.
    public static IEnumerable<T> OrEmpty<T>(this IEnumerable<T>? items)
        => throw new NotImplementedException();

    // Consecutive chunks of the given size; the last chunk may be short.
    public static IEnumerable<IEnumerable<T>> Batch<T>(this IEnumerable<T> items, int size)
        => throw new NotImplementedException();
}
