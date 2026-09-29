# 14 · The Middleware Pipeline

Everything an ASP.NET Core app does to a request before your endpoint sees it
— authentication, HTTPS redirection, CORS, compression, exception handling,
routing itself — is middleware. It is one small abstraction repeated, and once
you can read a `Program.cs` pipeline top to bottom you can debug almost any
"why is my request doing that?" question without a debugger.

## The mental model

**1. The pipeline is an onion, not a queue.**

```csharp
app.Use(A);   // outermost
app.Use(B);
app.MapGet("/", handler);

// A-in → B-in → handler → B-out → A-out
```

Each middleware runs code on the way in, calls `next`, then runs code on the
way out. **The first one registered is the outermost, so its "after" code runs
last.** Anything that must observe the finished response — timing, logging,
exception handling — has to be registered *early*.

**2. Not calling `next` ends the request.**

That is the entire short-circuit mechanism. No `Stop()`, no sentinel return
value: you write a response and return.

```csharp
app.Use(async (ctx, next) => {
    if (blocked) { ctx.Response.StatusCode = 503; return; }   // stops here
    await next(ctx);
});
```

**3. Headers go out before the body — so they're set on the way *in*.**

Once one byte of body is written, the header block has been flushed and is
read-only. Setting a header after `await next(ctx)` is the classic bug: it
works only when the handler wrote nothing, so it passes a smoke test and fails
in production. When the value isn't known until later, use
`Response.OnStarting(callback)`, which runs immediately before the headers are
sent.

**4. Per-request state goes in `HttpContext.Items`.**

Created fresh per request, discarded at the end. A `static` field or a
singleton would be shared across concurrent requests — a race that only shows
up under load.

**5. A middleware class is constructed once, for the life of the app.**

```csharp
sealed class Thing(RequestDelegate next, int max) {
    public async Task InvokeAsync(HttpContext ctx, IScopedService svc) { … }
}
```

Constructor → **singleton** dependencies only. Scoped services (a `DbContext`)
are extra parameters on `InvokeAsync`, which *is* per request. Putting a
scoped service in the constructor captures one request's instance forever.

## The details that bite

1. **Forgetting `await` on `next(ctx)`** makes the outbound half run before
   the pipeline finishes: timings of zero, logs with the wrong status code.

2. **`UseWhen` rejoins the pipeline; `MapWhen` does not.** Reach for `MapWhen`
   when you wanted `UseWhen` and your endpoint silently never runs.

3. **Capture a `Func<bool>`, not a `bool`,** for anything that can change at
   runtime. A captured value is frozen at startup. (This is exactly why
   `IOptionsMonitor<T>` exists.)

4. **Exception middleware must be outermost.** It can only catch what is
   nested inside it.

5. **Never put `ex.Message` in a 500 response body.** It may hold a connection
   string, a file path, or a password. Log the detail; send a fixed string.

6. **Check `Response.HasStarted` before changing the status** in an error
   handler, or you throw a second, more confusing exception on top of the
   first.

7. **Singletons must be thread-safe.** A `Dictionary` in a singleton needs a
   lock (or should be a `ConcurrentDictionary`) — middleware runs concurrently
   on many threads.

8. **Middleware sits outside routing,** so it sees requests that match no
   endpoint. That is why it can add headers to a 404; an endpoint filter
   cannot.

## The canonical order

Real apps put these in roughly this order, and the order is load-bearing:

```csharp
app.UseExceptionHandler();     // outermost: catches everything below
app.UseHttpsRedirection();
app.UseStaticFiles();          // before routing: cheap files never hit it
app.UseRouting();              // decides WHICH endpoint
app.UseCors();
app.UseAuthentication();       // who are you?     ─ must precede…
app.UseAuthorization();        // …are you allowed? ─ …this
app.MapControllers();          // innermost: the endpoint
```

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-pipeline-order.cs` | ★☆☆ | trace the onion and prove the in/out order |
| 02 | `02-short-circuit-and-branch.cs` | ★★☆ | maintenance mode, plus `UseWhen` branching |
| 03 | `03-exception-handling.cs` | ★★☆ | exceptions → status codes, without leaking secrets |
| 04 | `04-timing-and-onstarting.cs` | ★★★ | a `Server-Timing` header that actually arrives |
| 05 | `05-correlation-id.cs` | ★★☆ | per-request state in `HttpContext.Items` |
| 06 | `06-middleware-classes.cs` | ★★☆ | a class-based rate limiter, with DI in the right place |

Do the warm-ups and core in order. 04 is the one that teaches a bug you would
otherwise ship, so do it even if you skip the other stretch work.

---

**Stuck?** `cheatsheets/aspnetcore-api.md` (pipeline order, HttpContext, common middleware) · **Deep dive:** `guides/02-the-aspnetcore-request-pipeline.md` · **Self-check:** `quizzes/07-middleware-and-pipeline.md` · **Next:** `csbootcamp/15-mvc-controllers`
