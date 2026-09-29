// ─────────────────────────────────────────────────────────────────────────
//  05 · broken access control — SOLUTION                  ★★★ stretch
//  concepts: IDOR · resource-based authorization · mass assignment
//  run: dotnet run 05-broken-access-control.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Three separate defences, and each one closes a bug that ships constantly.
//
//  **1. Ownership belongs in the query, not in an `if` after it.**
//
//      orders.Values.Where(o => o.Owner == user)        ← correct
//      var o = orders[id]; if (o.Owner != user) …       ← works, but fragile
//
//  Both give the right answer today. The first is *structurally* safe: there
//  is no code path that returns a row you do not own, because the filter is
//  the lookup. The second relies on someone remembering the check in every
//  future endpoint, and someone eventually will not. `[Authorize]` does not
//  help either way — it proves you are *someone*, never that you may touch
//  *this row*. That gap is the whole vulnerability class.
//
//  **2. Not-yours is 404, not 403.**
//
//  A 403 confirms the resource exists. Given `/orders/{id}`, an attacker
//  walks the id space and reads off which orders are real — that is
//  enumeration, and it leaks exactly what you were protecting. Returning the
//  same 404 for "does not exist" and "not yours" makes the two
//  indistinguishable, which is why the test compares the two status codes to
//  each other rather than to a literal.
//
//  (403 is right when the caller may legitimately KNOW the thing exists —
//  a shared workspace they lack a role in. The rule is: never let the status
//  code reveal more than the caller is entitled to know.)
//
//  **3. The owner comes from the token, never from the body.**
//
//  `CreateOrder` has one member: `Item`. There is no `Owner` and no `Status`
//  to bind, so the client physically cannot set them — the DTO is the
//  defence. Bind straight onto the `Order` entity instead and
//  `{"owner":"bob","status":"paid"}` is accepted, which is *mass assignment*:
//  the same shortcut that lets a client POST `"isAdmin": true` or
//  `"balance": 1000000`. Server-controlled fields come from server state
//  (`user.Identity.Name`) or a constant, and the way to guarantee that is to
//  leave them off the input type entirely.
//
//  The admin route uses role-based authorization because "see everything" is
//  genuinely a role, not an ownership question — but note it is a *separate
//  route*, not a flag on the user route. Branching inside one endpoint on
//  `if (isAdmin)` is how the ownership filter gets accidentally skipped.
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.AspNetCore.Authentication.JwtBearer@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

var key = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes("bootcamp-signing-key-at-least-32-bytes-long"));

var orders = new Dictionary<int, Order>
{
    [1] = new(1, "ada", "ada's laptop", "pending"),
    [2] = new(2, "bob", "bob's monitor", "pending"),
};
var nextId = 2;

void MapRoutes(WebApplication app)
{
    var mine = app.MapGroup("/orders").RequireAuthorization();

    // The ownership filter IS the lookup — no unfiltered path exists.
    mine.MapGet("/", (ClaimsPrincipal user) =>
        orders.Values
              .Where(o => o.Owner == user.Identity!.Name)
              .OrderBy(o => o.Id));

    mine.MapGet("/{id:int}", (int id, ClaimsPrincipal user) =>
    {
        // Not "find then check": find MINE. And 404, never 403 — a 403 would
        // confirm the order exists.
        var order = orders.Values.SingleOrDefault(
            o => o.Id == id && o.Owner == user.Identity!.Name);

        return order is null ? Results.NotFound() : Results.Ok(order);
    });

    mine.MapDelete("/{id:int}", (int id, ClaimsPrincipal user) =>
    {
        var order = orders.Values.SingleOrDefault(
            o => o.Id == id && o.Owner == user.Identity!.Name);

        if (order is null) return Results.NotFound();
        orders.Remove(id);
        return Results.NoContent();
    });

    // CreateOrder carries ONLY Item. Owner and Status are unbindable.
    mine.MapPost("/", (CreateOrder input, ClaimsPrincipal user) =>
    {
        var order = new Order(
            Id: ++nextId,
            Owner: user.Identity!.Name!,   // from the token, never the body
            Item: input.Item,
            Status: "pending");            // server-controlled

        orders[order.Id] = order;
        return Results.Created($"/orders/{order.Id}", order);
    });

    // A separate route, not a flag inside the user route.
    app.MapGet("/admin/orders", () => orders.Values.OrderBy(o => o.Id))
       .RequireAuthorization(p => p.RequireRole("admin"));
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a user sees only their own orders", async () =>
{
    await using var app = await Serve();
    var body = await Body(app, "/orders", Token("ada"));

    Ok(body.Contains("ada's laptop"));
    Ok(!body.Contains("bob's monitor"), "ada must not see bob's order");
});

Test("a user can read their own order", async () =>
{
    await using var app = await Serve();
    Eq((int)(await Get(app, "/orders/1", Token("ada"))).StatusCode, 200);
});

Test("reading someone else's order is 404, not 200", async () =>
{
    await using var app = await Serve();
    Eq((int)(await Get(app, "/orders/2", Token("ada"))).StatusCode, 404);
});

Test("someone else's order is 404, not 403 — do not confirm it exists", async () =>
{
    await using var app = await Serve();
    var mine = (int)(await Get(app, "/orders/999", Token("ada"))).StatusCode;
    var theirs = (int)(await Get(app, "/orders/2", Token("ada"))).StatusCode;

    Eq(theirs, mine);
});

Test("deleting someone else's order is refused AND does not delete it", async () =>
{
    await using var app = await Serve();

    var request = new HttpRequestMessage(HttpMethod.Delete, "/orders/2");
    request.Headers.Authorization = new("Bearer", Token("ada"));
    Eq((int)(await app.Send(request)).StatusCode, 404);

    Eq((int)(await Get(app, "/orders/2", Token("bob"))).StatusCode, 200);
});

Test("a user can delete their own order", async () =>
{
    await using var app = await Serve();

    var request = new HttpRequestMessage(HttpMethod.Delete, "/orders/1");
    request.Headers.Authorization = new("Bearer", Token("ada"));
    Eq((int)(await app.Send(request)).StatusCode, 204);
});

Test("a created order belongs to the caller, whatever they claim", async () =>
{
    await using var app = await Serve();
    var response = await PostJson(app, "/orders",
        new { item = "sneaky", owner = "bob", status = "paid" }, Token("ada"));

    Eq((int)response.StatusCode, 201);
    var body = await response.Content.ReadAsStringAsync();

    Ok(body.Contains("\"owner\":\"ada\""), "owner must come from the token");
    Ok(body.Contains("\"status\":\"pending\""), "status is server-controlled");
});

Test("the created order shows up for its real owner, not the claimed one", async () =>
{
    await using var app = await Serve();
    await PostJson(app, "/orders", new { item = "sneaky", owner = "bob" }, Token("ada"));

    Ok((await Body(app, "/orders", Token("ada"))).Contains("sneaky"));
    Ok(!(await Body(app, "/orders", Token("bob"))).Contains("sneaky"));
});

Test("an admin can see everything", async () =>
{
    await using var app = await Serve();
    var body = await Body(app, "/admin/orders", Token("root", "admin"));

    Ok(body.Contains("ada's laptop"));
    Ok(body.Contains("bob's monitor"));
});

Test("a non-admin cannot reach the admin route", async () =>
{
    await using var app = await Serve();
    Eq((int)(await Get(app, "/admin/orders", Token("ada"))).StatusCode, 403);
});

// ──────────────────────────── helpers ────────────────────────────────────

async Task<ServedApp> Serve()
{
    orders = new Dictionary<int, Order>
    {
        [1] = new(1, "ada", "ada's laptop", "pending"),
        [2] = new(2, "bob", "bob's monitor", "pending"),
    };
    nextId = 2;

    return await Web.Serve(
        builder =>
        {
            builder.Services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(o =>
                {
                    o.MapInboundClaims = false;
                    o.TokenValidationParameters = new()
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = key,
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero,
                        NameClaimType = "name",
                        RoleClaimType = "role",
                    };
                });
            builder.Services.AddAuthorization();
        },
        app =>
        {
            app.UseAuthentication();
            app.UseAuthorization();
            MapRoutes(app);
        });
}

string Token(string name, string? role = null)
{
    List<Claim> claims = [new Claim("name", name)];
    if (role is not null) claims.Add(new Claim("role", role));

    return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(5),
        signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)));
}

Task<HttpResponseMessage> Get(ServedApp app, string path, string token)
{
    var request = new HttpRequestMessage(HttpMethod.Get, path);
    request.Headers.Authorization = new("Bearer", token);
    return app.Send(request);
}

async Task<string> Body(ServedApp app, string path, string token)
    => await (await Get(app, path, token)).Content.ReadAsStringAsync();

Task<HttpResponseMessage> PostJson<T>(ServedApp app, string path, T body, string token)
{
    var request = new HttpRequestMessage(HttpMethod.Post, path)
    {
        Content = new StringContent(System.Text.Json.JsonSerializer.Serialize(body),
                                    Encoding.UTF8, "application/json"),
    };
    request.Headers.Authorization = new("Bearer", token);
    return app.Send(request);
}

// ──────────────────────────── types ──────────────────────────────────────

public record Order(int Id, string Owner, string Item, string Status);

// One member. Owner and Status are absent, so a client cannot set them.
public record CreateOrder(string Item);
