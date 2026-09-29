// ─────────────────────────────────────────────────────────────────────────
//  01 · the helpful error — SOLUTION                      ★★☆ hunt
//  concepts: information disclosure · user enumeration
//  run: dotnet run 01-the-helpful-error.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  **Bug class: information disclosure.** Two instances, one mistake —
//  a response that distinguishes cases the caller is not entitled to
//  distinguish.
//
//  **1. User enumeration.** `404 "no account with that email"` versus `401`
//  tells an attacker which addresses have accounts. Point a list of a million
//  leaked emails at it and you learn which are customers — valuable on its
//  own, and the input to a credential-stuffing run. Every failed login must
//  return the *same status and the same body*, whether the account is missing
//  or the password is wrong.
//
//  The honest cost: the genuine user who typo'd their email gets a vaguer
//  message. That is the trade, and every serious login page makes it.
//
//  (The complete fix also equalises TIMING — bailing out early on an unknown
//  email is measurably faster than hashing a password, which leaks the same
//  bit. Real implementations hash a dummy password on the missing-user path.
//  Module 19/01's constant-time comparison is the same idea one level down.)
//
//  **2. Echoing `ex.Message` in a 500.** The message here carries a hostname,
//  a username and a password, because a connection string ended up in an
//  exception — which is entirely normal. Sending it hands over the database.
//  Even a boring message leaks framework versions, file paths and query
//  shapes.
//
//  The fix is the module 14/03 shape: log the real exception on the server,
//  send a fixed string to the client. The detail is not lost — it is just no
//  longer public.
//
//  How to recognise both: any response whose CONTENT depends on a fact the
//  caller should not learn. The question to ask of an error path is not "is
//  this message accurate?" but "who is allowed to know this?" — the same
//  question behind returning 404 instead of 403 for someone else's record
//  (module 19/05).
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

            // The detail stays on the SERVER. In a real app this is where
            // logger.LogError(e, ...) goes.
            _ = e;

            ctx.Response.StatusCode = 500;
            await ctx.Response.WriteAsJsonAsync(new { error = "internal error" });
        }
    });

    app.MapPost("/login", (Credentials input) =>
    {
        // ONE answer for both failures: a different status or body for
        // "no such account" lets an attacker enumerate your users.
        var known = users.TryGetValue(input.Email, out var password);
        if (!known || password != input.Password)
            return Results.Json(new { error = "invalid credentials" },
                                statusCode: StatusCodes.Status401Unauthorized);

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
