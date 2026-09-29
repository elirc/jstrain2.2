# 08 · Controllers and Validation

Cover the answer, commit out loud, then reveal.

---

### Q1 — which base class

`Controller` or `ControllerBase` for a JSON API?

<details><summary>Answer</summary>

**`ControllerBase`.** `Controller` derives from it and adds view rendering
(`View()`, `ViewBag`, Razor), which an API never uses and which drags in the
view engine.

Both give you `Ok()`, `NotFound()`, `BadRequest()`, `CreatedAtAction()`, and
`ModelState`.
</details>

---

### Q2 — how are controllers found

You wrote a controller and never registered it. Why does it work?

<details><summary>Answer</summary>

`AddControllers()` scans the assembly for public classes that derive from
`ControllerBase` (or are named `…Controller`) and registers their actions.
`MapControllers()` then maps every discovered action into routing.

You never register controllers individually — which is also why a
`public` → `internal` change makes one silently disappear.
</details>

---

### Q3 — precedence

`[Route("api/books")]` on the class, with both `[HttpGet("count")]` and
`[HttpGet("{id}")]`. Which handles `/api/books/count`?

<details><summary>Answer</summary>

**`count`.** A **literal** segment is more specific than a parameter segment,
and more specific wins.

So it never tries to parse `"count"` as an id. An `{id:int}` constraint would
also have saved it, but the precedence rule holds without one.
</details>

---

### Q4 — the union type

Why does this compile?

```csharp
public ActionResult<Book> GetById(int id)
    => Books.Find(id) is { } b ? b : NotFound();
```

<details><summary>Answer</summary>

`ActionResult<T>` has implicit conversions **from `T`** and **from
`ActionResult`**, so both branches convert to the same type.

Returning a bare `T` means 200 with the value serialised — no `Ok()` wrapper
needed.
</details>

---

### Q5 — what the attribute switches on

Name four behaviours `[ApiController]` turns on.

<details><summary>Answer</summary>

1. Complex parameters inferred as `[FromBody]` without the attribute.
2. DataAnnotations validated **before** the action runs.
3. Automatic **400 + ProblemDetails** on validation failure — and **your
   action never executes**.
4. Attribute routing required (no conventional routes).

Plus automatic 400 on binding failures, like a missing required header.
</details>

---

### Q6 — the silent hole

You remove `[ApiController]` from a controller. Nothing fails to compile.
What just broke?

<details><summary>Answer</summary>

Validation stops being enforced. DataAnnotations only **record** failures into
`ModelState` — they never stop anything on their own. Without the attribute's
filter, the action runs with `Name = ""` and `Age = 999` and writes them to
your database.

You now owe `if (!ModelState.IsValid) return ValidationProblem();` in **every**
action, and `[FromBody]` becomes explicit again.

The scariest part is that it is a silent, compile-clean behaviour change.
</details>

---

### Q7 — why only one body

Why is a second `[FromBody]` parameter a startup error rather than a runtime
one?

<details><summary>Answer</summary>

The request body is a **single forward-only stream**. It cannot be
deserialised twice, so there is no runtime configuration that could make it
work — MVC detects it while building the action model and fails fast at boot.

If you need two things from a body, they belong in one DTO. Same reason
`[FromForm]` and `[FromBody]` cannot coexist on one action.
</details>

---

### Q8 — the identifier problem

Why does a header almost always need `[FromHeader(Name = "X-Tenant")]` while
a query parameter usually needs nothing?

<details><summary>Answer</summary>

`X-Tenant` is **not a valid C# identifier** — you cannot declare a parameter
called `X-Tenant`. The attribute bridges the wire name to the code name.

Query parameters are usually already legal identifiers, so inference works.
Whenever the two names differ, the attribute is how you say so.
</details>

---

### Q9 — the Location that lies

What's wrong with `Created($"/api/customers/{id}", customer)`?

<details><summary>Answer</summary>

It hard-codes the URL. Change `[Route("api/customers")]` to
`[Route("api/v2/customers")]` and the Location header now points at a **404** —
and nothing fails loudly, because nothing checks it.

`CreatedAtAction(nameof(GetById), new { id }, customer)` asks **routing** to
generate the URL, so it follows the rename. And `nameof` makes an action
rename a **compile** error instead of a runtime one.
</details>

---

### Q10 — see the action

What can an action filter see that middleware cannot?

<details><summary>Answer</summary>

**The bound action arguments** (`ctx.ActionArguments`), the action's identity
(`ctx.ActionDescriptor`), and the `IActionResult` it returned.

Middleware runs before model binding, so at that layer there is only a raw
`HttpContext` — no idea which action will run or what its parameters will be.

That is the whole reason filters exist alongside middleware.
</details>

---

### Q11 — filter short-circuit

How does an action filter skip the action?

<details><summary>Answer</summary>

**Assign `context.Result` and return without calling `next()`.**

```csharp
context.Result = new BadRequestResult();
return;
```

Assigning `Result` is what tells MVC "this is the response". Do **both** —
assign and call `next()` — and the action runs anyway, then throws when two
results compete.
</details>

---

### Q12 — the outer filter

An inner filter short-circuits. Does the outer filter's code after
`await next()` still run?

<details><summary>Answer</summary>

**Yes.** `await next()` returns normally, carrying the short-circuited result.

Filters nest like middleware, so an outer filter always gets its outbound
half — which is exactly why auditing and logging belong in the **outermost**
filter, where nothing can skip them.
</details>

---

### Q13 — ServiceFilter

Why `[ServiceFilter(typeof(Audit))]` rather than `[Audit]`?

<details><summary>Answer</summary>

`[ServiceFilter]` resolves the filter **from DI**, so it can take constructor
dependencies (a logger, a store, a clock).

A plain attribute filter is constructed by the runtime with attribute
arguments only — attribute arguments must be compile-time constants, so it
cannot receive services. `[TypeFilter]` is the middle ground: DI-activated but
not registered in the container.

Requirement: the filter type must be registered (`AddScoped<Audit>()`).
</details>

---

### Q14 — filter order

Two filters, both default `Order`. What decides which is outer, and why pin
it?

<details><summary>Answer</summary>

Scope precedence: **global → controller → action**, and within the same scope,
declaration order.

Pin `Order` explicitly because that fallback is invisible and changes the day
someone adds a third filter or moves one to the controller. Lower `Order` runs
**first** (outermost). It costs nothing to be explicit.
</details>

---

### Q15 — thin controllers

Why is business logic in an action a problem, if it works?

<details><summary>Answer</summary>

Because it can only be tested **through HTTP**. Logic in an injected service
is a plain method you can call from a plain test — no server, no routing, no
serialisation, no ports.

A controller's job is to translate HTTP into method calls and outcomes into
status codes. When `store.Find(id)` returns `Customer?` and `store.Remove(id)`
returns `bool`, each action stays one line — and a service designed so its
results map cleanly onto HTTP is what keeps it that way.
</details>
