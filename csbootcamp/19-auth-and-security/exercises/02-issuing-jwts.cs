// ─────────────────────────────────────────────────────────────────────────
//  02 · issuing JWTs                                      ★★☆ core
//  concepts: claims · signing · expiry · what a JWT is not
//  run: dotnet run 02-issuing-jwts.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A JWT is three base64url segments joined by dots:
//
//      header.payload.signature
//
//  The header and payload are **base64, not encryption** — anyone holding the
//  token can read every claim in it. The signature proves the token was
//  issued by someone holding the key and has not been altered since. That is
//  the entire security model, and it means:
//
//      · NEVER put a secret in a JWT (no passwords, no PII you would not
//        print on a postcard)
//      · a token cannot be un-issued — until it expires, it is valid
//      · short expiry is the only revocation you get for free
//
//  Build the issuing half:
//
//      Issue("ada", ["admin"], TimeSpan.FromMinutes(5))
//          → a signed token carrying the name and roles
//      ReadClaims(token) → the claims, WITHOUT validating the signature
//
//  ReadClaims deliberately does not validate — it exists to prove the payload
//  is readable by anyone, which is the point of the exercise.
//
//  hint: JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(...));
//        SigningCredentials(key, SecurityAlgorithms.HmacSha256)
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.AspNetCore.Authentication.JwtBearer@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

// At least 32 bytes for HMAC-SHA256. In production this comes from
// configuration or a secret store — never a literal in source.
var key = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes("bootcamp-signing-key-at-least-32-bytes-long"));

// A signed token with:
//   · ClaimTypes.Name        = userName
//   · ClaimTypes.Role        = one claim PER role
//   · issuer "bootcamp", audience "bootcamp-api"
//   · expiry = now + lifetime
string Issue(string userName, string[] roles, TimeSpan lifetime)
{
    throw new NotImplementedException();
}

// Read the claims out WITHOUT verifying the signature — this is what an
// attacker (or a curious user) can do with any token they hold.
IReadOnlyList<Claim> ReadClaims(string token)
{
    throw new NotImplementedException();
}

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
    // Signing does not check the clock — VALIDATION does. Exercise 03.
    var jwt = new JwtSecurityTokenHandler().ReadJwtToken(
        Issue("ada", [], TimeSpan.FromMinutes(-5)));

    Ok(jwt.ValidTo < DateTime.UtcNow);
});

Test("the payload is readable by anyone — it is base64, not encryption", () =>
{
    var token = Issue("ada", ["admin"], TimeSpan.FromMinutes(5));
    var payload = token.Split('.')[1];

    // base64url → base64, then decode. No key involved anywhere.
    var padded = payload.Replace('-', '+').Replace('_', '/')
                        .PadRight((payload.Length + 3) / 4 * 4, '=');
    var json = Encoding.UTF8.GetString(Convert.FromBase64String(padded));

    Ok(json.Contains("ada"));
    Ok(json.Contains("admin"));
});

Test("two tokens for the same user differ, because the timestamps differ", async () =>
{
    var first = Issue("ada", [], TimeSpan.FromMinutes(5));
    await Sleep(1100);   // JWT timestamps have one-second resolution
    var second = Issue("ada", [], TimeSpan.FromMinutes(5));

    Ok(first != second);
});
