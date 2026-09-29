// ─────────────────────────────────────────────────────────────────────────
//  05 · broken access control                             ★★★ stretch
//  concepts: IDOR · resource-based authorization · mass assignment
//  run: dotnet run 05-broken-access-control.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Broken access control is #1 on the OWASP Top Ten, and it is not exotic.
//  It is this endpoint, which passes code review every day:
//
//      app.MapGet("/orders/{id}", (int id, ShopDb db) => db.Orders.Find(id))
//         .RequireAuthorization();
//
//  Authenticated? Yes. Authorized? **Not checked.** Any logged-in user can
//  read any order by changing the number in the URL. That is an *Insecure
//  Direct Object Reference*, and `[Authorize]` does nothing to stop it —
//  it only proves you are *someone*, never that you may touch *this row*.
//
//  The fix is RESOURCE-BASED authorization: the ownership check belongs in
//  the query, not in an `if` after it.
//
//  Build an order API where:
//
//      GET    /orders            → only the caller's own orders
//      GET    /orders/{id}       → 200 own · 404 someone else's · 404 missing
//      DELETE /orders/{id}       → 204 own · 404 someone else's
//      POST   /orders            → creates for the CALLER, and a client
//                                  cannot choose the owner or the status
//      GET    /admin/orders      → an "admin" role sees everything
//
//  Note "someone else's" is **404, not 403**. A 403 confirms the order
//  exists, which leaks the very fact you are protecting — an attacker can
//  enumerate valid ids. Deny by pretending it isn't there.
//
//  hint: put `o.Owner == userName` in the WHERE clause; and look hard at
//        what CreateOrder lets a client send
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

// Seeded for you: order 1 belongs to ada, order 2 to bob.
var orders = new Dictionary<int, Order>
{
    [1] = new(1, "ada", "ada's laptop", "pending"),
    [2] = new(2, "bob", "bob's monitor", "pending"),
};
var nextId = 2;

void MapRoutes(WebApplication app)
{
    throw new NotImplementedException();
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
    // The IDOR. Order 2 exists; ada may not have it.
    await using var app = await Serve();
    Eq((int)(await Get(app, "/orders/2", Token("ada"))).StatusCode, 404);
});

Test("someone else's order is 404, not 403 — do not confirm it exists", async () =>
{
    await using var app = await Serve();
    var mine = (int)(await Get(app, "/orders/999", Token("ada"))).StatusCode;
    var theirs = (int)(await Get(app, "/orders/2", Token("ada"))).StatusCode;

    Eq(theirs, mine);   // indistinguishable from "no such order"
});

Test("deleting someone else's order is refused AND does not delete it", async () =>
{
    await using var app = await Serve();

    var request = new HttpRequestMessage(HttpMethod.Delete, "/orders/2");
    request.Headers.Authorization = new("Bearer", Token("ada"));
    Eq((int)(await app.Send(request)).StatusCode, 404);

    // Still there for its real owner.
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
    // Mass assignment: the client tries to create an order owned by bob.
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
    // Fresh state per test.
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

// What a client is allowed to send. Look at what is MISSING from it.
public record CreateOrder(string Item);
