# Bootcamp — offline, test-graded, self-paced

A personal coding bootcamp for leveling up software engineering
fundamentals, in two languages. Built to run **fully offline** — every
exercise is a single self-contained file graded by its own tests,
runnable with nothing but Node or the .NET SDK.

**JavaScript / TypeScript — start here →
[`FLIGHTPLAN.md`](FLIGHTPLAN.md)** — the 10-hour core-JS schedule.
Flight 2 (Node + TypeScript) →
[`FLIGHTPLAN-NODE-TS.md`](FLIGHTPLAN-NODE-TS.md).

**C# / .NET (web-focused) — start here →
[`csbootcamp/FLIGHTPLAN.md`](csbootcamp/FLIGHTPLAN.md).** Same format,
same harness philosophy, weighted toward ASP.NET Core: 29 modules, 147
exercises, 1,292 tests. Every web exercise runs a real Kestrel server over
real HTTP. Needs the .NET 10 SDK and nothing else.

## Quick start (30 seconds)

```bash
node bootcamp/01-language-core/exercises/01-*.js   # run any exercise
node bootcamp/progress.js                          # your scoreboard
```

An exercise file looks like this: a prompt in comments, a function that
throws `TODO`, and tests underneath. You write the code and re-run the
file until:

```
  ✔ counts lowercase vowels
  ✔ is case-insensitive
  ✔ handles the empty string

  3 passed
  all green — next file!
```

No test runner to install, no config, no watcher — `node <file>`, that's
the whole workflow. (`☐ todo` = not written yet · `✘` = failing · `✔` = done
· `🐛` = a debug-hunt bug you haven't caught yet.)

## What's here

```
FLIGHTPLAN.md        ← the 10-hour plan. Read it first.
bootcamp/            ← the main event: 29 modules, ~770 exercises
  01-language-core/            types, coercion, scope, destructuring
  02-functions-and-closures/   closures, this, HOFs, debounce/memoize
  03-arrays-and-objects/       the method drills — map/filter/reduce/sort
  04-strings-regex-collections/ strings, regex, Map/Set, dates
  05-prototypes-and-classes/   what `class` really is
  06-errors-and-robustness/    throw/catch, custom errors, Result style
  07-async-mastery/            event loop, promises, async patterns
  08-iterators-generators-modules/
  09-data-structures/          stack → queue → tree → heap → LRU → graph
  10-algorithms-and-patterns/  two pointers, sliding window, DP-lite…
  11-functional-programming/   purity, immutability, composition
  12-node-fundamentals/        fs, path, streams, http, events
  13-dom-and-browser/          HTML files — open them in a browser
  14-swe-design-patterns/      observer, strategy, DI, state machines…
  15-capstones/                12 mini-projects (build an event emitter,
                               a store, a router, a template engine,
                               an undo manager, a validator, an ORM…)
  16-node-cli-tooling/         argv, ANSI, tables, testable CLIs
  17-node-async-advanced/      workers, child processes, backpressure
  18-node-http-apis/           build a toy Express, piece by piece
  19-node-persistence/         atomic writes, WAL, CSV, node:sqlite
  20-testing-and-quality/      fake clocks, property tests, contracts
  21-interleaved-drills/       REINFORCEMENT: mixed cold reps of 01–10,
                               event-loop gauntlets, rebuild-from-memory
  22-sql-joins/                INNER/LEFT JOIN, aggregates, N+1, indexes
  23-node-drills/              REINFORCEMENT: lane gauntlets, crash
                               recovery, zero-wait injected-time reps
  24-debug-hunts/              REINFORCEMENT: 25 planted bugs — tests
                               start red; read fast, fix minimal
  25-codebase-debug-hunts/     REINFORCEMENT: bugs across several files —
                               symptom here, cause there
  26-security-hunts/           REINFORCEMENT: close the vuln — injection,
                               XSS, IDOR, redirects, ReDoS, CSRF, leaky logs
  27-sql-data/                 transactions, UPSERT, keyset pagination,
                               schema design, migrations (node:sqlite)
  28-api-consumer/             retry+backoff, cursors, error envelopes,
                               idempotency, boundary validation
  29-write-the-test/           write the test that catches the bug —
                               graded by a meta-test
tsbootcamp/          ← the TypeScript track: 8 modules, ~125 exercises,
                       graded by tsc --strict AND runtime tests
                       (07 = reinforcement drills, 08 = debug hunts that
                       compile clean and still lie; run one:
                       node ../run.js exercises/01-….ts)
quizzes/             ← ~450 rapid-fire questions in 15 files,
                       answers hidden (incl. stack-trace reading)
guides/              ← 8 long-form essays — the why behind the mechanisms
                       (07 = using AI without being owned by it,
                       08 = the React versions of the hunt bug classes)
cheatsheets/         ← 15 offline reference sheets (your MDN substitute)
docs/                ← the map: project overview + learning path
                       (OVERVIEW.md), gaps + roadmap (IMPROVEMENTS.md)
jstrain/             ← bonus: a second course — 274 problems with
                       TypeScript + React tracks (vitest, deps installed)

csbootcamp/          ← the C# / .NET track: 29 modules, 147 exercises
  01-12                       the language: types, collections, LINQ,
                              records, generics, async, patterns, JSON, DI
  13-23                       the web: minimal APIs, middleware, MVC,
                              validation, EF Core, auth, caching, testing,
                              configuration, and three API capstones
  24-29                       reinforcement: three hunt modules that ship
                              BROKEN, plus SQL, HTTP resilience, and one
                              that makes you write the test instead
  docs/ROADMAP.md             the full status table
```

Run any C# exercise the same way as a JS one — `dotnet run <file>.cs`.
The module numbers are fixed slots in a 29-module plan and the web-facing
ones were built first, so work the order in
[`csbootcamp/FLIGHTPLAN.md`](csbootcamp/FLIGHTPLAN.md), not 01→29.

Each `bootcamp/` module: `README.md` (the lesson — read first),
`exercises/` (yours), `solutions/` (reference implementations with
teaching walkthroughs — peek only after a real attempt).

Module 13 is the exception to the "run with node" rule: those are HTML
files — double-click to open in a browser; a checks panel on the page
grades you live, refresh to re-run.

Module 24 (and `tsbootcamp/08`) is the exception to the "write the code"
rule: those exercises arrive finished and broken. Tests are red on the
first run by design — find the planted bug, make the smallest fix that
turns them green.

## Tools

| Command | What it does |
| --- | --- |
| `node bootcamp/progress.js` | JS-track scoreboard (`… 12` for one module) |
| `node tsbootcamp/progress.js 03` | TS-track scoreboard for one module (types + tests). Prefer the module number — with no argument it type-checks the whole track, ~10 min |
| `node tsbootcamp/run.js <file.ts>` | grade one TS exercise (tsc, then tests) |
| `node bootcamp/verify.js` | maintainer check: all solutions still green |
| `node tsbootcamp/verify.js` | same, for the TypeScript track |
| `cd jstrain && npm test` | the bonus course's full vitest suite |

## Rules of engagement

- Stuck >10 min → read the solution walkthrough, close it, rewrite from
  memory. Copy-pasting teaches nothing; reconstructing teaches plenty.
- ★★★ exercises are optional stretch. Skipping them is a strategy, not
  a failure.
- The quizzes are for saying answers **out loud** — recall beats
  recognition.
