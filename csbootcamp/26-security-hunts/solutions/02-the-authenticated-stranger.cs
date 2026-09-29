// ─────────────────────────────────────────────────────────────────────────
//  02 · the authenticated stranger — SOLUTION             ★★★ hunt
//  concepts: IDOR · mass assignment · authorization vs authentication
//  run: dotnet run 02-the-authenticated-stranger.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  **Bug class 1: IDOR (insecure direct object reference).** The GET looks
//  up the invoice by id and returns it. The caller is authenticated, so the
//  endpoint "is secured" — but authentication answers *who are you*, never
//  *may you have this row*. Change the number in the URL and you read
//  anyone's invoice. It is #1 on the OWASP Top Ten and it survives every
//  review that only asks "is this endpoint authenticated?"
//
//  The fix puts ownership **in the lookup**, not in an `if` after it:
//
//      invoices.Values.SingleOrDefault(i => i.Id == id && i.Owner == user)
//
//  That is structurally safe — there is no code path that returns a row you
//  do not own. A post-hoc check works today and depends on everyone
//  remembering it in every future endpoint.
//
//  And it returns **404, not 403**. A 403 confirms the invoice exists, which
//  lets an attacker enumerate valid ids — leaking exactly what you were
//  protecting. "Not yours" and "not there" must be indistinguishable, which
//  is what the fourth test checks.
//
//  **Bug class 2: mass assignment.** The POST binds the whole `Invoice`,
//  including `Owner`, `Status` and `Id` — so a client can create an invoice
//  owned by someone else, already marked paid, with an id of its choosing.
//
//  The fix is a **separate input DTO** carrying only what a client may send.
//  Not a validation rule: a type that cannot express the attack. `Owner`
//  comes from the authenticated identity, `Status` from a constant, `Id`
//  from the server. This is the same shape as module 13/07's two DTOs and
//  module 19/05's `CreateOrder`.
//
//  Both bugs share a root: trusting the request for something the server
//  already knows.
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
    {
        var user = (string)ctx.Items["user"]!;

        // Ownership is part of the LOOKUP, so no code path returns a row
        // the caller does not own. 404 — not 403 — so "not yours" is
        // indistinguishable from "not there".
        var invoice = invoices.Values.SingleOrDefault(i => i.Id == id && i.Owner == user);
        return invoice is null ? Results.NotFound() : Results.Ok(invoice);
    });

    // CreateInvoice carries ONLY Amount — there is no Owner, Status or Id
    // for a client to set. The type cannot express the attack.
    app.MapPost("/invoices", (CreateInvoice input, HttpContext ctx) =>
    {
        var user = (string)ctx.Items["user"]!;

        var created = new Invoice(
            Id: invoices.Keys.Max() + 1,   // server-assigned
            Owner: user,                    // from the identity, not the body
            Amount: input.Amount,
            Status: "draft");               // server-controlled

        invoices[created.Id] = created;
        return Results.Created($"/invoices/{created.Id}", created);
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

// What a client is allowed to send. Note what is ABSENT.
public record CreateInvoice(decimal Amount);
