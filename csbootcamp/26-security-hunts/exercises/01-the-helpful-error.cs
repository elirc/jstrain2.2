// ─────────────────────────────────────────────────────────────────────────
//  01 · the helpful error                                 ★★☆ hunt
//  concepts: information disclosure · user enumeration
//  run: dotnet run 01-the-helpful-error.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  THIS FILE SHIPS BROKEN. The tests are red on the first run, by design.
//
//  A login endpoint and an error handler, both written to be helpful. Both
//  are handing an attacker something.
//
//  There are TWO defects here and they are the same underlying mistake:
//  telling the caller more than they are entitled to know.
//
//  The tests describe what the responses should say. Make the smallest fixes.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void BuildApp(WebApplication app)
{
    var users = new Dictionary<string, string> { ["ada@example.com"] = "hunter2" };

    app.Use(async (ctx, next) =>
    {
        try
        {
            await next(ctx);
        }
        catch (Exception e)
        {
            if (ctx.Response.HasStarted) throw;

            ctx.Response.StatusCode = 500;
            await ctx.Response.WriteAsJsonAsync(new { error = e.Message });
        }
    });

    app.MapPost("/login", (Credentials input) =>
    {
        if (!users.TryGetValue(input.Email, out var password))
            return Results.NotFound(new { error = "no account with that email" });

        if (password != input.Password)
            return Results.Unauthorized();

        return Results.Ok(new { token = "a-token" });
    });

    app.MapGet("/report", string () =>
        throw new InvalidOperationException(
            "query failed: Server=db-prod-01;User=sa;Password=hunter2"));
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("valid credentials still succeed", async () =>
{
    await using var app = await Web.Serve(BuildApp);
    var response = await app.PostJson("/login",
        new { email = "ada@example.com", password = "hunter2" });

    Eq((int)response.StatusCode, 200);
});

Test("a wrong password is rejected", async () =>
{
    await using var app = await Web.Serve(BuildApp);
    var response = await app.PostJson("/login",
        new { email = "ada@example.com", password = "wrong" });

    Eq((int)response.StatusCode, 401);
});

Test("an unknown email gets the SAME status as a wrong password", async () =>
{
    // Otherwise an attacker learns which emails have accounts, one request
    // at a time. That is user enumeration.
    await using var app = await Web.Serve(BuildApp);

    var unknown = await app.PostJson("/login",
        new { email = "nobody@example.com", password = "whatever" });
    var wrongPassword = await app.PostJson("/login",
        new { email = "ada@example.com", password = "wrong" });

    Eq((int)unknown.StatusCode, (int)wrongPassword.StatusCode);
});

Test("an unknown email gets the SAME body as a wrong password", async () =>
{
    await using var app = await Web.Serve(BuildApp);

    var unknown = await (await app.PostJson("/login",
        new { email = "nobody@example.com", password = "x" })).Content.ReadAsStringAsync();
    var wrongPassword = await (await app.PostJson("/login",
        new { email = "ada@example.com", password = "x" })).Content.ReadAsStringAsync();

    Eq(unknown, wrongPassword);
});

Test("the login response never says whether the account exists", async () =>
{
    await using var app = await Web.Serve(BuildApp);
    var body = await (await app.PostJson("/login",
        new { email = "nobody@example.com", password = "x" })).Content.ReadAsStringAsync();

    Ok(!body.Contains("email", StringComparison.OrdinalIgnoreCase)
       || !body.Contains("no account", StringComparison.OrdinalIgnoreCase));
});

Test("an unhandled error is still a 500", async () =>
{
    await using var app = await Web.Serve(BuildApp);
    Eq(await app.GetStatus("/report"), 500);
});

Test("the 500 body does not leak the connection string", async () =>
{
    await using var app = await Web.Serve(BuildApp);
    var body = await app.GetBody("/report");

    Ok(!body.Contains("hunter2"), "the response leaked a password");
    Ok(!body.Contains("db-prod-01"), "the response leaked a hostname");
    Ok(!body.Contains("Server="), "the response leaked a connection string");
});

Test("the 500 body is a fixed, generic message", async () =>
{
    await using var app = await Web.Serve(BuildApp);
    var body = await app.GetBody("/report");

    Ok(!body.Contains("InvalidOperationException"));
    Ok(body.Contains("error"));
});

// ──────────────────────────── types ──────────────────────────────────────

public record Credentials(string Email, string Password);
