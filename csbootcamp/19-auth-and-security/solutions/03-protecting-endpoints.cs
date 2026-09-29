// ─────────────────────────────────────────────────────────────────────────
//  03 · protecting endpoints — SOLUTION                   ★★☆ core
//  concepts: authentication vs authorization · 401 vs 403 · token validation
//  run: dotnet run 03-protecting-endpoints.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `TokenValidationParameters` is the security boundary, and every flag left
//  off is an attack that works. The four tests for wrong-key, expired,
//  wrong-audience and garbage each correspond to one line here:
//
//    ValidateIssuerSigningKey + IssuerSigningKey → only tokens WE signed
//    ValidateLifetime                            → expiry is enforced
//    ValidateIssuer / ValidateAudience           → a token minted by another
//                                                  service, or for another
//                                                  API, is refused
//
//  Skipping the audience check is a real-world breach pattern: two services
//  share a signing key, so a token for the low-privilege service is happily
//  accepted by the high-privilege one.
//
//  Note `ClockSkew = TimeSpan.Zero`. The default allows FIVE MINUTES of skew,
//  so a token that expired four minutes ago still validates — which makes
//  "expired token is rejected" tests flaky and surprising. Zero is right for
//  a test; a small non-zero value is right in production where server clocks
//  genuinely drift.
//
//  The middleware order is the other half. `UseAuthentication` populates
//  `HttpContext.User`; `UseAuthorization` reads it. Swap them and User is
//  still anonymous when the decision is made, so everything 401s regardless
//  of the token.
//
//  The two status codes fall out of that split, and this is the distinction
//  worth being able to state cold:
//
//    · no token at all              → 401. We do not know who you are.
//    · valid token, missing role    → 403. We know exactly who you are; no.
//
//  Returning 403 for an anonymous request tells an attacker the resource
//  exists and they merely lack a role. Returning 401 for a known user tells
//  them to re-authenticate, which will not help and loops the client. ASP.NET
//  Core gets this right for free once the pipeline is ordered correctly —
//  which is most of why you should not hand-roll this.
//
//  `RequireAuthorization()` with no argument means "any authenticated user".
//  With a policy callback it composes further requirements.
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

void AddServices(WebApplicationBuilder builder)
{
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,          // only tokens we signed

                ValidateIssuer = true,
                ValidIssuer = "bootcamp",

                ValidateAudience = true,         // not a token for another API
                ValidAudience = "bootcamp-api",

                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,       // default is 5 MINUTES
            };
        });

    builder.Services.AddAuthorization();
}

void MapRoutes(WebApplication app)
{
    // Order is load-bearing: authorization reads what authentication wrote.
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapGet("/open", () => "open");

    app.MapGet("/me", (ClaimsPrincipal user) => user.Identity!.Name)
       .RequireAuthorization();                       // any authenticated user

    app.MapGet("/admin", (ClaimsPrincipal user) => $"welcome {user.Identity!.Name}")
       .RequireAuthorization(policy => policy.RequireRole("admin"));
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
