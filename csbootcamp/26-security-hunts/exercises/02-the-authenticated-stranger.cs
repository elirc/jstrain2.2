// ─────────────────────────────────────────────────────────────────────────
//  02 · the authenticated stranger                        ★★★ hunt
//  concepts: IDOR · mass assignment · authorization vs authentication
//  run: dotnet run 02-the-authenticated-stranger.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  THIS FILE SHIPS BROKEN. The tests are red on the first run, by design.
//
//  An invoices API. Every endpoint requires a logged-in user, the code
//  reviews cleanly, and it has two holes that let any authenticated customer
//  read and alter another customer's invoices.
//
//  `[Authorize]` is present and correct. That is not the bug — it is why
//  nobody noticed the bug.
//
//  Two defects. Both are about what the code does AFTER establishing who the
//  caller is.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Seeded: invoice 1 belongs to ada, invoice 2 to bob.
Dictionary<int, Invoice> Seed() => new()
{
    [1] = new Invoice(1, "ada", 100m, "draft"),
    [2] = new Invoice(2, "bob", 250m, "draft"),
};

void BuildApp(WebApplication app, Dictionary<int, Invoice> invoices)
{
    // Stand-in for real authentication: the caller's identity is trusted
    // and established before any endpoint runs.
    app.Use(async (ctx, next) =>
    {
        var user = ctx.Request.Headers["X-User"].ToString();
        if (string.IsNullOrWhiteSpace(user))
        {
            ctx.Response.StatusCode = 401;
            return;
        }

        ctx.Items["user"] = user;
        await next(ctx);
    });

    app.MapGet("/invoices/{id:int}", (int id, HttpContext ctx) =>
        invoices.TryGetValue(id, out var invoice)
            ? Results.Ok(invoice)
            : Results.NotFound());

    app.MapPost("/invoices", (Invoice input, HttpContext ctx) =>
    {
        var id = invoices.Keys.Max() + 1;
        var created = input with { Id = id };
        invoices[id] = created;

        return Results.Created($"/invoices/{id}", created);
    });
}

// ──────────────────────────── tests ──────────────────────────────────────

async Task<HttpResponseMessage> Get(ServedApp app, string path, string user)
{
    var request = new HttpRequestMessage(HttpMethod.Get, path);
    request.Headers.Add("X-User", user);
    return await app.Send(request);
}

async Task<HttpResponseMessage> Post(ServedApp app, object body, string user)
{
    var request = new HttpRequestMessage(HttpMethod.Post, "/invoices")
    {
        Content = new StringContent(System.Text.Json.JsonSerializer.Serialize(body),
                                    System.Text.Encoding.UTF8, "application/json"),
    };
    request.Headers.Add("X-User", user);
    return await app.Send(request);
}

Test("an anonymous request is refused", async () =>
{
    await using var app = await Web.Serve(a => BuildApp(a, Seed()));
    Eq(await app.GetStatus("/invoices/1"), 401);
});

Test("a user can read their OWN invoice", async () =>
{
    await using var app = await Web.Serve(a => BuildApp(a, Seed()));
    Eq((int)(await Get(app, "/invoices/1", "ada")).StatusCode, 200);
});

Test("a user CANNOT read someone else's invoice", async () =>
{
    // Invoice 2 is bob's. ada is authenticated — and that is all.
    await using var app = await Web.Serve(a => BuildApp(a, Seed()));
    Eq((int)(await Get(app, "/invoices/2", "ada")).StatusCode, 404);
});

Test("someone else's invoice is indistinguishable from a missing one", async () =>
{
    await using var app = await Web.Serve(a => BuildApp(a, Seed()));

    var theirs = (int)(await Get(app, "/invoices/2", "ada")).StatusCode;
    var missing = (int)(await Get(app, "/invoices/999", "ada")).StatusCode;

    Eq(theirs, missing);
});

Test("the body of another user's invoice is never returned", async () =>
{
    await using var app = await Web.Serve(a => BuildApp(a, Seed()));
    var body = await (await Get(app, "/invoices/2", "ada")).Content.ReadAsStringAsync();

    Ok(!body.Contains("bob"), "leaked another customer's invoice");
    Ok(!body.Contains("250"), "leaked another customer's amount");
});

Test("a created invoice belongs to the CALLER", async () =>
{
    await using var app = await Web.Serve(a => BuildApp(a, Seed()));
    var response = await Post(app, new { owner = "bob", amount = 5m, status = "paid" }, "ada");

    Eq((int)response.StatusCode, 201);
    var body = await response.Content.ReadAsStringAsync();

    Ok(body.Contains("\"owner\":\"ada\""), "the client chose its own owner");
});

Test("a created invoice cannot start as paid", async () =>
{
    await using var app = await Web.Serve(a => BuildApp(a, Seed()));
    var response = await Post(app, new { owner = "ada", amount = 5m, status = "paid" }, "ada");
    var body = await response.Content.ReadAsStringAsync();

    Ok(body.Contains("\"status\":\"draft\""), "the client set a server-controlled field");
});

Test("a client cannot choose its own invoice id", async () =>
{
    await using var app = await Web.Serve(a => BuildApp(a, Seed()));
    var response = await Post(app, new { id = 9999, owner = "ada", amount = 5m }, "ada");

    Eq(response.Headers.Location?.ToString(), "/invoices/3");
});

// ──────────────────────────── types ──────────────────────────────────────

public record Invoice(int Id, string Owner, decimal Amount, string Status);
