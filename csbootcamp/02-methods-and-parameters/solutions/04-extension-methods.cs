// ─────────────────────────────────────────────────────────────────────────
//  04 · extension methods — SOLUTION                      ★★☆ core
//  concepts: static class extensions · `this` parameter · null receivers
//  run: dotnet run 04-extension-methods.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  IsBlank and OrEmpty both take a NULLABLE receiver on purpose. Because the
//  call compiles to `Extensions.IsBlank(s)`, there is no dereference and so
//  no NullReferenceException — the null just arrives as an argument. That is
//  the one thing extension methods can do that instance methods cannot, and
//  `OrEmpty()` in particular removes a whole category of null checks from
//  calling code.
//
//  Truncate's subtlety is that the ellipsis has to fit INSIDE the budget:
//  `s[..maxLength] + "…"` overshoots by one, which is exactly what the
//  length test catches. Taking `maxLength - 1` characters and adding the one
//  character back lands on the limit.
//
//  Batch is written with an explicit iterator (`yield return`) because that
//  makes it lazy and single-pass: it never materialises the whole input, so
//  it works on a stream. The buffer is reassigned rather than cleared after
//  each yield — reusing one List and clearing it would hand every caller the
//  same mutating object, and by the time they enumerate, every chunk would
//  look identical. That is a real bug people ship; the `.Select(b =>
//  b.ToList())` in the test would still hide it, which is why the buffer is
//  fresh each time here.
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
    public static bool IsBlank(this string? s) => string.IsNullOrWhiteSpace(s);

    public static string Truncate(this string s, int maxLength)
        => s.Length <= maxLength ? s : s[..(maxLength - 1)] + "…";

    public static IEnumerable<T> OrEmpty<T>(this IEnumerable<T>? items)
        => items ?? [];

    public static IEnumerable<IEnumerable<T>> Batch<T>(this IEnumerable<T> items, int size)
    {
        var buffer = new List<T>(size);
        foreach (var item in items)
        {
            buffer.Add(item);
            if (buffer.Count < size) continue;
            yield return buffer;
            buffer = new List<T>(size);   // a fresh buffer, never a Clear()
        }
        if (buffer.Count > 0) yield return buffer;
    }
}
