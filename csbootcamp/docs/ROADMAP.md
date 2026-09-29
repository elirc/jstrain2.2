# Roadmap — what is built

The C# track mirrors the 29-module shape of the JS track in `bootcamp/`.
Module numbers are **fixed slots**: slot 13 is minimal APIs regardless of what
came before it. The web-facing modules were built first, because the stated
goal of this track is web development.

**All 29 slots are now filled.** Directories only exist for built modules, so
`ls` still tells you the truth — there is simply nothing missing any more.

## Status

| # | Module | Exercises | Tests |
| --- | --- | --- | --- |
| 01 | `csharp-language-core` | 8 | 71 |
| 02 | `methods-and-parameters` | 6 | 45 |
| 03 | `collections` | 6 | 54 |
| 04 | `linq-mastery` | 6 | 56 |
| 05 | `classes-records-structs` | 6 | 60 |
| 06 | `interfaces-and-generics` | 6 | 54 |
| 07 | `nullability-and-errors` | 6 | 59 |
| 08 | `async-await` | 4 | 37 |
| 09 | `pattern-matching` | 6 | 51 |
| 10 | `strings-and-regex` | 6 | 59 |
| 11 | `json-and-serialization` | 6 | 57 |
| 12 | `dependency-injection` | 6 | 51 |
| 13 | `minimal-apis` | 7 | 51 |
| 14 | `middleware-pipeline` | 6 | 35 |
| 15 | `mvc-controllers` | 5 | 32 |
| 16 | `validation-and-binding` | 5 | 48 |
| 17 | `ef-core-fundamentals` | 4 | 31 |
| 18 | `ef-core-relationships` | 6 | 57 |
| 19 | `auth-and-security` | 5 | 46 |
| 20 | `caching-and-performance` | 6 | 56 |
| 21 | `testing-web-apps` | 5 | 42 |
| 22 | `configuration-and-hosting` | 6 | 50 |
| 23 | `api-capstones` | 3 | 48 |
| 24 | `debug-hunts` † | 3 | 20 |
| 25 | `web-debug-hunts` † | 2 | 11 |
| 26 | `security-hunts` † | 2 | 16 |
| 27 | `sql-and-data` | 2 | 21 |
| 28 | `http-client-resilience` | 2 | 23 |
| 29 | `write-the-test` | 6 | 51 |

**29 modules, 147 exercises, 1,292 tests, 147 reference solutions.**

† Hunt modules invert the contract: the exercises ship **complete and broken**,
red on the first run, with no stubs. `verify.cs` keys on the directory name
(`-debug` in it, or an `-hunts` suffix) and checks them the other way round.

## Shape of the track

**01–12 · the language.** Types and value semantics, methods and delegates,
collections and LINQ, records and structs, interfaces and generics,
nullability, async, patterns, strings, JSON, DI.

**13–23 · the web.** Minimal APIs, the middleware pipeline, MVC controllers,
model binding and validation, EF Core and relationships, auth, caching,
testing, configuration and hosting — then three capstones that make all of it
work together in one file.

**24–29 · reinforcement.** Three hunt modules where you find planted bugs
instead of filling stubs, two applied modules (SQL, HTTP resilience), and one
that inverts the whole exercise: the implementations are given and you write
the test.

## Supporting material

- [`../cheatsheets/`](../cheatsheets/) — 6 offline reference sheets
- [`../quizzes/`](../quizzes/) — 12 recall quizzes, 15 questions each
- [`../guides/`](../guides/) — long-form pieces on the two things that cause
  the most trouble: value vs reference semantics, and the request pipeline
- [`../FLIGHTPLAN.md`](../FLIGHTPLAN.md) — the order to actually work through
  it in, which is not module order

## If you extend it

- Read [`../_lib/FORMAT.md`](../_lib/FORMAT.md) first. The contract is enforced
  by `verify.cs`, not just by convention.
- Run `dotnet run csbootcamp/verify.cs <NN>` before calling a module done, and
  the whole thing (`dotnet run csbootcamp/verify.cs`) before calling a batch
  done — a few tests only misbehave under the load of a full run.
- Packages available offline in the local NuGet cache, all at `10.0.11`:
  `Microsoft.EntityFrameworkCore.Sqlite`, `Microsoft.Data.Sqlite.Core`,
  `Microsoft.AspNetCore.Authentication.JwtBearer`,
  `Microsoft.AspNetCore.Mvc.Testing`, `Microsoft.AspNetCore.TestHost`, plus
  `xunit` and `Newtonsoft.Json`. Pin exact versions with
  `#:package Name@10.0.11` or restore will try the network.
- MSBuild settings that apply to every exercise live in
  `Directory.Build.props`. Prefer adding there over a `#:property` line in a
  hundred files.

## Known gaps, deliberately left

- **`WebApplicationFactory`** does not appear anywhere. In a file-based app the
  entry point *is* the test file, so the factory re-runs the test suite when it
  boots the app. Module 21 uses `Web.Serve` (a real Kestrel on a random port)
  instead, which is closer to what an integration test actually proves. The
  package is cached if you build a multi-file project and want to try it.
- **No EF migrations.** Every database is SQLite in-memory with
  `EnsureCreated()`. Migrations need a project on disk and a design-time
  factory, which is a tooling exercise rather than a C# one.
