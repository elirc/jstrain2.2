# Flight plan — C# / .NET for web development

A worked order for all 29 modules, sized in hours. The route is deliberately
**not** 01→02→03: it goes just deep enough into the language to write ASP.NET
Core confidently, spends the bulk of its time on the web stack, and comes back
for the rest of the language afterwards — because that is the stated goal of
this track.

Total: **~62 hours** of focused work, 1,292 tests across 147 exercises.

You do not have to do all of it. Legs 0–2 are ~21 hours and get you to
"competent at ASP.NET Core". Everything after that is depth.

---

## Leg 0 · Preflight (10 min)

```bash
dotnet --version                                    # expect 10.x
dotnet run csbootcamp/_lib/example/smoke.cs         # expect 13 passed · 1 todo
```

The smoke test exercises the whole harness including a live Kestrel server. If
it is green, everything in the track will run.

Then read [`_lib/FORMAT.md`](_lib/FORMAT.md) — 5 minutes, and it tells you
what every file you are about to open looks like and why.

---

## Leg 1 · Enough language to be dangerous (~5.5 h)

You do not need all of C# to write a good API. You need these three.

| Module | Time | Why it's on the critical path |
| --- | --- | --- |
| `01-csharp-language-core` | 2 h | Value vs reference semantics, nullability, and `TryParse` + `InvariantCulture` at the request boundary. Every model-binding bug traces back here. |
| `02-methods-and-parameters` | 1.5 h | Delegates and closures — an ASP.NET endpoint *is* a delegate, and middleware *is* a closure over `next`. Deferred iterators set up EF's `IQueryable`. |
| `08-async-await` | 2 h | Leg 2 uses `async` on almost every line. Concurrency, cancellation tokens, the exception pitfalls, and async streams. |

**Do not skip:** `01/03` (value vs reference), `01/07` (parsing input),
`02/03` (delegates and closures), `02/06` (deferred iterators),
`08/02` (cancellation), `08/03` (async exception pitfalls).

If you already know C#, skim the two module READMEs, do those four exercises
cold, and move on.

---

## Leg 2 · The web stack (~15 h) — the main event

| Module | Time | What you come away with |
| --- | --- | --- |
| `13-minimal-apis` | 2.5 h | Routing, binding, status codes, typed results, groups, filters, and a complete CRUD resource. |
| `14-middleware-pipeline` | 2 h | The onion model, short-circuiting, exception handling that doesn't leak secrets, `OnStarting`, per-request state. |
| `15-mvc-controllers` | 2 h | The same machinery as controllers — which is what most existing codebases use. `[ApiController]`, binding attributes, action filters. |
| `16-validation-and-binding` | 1.5 h | Data annotations and what actually runs them, custom validators, binding your own types, and a reusable validation filter. |
| `17-ef-core-fundamentals` | 2 h | `DbContext`, `IQueryable` vs `IEnumerable`, change tracking, and EF behind real endpoints with DTOs. |
| `18-ef-core-relationships` | 2 h | Navigation properties, `Include` vs projection, and the N+1 problem measured with a real query counter. |
| `19-auth-and-security` | 2 h | Password hashing, JWTs, 401 vs 403, authorization policies, and the OWASP #1 vulnerability. |
| `21-testing-web-apps` | 1.5 h | Seams and fakes, injecting the clock, and endpoint tests that swap a service through DI. |

**The seven exercises that matter most in this leg**, if you are short on time:

1. `13/07-crud-resource` — the shape of every REST endpoint you will write,
   including the PATCH semantics almost everyone gets wrong the first time.
2. `14/03-exception-handling` — the difference between a helpful error and a
   security incident.
3. `15/03-apicontroller-conventions` — two controllers, one attribute apart,
   and a whole class of validation bug.
4. `16/04-validation-over-http` — proves minimal APIs validate *nothing* by
   default, then builds the filter that fixes it for every DTO.
5. `17/04-ef-behind-an-api` — DI lifetimes, projections, and the entity/DTO
   boundary, all at once.
6. `18/03-the-n-plus-1-problem` — the most common performance bug in ORM
   code, made visible by counting the queries rather than describing it.
7. `19/05-broken-access-control` — the most common serious vulnerability in
   real APIs, and the one that survives every review that only asks "is this
   endpoint authenticated?"

---

## Leg 3 · Production concerns (~8 h)

Everything in leg 2 works on your laptop. This is what it takes to survive
contact with traffic.

| Module | Time | What you come away with |
| --- | --- | --- |
| `12-dependency-injection` | 2 h | Lifetimes, disposal ownership, factories and `Func<T>`, and moving container failures to startup with `ValidateOnBuild`. |
| `20-caching-and-performance` | 2 h | `IMemoryCache`, expiration, cache keys, the distributed cache, and output caching — including the two caching bugs that are security incidents. |
| `22-configuration-and-hosting` | 2 h | Providers and precedence, options validation at startup, environments, and hosted-service ordering. |
| `23-api-capstones` | 2 h | Three complete APIs. No new mechanism — the difficulty is making everything above agree with itself in one file. |

The capstones are the point of the track. If you do nothing else after leg 2,
do `23/01`.

---

## Leg 4 · The rest of the language (~14 h)

Now that you have written real code, these land differently — every one of
them is something you have already needed.

| Module | Time | Why now rather than earlier |
| --- | --- | --- |
| `03-collections` | 1.5 h | You have picked a container badly by now, and know it. Also comparers, and mutating a collection you are iterating. |
| `04-linq-mastery` | 2 h | Deferred execution finally means something, because you have seen `IQueryable` do it against a database. Then paging, the four classic pitfalls, and writing your own operator. |
| `05-classes-records-structs` | 2 h | You have written a dozen DTOs. This is why they are records — plus struct copying, the equality contract, and operators on a domain type. |
| `06-interfaces-and-generics` | 2 h | Constraints, variance, explicit implementation, and `static abstract` / generic math. |
| `07-nullability-and-errors` | 2 h | NRT annotations, exceptions vs results, disposal, accumulating validation, and guarding invariants. |
| `09-pattern-matching` | 1.5 h | Switch expressions, list and tuple patterns, exhaustiveness, and arm order as behaviour. |
| `10-strings-and-regex` | 1.5 h | Spans, regex, formatting, culture and Unicode. Culture bugs are the ones that only fail in production. |
| `11-json-and-serialization` | 1.5 h | `System.Text.Json` in depth: converters, naming, polymorphism, tolerant contracts. |

Work them in any order. None of them depends on another.

---

## Leg 5 · Reinforcement (~8.5 h)

Different shape from everything before it: no stubs to fill.

| Module | Time | What it drills |
| --- | --- | --- |
| `24-debug-hunts` | 1.5 h | **Ships red.** Complete, plausible, wrong code. Find the language bug. |
| `25-web-debug-hunts` | 1 h | **Ships red.** Bugs that only exist because there is a request pipeline. |
| `26-security-hunts` | 1 h | **Ships red.** Vulnerabilities that pass code review precisely *because* the obvious controls are present. |
| `27-sql-and-data` | 1 h | Raw SQL when the ORM is the wrong tool, parameterisation, transactions. |
| `28-http-client-resilience` | 1 h | `HttpClient` lifetime, timeouts, retries, and calling other people's flaky services. |
| `29-write-the-test` | 3 h | Inverted: the implementations are given — some right, several subtly wrong — and you write the test that tells them apart. Six files on what makes a test good: boundaries, over-specification, diagnostics, properties, and flakiness. |

The hunts are the highest-value hours in the track per minute spent, because
finding a bug in working-looking code is the actual job, and nothing else here
practises it.

---

## Leg 6 · Consolidation (~2 h)

1. **Re-run cold.** `dotnet run csbootcamp/progress.cs` and redo any exercise
   you needed the solution for. Reconstructing from memory is the rep that
   sticks.
2. **Read the guides.** `guides/01-value-vs-reference-and-null.md` and
   `guides/02-the-aspnetcore-request-pipeline.md`.
3. **Say the quizzes out loud.** `quizzes/` — recall, not recognition.
4. **Build something small unaided.** A URL shortener: POST a URL, get a
   short code, GET the code and redirect. It needs routing, binding, status
   codes, a store behind DI, and EF if you want persistence — the whole of
   leg 2 in about 60 lines. Nothing in this repo grades it; that is the point.

---

## Pace

| If you have | Do |
| --- | --- |
| One evening (3 h) | Leg 0, then `13-minimal-apis` end to end |
| A weekend (21 h) | Legs 0–2 |
| A week, an hour a night | One module per night; legs 0–3 in two weeks |
| Whatever it takes | All six legs, ~62 h |

Two hours of writing code beats six of reading. Every module README is ~10
minutes; the rest of the time is meant to be spent in the exercise files.

`docs/ROADMAP.md` has the full status table — every module, its exercise count
and its test count.
