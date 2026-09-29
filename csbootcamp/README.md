# C# / .NET Bootcamp — offline, test-graded, self-paced

The C# sibling of the JS track in this repo, weighted heavily toward **web
development with ASP.NET Core**. Same philosophy: every exercise is a single
self-contained file, graded by its own tests, runnable with nothing but the
.NET SDK. No test runner to install, no IDE, no internet.

**Start here → [`FLIGHTPLAN.md`](FLIGHTPLAN.md)** — what to do, in what order.

## Quick start (30 seconds)

```bash
dotnet run csbootcamp/01-csharp-language-core/exercises/01-fizzbuzz-range.cs
dotnet run csbootcamp/progress.cs 13        # scoreboard for one module
```

.NET 10 runs a single `.cs` file directly, so the workflow is exactly the JS
track's `node file.js`. An exercise is a prompt in comments, a method that
throws `NotImplementedException`, and tests underneath. Write the code, re-run
the file until:

```
  ✔ maps a plain number to its string
  ✔ replaces multiples of 3 with Fizz
  ✔ covers an inclusive range

  7 passed
  all green — next file!
```

(`☐ todo` = not written yet · `✘` = failing · `✔` = done.)

First run of a file compiles it (~2–6s); re-runs are ~1s.

## Requirements

- **.NET 10 SDK** (`dotnet --version` → 10.x). That is the whole list.
- Most modules need **zero NuGet packages** — ASP.NET Core ships in the
  shared framework.
- The EF Core, JWT and SQL modules (17, 18, 19, 23, 27) pin
  `Microsoft.EntityFrameworkCore.Sqlite` and
  `Microsoft.AspNetCore.Authentication.JwtBearer` to `10.0.11`, which resolve
  from the local package cache. Fully offline once restored.

## What's here

```
FLIGHTPLAN.md        ← the plan. Read it first.

  the language ─────────────────────────────────────────────────────────────
01-csharp-language-core/    types, value vs reference, null, ranges, equality
02-methods-and-parameters/  out/ref, delegates, extensions, iterators
03-collections/             choosing a container, dictionaries, mutation, cost
04-linq-mastery/            deferred execution, grouping, projection
05-classes-records-structs/ value semantics, records, `with`, immutability
06-interfaces-and-generics/ constraints, explicit implementation, variance
07-nullability-and-errors/  NRTs, exceptions vs results, failing loudly
08-async-await/             concurrency, cancellation, pitfalls, streams
09-pattern-matching/        switch expressions, property and list patterns
10-strings-and-regex/       spans, formatting, culture, compiled regex
11-json-and-serialization/  System.Text.Json, converters, naming, polymorphism
12-dependency-injection/    lifetimes, options, keyed services, factories

  the web ──────────────────────────────────────────────────────────────────
13-minimal-apis/            routing, binding, typed results, groups, CRUD
14-middleware-pipeline/     the onion, short-circuiting, errors, OnStarting
15-mvc-controllers/         attribute routing, [ApiController], filters
16-validation-and-binding/  annotations, custom validators, TryParse/BindAsync
17-ef-core-fundamentals/    DbContext, IQueryable, change tracking, DTOs
18-ef-core-relationships/   navigations, Include, and the N+1 problem
19-auth-and-security/       hashing, JWT, policies, broken access control
20-caching-and-performance/ IMemoryCache, output caching, stampedes
21-testing-web-apps/        seams, fakes, injected clocks, endpoint tests
22-configuration-and-hosting/ options binding, validation, hosted services
23-api-capstones/           three complete APIs, everything at once

  reinforcement ────────────────────────────────────────────────────────────
24-debug-hunts/             planted language bugs — ships red, no stubs
25-web-debug-hunts/         planted pipeline bugs — ships red, no stubs
26-security-hunts/          planted vulnerabilities — ships red, no stubs
27-sql-and-data/            raw SQL, parameterisation, transactions
28-http-client-resilience/  HttpClient lifetime, timeouts, retries
29-write-the-test/          inverted: the code is given, you write the test

_lib/                       the test harness (Check.cs, Web.cs) + FORMAT.md
docs/                       ROADMAP.md — the full status table
cheatsheets/                offline reference sheets
quizzes/                    rapid-fire recall, answers hidden
guides/                     long-form: the why behind the mechanisms
```

**29 modules, 147 exercises, 1,292 tests, 147 reference solutions.** Module
order is not the order to work in — the web modules come early on purpose, and
[`FLIGHTPLAN.md`](FLIGHTPLAN.md) has the route.

Each module: `README.md` (the lesson — read first), `exercises/` (yours),
`solutions/` (reference implementations with teaching walkthroughs — peek only
after a real attempt).

## The web modules use a real server

Every ASP.NET Core exercise starts a **real Kestrel server** on a random
loopback port and talks to it over **real HTTP**. Nothing is mocked — no
`WebApplicationFactory`, no `TestServer`, no test-only abstractions. If a
status code is right here, it is right in production.

```csharp
await using var app = await Web.Serve(a => a.MapGet("/ping", () => "pong"));
Eq(await app.Client.GetStringAsync("/ping"), "pong");
```

## Tools

| Command | What it does |
| --- | --- |
| `dotnet run csbootcamp/progress.cs` | scoreboard for the whole track |
| `dotnet run csbootcamp/progress.cs 13` | one module (much faster — use this) |
| `dotnet run csbootcamp/verify.cs` | maintainer check: every file in contract |
| `dotnet run csbootcamp/verify.cs 17` | same, one module |
| `dotnet run csbootcamp/_lib/example/smoke.cs` | prove the harness itself works |

## The harness

`_lib/Check/` is ~400 lines and has no dependencies:

- `Test(name, fn)` — accepts sync or async; auto-reports at exit
- `Eq` — deep and structural, so `Eq(list, new[] { 1, 2, 3 })` just works
- `Ok`, `NotNull`, `Throws<T>`, `ThrowsAsync<T>`, `Approx`, `Sleep`
- `Spy<T>`, `Spy<T,TResult>`, `Spy0` — call recorders
- `Web.Serve(...)` → a `ServedApp` with `.Client`, `.GetBody`, `.GetStatus`,
  `.PostJson`, `.PutJson`, `.PostForm`, `.Send`

`throw new NotImplementedException()` is the TODO marker — it is what every
IDE generates for a stub, and the harness reports it as `☐ todo` rather than a
failure. That works inside request handlers too: the harness catches it on the
server and replays it on the test thread, so an unwritten endpoint reads as
"not done yet", not as a mysterious 500.

Authoring rules for new modules: [`_lib/FORMAT.md`](_lib/FORMAT.md).

## Rules of engagement

- Stuck >10 min → read the solution walkthrough, close it, rewrite from
  memory. Copy-pasting teaches nothing; reconstructing teaches plenty.
- ★★★ exercises are optional stretch. Skipping them is a strategy, not a
  failure.
- The quizzes are for saying answers **out loud** — recall beats recognition.
- Modules 24–26 **ship broken**. Red on the first run is the exercise, not a
  bug in your setup.
