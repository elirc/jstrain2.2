# 15 · MVC Controllers

Controllers are the older, heavier, and still overwhelmingly common way to
write an ASP.NET Core API. Everything underneath — routing, binding, results —
is the machinery from modules 13 and 14. What controllers add is *grouping*:
related endpoints share a class, a route prefix, a set of filters, and a
constructor full of injected services.

Most existing .NET codebases you join will be controllers. Read this module
as "the same thing, arranged differently", not as a new framework.

## The mental model

**1. Two lines wire the whole thing up.**

```csharp
builder.Services.AddControllers();   // register MVC's services
app.MapControllers();                // map every discovered action
```

Controllers are found by scanning the assembly for public classes deriving
from `ControllerBase` (or named `…Controller`). You never register them
individually.

Use `ControllerBase`, not `Controller` — the latter adds view rendering, which
an API does not need.

**2. Route templates compose: class prefix + action template.**

```csharp
[Route("api/books")]           // on the class
public class BooksController : ControllerBase {
    [HttpGet("count")]         // → GET /api/books/count
    [HttpGet("{id:int}")]      // → GET /api/books/42
}
```

Precedence: **a literal segment beats a parameter segment.** So
`/api/books/count` reaches `Count()` and never tries to parse `"count"` as an
id.

**3. `ActionResult<T>` is a union of "the value" and "a result".**

```csharp
public ActionResult<Book> GetById(int id)
    => Books.Find(id) is { } b ? b : NotFound();   // both legal
```

Returning a bare `T` means 200 with the value serialised. No `Ok()` wrapper
needed.

**4. `[ApiController]` is a behaviour switch, not decoration.**

It turns on:

- complex parameters inferred as `[FromBody]` without the attribute
- DataAnnotations validation running **before** the action
- automatic **400 + ProblemDetails** when validation fails — *the action never
  runs*
- attribute routing required

Without it, `if (!ModelState.IsValid) return ValidationProblem();` is mandatory
in every action, because annotations only *record* failures — they never stop
anything by themselves.

**5. Filters are middleware that can see the action.**

```csharp
public async Task OnActionExecutionAsync(ActionExecutingContext ctx,
                                         ActionExecutionDelegate next) {
    // ctx.ActionArguments — the BOUND parameters (middleware can't see these)
    var executed = await next();
    // executed.Result — what the action returned
}
```

Assigning `ctx.Result` before `next()` short-circuits: the action is skipped
and your result is used instead.

## Binding sources

| Attribute | Reads from | When you need it |
| --- | --- | --- |
| `[FromRoute]` | a `{placeholder}` | rarely — inferred |
| `[FromQuery]` | `?key=value` | rarely — inferred |
| `[FromBody]` | the request body | inferred under `[ApiController]`; **max one per action** |
| `[FromHeader(Name="X-Tenant")]` | a header | always — header names aren't valid identifiers |
| `[FromForm]` | a form field | always — different wire format from JSON |
| `[FromServices]` | DI | rarely — inferred |

## The details that bite

1. **Only one `[FromBody]` per action.** The body is a single forward-only
   stream. Two is a *startup* error, not a runtime one. Need two things? One
   DTO.

2. **`[ApiController]` means your action never sees invalid input** — so stop
   writing the ModelState check. Remove the attribute and you silently owe
   that check again in every action.

3. **Use `CreatedAtAction(nameof(GetById), new { id }, entity)`,** not a
   hand-built URL string. String concatenation survives a `[Route]` rename and
   then serves a Location header that 404s — with nothing failing loudly.
   `nameof` makes an action rename a compile error.

4. **`[ServiceFilter]` resolves the filter from DI**; a bare attribute filter
   cannot take constructor dependencies.

5. **Pin filter `Order` explicitly.** Same-order filters fall back to scope
   precedence (global → controller → action), which quietly changes the day
   someone adds a third filter.

6. **A short-circuiting filter must not also call `next()`.** Doing both runs
   the action anyway and then throws when two results compete.

7. **An outer filter always gets its outbound half,** even when an inner one
   short-circuits — which is why auditing belongs in the outermost filter.

8. **Keep controllers thin.** They translate HTTP to method calls and back.
   Business logic in an injected service is testable without HTTP; business
   logic in an action is not.

## Minimal API ↔ controller

| Minimal API | Controller |
| --- | --- |
| `app.MapGet("/x", handler)` | `[HttpGet("x")]` on an action |
| `app.MapGroup("/api")` | `[Route("api")]` on the class |
| `Results.Ok(v)` | `Ok(v)` or just `return v;` |
| `Results<Ok<T>, NotFound>` | `ActionResult<T>` |
| `.AddEndpointFilter(f)` | `IAsyncActionFilter` |
| handler parameter from DI | constructor injection |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-first-controller.cs` | ★☆☆ | a BooksController; route precedence and 405 |
| 02 | `02-binding-sources.cs` | ★★☆ | route/query/header/body/form, and when to be explicit |
| 03 | `03-apicontroller-conventions.cs` | ★★☆ | strict vs loose: what `[ApiController]` really does |
| 04 | `04-action-filters.cs` | ★★☆ | an audit filter and a short-circuiting one |
| 05 | `05-controller-crud.cs` | ★★★ | thin CRUD over an injected store, with `CreatedAtAction` |

Do the warm-ups and core in order. 03 is the one to be sure of — the
difference between the two controllers is a single attribute and a whole class
of validation bug.

---

**Stuck?** `cheatsheets/aspnetcore-api.md` (controllers, binding attributes, filters) · **Deep dive:** `guides/02-the-aspnetcore-request-pipeline.md` · **Self-check:** `quizzes/08-controllers-and-validation.md` · **Next:** `csbootcamp/16-validation-and-binding`
