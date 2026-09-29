# 13 · Minimal APIs

This is where the C# track becomes a web track. A minimal API is a route
template plus a delegate — no controller, no attributes, no base class — and
it is now the default shape for new .NET HTTP services. Everything you learn
here about routing, binding and results carries over unchanged to MVC
controllers in module 15; the only thing that changes is where the code sits.

Every exercise in this module starts a **real Kestrel server** on a random
loopback port and talks to it over **real HTTP**. Nothing is mocked. If a
status code is wrong here, it is wrong in production.

## The mental model

**1. An endpoint is a template, a verb, and a delegate.**

```csharp
app.MapGet("/items/{id:int}", (int id) => $"item {id}");
```

The return value decides the response body and content type. A `string` goes
out as `text/plain`; anything else is serialised to JSON (camelCase); an
`IResult` describes the response explicitly.

**2. Parameters bind by name and by type, in a fixed order.**

| The parameter… | comes from |
| --- | --- |
| matches a `{placeholder}` in the template | the route |
| is a simple type (`int`, `string`, `Guid`, `DateTime`…) | the query string |
| is a registered DI service | the container |
| is `HttpContext`, `ClaimsPrincipal`, `CancellationToken` | the framework |
| is anything else (a class or record) | the JSON body |

No attributes required. `[FromQuery]`, `[FromBody]` etc. exist for the cases
where you need to override this, not for the normal path.

**3. Routing failure and binding failure are different.**

`/items/abc` against `/items/{id:int}` is a **404** — the route constraint is
part of matching, so no endpoint was found. `?limit=lots` against
`int limit` is a **400** — the route matched, then conversion failed. Neither
is a 500 and neither needs a `try`/`catch` from you.

**4. `TypedResults` keeps the type; `Results` throws it away.**

```csharp
Results<Ok<Item>, NotFound> GetItem(int id) => …   // compiler-checked union
```

Returning anything outside the declared union is a compile error, OpenAPI can
describe the endpoint without hand-written `.Produces<T>()`, and — best of all
— you can unit test the handler without starting a server.

**5. Groups factor out everything a set of endpoints shares.**

```csharp
var v2 = app.MapGroup("/api/v2");
v2.AddEndpointFilter(RequireApiKey);   // covers every endpoint in the group
```

Filters attached to a group cover endpoints added *after* the filter and
inside nested groups. A filter that returns without awaiting `next(ctx)`
short-circuits the handler entirely — that is how it can enforce auth.

## The details that bite

1. **Returning `string` gives text/plain, not JSON.** A client calling
   `response.json()` on `pong` fails. Wrap it (`Results.Ok(new { … })`) if you
   meant JSON.

2. **An empty collection is `200 []`, never 404.** 404 means the resource
   does not exist. A list with nothing in it exists.

3. **`Results.Created(uri, value)` sets the Location header.**
   `Results.Ok(value)` on a create loses it — clients then have to guess
   where the new resource lives.

4. **PATCH needs nullable DTO members.** With `bool Done`, an absent field
   deserialises to `false` and your PATCH silently un-completes tasks. With
   `bool? Done`, absent is `null` and `patch.Done ?? existing.Done` keeps it.

5. **Separate the DTO you accept from the one you return.** One shared type
   lets a client POST its own `Id` — or, in a bigger app, its own `IsAdmin`.
   Two records, two lines, whole class of bug gone.

6. **DI lifetime is the #1 production bug.** A singleton holding per-user
   state serves one user's data to everyone. Per-request state is `Scoped`.
   Resolving a scoped service twice in one request gives the *same* object;
   a transient gives two.

7. **`{*path}` is a catch-all** that keeps slashes; plain `{path}` matches one
   segment.

8. **Values arrive URL-decoded.** Decoding again turns `100%25` into `100%`
   and then breaks on the next pass.

## Status code cheat table

| Situation | Code | Helper |
| --- | --- | --- |
| Read succeeded | 200 | `Results.Ok(value)` |
| Created a resource | 201 | `Results.Created(uri, value)` |
| Succeeded, nothing to say | 204 | `Results.NoContent()` |
| Client sent something invalid | 400 | `Results.BadRequest()` / `ValidationProblem` |
| Not authenticated | 401 | `Results.Unauthorized()` |
| Authenticated, not allowed | 403 | `Results.Forbid()` |
| No such resource | 404 | `Results.NotFound()` |
| Route exists, verb doesn't | 405 | automatic |
| State conflict (duplicate) | 409 | `Results.Conflict()` |
| Body wasn't JSON | 415 | automatic |
| Anything else | any | `Results.StatusCode(n)` |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-first-endpoints.cs` | ★☆☆ | four routes, four response shapes; 404 vs 405 |
| 02 | `02-route-and-query-binding.cs` | ★★☆ | route params, query defaults, catch-all, 404 vs 400 |
| 03 | `03-json-body-and-post.cs` | ★★☆ | POST with a record DTO, 201 + Location, 415 |
| 04 | `04-typed-results.cs` | ★★☆ | `Results<Ok<T>, NotFound>` and ProblemDetails |
| 05 | `05-route-groups.cs` | ★★☆ | versioned groups and an api-key endpoint filter |
| 06 | `06-services-in-endpoints.cs` | ★★☆ | singleton vs scoped vs transient, proved over HTTP |
| 07 | `07-crud-resource.cs` | ★★★ | the whole resource: GET/POST/PUT/PATCH/DELETE |

Do the warm-ups and core in order. 07 is the one to come back to — it is the
shape of every REST endpoint you will write, and the PATCH semantics catch
most people the first time.

---

**Stuck?** `cheatsheets/aspnetcore-api.md` (routing, binding, results, status codes) · **Deep dive:** `guides/02-the-aspnetcore-request-pipeline.md` · **Self-check:** `quizzes/06-aspnetcore-basics.md` · **Next:** `csbootcamp/14-middleware-pipeline`
