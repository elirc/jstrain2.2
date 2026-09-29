# 25 · Web Debug Hunts

**These exercises ship broken.** Red on the first run, by design. No stubs —
the code is complete, plausible ASP.NET Core, and wrong.

Where module 24 planted language bugs, these are the ones that only exist
because there is a *request pipeline*: things that work when you click around
by hand and fail under real traffic, or work on one endpoint and not another.

## How to work these

1. **Read which tests PASS.** In both hunts here the passing tests are the
   hint: the bug is in whatever they do differently.
2. **Predict, then run.** Changing things until green teaches nothing.
3. **Smallest fix.** Both bugs are one line — one of them is one *word*.
4. **Name the bug class** when you are done. The shape transfers; the file
   does not.

## The bug classes in this module

| # | file | Class |
| --- | --- | --- |
| 01 | `01-the-header-that-never-arrives.cs` | writing a response header after the response started |
| 02 | `02-the-tenant-leak.cs` | per-request state in a singleton |

## Why these two

**01 works on the health check.** `204 No Content` has no body, so nothing
was flushed and the late header assignment still lands. Every endpoint that
returns data has already sent its header block. The developer tests
`/health`, sees the header, and ships — which is exactly how this reaches
production.

**02 works when you click around.** It needs *concurrency* to appear, and a
development machine has none. When it does appear the symptom is not a
crash: it is one customer seeing another customer's data. Note also that DI
scope validation will **not** catch it — a singleton depending on nothing is
a perfectly legal graph. Only the lifetime is wrong.

## A testing lesson hiding in 02

The concurrency test is the **symptom** and is inherently probabilistic —
with the bug present it almost always fails, but "almost always" is not a
test. The last test is the **proof**: two DI scopes must resolve two
different instances, and with a singleton they never will.

When you write a test for a concurrency bug, find the structural assertion.
An earlier draft of this file had a third test asserting all twenty responses
were distinct — it passed by luck even with the bug present, and was removed
for exactly that reason.

## Recognising these in the wild

- **`ctx.Response.Headers[...] = ...` after `await next(ctx)`.** Same for
  `StatusCode` — which is why an exception handler must check
  `Response.HasStarted` (module 14/03). Use `Response.OnStarting`.
- **Any service holding request-specific state** — a tenant, a user, a
  correlation id, a `DbContext` — registered as a singleton. Per-request
  state belongs in `Scoped`, or in `HttpContext.Items` (module 14/05).

---

**No "Stuck?" line here, on purpose** — deciding which module explains the mechanism, and going to find it, is the retrieval this module trains. · **Next:** `csbootcamp/26-security-hunts`
