// ─────────────────────────────────────────────────────────────────────────
//  02 · issuing JWTs — SOLUTION                           ★★☆ core
//  concepts: claims · signing · expiry · what a JWT is not
//  run: dotnet run 02-issuing-jwts.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `Issue` is assembly, not cryptography-by-hand: build a claim list, hand it
//  to `JwtSecurityToken` with an expiry and a `SigningCredentials`, and let
//  the handler serialise it. The signature is computed for you.
//
//  Roles are **one claim per role**, not one comma-joined claim. That is the
//  convention `ClaimsPrincipal.IsInRole` and `[Authorize(Roles = "...")]`
//  expect; join them into "admin,auditor" and role checks silently never
//  match.
//
//  The test that matters most is "the payload is readable by anyone". It
//  decodes the middle segment with no key at all and finds `ada` and `admin`
//  sitting in plain JSON. A JWT is **signed, not encrypted** — the signature
//  proves *authenticity* (I issued this, it has not been altered), never
//  *confidentiality*. So: no passwords in a token, no PII you would not print
//  on a postcard, no internal ids you would rather not leak.
//
//  The expired-token test makes the other half of the split visible: signing
//  never consults the clock, so issuing a token that is already expired
//  works fine. Expiry is enforced at VALIDATION time (exercise 03). Two
//  different stages, and only one of them protects you.
//
//  Which leads to the operational point: a JWT cannot be un-issued. There is
//  no server-side session to delete, so until `exp` passes, a stolen token is
//  valid. Short lifetimes plus refresh tokens are the standard answer; a
//  revocation list works but gives back the statelessness you chose JWTs for.
//
//  `ReadJwtToken` parses WITHOUT validating. Never use it to make an
//  authorization decision — that is `ValidateToken`, or better, the
//  JwtBearer middleware in exercise 03.
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.AspNetCore.Authentication.JwtBearer@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

var key = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes("bootcamp-signing-key-at-least-32-bytes-long"));

string Issue(string userName, string[] roles, TimeSpan lifetime)
{
    // One claim per role — that is what IsInRole and [Authorize(Roles=…)]
    // look for. A single comma-joined claim silently never matches.
    List<Claim> claims = [new Claim(ClaimTypes.Name, userName)];
    claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

    var token = new JwtSecurityToken(
        issuer: "bootcamp",
        audience: "bootcamp-api",
        claims: claims,
        expires: DateTime.UtcNow.Add(lifetime),
        signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

    return new JwtSecurityTokenHandler().WriteToken(token);
}

// Parses only. No signature check, no expiry check — which is exactly what
// anyone holding the token can also do.
IReadOnlyList<Claim> ReadClaims(string token)
    => new JwtSecurityTokenHandler().ReadJwtToken(token).Claims.ToList();

// ──────────────────────────── tests ──────────────────────────────────────

Test("a JWT has three dot-separated segments", () =>
{
    var token = Issue("ada", [], TimeSpan.FromMinutes(5));
    Eq(token.Split('.').Length, 3);
});

Test("the name claim survives the round trip", () =>
{
    var claims = ReadClaims(Issue("ada", [], TimeSpan.FromMinutes(5)));
    Eq(claims.Single(c => c.Type == ClaimTypes.Name).Value, "ada");
});

Test("each role is its own claim", () =>
{
    var claims = ReadClaims(Issue("ada", ["admin", "auditor"], TimeSpan.FromMinutes(5)));
    Eq(claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value),
       new[] { "admin", "auditor" });
});

Test("issuer and audience are recorded", () =>
{
    var jwt = new JwtSecurityTokenHandler().ReadJwtToken(
        Issue("ada", [], TimeSpan.FromMinutes(5)));

    Eq(jwt.Issuer, "bootcamp");
    Ok(jwt.Audiences.Contains("bootcamp-api"));
});

Test("the token expires in the future, near the requested lifetime", () =>
{
    var jwt = new JwtSecurityTokenHandler().ReadJwtToken(
        Issue("ada", [], TimeSpan.FromMinutes(5)));

    var minutes = (jwt.ValidTo - DateTime.UtcNow).TotalMinutes;
    Ok(minutes is > 4 and <= 5.1, $"expected ~5 minutes, got {minutes}");
});

Test("an already-expired token can still be issued and read", () =>
{
    var jwt = new JwtSecurityTokenHandler().ReadJwtToken(
        Issue("ada", [], TimeSpan.FromMinutes(-5)));

    Ok(jwt.ValidTo < DateTime.UtcNow);
});

Test("the payload is readable by anyone — it is base64, not encryption", () =>
{
    var token = Issue("ada", ["admin"], TimeSpan.FromMinutes(5));
    var payload = token.Split('.')[1];

    var padded = payload.Replace('-', '+').Replace('_', '/')
                        .PadRight((payload.Length + 3) / 4 * 4, '=');
    var json = Encoding.UTF8.GetString(Convert.FromBase64String(padded));

    Ok(json.Contains("ada"));
    Ok(json.Contains("admin"));
});

Test("two tokens for the same user differ, because the timestamps differ", async () =>
{
    var first = Issue("ada", [], TimeSpan.FromMinutes(5));
    await Sleep(1100);
    var second = Issue("ada", [], TimeSpan.FromMinutes(5));

    Ok(first != second);
});
