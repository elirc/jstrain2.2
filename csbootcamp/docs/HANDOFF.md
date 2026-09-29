# Handoff — continuing the C# bootcamp build

**Last updated:** 2026-09-02 · **Branch:** `bootcamp-finish-open-items`
**Last verified:** full-track `verify.cs` → 294 files, everything in contract.

**The track is complete.** All 29 module slots are filled and verified. Read
this if you are picking the work up to *extend* or *maintain* it: it records
what exists, the traps already paid for, and the contract any new module has
to satisfy.

---

## 1. Orient yourself in 60 seconds

```bash
cd "C:/Users/Owner/Desktop/_Organized Desktop/04 JavaScript Training/jstrain2.2"

dotnet --version                                  # expect 10.x
dotnet run csbootcamp/_lib/example/smoke.cs       # expect 13 passed · 1 todo
dotnet run csbootcamp/verify.cs 13                # expect "everything is in contract"
```

If those three pass, the toolchain is healthy and you can start writing
modules immediately.

Then read, in order:

1. [`../_lib/FORMAT.md`](../_lib/FORMAT.md) — the authoring contract. **Not
   optional.** `verify.cs` enforces it.
2. [`ROADMAP.md`](ROADMAP.md) — all 29 module slots and their status.
3. Any existing module's `README.md` + one exercise/solution pair, to absorb
   the voice.

---

## 2. Current state

**Complete: 29 modules, 147 exercises, 1,292 tests, 147 solutions.**
`dotnet run csbootcamp/verify.cs` reports **294 files, all in contract**
(takes ~55 min, which exceeds the 10-minute cap on one backgrounded
command — run it per-module, or in batches of four or five modules).

| Slot | Module | Exercises | Slot | Module | Exercises |
| --- | --- | --- | --- | --- | --- |
| 01 | `csharp-language-core` | 8 | 16 | `validation-and-binding` | 5 |
| 02 | `methods-and-parameters` | 6 | 17 | `ef-core-fundamentals` | 4 |
| 03 | `collections` | 6 | 18 | `ef-core-relationships` | 6 |
| 04 | `linq-mastery` | 6 | 19 | `auth-and-security` | 5 |
| 05 | `classes-records-structs` | 6 | 20 | `caching-and-performance` | 6 |
| 06 | `interfaces-and-generics` | 6 | 21 | `testing-web-apps` | 5 |
| 07 | `nullability-and-errors` | 6 | 22 | `configuration-and-hosting` | 6 |
| 08 | `async-await` | 4 | 23 | `api-capstones` | 3 |
| 09 | `pattern-matching` | 6 | 24 | `debug-hunts` † | 3 |
| 10 | `strings-and-regex` | 6 | 25 | `web-debug-hunts` † | 2 |
| 11 | `json-and-serialization` | 6 | 26 | `security-hunts` † | 2 |
| 12 | `dependency-injection` | 6 | 27 | `sql-and-data` | 2 |
| 13 | `minimal-apis` | 7 | 28 | `http-client-resilience` | 2 |
| 14 | `middleware-pipeline` | 6 | 29 | `write-the-test` | 6 |
| 15 | `mvc-controllers` | 5 | | | |

† Hunt modules invert the contract — see §5.

Supporting material, all cross-referenced and resolving:

- `cheatsheets/` — `csharp-basics.md`, `collections.md`, `async.md`,
  `aspnetcore-api.md`, `ef-core.md`, `auth-and-security.md`
- `quizzes/` — 12 files, 15 questions each (180 total)
- `guides/` — `01-value-vs-reference-and-null.md`,
  `02-the-aspnetcore-request-pipeline.md`
- `README.md`, `FLIGHTPLAN.md`, `docs/ROADMAP.md`
- `verify.cs`, `progress.cs` — written in C#, no Node needed

**Module numbers were built out of order**, web-facing first, at the user's
explicit direction ("web-first, then backfill"). The gaps are now all filled;
`FLIGHTPLAN.md` still teaches the web-first *route*, which is the point.

### Git state

Nothing has been committed. `git status` shows:

```
 M README.md          (added the C# track pointer + tree entry)
 M .gitignore         (added bin/ obj/ *.user)
?? csbootcamp/        (everything new)
```

**The user has not asked for a commit.** Do not commit unless asked.

---

## 3. The user's stated preferences

Captured from this conversation — treat as standing instructions:

- **Goal:** "a similar version of this project but covering C#, and .NET
  especially related to **web dev**."
- **Placement:** "needs to be in new folder in this repo so as not to replace
  or cause confusion with the current JS/TS one" → `csbootcamp/`.
- **Build order** (chosen via explicit question): **web-first, then backfill**
  the language modules.
- **Density** (chosen explicitly): **6–8 exercises per module**, matching
  modules 01–02 — full prompt, 4–10 tests, solution with a teaching
  walkthrough.
- **"finish all"** — the user wants the whole 29-module curriculum eventually.

---

## 4. Toolchain facts — already paid for, do not re-derive

These cost real debugging time. They are all settled.

| Fact | Detail |
| --- | --- |
| **Run a file** | `dotnet run foo.cs` (.NET 10 file-based apps). ~2–6s cold, ~1s warm. |
| **Shared harness** | `#:project ../../_lib/Check/Check.csproj` — works offline. |
| **Web** | `#:sdk Microsoft.NET.Sdk.Web` + `Web.Serve(...)` → real Kestrel on port 0. |
| **EF Core** | `#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11` |
| **MVC controllers** | Discovered fine in file-based apps. Controller classes go after top-level statements; must be `public`. |

### Directory.Build.props does the ceremony

`csbootcamp/Directory.Build.props` applies to every file-based app in the
track. **Do not add `#:property` lines to exercise files** — put settings
there instead. It already sets:

- `JsonSerializerIsReflectionEnabledByDefault=true` — without it,
  `Results.Ok(new { … })` compiles then throws `NotSupportedException:
  JsonTypeInfo metadata … was not provided` on the first request.
- `PublishAot=false` — without it, EF throws *"Model building is not supported
  when publishing with NativeAOT"*.
- `EnableRequestDelegateGenerator=false` + `NoWarn` for IL2026/IL3050/RDG004 —
  without it every `MapGet` prints three trim warnings above the test output.

So an exercise header is **one directive** (plain) or **two** (web). That's it.

### Offline NuGet cache (all at `10.0.11`)

`Microsoft.EntityFrameworkCore.Sqlite`, `.Design`, `Microsoft.Data.Sqlite.Core`,
`Microsoft.AspNetCore.Authentication.JwtBearer`,
`Microsoft.AspNetCore.Mvc.Testing`, `Microsoft.AspNetCore.TestHost`, plus
`xunit` and `Newtonsoft.Json`. **Pin exact versions** or restore hits the
network.

### Harness gotchas already handled

- **Test timeout is 90s** (`Check.cs`). Raised 5s → 20s → 90s. A cold web/EF
  test pays for Kestrel startup plus EF model building; at 20s the
  **full-track** run went flaky (module 18/05 and 18/06 failed) while every
  file passed in isolation, purely because the machine was loaded. Treat it
  as a hang detector, not a perf budget — if you see a timeout, suspect a
  deadlock, not slowness. **A flaky test in a teaching repo is worse than a
  missing one**: verify per-module AND full-track before declaring done.
- **`NotImplementedException` inside a request handler** would be an opaque
  500. `Web.Serve` catches it server-side and `ServedApp` replays it on the
  test thread, so stubs report `☐ todo`. **This only works through the
  `ServedApp` helpers** (`GetBody`, `GetStatus`, `PostJson`, `PutJson`,
  `PostForm`, `Send`) — a raw `app.Client.PostAsync(...)` bypasses it and the
  exercise reports a *failure*. This already bit twice (13/04, 15/02). Use
  the helpers in tests.
- **`Eq` is object-based, not `Eq<T>`**, so `Eq(list, new[] {1,2,3})` works.
- **ANSI escapes:** write `"\u001b"` in source. A raw ESC byte survives but is
  fragile; heredocs mangle it.

### Authoring traps

- **Throw-expression lambdas** need an explicit return type in `MapGet`:
  `app.MapGet("/x", string () => throw new …)`. Otherwise CS1593.
- **An exercise whose stub makes routes unreachable fails instead of
  todo-ing.** In module 15/01 the routing attributes had to be *given* in the
  starter, with the student implementing bodies only — otherwise no route
  exists, nothing throws, and tests just fail. Watch for this whenever the
  stub is the thing that registers the route.
- **`[ServiceFilter]` filters must be registered in DI** and should have an
  explicit `Order`.
- **SQLite has no decimal type** — cannot `SUM`/`ORDER BY` a decimal
  server-side. Project and aggregate in memory. (This is taught in 17/02, not
  worked around silently.)
- **`4.50m` serialises to `4.5`** in JSON. Match assertions accordingly.
- **JWT claim remapping.** `MapInboundClaims` defaults to true and renames
  well-known claims (`birthdate` → `ClaimTypes.DateOfBirth`, `sub` →
  `ClaimTypes.NameIdentifier`). `FindFirst("birthdate")` returns null and a
  fail-closed handler gives a silent 403. Set `options.MapInboundClaims =
  false`, and set `NameClaimType`/`RoleClaimType` if you do.
- **`ClockSkew` defaults to 5 minutes**, so "expired token is rejected" tests
  fail unless you set `TimeSpan.Zero`.
- **No `static` fields in top-level statements** (CS0106), and a top-level
  local captured by a helper declared above its use fails definite-assignment
  (CS0165). Put shared test state in a `static class` at the BOTTOM of the
  file — see `TestDb` in module 18.
- **`[property: Required]` is mandatory on positional records.** Without the
  `property:` target the attribute lands on the constructor parameter, where
  `Validator` never sees it — a silent no-op that looks correct.
- **`decimal` carries its scale.** `Math.Round(9.1m, 2)` serialises as
  `9.10`, not `9.1`. Bit us in 21/03.
- **`DateOnly.ToString()` uses the current culture** ("1/1/2026"). Format
  explicitly (`:yyyy-MM-dd`) in anything a test asserts on.
- **`Validator.TryValidateObject` defaults `validateAllProperties` to false**
  (only `[Required]` runs) and does not recurse into nested objects.
- **An async-iterator stub cannot just throw** — CS8420 requires a `yield` in
  the body. Use `throw new NotImplementedException();` then a
  `#pragma`-suppressed `yield break;` (see 08/04).
- **NEVER let an `async void` throw in an exercise.** There is no Task to hold
  the exception, so it reaches the thread pool and kills the whole test run.
  Demonstrate the principle with an un-awaited `Task` instead (08/03).
- **Relationship fixup makes EF tests lie.** In the same context that inserted
  a graph, navigation collections are already populated with no query at all.
  Use a second context (`TestDb.Again()`) whenever a test means "a fresh
  load" — otherwise it passes here and fails in production, which uses a new
  context per request.
- **Decimal comparisons:** `Eq` uses `Convert.ToDecimal`, so `9.99m` vs
  `9.99` compares fine.

---

## 5. The contract `verify.cs` enforces

```
solutions/   → passed>0, failed=0, todo=0        ("all green")
exercises/   → failed=0, todo>0                   (a stub)
hunt module  → failed>0, todo=0                   (ships broken on purpose)
```

A "hunt module" is any directory whose name contains `-debug` or ends in
`-hunts`. Its exercises ship **complete and broken** with a planted bug.

An exercise may contain some *passing* tests where the point is a deliberate
contrast (e.g. 01/08 hands you the `record` version working next to the
hand-written class you must fill in). What is **never** allowed is a *failing*
test in a non-hunt exercise.

**Always run `dotnet run csbootcamp/verify.cs <NN>` before calling a module
done.** It takes ~70–90s per module and catches drift the eye misses.

---

## 6. Next actions

**There is no unfinished module.** Everything below is optional depth, in the
order it would add the most.

1. **Density is done for the teaching modules.** Every module from 03 to 22
   now holds 5–8 exercises. The ones still below that are deliberate:
   `08-async-await` (4) could take two more; `15`, `17`, `19` and `21` sit at
   4–5; the capstones (23) are three large files; and 24–29 are
   reinforcement modules that are meant to be short.
2. **Quizzes for the uncovered slots** — there is no quiz for caching (20),
   configuration (22), SQL (27), or resilience (28). The existing 12 are the
   template.
3. **A third guide.** The two that exist cover the two things that cause the
   most trouble. A third on *EF Core's change tracker* is the obvious
   candidate — modules 17, 18 and 23/01 all lean on it and all explain it
   locally rather than once.
4. **`WebApplicationFactory`.** Structurally impossible in a file-based app
   (the entry point *is* the test file, so the factory re-runs the suite).
   Adding it means a real multi-file project under `_lib/`. The package is
   cached. See the "known gaps" note in `ROADMAP.md`.

### When you finish a module, also do this

Otherwise links dead-end and the docs drift out of true:

- [ ] Module `README.md` with the standard footer. **Teaching modules** get
      `**Stuck?** … · **Self-check:** … · **Next:** …`; **hunt modules**
      deliberately drop `Stuck?`/`Self-check:` and say why.
- [ ] Fix the **previous** module's `Next:` link to point at the new one, and
      the **last** module's to point back at `csbootcamp/README.md`. The chain
      is currently unbroken from 01 to 29; keep it that way.
- [ ] Add the cheatsheet / quiz the footer references, or point at an existing
      one. Verify with the link check in §7.
- [ ] Update `ROADMAP.md` status table and the built-count line.
- [ ] Update `README.md` tree + counts, and `FLIGHTPLAN.md` (legs, totals,
      "where the gaps are").
- [ ] Update **this file's** §2 and §6.
- [ ] `dotnet run csbootcamp/verify.cs <NN>` → in contract.

### Recompute the counts, don't guess

```bash
cd csbootcamp
ex=0; t=0
for d in [0-9][0-9]-*; do
  n=$(ls $d/exercises/*.cs 2>/dev/null | wc -l)
  # solutions, not exercises: hunt modules have no stubs, and count every
  # Test( call wherever it is indented, not just at column 0.
  k=$(grep -ho 'Test("' $d/solutions/*.cs 2>/dev/null | wc -l)
  echo "$d: $n exercises, $k tests"; ex=$((ex+n)); t=$((t+k))
done
echo "TOTAL: $ex exercises, $t tests"     # expect 104 and 914
```

I got the count wrong once by estimating. Run the script.

---

## 7. Link check (run before declaring done)

```bash
cd csbootcamp

# doc cross-references
grep -rhoE '(cheatsheets|quizzes|guides|docs)/[A-Za-z0-9._-]+\.md' --include=*.md . \
  | sort -u | while read r; do [ -f "$r" ] && echo "OK   $r" || echo "MISS $r"; done

# module cross-references
grep -rhoE 'csbootcamp/[0-9]{2}-[a-z-]+' --include=*.md . | sort -u \
  | sed 's|csbootcamp/||' | while read m; do
      [ -d "$m" ] && echo "OK   $m" || echo "MISS $m"; done
```

`cheatsheets/x.md` and `quizzes/NN-y.md` are **expected misses** — they are
placeholders inside the authoring template in `_lib/FORMAT.md`.

---

## 8. Voice and quality bar

Match the existing modules. Concretely:

- **Prompts:** real-world setup in 1–2 sentences, then exactly what to build,
  with `→` examples. One `hint:` line for ★★☆ and up, placed last.
- **Solutions:** a `Walkthrough:` block that explains *why*, names the concept,
  and names **the classic wrong turn**. This is the highest-value part of the
  whole repo — a solution without the wrong turn is just an answer key.
- **Tests read as a spec:** "is case-insensitive", never "test 2".
- **Teach the real thing.** The web modules use real Kestrel and real HTTP;
  the EF modules use real SQLite. Where a provider genuinely can't do
  something (SQLite + decimal `SUM`), *teach the limitation* rather than
  quietly working around it.
- **Comment lines ≤ 78 chars.** Modern C#: file-scoped namespaces, primary
  constructors, collection expressions, records for data, NRT on.
- Prefer a test that catches the **naive** solution over a third happy-path
  test.

---

## 9. If you are the session that runs out mid-module

Leave the tree in contract, not half-written:

- A module with **no** `exercises/*.cs` → delete the directory (empty dirs are
  removed by policy; `ls` must tell the truth).
- A module with some pairs done → keep only **complete, verified**
  exercise+solution pairs; delete partial ones. Then write the README covering
  just what's there and run `verify.cs <NN>`.
- Update §2 and §6 above with the real state before stopping.

A smaller module that is fully in contract is worth far more than a larger one
that is half-broken.
