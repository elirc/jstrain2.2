// ─────────────────────────────────────────────────────────────────────────
//  03 · protecting endpoints                              ★★☆ core
//  concepts: authentication vs authorization · 401 vs 403 · token validation
//  run: dotnet run 03-protecting-endpoints.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Two different questions, two different middlewares, two different status
//  codes — and mixing them up is the most common auth bug there is:
//
//      UseAuthentication()  WHO ARE YOU?    → populates HttpContext.User
//      UseAuthorization()   MAY YOU?        → reads it and decides
//
//      401 Unauthorized  = I don't know who you are   (authentication failed)
//      403 Forbidden     = I know who you are, and no (authorization failed)
//
//  The order is load-bearing: authorization reads what authentication wrote,
//  so `UseAuthentication` MUST come first. Reversed, every request looks
//  anonymous.
//
//  Wire up JWT bearer validation and protect the endpoints:
//
//      GET /open      → always 200
//      GET /me        → requires any authenticated user; returns their name
//      GET /admin     → requires the "admin" role
//
//  Validation must check the signature, the issuer, the audience, AND the
//  expiry — an unvalidated claim is just a string an attacker typed.
//
//  hint: AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//        .AddJwtBearer(o => o.TokenValidationParameters = new(...));
//        .RequireAuthorization() and .RequireAuthorization(p => p.RequireRole(...))
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
var wrongKey = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes("a-completely-different-key-32-bytes-long!!"));

// Register authentication (JWT bearer, validating signature/issuer/audience/
// lifetime against issuer "bootcamp" and audience "bootcamp-api") and
// authorization.
void AddServices(WebApplicationBuilder builder)
{
    throw new NotImplementedException();
}

// Add the two middlewares in the right order, then map the three endpoints.
void MapRoutes(WebApplication app)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("an open endpoint needs no token", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetStatus("/open"), 200);
});

Test("a protected endpoint without a token is 401", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetStatus("/me"), 401);
});

Test("a valid token reaches the endpoint and carries the identity", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await Get(app, "/me", Token("ada", []));

    Eq((int)response.StatusCode, 200);
    Eq(await response.Content.ReadAsStringAsync(), "ada");
});

Test("a token signed with the wrong key is 401", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq((int)(await Get(app, "/me", Token("ada", [], signWith: wrongKey))).StatusCode, 401);
});

Test("an expired token is 401", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var expired = Token("ada", [], lifetime: TimeSpan.FromMinutes(-10));
    Eq((int)(await Get(app, "/me", expired)).StatusCode, 401);
});

Test("a token for the wrong audience is 401", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var foreign = Token("ada", [], audience: "some-other-api");
    Eq((int)(await Get(app, "/me", foreign)).StatusCode, 401);
});

Test("garbage in the Authorization header is 401, not 500", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq((int)(await Get(app, "/me", "not-a-token")).StatusCode, 401);
});

Test("an authenticated NON-admin gets 403, not 401", async () =>
{
    // The crucial distinction: we know exactly who this is. They may not.
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq((int)(await Get(app, "/admin", Token("ada", ["user"]))).StatusCode, 403);
});

Test("an anonymous request to /admin is 401, not 403", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetStatus("/admin"), 401);
});

Test("an admin gets through", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await Get(app, "/admin", Token("root", ["admin"]));

    Eq((int)response.StatusCode, 200);
    Eq(await response.Content.ReadAsStringAsync(), "welcome root");
});

// ──────────────────────────── helpers ────────────────────────────────────

string Token(string name, string[] roles, TimeSpan? lifetime = null,
             string audience = "bootcamp-api", SecurityKey? signWith = null)
{
    List<Claim> claims = [new Claim(ClaimTypes.Name, name)];
    claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

    var token = new JwtSecurityToken(
        issuer: "bootcamp",
        audience: audience,
        claims: claims,
        expires: DateTime.UtcNow.Add(lifetime ?? TimeSpan.FromMinutes(5)),
        signingCredentials: new SigningCredentials(
            signWith ?? key, SecurityAlgorithms.HmacSha256));

    return new JwtSecurityTokenHandler().WriteToken(token);
}

Task<HttpResponseMessage> Get(ServedApp app, string path, string token)
{
    var request = new HttpRequestMessage(HttpMethod.Get, path);
    request.Headers.Authorization = new("Bearer", token);
    return app.Send(request);
}
