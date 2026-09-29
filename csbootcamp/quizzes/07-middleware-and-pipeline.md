# 07 · Middleware and the Pipeline

Cover the answer, commit out loud, then reveal.

---

### Q1 — the trace

```csharp
app.Use(A); app.Use(B); app.MapGet("/", handler);
```

Each logs `x-in` before `next` and `x-out` after. What's the trace?

<details><summary>Answer</summary>

**`a-in, b-in, handler, b-out, a-out`.**

The pipeline is an **onion**, not a queue. Registration order is *nesting* order: `a { b { handler } }`. The first registered is the outermost, so its "after" code runs **last**.
</details>

---

### Q2 — where does timing go

You want to log how long each request took. Where do you register that
middleware — first or last?

<details><summary>Answer</summary>

**First**, so it is outermost and its outbound half runs after everything else has finished.

Register it last and it measures only the endpoint, missing every other middleware. General rule: anything that must observe the *finished* response — timing, logging, exception handling, compression — goes early.
</details>

---

### Q3 — the missing await

```csharp
app.Use(async (ctx, next) => {
    var sw = Stopwatch.StartNew();
    next(ctx);                       // no await
    log.Add(sw.ElapsedMilliseconds);
});
```

<details><summary>Answer</summary>

The outbound code runs **before the rest of the pipeline finishes**. You get timings of ~0, logs with a status code nobody has set yet, and any exception downstream becomes an unobserved task.

Always `await next(ctx)`. The compiler will usually warn (CS4014) — do not suppress it.
</details>

---

### Q4 — stopping

How does a middleware end a request without reaching the endpoint?

<details><summary>Answer</summary>

**It doesn't call `next`.** Write a response and return:

```csharp
ctx.Response.StatusCode = 503;
await ctx.Response.WriteAsync("maintenance");
return;                                // no next() → done
```

There is no `Stop()`. The request unwinds back out through the middlewares that already ran — so their outbound halves still execute.
</details>

---

### Q5 — Use vs Map

`UseWhen` vs `MapWhen` — what's the difference and which bites?

<details><summary>Answer</summary>

`UseWhen` runs a branch and **rejoins** the main pipeline, so the endpoint still runs.
`MapWhen` is **terminal** — the branch never rejoins and your endpoint never runs.

The bite: reach for `MapWhen` when you wanted `UseWhen` and your endpoint silently stops executing, usually producing an empty 200. Nothing errors.
</details>

---

### Q6 — frozen flag

```csharp
app.Use(async (ctx, next) => {
    if (underMaintenance) { … }        // captured bool
    await next(ctx);
});
```

Why won't flipping `underMaintenance` at runtime work?

<details><summary>Answer</summary>

The lambda captured the **value** when the pipeline was built, at startup. It is read once and frozen.

Capture a `Func<bool>` (or read from a service) so it is evaluated **per request**. This is exactly the problem `IOptionsMonitor<T>` exists to solve for configuration — capture `config["X"]` at startup and you have pinned it for the life of the process.
</details>

---

### Q7 — the header that vanishes

```csharp
await next(ctx);
ctx.Response.Headers["X-Timing"] = "…";   // never appears
```

<details><summary>Answer</summary>

HTTP sends **headers before the body**. By the time `next` returns, the endpoint has usually written the body, which flushed the header block — it is now read-only. The assignment is silently ignored or throws.

Fix: `ctx.Response.OnStarting(callback)`, which runs immediately **before** the headers are flushed — after the endpoint set the status, before any body bytes.

Nasty because it *works* when the handler writes no body, so it passes a smoke test and fails in production.
</details>

---

### Q8 — what OnStarting measures

Timing captured in `OnStarting` is time-to-what?

<details><summary>Answer</summary>

**Time to first byte**, not total request time — the callback fires before the body is written. For a large streamed response those differ a lot.

Not wrong, just worth knowing which number you are publishing.
</details>

---

### Q9 — outermost catch

Why must exception-handling middleware be registered first?

<details><summary>Answer</summary>

A middleware can only catch what is **nested inside** it. Anything registered above it is outside its `try` and therefore unprotected.

Same reason `UseExceptionHandler()` is the first line of a real `Program.cs`.
</details>

---

### Q10 — the leak

```csharp
catch (Exception ex) {
    return Results.Problem(ex.Message);
}
```

What's wrong?

<details><summary>Answer</summary>

`ex.Message` may contain a **connection string, a file path, a SQL fragment, or a password**. Sending it tells an attacker your framework versions, directory layout, and query shapes.

Log the detail on the server; send a **fixed string** to the client. The exception is: messages *you* wrote for a user to read (a `ValidationException`) are fine to echo — because you chose their contents.
</details>

---

### Q11 — HasStarted

Why check `ctx.Response.HasStarted` in an error handler?

<details><summary>Answer</summary>

If bytes are already on the wire, the status code and headers are locked in. Assigning them throws a **second**, more confusing exception on top of the first — and you lose the original.

Standard shape: `if (ctx.Response.HasStarted) throw;` and let the server abort the connection.
</details>

---

### Q12 — 404s and middleware

Can middleware add a header to a 404 that no endpoint produced?

<details><summary>Answer</summary>

**Yes.** Middleware sits *outside* routing, so it sees every request including ones that match no endpoint, and it sees the generated 404 on the way out.

An **endpoint filter** cannot — there is no endpoint to filter. That is the practical difference between the two layers.
</details>

---

### Q13 — per-request state

Where do you put a correlation id so everything downstream in *this* request
can read it?

<details><summary>Answer</summary>

**`HttpContext.Items`** — a dictionary created fresh per request and discarded at the end.

A `static` field or a singleton service would be shared across concurrent requests: request A overwrites request B's id and both log the wrong one. A race that only appears under load, which is the worst kind to debug.
</details>

---

### Q14 — constructed how often

```csharp
sealed class RateLimit(RequestDelegate next, int max) {
    public async Task InvokeAsync(HttpContext ctx, IScopedThing svc) { … }
}
```

How many times is that class constructed, and why does `svc` go on
`InvokeAsync`?

<details><summary>Answer</summary>

**Once**, at startup, for the life of the application.

So constructor parameters get **singleton** dependencies only. Put a scoped service (a `DbContext`) in the constructor and you capture the *first request's* instance and hand it to every subsequent request — `ObjectDisposedException` at best, cross-request data bleed at worst.

`InvokeAsync` **is** per request, so scoped services are injected there. It is a top-tier ASP.NET Core production bug, and the class shape is what makes it avoidable.
</details>

---

### Q15 — the canonical order

Put these in order and say why two of them are strictly coupled:
`UseAuthorization`, `UseRouting`, `UseExceptionHandler`, `UseAuthentication`,
`UseStaticFiles`.

<details><summary>Answer</summary>

```
UseExceptionHandler   // outermost: catches everything below
UseStaticFiles        // before routing — cheap files never touch it
UseRouting            // decides WHICH endpoint
UseAuthentication     // who are you?      ─┐ strictly coupled:
UseAuthorization      // are you allowed?  ─┘ you cannot authorize an unknown user
```

`UseAuthentication` **must** precede `UseAuthorization` — the first populates
`HttpContext.User`, the second reads it. Reverse them and every request looks
anonymous, so authorization either rejects everyone or, if misconfigured,
lets everyone through.
</details>
