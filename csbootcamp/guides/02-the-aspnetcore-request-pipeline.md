# The ASP.NET Core Request Pipeline

*Read when: a middleware runs in an order you didn't expect, a header you set
doesn't arrive, auth passes when it should fail, or you want to know what
`app.MapGet` actually built.*

Pairs with [`13-minimal-apis`](../13-minimal-apis/),
[`14-middleware-pipeline`](../14-middleware-pipeline/),
[`15-mvc-controllers`](../15-mvc-controllers/).

---

## 1. There is only one abstraction

An ASP.NET Core application is a single function:

```csharp
delegate Task RequestDelegate(HttpContext context);
```

That's it. A request comes in as an `HttpContext`, something happens, a
`Task` completes. Everything else — routing, authentication, MVC, static
files, your endpoints — is built by composing functions of that one shape.

A middleware is a function that takes the *next* `RequestDelegate` and
returns a new one:

```csharp
Func<RequestDelegate, RequestDelegate>
```

Which is why `app.Use` looks the way it does. When you write:

```csharp
app.Use(async (ctx, next) => {
    log("in");
    await next(ctx);
    log("out");
});
```

you are describing a function that wraps another function. Register three of
them and you have built one big `RequestDelegate` by nesting:

```
a( b( c( endpoint ) ) )
```

The pipeline is not a list that gets iterated. It is a **stack of closures
built once at startup**, and every request is one call into the outermost one.

That single fact explains almost everything else in this guide.

## 2. Why the order reverses

Because it is nesting, not iteration, the trace looks like this:

```
a-in → b-in → c-in → endpoint → c-out → b-out → a-out
```

The first middleware registered is the **outermost**, so its code *after*
`await next(ctx)` runs **last**. People expect "registered first, finishes
first" and get the opposite.

The practical rule that falls out:

> Anything that needs to see the **finished response** must be registered
> **early**.

Timing, logging, exception handling, response compression — all of them
observe the result, so all of them go near the top. Register your timing
middleware last and it measures only the endpoint, missing every other
middleware in the app.

And the security-relevant corollary:

> A middleware can only affect what is **nested inside** it.

`UseExceptionHandler()` is the first line of a real `Program.cs` because
anything registered above it is outside its `try`. An auth check registered
after your endpoints protects nothing.

## 3. Short-circuiting is just "don't call next"

There is no `Stop()`, no sentinel return value, no `ctx.Abort()` for the
normal case. To end a request early you write a response and return:

```csharp
app.Use(async (ctx, next) => {
    if (underMaintenance()) {
        ctx.Response.StatusCode = 503;
        await ctx.Response.WriteAsync("maintenance");
        return;                       // never calls next — the request ends
    }
    await next(ctx);
});
```

The inner functions are simply never invoked. The request then unwinds back
out through the middlewares that already ran, so **their outbound halves
still execute** — your logging middleware still logs the 503.

This is also why a middleware that forgets `await` is so destructive:

```csharp
next(ctx);                    // fire and forget
log(sw.ElapsedMilliseconds);  // runs immediately — measures nothing
```

The outbound code runs before the inner pipeline has finished. You get
timings of zero, logs with a status code nobody has set yet, and any
downstream exception becomes an unobserved task. The compiler warns (CS4014).
Believe it.

## 4. Branching: rejoin or don't

Two ways to run a sub-pipeline conditionally, and picking the wrong one is a
silent failure:

```csharp
app.UseWhen(pred, branch => branch.Use(…));   // runs the branch, then REJOINS
app.MapWhen(pred, branch => branch.Use(…));   // terminal — never rejoins
```

`UseWhen` is what you want when the branch *adds* something — a header, a
log line, a tenant lookup — and the request should still reach its endpoint.

`MapWhen` is for a completely separate sub-application: a health-check
endpoint, a legacy handler, a WebSocket branch. Nothing after it runs.

Reach for `MapWhen` when you meant `UseWhen` and your endpoint silently never
executes, usually producing an empty `200`. Nothing errors. Nothing logs.

## 5. Startup values are frozen

The pipeline is built **once**. Every lambda you pass captures whatever was in
scope at build time:

```csharp
var underMaintenance = config.GetValue<bool>("Maintenance");
app.Use(async (ctx, next) => {
    if (underMaintenance) { … }     // read ONCE, at startup, forever
    await next(ctx);
});
```

Flipping the config at runtime does nothing. The captured `bool` is a copy.

Capture something *invocable* instead — a `Func<bool>`, or better, resolve a
service per request:

```csharp
app.Use(async (ctx, next) => {
    var opts = ctx.RequestServices.GetRequiredService<IOptionsMonitor<Settings>>();
    if (opts.CurrentValue.UnderMaintenance) { … }
    await next(ctx);
});
```

This is precisely why `IOptionsMonitor<T>` exists alongside `IOptions<T>`:
`IOptions` is resolved once, `IOptionsMonitor` re-reads on change.

## 6. Headers go out before the body

This is HTTP, not a framework quirk. The response is:

```
HTTP/1.1 200 OK
Content-Type: application/json
X-Something: value
                      ← blank line: header block is now CLOSED
{"body":"here"}
```

The moment any body byte is written, the header block has been flushed and
the status code has been sent. Both are now immutable. So this fails:

```csharp
await next(ctx);
ctx.Response.Headers["X-Timing"] = "…";   // silently dropped, or throws
```

It is a nasty bug because it *works* when the handler wrote no body — a `204`,
an empty `404` — so it passes a casual smoke test and drops the header in
production, where responses have bodies.

The fix is a callback that fires in the narrow window after the endpoint has
run and before the bytes leave:

```csharp
ctx.Response.OnStarting(() => {
    ctx.Response.Headers["Server-Timing"] =
        $"app;dur={sw.Elapsed.TotalMilliseconds:F2}";
    return Task.CompletedTask;
});
```

Note what that measures: **time to first byte**, not total request time,
because the callback fires before the body is written. For a large streamed
response those are very different numbers.

The same rule governs error handling. If an exception happens after the
response started, you cannot turn it into a 500 — the 200 is already on the
wire:

```csharp
catch (Exception ex) {
    logger.LogError(ex, "unhandled");
    if (ctx.Response.HasStarted) throw;   // too late; let the connection abort
    ctx.Response.StatusCode = 500;
    await ctx.Response.WriteAsJsonAsync(new { error = "internal error" });
}
```

Skip the `HasStarted` check and you throw a second, more confusing exception
on top of the first — and lose the original.

## 7. Errors: what you may say

Turning exceptions into responses is a middleware concern, and the shape is
always the same: map the **type** to a status code.

```csharp
var (status, message) = ex switch {
    NotFoundException   => (404, "not found"),
    ValidationException => (400, ex.Message),   // YOU wrote this message
    _                   => (500, "internal error"),
};
```

The `_` arm is the security boundary. A `ValidationException`'s message was
written by you, for a user to read, so echoing it is fine. An arbitrary
exception's message was written by a library and may contain a connection
string, a file path, a SQL fragment, or a password. Log it; never send it.

The general design worth taking away: throw meaningful exceptions deep in
domain code, and let **one place at the edge** decide what they mean over
HTTP. The alternative — threading result objects up through every layer —
works too, but it puts HTTP concerns in code that should not know HTTP exists.

## 8. Where routing sits

`UseRouting` is a middleware like any other, and it splits the pipeline into
"before we know the endpoint" and "after":

```
UseExceptionHandler   ─┐
UseStaticFiles         │  no endpoint known yet
UseRouting            ─┘  ← endpoint SELECTED here
UseAuthentication      ┐
UseAuthorization       │  endpoint known: its metadata is readable
MapControllers        ─┘  ← endpoint EXECUTED here
```

That gap is the point. `UseAuthorization` can read the `[Authorize]` metadata
on the selected endpoint precisely because routing already chose it but has
not run it yet.

It also explains the coupling everyone memorises without knowing why:

- **`UseAuthentication` must precede `UseAuthorization`.** The first
  establishes *who you are* by populating `HttpContext.User`; the second reads
  that to decide *what you may do*. Reversed, every request looks anonymous.
- **`UseStaticFiles` before `UseRouting`.** A request for `/logo.png` is
  served and short-circuited without paying for endpoint matching at all.

And it is why **middleware sees requests that match no endpoint**. A 404 for
an unknown path is generated at the end of the pipeline and travels back out
through every middleware, which is how your correlation-id middleware
decorates a 404. An *endpoint filter* cannot do that — there is no endpoint.

## 9. Routing failure vs binding failure

Two stages, two status codes, and confusing them costs an afternoon:

| Request | Against | Result | Why |
| --- | --- | --- | --- |
| `/items/abc` | `/items/{id:int}` | **404** | the constraint is part of *matching*; no endpoint found |
| `/search?limit=lots` | `int limit` | **400** | route matched, then *binding* failed |
| `POST /ping` | `MapGet("/ping")` | **405** | path matched, verb didn't |

None of these needs a `try`/`catch` from you, and writing your own
`int.TryParse` in a handler to "improve" the second one strictly makes things
worse: you turn a free, correctly-shaped 400 into a hand-rolled one.

## 10. Filters: middleware that can see the action

Endpoint filters (minimal APIs) and action filters (MVC) sit *inside* routing,
which is what gives them the thing middleware cannot have: **the bound
arguments**.

```csharp
public async Task OnActionExecutionAsync(ActionExecutingContext ctx,
                                         ActionExecutionDelegate next) {
    ctx.ActionArguments["id"]                       // the BOUND parameter
    ctx.ActionDescriptor.RouteValues["action"]      // which action
    var executed = await next();
    executed.Result                                 // what it returned
}
```

Middleware runs before model binding, so at that layer there is only a raw
`HttpContext`. If your cross-cutting concern needs to know *which action* or
*what its arguments were*, it has to be a filter.

Everything else is identical to middleware: same in/next/out shape, same
nesting, same short-circuit semantics — except that a filter short-circuits by
assigning `ctx.Result` rather than by writing to the response:

```csharp
ctx.Result = new BadRequestResult();
return;                                 // and do NOT also call next()
```

Doing both runs the action anyway and then throws when two results compete.

And the nesting rule holds here too: **an outer filter always gets its
outbound half**, even when an inner filter short-circuits. Which is exactly
why auditing belongs in the outermost filter, where nothing can skip it.

## 11. Built once, invoked many

Everything in this guide traces back to one distinction:

| Built **once**, at startup | Created **per request** |
| --- | --- |
| the middleware chain | `HttpContext` |
| middleware class instances | `HttpContext.Items` |
| endpoint delegates and routes | the DI **scope** |
| captured lambda values | scoped services (`DbContext`) |
| singleton services | |

Which is why a conventional middleware class:

```csharp
sealed class RateLimit(RequestDelegate next, int max) {
    public async Task InvokeAsync(HttpContext ctx, IScopedThing svc) { … }
}
```

takes **singletons in the constructor** (it is constructed once) and **scoped
services on `InvokeAsync`** (which is called per request). Put a `DbContext`
in that constructor and you capture the first request's instance and hand it
to every request forever: `ObjectDisposedException` if you are lucky,
cross-request data bleed if you are not.

It is also why a singleton needs to be thread-safe. It is touched by many
requests concurrently, so a plain `Dictionary` in a singleton is a corruption
waiting to happen — lock it, or use `ConcurrentDictionary`.

And it is why per-request state goes in `HttpContext.Items` rather than a
static field. A static is shared by every in-flight request; `Items` is born
and dies with one.

---

## The short version

1. A middleware is a closure over `next`; the pipeline is a stack of them,
   built once.
2. First registered = outermost = its outbound code runs last.
3. Short-circuit by not calling `next`. Outer middlewares still unwind.
4. `UseWhen` rejoins; `MapWhen` is terminal.
5. Captured values are frozen at startup. Capture a delegate or resolve a
   service for anything that changes.
6. Headers precede the body. Set them on the way in, or use `OnStarting`.
7. Map exception *types* to status codes at the edge, and never echo an
   arbitrary `ex.Message`.
8. `UseRouting` selects; the endpoint executes later. Auth lives in the gap,
   authentication before authorization.
9. Routing failure is 404, binding failure is 400, wrong verb is 405.
10. Filters see the bound arguments; middleware does not.
11. Built-once vs per-request decides where every dependency belongs.
