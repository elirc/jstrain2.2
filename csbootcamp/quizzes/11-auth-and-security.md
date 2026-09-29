# 11 · Auth and Security

Cover the answer, commit out loud, then reveal. This is the one where a
half-remembered answer is worse than none.

---

### Q1 — the two words

Authentication and authorization: which is which, and what status code does
each failure produce?

<details><summary>Answer</summary>

**Authentication** = *who are you?* Failure is **401 Unauthorized** (badly
named — it means unauthenticated).

**Authorization** = *may you?* Failure is **403 Forbidden**.

`UseAuthentication()` populates `HttpContext.User`; `UseAuthorization()` reads
it. Order is load-bearing — reversed, `User` is anonymous when the decision is
made and everything 401s.
</details>

---

### Q2 — why not SHA-256

Why is a plain SHA-256 hash the wrong way to store a password?

<details><summary>Answer</summary>

**Because it's fast.** SHA-256 is designed for throughput; a GPU does billions
per second, so a leaked table falls to a dictionary attack in minutes.

Password hashing wants a *deliberately slow* function — PBKDF2 with a high
iteration count, or better, a memory-hard one (Argon2id, scrypt) that resists
GPUs specifically.

Unsalted is the second half of the problem: identical passwords produce
identical hashes, so one cracked hash cracks every account sharing it.
</details>

---

### Q3 — what the salt buys

The salt is stored in plaintext right next to the hash. What's the point?

<details><summary>Answer</summary>

The salt is **not a secret** — it only has to be **unique per user**.

It defeats *precomputation*. An attacker can build a rainbow table for
unsalted hashes once and use it against every breach forever. With a unique
salt per user, the table would have to be rebuilt per user, which is the same
as brute-forcing each one individually.

It also means two users with the same password get different hashes, so
cracking one tells you nothing about the other.
</details>

---

### Q4 — the timing leak

Why `CryptographicOperations.FixedTimeEquals` instead of `SequenceEqual`?

<details><summary>Answer</summary>

`SequenceEqual` returns as soon as two bytes differ, so **how long it took
reveals how many leading bytes matched**. Over enough requests an attacker
reconstructs the value byte by byte — a timing attack.

`FixedTimeEquals` always compares every byte, so the duration carries no
information.
</details>

---

### Q5 — signed or encrypted

Can a user read the claims inside their own JWT?

<details><summary>Answer</summary>

**Yes — trivially, with no key at all.** The header and payload are base64url,
not ciphertext. `token.Split('.')[1]`, base64-decode, done.

A JWT is **signed, not encrypted**. The signature proves *authenticity* (I
issued this, it hasn't been altered), never *confidentiality*.

So: no passwords, no secrets, no PII you wouldn't print on a postcard.
</details>

---

### Q6 — logging out

A user clicks "log out". Their JWT was issued 30 seconds ago with a 15-minute
expiry. Is it still valid?

<details><summary>Answer</summary>

**Yes.** A JWT cannot be un-issued. There is no server-side session to delete
— that statelessness is the whole reason to use one — so until `exp` passes,
anyone holding that token can use it.

Mitigations: short lifetimes plus refresh tokens (the standard answer), or a
revocation/denylist (works, but reintroduces the state you were avoiding).
Logging out normally just discards the token client-side.
</details>

---

### Q7 — the clock

Can you issue a JWT that is already expired? Does the framework stop you?

<details><summary>Answer</summary>

**Yes, you can, and no, it doesn't.** Signing never consults the clock — it
just serialises the claims and computes a signature.

Expiry is enforced at **validation** time (`ValidateLifetime = true`). Two
separate stages, and only one of them protects you.
</details>

---

### Q8 — the five-minute surprise

A token expired 4 minutes ago. With default settings, does it validate?

<details><summary>Answer</summary>

**Yes.** `ClockSkew` defaults to **5 minutes**, to tolerate drift between
servers.

Surprising, and it makes expiry tests flaky and confusing. Set
`ClockSkew = TimeSpan.Zero` in tests, and a small deliberate value in
production.
</details>

---

### Q9 — the shared key

Two of your services share a JWT signing key. You set `ValidateIssuerSigningKey`
and `ValidateLifetime` but skip `ValidateAudience`. What's the attack?

<details><summary>Answer</summary>

A token minted for the **low-privilege service** is accepted by the
**high-privilege one**. It's correctly signed and unexpired, and nothing else
distinguishes it.

That's a real, repeatedly-exploited breach pattern. `aud` exists precisely to
say *which API this token is for*; validating it is not optional.

Same reasoning for `ValidateIssuer`: a token from another identity provider
you happen to trust for something else shouldn't authenticate here.
</details>

---

### Q10 — the silent 403

You issue a `birthdate` claim. Your authorization handler calls
`context.User.FindFirst("birthdate")` and gets null, so every request 403s.
The claim is definitely in the token. Why?

<details><summary>Answer</summary>

`MapInboundClaims` is **true by default**, and `JwtSecurityTokenHandler`
renames well-known JWT claims into long WS-Federation URIs as it reads the
token: `birthdate` → `ClaimTypes.DateOfBirth`, `sub` →
`ClaimTypes.NameIdentifier`, `email` → `ClaimTypes.Email`.

The claim is there under a name you never chose. Set
`options.MapInboundClaims = false` so claims mean what you wrote.

Nastiest part: because a well-written handler **fails closed**, the symptom is
a silent 403 rather than an error.
</details>

---

### Q11 — the handler contract

In an `AuthorizationHandler<T>`, how do you fail a requirement?

<details><summary>Answer</summary>

**By doing nothing.** Call `context.Succeed(requirement)` to pass; simply
returning without succeeding *is* the failure.

`context.Fail()` exists and is **stronger**: it vetoes the requirement even if
another registered handler for the same requirement succeeded. Use it only
when you mean an absolute veto.
</details>

---

### Q12 — which way to fail

Your rule can't be evaluated — the claim is missing or unparseable. Allow or
deny?

<details><summary>Answer</summary>

**Deny. Always.** Fail closed.

"Succeed unless we can prove they're a minor" means a user who simply *omits*
the birthdate claim walks straight through. Ambiguity must deny — the absence
of evidence is not evidence of permission.
</details>

---

### Q13 — the endpoint that reviews clean

```csharp
app.MapGet("/orders/{id}", (int id, ShopDb db) => db.Orders.Find(id))
   .RequireAuthorization();
```

It's authenticated. What's the vulnerability?

<details><summary>Answer</summary>

**IDOR** — Insecure Direct Object Reference. Any logged-in user reads **any**
order by changing the number in the URL. It's #1 on the OWASP Top Ten.

`[Authorize]` / `RequireAuthorization()` proves you are *someone*. It says
nothing about whether you may touch *this row*.

Fix — put ownership **in the query**, not in an `if` after it:

```csharp
db.Orders.SingleOrDefault(o => o.Id == id && o.Owner == user.Identity!.Name)
```

Then no code path exists that returns a row you don't own. A post-hoc check
works today and relies on everyone remembering it in every future endpoint.
</details>

---

### Q14 —403 or 404

A user requests an order that exists but belongs to someone else. Which do you
return?

<details><summary>Answer</summary>

**404.** A 403 *confirms the order exists*, which lets an attacker walk the id
space and enumerate valid records — leaking exactly what you were protecting.

Make "doesn't exist" and "not yours" **indistinguishable**.

403 is right when the caller may legitimately *know* it exists — a shared
workspace they lack a role in. The rule: never let a status code reveal more
than the caller is entitled to know.
</details>

---

### Q15 — the sneaky POST

A client POSTs `{"item":"laptop","owner":"bob","status":"paid"}`. How do you
guarantee they can't set `owner` or `status`?

<details><summary>Answer</summary>

**Leave them off the input type entirely.**

```csharp
public record CreateOrder(string Item);      // no Owner, no Status to bind
```

There is nothing to bind to, so the extra JSON fields are ignored. The owner
comes from `user.Identity.Name` and the status from a constant.

Binding onto the entity is **mass assignment** — the same shortcut that
accepts `"isAdmin": true` or `"balance": 1000000`. Validation rules are a
weaker defence than a type that can't express the attack.
</details>
