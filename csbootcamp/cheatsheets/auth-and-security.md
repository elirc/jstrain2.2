# Auth and security — offline reference

Covers module 19: password hashing, JWTs, policies, access control.

## The two words

| | Question | Failure |
| --- | --- | --- |
| **Authentication** | who are you? | **401** |
| **Authorization** | may you? | **403** |

```csharp
app.UseAuthentication();   // populates HttpContext.User   ─┐ order is
app.UseAuthorization();    // reads it and decides         ─┘ load-bearing
```

## Status codes

| Situation | Code |
| --- | --- |
| No token | **401** |
| Expired / wrong key / wrong issuer / wrong audience / malformed | **401** |
| Valid token, missing role or claim | **403** |
| Valid token, resource belongs to someone else | **404** — don't confirm it exists |

403 is right only when the caller may legitimately *know* the resource
exists. Never let a status code reveal more than the caller is entitled to.

## Password hashing

```csharp
var salt = RandomNumberGenerator.GetBytes(16);           // per user
var hash = Rfc2898DeriveBytes.Pbkdf2(
    Encoding.UTF8.GetBytes(password), salt,
    iterations: 100_000, HashAlgorithmName.SHA256, outputLength: 32);

var stored = $"{iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";

// verify — re-derive with the SAME salt and cost, then:
CryptographicOperations.FixedTimeEquals(actual, expected)
```

| Defence | Stops |
| --- | --- |
| random salt per user | rainbow tables; shared-password cracking |
| high iteration count | GPU brute force |
| `FixedTimeEquals` | timing attacks (early exit leaks match length) |
| storing the cost | lets you raise it later without lockouts |

**Never** a bare SHA-256 — being fast is exactly the bug. Prefer ASP.NET Core
Identity's `PasswordHasher<T>`, or Argon2id/scrypt (memory-hard) in new code.

## JWT structure

```
header.payload.signature      ← base64url, base64url, signature
```

**Signed, not encrypted.** Anyone can read the payload with no key:

```csharp
var payload = token.Split('.')[1];
var padded  = payload.Replace('-','+').Replace('_','/')
                     .PadRight((payload.Length + 3) / 4 * 4, '=');
Encoding.UTF8.GetString(Convert.FromBase64String(padded));
```

So: no secrets, no passwords, no PII in a token. And a token **cannot be
un-issued** — until `exp`, it is valid. Short lifetimes + refresh tokens.

## Issuing

```csharp
List<Claim> claims = [new Claim(ClaimTypes.Name, userName)];
claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));  // ONE PER ROLE

var token = new JwtSecurityToken(
    issuer: "bootcamp", audience: "bootcamp-api", claims: claims,
    expires: DateTime.UtcNow.AddMinutes(15),
    signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

return new JwtSecurityTokenHandler().WriteToken(token);
```

Signing **never checks the clock** — you can issue an already-expired token.
Expiry is enforced at validation.

## Validating — every flag is an attack you're closing

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => {
        o.MapInboundClaims = false;            // keep claim names as issued
        o.TokenValidationParameters = new() {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,            // only tokens WE signed
            ValidateIssuer   = true, ValidIssuer   = "bootcamp",
            ValidateAudience = true, ValidAudience = "bootcamp-api",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,         // DEFAULT IS 5 MINUTES
            NameClaimType = "name", RoleClaimType = "role",
        };
    });
```

- **Skip `ValidateAudience`** and a token for a low-privilege service that
  shares your key is accepted by your high-privilege one. Real breach pattern.
- **`ClockSkew` defaults to 5 minutes** — a token that expired 4 minutes ago
  still validates.
- **`MapInboundClaims`** defaults to true and renames well-known claims:
  `birthdate` → `ClaimTypes.DateOfBirth`, `sub` → `ClaimTypes.NameIdentifier`,
  `email` → `ClaimTypes.Email`. `FindFirst("birthdate")` then returns null and
  you get a silent 403.
- **`ReadJwtToken` does not validate.** Never authorize from it.

Signing keys come from configuration or a secret store — never a literal in
source. Minimum 32 bytes for HMAC-SHA256.

## Protecting endpoints

```csharp
app.MapGet("/me",    …).RequireAuthorization();                       // any user
app.MapGet("/admin", …).RequireAuthorization(p => p.RequireRole("admin"));
app.MapGet("/eu",    …).RequireAuthorization("EuOnly");               // named policy

var group = app.MapGroup("/orders").RequireAuthorization();           // whole group
```

Controllers: `[Authorize]`, `[Authorize(Roles = "admin")]`,
`[Authorize(Policy = "EuOnly")]`, `[AllowAnonymous]`.

## Policies

```csharp
builder.Services.AddAuthorization(options => {
    options.AddPolicy("EuOnly",   p => p.RequireClaim("region", "eu"));
    options.AddPolicy("EuVerified", p => p
        .RequireClaim("region", "eu")
        .RequireClaim("email_verified", "true"));      // ANDed
    options.AddPolicy("Adult", p => p.Requirements.Add(new MinimumAgeRequirement(18)));
});
```

| Builder | Meaning |
| --- | --- |
| `RequireAuthenticatedUser()` | any signed-in user |
| `RequireRole("a", "b")` | any **one** of these roles |
| `RequireClaim(type, values…)` | claim present with one of these values |
| `RequireAssertion(ctx => …)` | arbitrary predicate — the OR escape hatch |

Requirements within one policy are **ANDed**. There is no built-in OR.

## Custom requirements

```csharp
public class MinimumAgeRequirement(int years) : IAuthorizationRequirement {
    public int Years { get; } = years;                      // PARAMETERS
}

public class MinimumAgeHandler : AuthorizationHandler<MinimumAgeRequirement> {
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, MinimumAgeRequirement requirement) {
        if (!CanEvaluate) return Task.CompletedTask;        // FAIL CLOSED
        if (ok) context.Succeed(requirement);               // pass
        return Task.CompletedTask;
    }
}

builder.Services.AddSingleton<IAuthorizationHandler, MinimumAgeHandler>();
```

**Contract:** `Succeed()` to pass; **do nothing** to fail. `context.Fail()` is
stronger — it vetoes even if another handler succeeded.

**Fail closed.** Missing or unparseable claim → deny. "Succeed unless proven
otherwise" lets anyone who omits the claim walk through.

## Broken access control (OWASP #1)

`[Authorize]` proves you are *someone*. It never proves you may touch *this
row*.

```csharp
// ❌ IDOR — any logged-in user reads any order
app.MapGet("/orders/{id}", (int id, ShopDb db) => db.Orders.Find(id))
   .RequireAuthorization();

// ✅ ownership IS the lookup
var order = db.Orders.SingleOrDefault(o => o.Id == id && o.Owner == user.Identity!.Name);
return order is null ? Results.NotFound() : Results.Ok(order);   // 404, not 403
```

Put ownership **in the query**, not in an `if` after it — then no code path
returns a row you don't own.

## Mass assignment

```csharp
public record Order(int Id, string Owner, string Item, string Status);
public record CreateOrder(string Item);      // ← no Owner, no Status to bind

var order = new Order(++nextId, user.Identity!.Name!, input.Item, "pending");
```

Server-controlled fields come from server state. Leave them **off the input
type entirely** — that is the defence, not a validation rule. Binding onto the
entity accepts `{"owner":"bob","status":"paid"}`, or `"isAdmin": true`.

## Checklist before shipping an endpoint

- [ ] Is it authenticated where it should be?
- [ ] Does it check the caller may touch **this specific resource**?
- [ ] Is the ownership filter in the **query**?
- [ ] Does "not yours" return **404**, not 403?
- [ ] Can the client set any server-controlled field via the body?
- [ ] Do error responses leak internals? (see module 14)
- [ ] Does ambiguity **deny**?
