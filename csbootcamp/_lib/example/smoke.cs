// smoke.cs — proves the harness itself works. Not an exercise.
//
//     dotnet run smoke.cs
//
// Expected: 13 passed · 1 todo, and a "#done" tail. Nothing failed.
#:sdk Microsoft.NET.Sdk.Web
#:project ../Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

Test("Eq compares primitives", () => Eq(2 + 2, 4));

Test("Eq compares sequences structurally", () =>
    Eq(new List<int> { 1, 2, 3 }.Select(n => n * 2).ToList(), new[] { 2, 4, 6 }));

Test("Eq compares dictionaries structurally", () =>
    Eq(new Dictionary<string, int> { ["a"] = 1 }, new Dictionary<string, int> { ["a"] = 1 }));

Test("Eq compares records by value", () =>
    Eq(new Point(1, 2), new Point(1, 2)));

Test("Eq compares anonymous types by property", () =>
    Eq(new { Name = "ada", Age = 36 }, new { Name = "ada", Age = 36 }));

Test("Ok takes a bool", () => Ok("abc".StartsWith('a')));

Test("NotNull catches null", () => NotNull("not null"));

Test("Throws matches the exception type", () =>
    Throws<InvalidOperationException>(() => throw new InvalidOperationException("nope")));

Test("Throws matches a message substring", () =>
    Throws<ArgumentException>(() => throw new ArgumentException("bad id"), "bad id"));

Test("ThrowsAsync works", async () =>
    await ThrowsAsync<TimeoutException>(async () =>
    {
        await Task.Yield();
        throw new TimeoutException("too slow");
    }, "too slow"));

Test("Approx tolerates float dust", () => Approx(0.1 + 0.2, 0.3, 1e-12));

Test("Spy records calls", () =>
{
    var spy = new Spy<string>();
    foreach (var s in new[] { "a", "b" }) spy.Action(s);
    Eq(spy.CallCount, 2);
    Eq(spy.Calls, new[] { "a", "b" });
});

Test("Web.Serve runs a real server", async () =>
{
    await using var app = await Web.Serve(a =>
    {
        a.MapGet("/ping", () => "pong");
        a.MapGet("/json", () => Results.Ok(new { ok = true }));
        a.MapGet("/missing", () => Results.NotFound());
    });

    Eq(await app.Client.GetStringAsync("/ping"), "pong");
    Ok((await app.GetBody("/json")).Contains("\"ok\":true"));
    Eq(await app.GetStatus("/missing"), 404);
});

Test("a NotImplementedException reports as todo, not a failure", () =>
    throw new NotImplementedException());

record Point(int X, int Y);
