# 19 · Auth and Security

The module where getting it *nearly* right is the same as getting it wrong.
A missing `ValidateAudience`, a `403` where a `404` belonged, an `Owner` field
that a client can set — each is one line, and each is a breach.

Two words that sound alike and are not:

- **Authentication** — *who are you?* Proving identity. Failure is **401**.
- **Authorization** — *may you?* Deciding permission. Failure is **403**.

Everything in this module hangs off that split.

## The mental model

**1. Never store a password. Store something you can verify against.**

```csharp
Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32)
```

Three defences, three attacks closed:

| Defence | Stops |
| --- | --- |
| a random **salt per user** | rainbow tables; one cracked hash cracking every shared password |
| many **iterations** | GPU brute force (SHA-256 alone does billions/sec — being fast is the bug) |
| **`CryptographicOperations.FixedTimeEquals`** | timing attacks: an early-exit compare leaks how many bytes matched |

Store the iteration count alongside the hash so you can raise the cost later
without locking anyone out.

**2. A JWT is signed, not encrypted.**

```
header.payload.signature      ← base64, base64, signature
```

Anyone holding the token can read every claim with no key at all. The
signature proves *authenticity* (I issued this, it hasn't been altered),
never *confidentiality*.

- No secrets, no passwords, no PII you wouldn't print on a postcard.
- A token **cannot be un-issued**. Until `exp` passes, it is valid.
- Short lifetimes + refresh tokens are the standard answer. A revocation list
  works but gives back the statelessness you chose JWTs for.

**3. Validation is where security happens — issuing is not.**

Signing never consults the clock; you can issue an already-expired token
happily. Every flag you leave off `TokenValidationParameters` is an attack
that works:

```csharp
ValidateIssuerSigningKey = true, IssuerSigningKey = key,  // only tokens WE signed
ValidateIssuer = true,   ValidIssuer = "bootcamp",
ValidateAudience = true, ValidAudience = "bootcamp-api",  // not another API's token
ValidateLifetime = true,
ClockSkew = TimeSpan.Zero,                                // default is 5 MINUTES
```

**4. Order is load-bearing.**

```csharp
app.UseAuthentication();   // populates HttpContext.User
app.UseAuthorization();    // reads it
```

Reversed, `User` is still anonymous when the decision is made and everything
401s regardless of the token.

**5. A policy is a rule with a name.**

```csharp
options.AddPolicy("EuVerified", p => p
    .RequireClaim("region", "eu")
    .RequireClaim("email_verified", "true"));   // requirements are ANDed

app.MapGet("/x", …).RequireAuthorization("EuVerified");
```

For anything more, split it: an `IAuthorizationRequirement` holds the
**parameters**, an `AuthorizationHandler<T>` holds the **logic** and comes
from DI, so it can inject a clock or a database.

The handler contract: call `context.Succeed(requirement)` to pass, and **do
nothing** to fail. Returning without succeeding *is* the failure.

## The details that bite

1. **`[Authorize]` does not protect a row.** It proves you are *someone*,
   never that you may touch *this record*. `GET /orders/{id}` behind
   `.RequireAuthorization()` with no ownership check is an **IDOR** — the #1
   item on the OWASP Top Ten.

2. **Put ownership in the query, not in an `if` after it.**
   `Where(o => o.Owner == user)` is *structurally* safe: there is no code path
   that returns a row you don't own. A post-hoc check relies on everyone
   remembering it forever.

3. **Someone else's resource is 404, not 403.** A 403 confirms it exists, so
   an attacker enumerates valid ids. (403 is right when the caller may
   legitimately *know* it exists — a shared workspace they lack a role in.)
   Never let a status code reveal more than the caller is entitled to know.

4. **The owner comes from the token, never the body.** Leave server-controlled
   fields *off the input DTO entirely* — `record CreateOrder(string Item)` has
   no `Owner` to bind, so a client physically cannot set it. Binding onto the
   entity is **mass assignment**: the same shortcut that accepts
   `"isAdmin": true`.

5. **Fail closed.** When a rule can't be evaluated — missing claim,
   unparseable value — deny. "Succeed unless proven otherwise" means anyone
   who simply omits the claim walks through.

6. **`ClockSkew` defaults to five minutes.** A token that expired four minutes
   ago still validates. Surprising, and it makes expiry tests flaky.

7. **`MapInboundClaims` silently renames your claims.** By default
   `"birthdate"` arrives as `ClaimTypes.DateOfBirth`, `"sub"` as
   `ClaimTypes.NameIdentifier`. `FindFirst("birthdate")` returns null, the
   handler fails closed, and you get a silent 403 instead of an error. Set
   `options.MapInboundClaims = false`.

8. **One claim per role.** `[Authorize(Roles = "admin")]` and `IsInRole` look
   for separate `ClaimTypes.Role` claims; a comma-joined `"admin,auditor"`
   silently never matches.

9. **`ReadJwtToken` does not validate.** Never make an authorization decision
   from it.

10. **Signing keys are configuration, not source.** A literal key in a repo is
    a key in everyone's git history forever.

## 401 vs 403 — the table to memorise

| Situation | Code |
| --- | --- |
| No token | **401** |
| Expired / wrong key / wrong audience / malformed | **401** |
| Valid token, missing role or claim | **403** |
| Valid token, resource belongs to someone else | **404** (don't confirm it exists) |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-password-hashing.cs` | ★★☆ | PBKDF2 with per-user salt and constant-time compare |
| 02 | `02-issuing-jwts.cs` | ★★☆ | claims, signing, expiry — and decoding your own payload |
| 03 | `03-protecting-endpoints.cs` | ★★☆ | JWT validation, and 401 vs 403 pinned down |
| 04 | `04-authorization-policies.cs` | ★★☆ | named policies and a custom requirement + handler |
| 05 | `05-broken-access-control.cs` | ★★★ | IDOR, resource-based authz, mass assignment |

Do 01–03 in order; they build. **05 is the one that matters most** — it is the
most common serious vulnerability in real APIs, and it survives every review
that only asks "is this endpoint authenticated?"

---

**Stuck?** `cheatsheets/auth-and-security.md` (hashing, JWT, policies, status codes) · **Self-check:** `quizzes/11-auth-and-security.md` · **Next:** `csbootcamp/20-caching-and-performance`
