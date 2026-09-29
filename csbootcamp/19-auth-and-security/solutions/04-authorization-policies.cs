// ─────────────────────────────────────────────────────────────────────────
//  04 · authorization policies — SOLUTION                 ★★☆ core
//  concepts: named policies · claim requirements · custom requirements
//  run: dotnet run 04-authorization-policies.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  A policy is a rule with a NAME. That indirection is the whole value: the
//  endpoint says `RequireAuthorization("EuVerified")` and stays readable,
//  while the rule lives in one place you can change, test, and audit. Forty
//  endpoints with inline `if (user.HasClaim(...))` is forty places to forget
//  a condition.
//
//  Requirements inside one policy are **ANDed**. `EuVerified` adds two
//  RequireClaim calls and both must hold — which the test pins down by
//  showing each half alone gets a 403. There is no built-in OR: for that you
//  use `RequireAssertion` with a `||`, and the fact that it is awkward is
//  deliberate, because OR-ed permissions are usually a modelling smell.
//
//  The custom requirement is the pattern to remember for anything real:
//
//    · `MinimumAgeRequirement` is a dumb marker holding the PARAMETERS.
//    · `MinimumAgeHandler` holds the LOGIC and is registered in DI, so it can
//      inject a clock, a database, a feature flag — whatever the rule needs.
//
//  Splitting them lets one handler serve many parameterisations (18 here, 21
//  elsewhere) and lets the logic be unit-tested on its own.
//
//  The handler's contract is easy to get wrong: call `context.Succeed(req)`
//  to pass, and **do nothing** to fail. There is no `Fail()` in the normal
//  path — returning without succeeding is a failure. (`context.Fail()` exists
//  and is stronger: it vetoes even if another handler for the same
//  requirement succeeded.)
//
//  Which gives the security property the last test checks: a missing or
//  unparseable `birthdate` claim **fails closed**. The `TryParse` returns
//  false, we return without succeeding, and the request is denied. Writing it
//  the other way — succeed unless you can prove the user is a minor — means
//  a user who simply omits the claim walks straight through. Ambiguity must
//  deny, always.
//
//  `MapInboundClaims = false` is the trap this exercise is built around. By
//  default JwtSecurityTokenHandler rewrites well-known JWT claim names into
//  long WS-Federation URIs as it reads a token: "birthdate" arrives as
//  ClaimTypes.DateOfBirth, "sub" as ClaimTypes.NameIdentifier, "email" as
//  ClaimTypes.Email. So you issue "birthdate", and FindFirst("birthdate")
//  returns null — the claim is there, under a name you never chose. Because
//  the handler fails closed, the symptom is a silent 403 rather than an
//  error, which is a genuinely nasty afternoon. Turn the mapping off and
//  claims mean what you wrote.
//
//  The age arithmetic subtracts a year when this year's birthday has not
//  happened yet; `(now - dob).TotalDays / 365.25` is the sloppy version that
//  is wrong for a day at a time around leap years.
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

void AddServices(WebApplicationBuilder builder)
{
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            // Without this, JwtSecurityTokenHandler silently REMAPS well-known
            // JWT claim names to long WS-Federation URIs on the way in —
            // "birthdate" becomes ClaimTypes.DateOfBirth, and
            // FindFirst("birthdate") returns null. Turning the mapping off
            // means claims arrive exactly as they were issued.
            options.MapInboundClaims = false;

            options.TokenValidationParameters = new()
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = "bootcamp",
                ValidateAudience = true,
                ValidAudience = "bootcamp-api",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
            };
        });

    // The handler is resolved from DI, so it could take dependencies.
    builder.Services.AddSingleton<IAuthorizationHandler, MinimumAgeHandler>();

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("EuOnly", p => p.RequireClaim("region", "eu"));
        options.AddPolicy("Verified", p => p.RequireClaim("email_verified", "true"));

        // Two requirements in one policy → ANDed.
        options.AddPolicy("EuVerified", p => p
            .RequireClaim("region", "eu")
            .RequireClaim("email_verified", "true"));

        options.AddPolicy("Adult", p => p.Requirements.Add(new MinimumAgeRequirement(18)));
    });
}

void MapRoutes(WebApplication app)
{
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapGet("/eu", () => "ok").RequireAuthorization("EuOnly");
    app.MapGet("/verified", () => "ok").RequireAuthorization("Verified");
    app.MapGet("/eu-verified", () => "ok").RequireAuthorization("EuVerified");
    app.MapGet("/adult", () => "ok").RequireAuthorization("Adult");
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

    Eq((int)(await Get(app, "/eu-verified", Token(("region", "eu")))).StatusCode, 403);
    Eq((int)(await Get(app, "/eu-verified",
        Token(("email_verified", "true")))).StatusCode, 403);

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

public class MinimumAgeRequirement(int years) : IAuthorizationRequirement
{
    public int Years { get; } = years;
}

public class MinimumAgeHandler : AuthorizationHandler<MinimumAgeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, MinimumAgeRequirement requirement)
    {
        var claim = context.User.FindFirst("birthdate")?.Value;

        // Fail CLOSED: no claim, or unreadable, means deny. Returning
        // without calling Succeed IS the failure — there is no Fail() needed.
        if (!DateTime.TryParseExact(claim, "yyyy-MM-dd", CultureInfo.InvariantCulture,
                                    DateTimeStyles.None, out var birthdate))
            return Task.CompletedTask;

        var today = DateTime.UtcNow.Date;
        var age = today.Year - birthdate.Year;
        if (birthdate.Date > today.AddYears(-age)) age--;   // birthday not yet reached

        if (age >= requirement.Years) context.Succeed(requirement);
        return Task.CompletedTask;
    }
}
