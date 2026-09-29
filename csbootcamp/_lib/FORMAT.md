# C# bootcamp authoring format — the contract

Every module in `csbootcamp/` follows this format exactly. It is optimized for
offline solo study: every file is self-contained, runnable with plain
`dotnet run <file>`, and readable top-to-bottom without jumping between files.

This is the C# sibling of `bootcamp/_lib/FORMAT.md`. Where the two differ, the
difference is called out — the shape is deliberately the same so that moving
between tracks costs nothing.

## Why file-based apps

.NET 10 runs a single `.cs` file directly: `dotnet run 03-word-count.cs`. No
`.csproj` per exercise, no solution file, no `dotnet new`. That gives the C#
track the same "one file, one command" workflow the JS track gets from
`node file.js`. First run of a file compiles (~2–6s); re-runs are ~1s.

## Module layout

```
csbootcamp/NN-topic-name/
├── README.md          the lesson (read first, ~10 min)
├── exercises/
│   ├── 01-short-name.cs
│   ├── 02-short-name.cs
│   └── ...
└── solutions/
    ├── 01-short-name.cs   same tests, working code, + walkthrough comment
    └── ...
```

- Two-digit numbering, kebab-case names, identical filenames between
  `exercises/` and `solutions/`.
- Zero NuGet for modules 01–16. Modules that need EF Core or JWT pin the
  exact version that ships in the local package cache (see below).

## The directive header

File-based apps configure themselves with `#:` directives at the very top of
the file, before any code. Exercises keep these to a minimum — anything that
is pure ceremony lives in `csbootcamp/Directory.Build.props` instead, which
MSBuild applies to every file-based app in the track:

| Directive | When | Why |
| --- | --- | --- |
| `#:project ../../_lib/Check/Check.csproj` | **every** exercise | the test harness |
| `#:sdk Microsoft.NET.Sdk.Web` | web modules | brings in ASP.NET Core |
| `#:package Name@10.0.11` | EF Core / JWT modules | pinned to the version already in the local NuGet cache, so it resolves offline |

So a plain exercise has one directive and a web exercise has two. That is the
whole header.

### What Directory.Build.props handles for you

File-based apps default to AOT/trim-friendly settings, which are wrong for a
teaching repo in three separate ways. The props file turns them off once:

- `JsonSerializerIsReflectionEnabledByDefault=true` — without it,
  `Results.Ok(new { … })` compiles fine and then throws
  `NotSupportedException: JsonTypeInfo metadata … was not provided` at
  runtime, on the first request.
- `PublishAot=false` — without it, EF Core refuses to build a model at all:
  `Model building is not supported when publishing with NativeAOT`.
- `EnableRequestDelegateGenerator=false` plus `NoWarn` for IL2026 / IL3050 /
  RDG004 — without it, every single `MapGet` prints three trim-analysis
  warnings above the test output.

If you add a module that needs a different MSBuild setting, prefer adding it
there over adding a `#:property` line to a hundred exercise files.

## Exercise file template

```csharp
// ─────────────────────────────────────────────────────────────────────────
//  07 · rate limiter                                      ★★☆ core
//  concepts: closures over state · DateTimeOffset
//  run: dotnet run 07-rate-limiter.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Real-world setup in one or two sentences, then exactly what to build.
//  Show concrete input → output examples:
//
//      limiter.TryAcquire()  → true for the first 3 calls, then false
//
//  hint: store the timestamps you have already handed out, not a count
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

RateLimiter Build(int max, TimeSpan window) => throw new NotImplementedException();

// ──────────────────────────── tests ──────────────────────────────────────

Test("allows the first N calls", () =>
{
    var limiter = Build(3, TimeSpan.FromSeconds(1));
    Eq(Enumerable.Range(0, 3).Select(_ => limiter.TryAcquire()), new[] { true, true, true });
});

// ...4–8 focused tests total

// ──────────────────────────── types ──────────────────────────────────────
// Top-level statements come first; type declarations go at the BOTTOM.
sealed class RateLimiter { /* … */ }
```

Rules:

1. **Header block**: number · name, difficulty stars + tier, `concepts:` line,
   `run:` line. Difficulty: `★☆☆ warm-up`, `★★☆ core`, `★★★ stretch`.
2. **Prompt**: 3–15 comment lines. Concrete examples with `→` arrows. One
   `hint:` line for ★★☆ and up (put it last; it's below the fold of
   attention). Never reveal the whole approach.
3. **Directives** immediately after the prompt, then `using` lines. Always
   `using static Bootcamp.Check;` so tests read `Eq(…)` not `Check.Eq(…)`.
4. **Starter code**: methods with real parameter names and
   `throw new NotImplementedException();` as the body. That is the C# TODO —
   the harness reports it as `☐ todo` rather than a failure, and it is what
   every IDE generates when it stubs a method. For multi-part exercises, one
   per method.
5. **Tests**: 4–8 per exercise, after the divider. Test names read as a spec
   ("is case-insensitive", not "test 2"). Cover the happy path, one edge case
   minimum, and — where it teaches something — the tricky case that catches
   the naive solution.
6. **Type declarations go last.** C# top-level statements must precede type
   declarations in the file. This is the one structural difference from the JS
   track, where helpers can sit anywhere.
7. Available from the harness: `Test, Eq, Ok, NotNull, Throws, ThrowsAsync,
   Approx, Sleep`, plus `Spy<T>` / `Spy<T,TResult>` / `Spy0` and, for web
   modules, `Web.Serve`. `Test` accepts `Action` or `Func<Task>`.
   `Eq` is deep and structural: it compares sequences element by element, so
   `Eq(someList, new[] { 1, 2, 3 })` is the normal spelling.
8. Timers in tests: keep total waiting under ~300ms per file; assert
   order and counts, not exact milliseconds. Never depend on wall-clock dates,
   locale, or randomness in assertions.
9. Comment lines ≤ 78 chars. Modern C#: file-scoped namespaces, `var` where
   the type is obvious, expression-bodied members, records for data,
   collection expressions (`[1, 2, 3]`), nullable reference types on.

## Web exercise template

Web modules add the web directives and use `Web.Serve`, which starts a real
Kestrel server on a random loopback port and hands back an `HttpClient` aimed
at it. Real HTTP, real routing, real model binding — no mocking framework:

```csharp
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

Test("GET /todos returns the seeded list", async () =>
{
    await using var app = await Web.Serve(a => MapTodos(a));
    Eq(await app.GetStatus("/todos"), 200);
    Ok((await app.GetBody("/todos")).Contains("write tests"));
});
```

`ServedApp` gives you `.Client` (raw `HttpClient`), `.GetBody(path)`,
`.GetStatus(path)`, `.PostJson(path, obj)`, `.PutJson(path, obj)`. Always
`await using` it so the port is released before the next test.

## Solution file template

Identical file, with:
- ` — SOLUTION` appended to the header name line,
- a `Walkthrough:` comment block (3–10 lines) after the header explaining the
  approach and WHY, naming the concept it drills, and the classic wrong turn
  if there is one,
- the `NotImplementedException` replaced by a clean, idiomatic implementation,
- the SAME tests, unchanged.

Both files must run clean:
- exercise file → **0 failed**, and at least one `todo`, exit code 0
- solution file → all tests pass, exit code 0

Most exercises are entirely `todo` on the first run. A few deliberately ship
with a working half so the student can see a contrast — module 01's equality
exercise hands you the `record` version already done, next to the hand-written
class you have to fill in. That is allowed: what is never allowed is a
**failing** test in a non-hunt exercise, which means the tests and the starter
have drifted apart.

## Module README.md (the lesson)

Structure, in order — total read ~8–12 minutes:

```md
# NN · Topic Name

One-paragraph "why this matters" hook.

## The mental model
The 2–4 core ideas, each with a tiny runnable code snippet.

## The details that bite
Numbered list of gotchas/edge cases with one-line code proof each.

## Cheat table (optional)
Small md table if the topic is API-shaped (LINQ operators, status codes…).

## Exercises
| # | file | ★ | what you build |
table listing every exercise, marking which are core vs stretch.
Then: "Do the warm-ups and core in order. Stretch if time allows."
```

Tone: direct, second person, no fluff, no "in this section we will". Explain
like a sharp senior explaining to a junior on a whiteboard.

## The README footer (every module has one)

The last line of every module README is a one-line footer, after a `---` rule.
Two variants, and which one you get is a rule, not a mood:

**Teaching modules** point at the reference, the recall check, and the next
stop:

```md
**Stuck?** `cheatsheets/x.md` (what's in it) · **Self-check:** `quizzes/NN-y.md` · **Next:** `csbootcamp/NN-next`
```

Optionally a `**Deep dive:** guides/NN-….md` between them.

**Reinforcement and hunt modules** deliberately DROP the `Stuck?` and
`Self-check:` links. Finding the reference yourself is the retrieval those
modules exist to train. They still carry a `Next:`, and they say why the hint
line is missing:

```md
**No "Stuck?" line here, on purpose** — … · **Next:** `csbootcamp/NN-next`
```

## Debug / hunt modules (dir name contains `-debug`, or ends in `-hunts`)

These invert the contract: the student reads instead of writes.

- The exercise ships **complete, plausible code** — no stubs, no
  `NotImplementedException` — with a planted defect: ≥1 failing test and
  0 todos. `verify.cs` enforces both halves; a debug exercise that already
  passes has no bug to find and is reported broken.
- The prompt states the CORRECT behaviour and the symptom. It never names the
  bug, the line, or the fix — that IS the exercise.
- The solution is the **minimal** fix (usually one line), plus the usual
  `Walkthrough:` block naming the bug CLASS — off-by-one, captured loop
  variable, `async void`, deferred LINQ re-enumeration, DI lifetime mismatch —
  so the next one is recognisable on sight.
- `progress.cs` shows a still-red debug exercise as 🐛, not ✘: red is the
  starting state here, not a scolding.

## Capstone modules (23)

Capstones compose modules that already exist rather than teaching a new
mechanism, so two of the rules above are relaxed deliberately:

- **More than 8 tests per file.** A capstone grades a whole API — 13 to 18
  tests is normal. Order them so the student can work endpoint by endpoint,
  each test reachable as soon as the ones above it pass.
- **More than ~300ms of waiting**, where a cache TTL or a startup sequence is
  the thing under test. Keep it under a second and never assert an exact
  duration.

Everything else holds: stubs throw `NotImplementedException`, the prompt
states the rules as a numbered list that maps one-to-one onto tests, and the
solution carries the usual `Walkthrough:` block.

The prompt should name the rules as *rules*, not as hints. In a capstone the
student is not being asked to discover the requirement; they are being asked
to satisfy several at once without breaking any of them.

## Verification (mandatory before you finish)

From the repo root:

```
dotnet run csbootcamp/verify.cs            # every solution green, every exercise todo-only
dotnet run csbootcamp/verify.cs 04         # just one module
```

Run the **per-module** check while authoring and the **full** run before
calling a batch done — the full run takes ~35 minutes and puts every file
under load at once, which is the only way some timing-sensitive tests
misbehave. The harness allows 90 seconds per file for exactly this reason: a
timeout should mean *hung*, never *busy*.

Every solution must end `all green — next file!`. Every exercise must report
only `todo` (0 failed — a failed test in an exercise means the test doesn't
match the starter, or scaffolding is broken). Fix before finishing; do not
report done with red files.
