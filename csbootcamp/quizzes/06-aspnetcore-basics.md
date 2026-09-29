# 06 · ASP.NET Core Basics — routing, binding, results

Cover the answer, commit out loud, then reveal.

---

### Q1 — content type

```csharp
app.MapGet("/ping", () => "pong");
```

A JavaScript client calls `await response.json()` on that and it throws. Why?

<details><summary>Answer</summary>

Returning a bare `string` produces **`text/plain`** with the body `pong` — unquoted, not JSON. `"pong"` would be valid JSON; `pong` is not.

Return an object (`Results.Ok(new { message = "pong" })`) if you meant JSON. Any non-string return value is serialised to `application/json`.
</details>

---

### Q2 — 404 or 400

`GET /items/abc` against `app.MapGet("/items/{id:int}", (int id) => …)`.
Status code?

<details><summary>Answer</summary>

**404.** The `:int` constraint is part of route **matching**. `abc` doesn't match, so no endpoint was found — nothing was ever bound.

Contrast: `GET /search?limit=lots` against `int limit` is a **400** — the route matched, then *binding* failed. Two different stages, two different codes, and neither needs a try/catch from you.
</details>

---

### Q3 — 404 or 405

`POST /ping` where only `MapGet("/ping", …)` exists.

<details><summary>Answer</summary>

**405 Method Not Allowed.** The path matched a known route; the verb didn't.

Routing is a real matching stage, not a dictionary lookup on the path — which is exactly why it can tell "no such resource" apart from "not that way".
</details>

---

### Q4 — where does it bind from

Rank the binding sources for a minimal API handler parameter.

<details><summary>Answer</summary>

1. Name matches a `{placeholder}` in the template → **route**
2. Simple type (`int`, `string`, `Guid`, `DateTime`…) → **query string**
3. Registered DI service → **the container**
4. `HttpContext` / `ClaimsPrincipal` / `CancellationToken` → **the framework**
5. Anything else (a class or record) → **the JSON body**

No attributes needed for any of it. `[FromQuery]` and friends exist to *override* this, not to enable it.
</details>

---

### Q5 — the empty list

`GET /tasks` when there are no tasks. What do you return?

<details><summary>Answer</summary>

**`200` with `[]`.** Never 404.

404 means "this resource does not exist". A collection with nothing in it *exists* and is empty. Clients written against a 404 here break on the day the list empties — and they will have written `if (res.status === 404) showError()`.
</details>

---

### Q6 — what Created buys you

Why `Results.Created(uri, value)` rather than `Results.Ok(value)` on a POST?

<details><summary>Answer</summary>

`Created` sets **201** *and* the **`Location`** header pointing at the new resource. `Ok` gives 200 and no Location, so the client has to guess where the thing now lives — usually by string-concatenating a URL, which then breaks when your routes change.

In controllers, use `CreatedAtAction(nameof(GetById), new { id }, entity)` so **routing** generates the URL. A hand-built `$"/api/items/{id}"` survives a `[Route]` rename and quietly serves a Location that 404s.
</details>

---

### Q7 — the PATCH trap

Your `PATCH /tasks/1` with body `{"title":"new"}` silently marks the task
incomplete. What's the DTO bug?

<details><summary>Answer</summary>

The DTO has `bool Done` instead of **`bool? Done`**. An absent JSON field deserialises to the type's default — `false` — so "not supplied" is indistinguishable from "set it to false".

With `bool?`, absent is `null`, and `patch.Done ?? existing.Done` keeps the old value.

Honest caveat: this makes it impossible to PATCH a field **to** null. When you need that, reach for `JsonPatchDocument` or a wrapper type that tracks "was set".
</details>

---

### Q8 — one DTO or two

Why not reuse one `Task` record for the POST body and the response?

<details><summary>Answer</summary>

Because the request DTO would carry `Id`, letting a client **choose its own id**. In a bigger model the same shortcut lets a client POST `IsAdmin: true` or `Balance: 1000000` — mass assignment, one of the oldest web vulnerabilities.

Separate the type you **accept** from the type you **return**. Two records, two lines.
</details>

---

### Q9 — typed results

What does `Results<Ok<Item>, NotFound>` buy over `IResult`?

<details><summary>Answer</summary>

Three things:

1. **Compiler-checked outcomes** — returning anything outside the union is a build error.
2. **OpenAPI for free** — the metadata is in the type, so no hand-written `.Produces<Item>(200)`.
3. **Unit-testable handlers** — `GetItem(1).Result is Ok<Item>` is a plain test on a plain method, **no server required**.

`IResult` is an opaque box that accepts anything and tells you nothing.
</details>

---

### Q10 — group filters

You add an auth filter to a group, then map three more endpoints into that
group afterwards. Are the new ones covered?

<details><summary>Answer</summary>

**Yes** — and nested groups too. The filter is attached to the *group*, not to the endpoints that happened to exist when you called `AddEndpointFilter`.

The opposite intuition ("it only covers what came before") would be an ugly security hole, so it's worth being certain about.
</details>

---

### Q11 — how to short-circuit

Inside an endpoint filter, how do you stop the handler running?

<details><summary>Answer</summary>

**Return without awaiting `next(ctx)`.**

```csharp
if (key != expected) return Results.Unauthorized();   // handler never runs
return await next(ctx);                               // handler runs
```

That is the whole mechanism — no `Stop()`, no sentinel.
</details>

---

### Q12 — lifetimes

A singleton service caches "the current user". What goes wrong?

<details><summary>Answer</summary>

**Every user sees whoever logged in last.** A singleton is one instance for the whole application, shared across all concurrent requests.

Per-request state belongs in `Scoped` (or `HttpContext.Items`). This is the single most common ASP.NET Core production bug, and it does not reproduce with one user on localhost.

Also: singletons are touched by many threads at once, so they must be **thread-safe** — a plain `Dictionary` in a singleton needs a lock or should be a `ConcurrentDictionary`.
</details>

---

### Q13 — scoped, twice

You resolve a scoped service twice within one request. Same object or two?

<details><summary>Answer</summary>

**The same object.** "Per request" means one instance per DI scope, and a request is one scope.

Resolve a **transient** twice and you get two. That difference is the entire practical distinction between the two lifetimes, and it is why a `DbContext` (scoped) can accumulate changes across several services in one request and save them together.
</details>

---

### Q14 — the catch-all

Difference between `{path}` and `{*path}`?

<details><summary>Answer</summary>

`{path}` matches **one segment** — `/files/a/b/c.txt` won't match `/files/{path}`.

`{*path}` is a **catch-all**: it matches the rest of the URL including the slashes, so `path` binds to `a/b/c.txt`.
</details>

---

### Q15 — double decoding

A query value arrives as `red%20hats`. Should you `UrlDecode` it?

<details><summary>Answer</summary>

**No.** The framework already decoded it — you receive `red hats`.

Decoding again turns `100%25` (which arrived as `100%`) into a malformed string, and can turn `%252F` into `/`, which is a path-traversal vector. Decode exactly once, at the boundary that owns the encoding.
</details>
