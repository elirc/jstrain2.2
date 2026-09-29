# ASP.NET Core — offline reference

Covers modules 13–15: routing, binding, results, middleware, controllers,
filters.

## Wiring

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<IThing, Thing>();
builder.Services.AddControllers();          // only if using controllers
var app = builder.Build();

app.UseExceptionHandler();                  // pipeline (see order below)
app.MapGet("/ping", () => "pong");          // minimal API
app.MapControllers();                       // controllers
app.Run();
```

## Status codes

| Situation | Code | Minimal API | Controller |
| --- | --- | --- | --- |
| Read OK | 200 | `Results.Ok(v)` / return `v` | `Ok(v)` / return `v` |
| Created | 201 | `Results.Created(uri, v)` | `CreatedAtAction(nameof(Get), new { id }, v)` |
| Done, no body | 204 | `Results.NoContent()` | `NoContent()` |
| Bad input | 400 | `Results.BadRequest()` / `ValidationProblem()` | `BadRequest()` / `ValidationProblem()` |
| Not authenticated | 401 | `Results.Unauthorized()` | `Unauthorized()` |
| Not allowed | 403 | `Results.Forbid()` | `Forbid()` |
| No such thing | 404 | `Results.NotFound()` | `NotFound()` |
| Wrong verb | 405 | automatic | automatic |
| Duplicate / state clash | 409 | `Results.Conflict()` | `Conflict()` |
| Body wasn't JSON | 415 | automatic | automatic |
| Too many requests | 429 | `Results.StatusCode(429)` | `StatusCode(429)` |
| Anything | any | `Results.StatusCode(n)` | `StatusCode(n)` |

**404 vs 405:** unknown path → 404; known path, wrong verb → 405.
**404 vs 400:** `/items/abc` against `{id:int}` → **404** (route didn't match);
`?limit=lots` against `int limit` → **400** (route matched, binding failed).

An **empty collection is `200 []`**, never 404.

## Return values → response

| Handler returns | Response |
| --- | --- |
| `string` | 200 `text/plain` — **not** JSON |
| any object / record | 200 `application/json`, camelCase |
| `IResult` / `ActionResult` | whatever it describes |
| `Results<Ok<T>, NotFound>` | compiler-checked union of outcomes |

## Binding

| The parameter… | comes from |
| --- | --- |
| matches a `{placeholder}` | the route |
| is a simple type (`int`, `string`, `Guid`, `DateTime`) | the query string |
| is a registered DI service | the container |
| is `HttpContext`, `ClaimsPrincipal`, `CancellationToken` | the framework |
| is anything else (class/record) | the JSON body |

Controller attributes when inference isn't enough:

```csharp
[FromRoute] [FromQuery] [FromBody] [FromForm] [FromServices]
[FromHeader(Name = "X-Tenant")] string tenant   // header names aren't identifiers
```

**Max one `[FromBody]` per action** — the body is a single forward-only
stream. Two is a *startup* error.

JSON matching is **case-insensitive** in; responses go out **camelCase**.

## Route templates

```csharp
"{id:int}"          // constraint — part of MATCHING, so a miss is 404
"{slug}"            // one segment
"{*path}"           // catch-all, keeps slashes
"{id:int?}"         // optional
"count"             // literal — BEATS {id} in precedence
```

Common constraints: `int`, `long`, `guid`, `bool`, `datetime`, `alpha`,
`min(1)`, `max(100)`, `range(1,100)`, `length(5)`, `regex(...)`.

Values arrive **URL-decoded**. Do not decode again.

## Groups and filters (minimal APIs)

```csharp
var v2 = app.MapGroup("/api/v2");
v2.AddEndpointFilter(async (ctx, next) => {
    if (bad) return Results.Unauthorized();   // short-circuit: no next()
    return await next(ctx);
});
v2.MapGet("/items", …);              // covered by the filter
var admin = v2.MapGroup("/admin");   // → /api/v2/admin, also covered
```

Group filters cover endpoints added **after** the filter and inside **nested**
groups.

## Middleware

```csharp
app.Use(async (ctx, next) => {
    // inbound
    await next(ctx);
    // outbound
});
```

**The pipeline is an onion.** First registered = outermost = its *outbound*
code runs **last**.

| Need | Use |
| --- | --- |
| Always run, decide whether to continue | `app.Use` |
| Branch, then **rejoin** | `app.UseWhen(pred, branch => …)` |
| Branch, **terminal** (never rejoins) | `app.MapWhen(pred, branch => …)` |
| Terminal handler | `app.Run(ctx => …)` |
| Reusable class | `app.UseMiddleware<T>(args)` |

Short-circuit = write a response and **return without awaiting `next`**.

### Canonical order

```csharp
app.UseExceptionHandler();     // outermost — can only catch what's inside it
app.UseHttpsRedirection();
app.UseStaticFiles();          // before routing: cheap files skip it
app.UseRouting();
app.UseCors();
app.UseAuthentication();       // who are you?      ─ must precede…
app.UseAuthorization();        // …are you allowed?  ─ …this
app.MapControllers();          // innermost
```

### Headers go out before the body

Once one byte of body is written, headers are **read-only**. Set them on the
way *in*, or use `OnStarting` when the value isn't known until later:

```csharp
ctx.Response.OnStarting(() => {
    ctx.Response.Headers["Server-Timing"] = $"app;dur={sw.Elapsed.TotalMilliseconds:F2}";
    return Task.CompletedTask;
});
```

Check `ctx.Response.HasStarted` before changing the status in an error handler.

### Per-request state

`HttpContext.Items` — created fresh per request, discarded at the end. A
`static` field or singleton would be shared across concurrent requests.

## Middleware classes

```csharp
sealed class RateLimit(RequestDelegate next, int max) {
    public async Task InvokeAsync(HttpContext ctx, IScopedThing svc) { … }
}
```

Constructed **once**, for the app's lifetime:

- **Constructor → singleton dependencies only.**
- **Scoped services go on `InvokeAsync`** (a `DbContext` belongs here).

## Controllers

```csharp
[ApiController]
[Route("api/books")]
public class BooksController(IStore store) : ControllerBase {
    [HttpGet]              public ActionResult<IEnumerable<Book>> GetAll() => Ok(store.All());
    [HttpGet("{id:int}")]  public ActionResult<Book> GetById(int id)
        => store.Find(id) is { } b ? b : NotFound();
}
```

`ControllerBase`, not `Controller` (the latter adds view rendering).

### What `[ApiController]` switches on

- complex parameters inferred as `[FromBody]`
- DataAnnotations validated **before** the action
- automatic **400 + ProblemDetails**, and **your action never runs**
- attribute routing required

Without it you owe `if (!ModelState.IsValid) return ValidationProblem();` in
every action — annotations only *record* failures, they never stop anything.

### Validation annotations

`[Required]` `[MinLength(n)]` `[MaxLength(n)]` `[StringLength(n)]`
`[Range(a,b)]` `[EmailAddress]` `[Url]` `[RegularExpression(p)]`
`[Compare(nameof(Other))]`

## Action filters

```csharp
public class Audit(ILogger log) : IAsyncActionFilter {
    public async Task OnActionExecutionAsync(ActionExecutingContext ctx,
                                             ActionExecutionDelegate next) {
        // ctx.ActionArguments — the BOUND parameters
        // ctx.ActionDescriptor.RouteValues["action"] — the action name
        ctx.Result = new BadRequestResult();   // short-circuit; then DON'T call next
        var executed = await next();
        // executed.Result — what the action returned
    }
}

[ServiceFilter(typeof(Audit), Order = 1)]   // resolves from DI; pin Order
```

Filters nest like middleware: an **outer filter still gets its outbound half**
even when an inner one short-circuits.

## DI lifetimes

| Lifetime | One instance per | Use for |
| --- | --- | --- |
| `AddSingleton` | application | stateless helpers, caches — **must be thread-safe** |
| `AddScoped` | HTTP request | `DbContext`, per-request state |
| `AddTransient` | resolution | cheap stateless objects |

The #1 production bug: a singleton holding per-user state serves one user's
data to everyone. Resolving a **scoped** service twice in one request gives
the **same** object; a transient gives two.

You cannot resolve a scoped service from the root provider — use
`app.Services.CreateScope()`.

## ProblemDetails (RFC 7807)

```csharp
Results.Problem(title: "Invalid quantity", statusCode: 400);
TypedResults.BadRequest(new ProblemDetails { Title = …, Detail = …, Status = 400 });
ValidationProblem();   // controller: the shape [ApiController] generates
```

Content type `application/problem+json`, with an `errors` object keyed by
property name. Matching this shape means clients write one error handler.

## Never leak internals

```csharp
catch (Exception ex) {
    logger.LogError(ex, "…");                 // detail stays on the SERVER
    return Results.Problem("internal error"); // fixed string to the client
}
```

`ex.Message` can hold a connection string, a file path, or a password.
