// ─────────────────────────────────────────────────────────────────────────
//  04 · authorization policies                            ★★☆ core
//  concepts: named policies · claim requirements · custom requirements
//  run: dotnet run 04-authorization-policies.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Roles run out fast. "Admins can do this" becomes "admins in the EU with a
//  verified email and at least two years' tenure", and you do NOT want that
//  scattered across forty `if` statements in forty endpoints.
//
//  A POLICY is that rule, named once and applied by name:
//
//      options.AddPolicy("EuOnly", p => p.RequireClaim("region", "eu"));
//      app.MapGet("/x", …).RequireAuthorization("EuOnly");
//
//  Built-in requirement builders: RequireAuthenticatedUser, RequireRole,
//  RequireClaim, RequireAssertion (an arbitrary predicate over the user).
//  For anything more, write an `IAuthorizationRequirement` + a handler.
//
//  Define four policies and apply them:
//
//      "EuOnly"      → claim region == "eu"
//      "Verified"    → claim email_verified == "true"
//      "EuVerified"  → BOTH of the above (requirements are AND, not OR)
//      "Adult"       → a custom MinimumAge requirement of 18, reading a
//                      "birthdate" claim (ISO yyyy-MM-dd)
//
//  hint: requirements added to one policy are ANDed. RequireAssertion gives
//        you a predicate; MinimumAgeHandler at the bottom is the structured
//        way to do the same thing reusably.
//
//  hint 2: if your birthdate claim reads back as null, set
//        `options.MapInboundClaims = false` on the JwtBearer options — by
//        default the handler renames well-known JWT claims on the way in.
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.AspNetCore.Authentication.JwtBearer@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

var key = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes("bootcamp-signing-key-at-least-32-bytes-long"));

// Register JWT auth (as in exercise 03) plus the four named policies, and
// register the handler for the custom requirement.
void AddServices(WebApplicationBuilder builder)
{
    throw new NotImplementedException();
}

// Map: /eu, /verified, /eu-verified, /adult — each guarded by its policy,
// each returning "ok".
void MapRoutes(WebApplication app)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a matching claim passes the policy", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq((int)(await Get(app, "/eu", Token(("region", "eu")))).StatusCode, 200);
});

Test("a wrong claim value is 403", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq((int)(await Get(app, "/eu", Token(("region", "us")))).StatusCode, 403);
});

Test("a missing claim is 403", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq((int)(await Get(app, "/eu", Token())).StatusCode, 403);
});

Test("no token at all is still 401, not 403", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetStatus("/eu"), 401);
});

Test("the verified policy reads its own claim", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq((int)(await Get(app, "/verified", Token(("email_verified", "true")))).StatusCode, 200);
    Eq((int)(await Get(app, "/verified", Token(("email_verified", "false")))).StatusCode, 403);
});

Test("requirements within a policy are ANDed, not ORed", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);

    // Each half alone is not enough.
    Eq((int)(await Get(app, "/eu-verified", Token(("region", "eu")))).StatusCode, 403);
    Eq((int)(await Get(app, "/eu-verified",
        Token(("email_verified", "true")))).StatusCode, 403);

    // Both together pass.
    Eq((int)(await Get(app, "/eu-verified",
        Token(("region", "eu"), ("email_verified", "true")))).StatusCode, 200);
});

Test("the custom age requirement admits an adult", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var born = DateTime.UtcNow.AddYears(-30).ToString("yyyy-MM-dd");
    Eq((int)(await Get(app, "/adult", Token(("birthdate", born)))).StatusCode, 200);
});

Test("the custom age requirement rejects a minor", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var born = DateTime.UtcNow.AddYears(-12).ToString("yyyy-MM-dd");
    Eq((int)(await Get(app, "/adult", Token(("birthdate", born)))).StatusCode, 403);
});

Test("a missing or unparseable birthdate fails closed", async () =>
{
    // Fail CLOSED: when the rule can't be evaluated, deny.
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq((int)(await Get(app, "/adult", Token())).StatusCode, 403);
    Eq((int)(await Get(app, "/adult", Token(("birthdate", "someday")))).StatusCode, 403);
});

// ──────────────────────────── helpers ────────────────────────────────────

string Token(params (string Type, string Value)[] extra)
{
    List<Claim> claims = [new Claim(ClaimTypes.Name, "ada")];
    claims.AddRange(extra.Select(c => new Claim(c.Type, c.Value)));

    var token = new JwtSecurityToken(
        issuer: "bootcamp",
        audience: "bootcamp-api",
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(5),
        signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

    return new JwtSecurityTokenHandler().WriteToken(token);
}

Task<HttpResponseMessage> Get(ServedApp app, string path, string token)
{
    var request = new HttpRequestMessage(HttpMethod.Get, path);
    request.Headers.Authorization = new("Bearer", token);
    return app.Send(request);
}

// ──────────────────────────── types ──────────────────────────────────────

// A requirement is a marker carrying the rule's PARAMETERS.
public class MinimumAgeRequirement(int years) : IAuthorizationRequirement
{
    public int Years { get; } = years;
}

// A handler evaluates it. Call Succeed to pass; do nothing to fail.
public class MinimumAgeHandler : AuthorizationHandler<MinimumAgeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, MinimumAgeRequirement requirement)
        => throw new NotImplementedException();
}
