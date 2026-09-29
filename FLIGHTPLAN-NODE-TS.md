# ✈️ FLIGHTPLAN 2 — Node + TypeScript, 10 hours, no internet

The second flight (or the second wind). Same rules as
[`FLIGHTPLAN.md`](FLIGHTPLAN.md): everything local, everything graded,
solutions with walkthroughs when stuck >10 min, cheatsheets instead of
MDN. This plan assumes you've done (most of) the core JS flight.

Two lanes, five hours each. Swap their order if you'd rather start with
servers than types.

## How the TypeScript track works

TS exercises are graded TWICE — types by `tsc --strict`, behavior by the
same test harness you know. From a module directory:

```bash
node ../run.js exercises/01-whatever.ts
```

A fresh exercise shows **type errors — that's the todo list**. Replace
the `TODO` type placeholders until tsc is silent, implement until tests
are green. `@ts-expect-error` lines are tests too: they must STAY errors
— if your types are so loose they compile, that's the graders catching
an `any` cheat.

**The fast inner loop** (tsc takes ~30s cold on this laptop): keep
`npm run ts:watch` running in a second terminal — it re-checks types in
about a second after every save. Iterate against the watcher (or your
editor's squiggles), use `node ../run.js --tests <file>` for quick test
runs, and run the full `node ../run.js <file>` as the final referee.

Scoreboards: `node tsbootcamp/progress.js 03` (module-scoped — the
whole-track run is a ~10-minute end-of-flight ritual, not a loop tool)
and `node bootcamp/progress.js` for the JS side.

## The schedule

| Hour | Block | Why |
| --- | --- | --- |
| 1 | `tsbootcamp/01-types-and-annotations` | Inference, shapes, unions — the vocabulary |
| 2 | `tsbootcamp/02-narrowing` | Discriminated unions + guards = 80% of daily TS |
| 3 | `tsbootcamp/03-generics` | The interview filter; typed HOFs and constraints |
| 4 | `tsbootcamp/04-utility-and-mapped-types` | Partial/Pick from scratch, template literal types |
| 5 | `tsbootcamp/06-typing-real-code` (core ★★☆ files) | Typed emitters, API clients, satisfies — job TS |
| 6 | `bootcamp/17-node-async-advanced` | workers, child processes, backpressure — beyond await |
| 7 | `bootcamp/18-node-http-apis` (first half) | Build a toy Express: routing, middleware, bodies |
| 8 | `bootcamp/18` (finish core) → `19-node-persistence` | ETags, cookies, rate limits → atomic writes + real SQL |
| 9 | `bootcamp/22-sql-joins` → `27-sql-data` | JOINs (reading), then the write side — transactions, UPSERT, keyset pagination, schema design, migrations |
| 10 | `bootcamp/28-api-consumer` → finisher (pick one below) | Being a good client — retry/backoff, cursors, error envelopes, idempotency, boundary validation — then end on a build |

### Hour 10 finishers — pick ONE

- `tsbootcamp/06` stretch files: the typed builder, state machine, or
  the typed-event-emitter (★★★ flexes)
- `bootcamp/16-node-cli-tooling` speedrun → its finale is a working
  task CLI composed from your own pieces
- `tsbootcamp/05-conditional-types-and-infer` — type puzzles
  (type-challenges style; hardest content in the repo, great fun if
  your brain still has fuel)

### Overflow / swap pool

`bootcamp/16-node-cli-tooling`, `bootcamp/20-testing-and-quality`, and
`tsbootcamp/05` are deliberately not on the main path — swap them in for
any hour that finishes early. `20-testing-and-quality` pairs especially
well after `28-api-consumer`, and `bootcamp/29-write-the-test` is the
quick companion to it (write the edge-case test the bug slips through).
The quiz files `quizzes/11-typescript.md` and `quizzes/12-node-advanced.md`
are the between-hours breaks for this flight; `quizzes/13-sql.md` is the
one for hour 9, `quizzes/15-stack-traces.md` for any debugging lull.

### Spaced reinforcement

After hour 4, do 2–3 files from `tsbootcamp/07-reinforcement-drills`
(cold TS reps — discriminated unions, unknown-parsing, DTO shaping; do
files 09/12/14 only after TS-06). After hour 8, one or two files from
`bootcamp/23-node-drills` (lane gauntlets, crash-recovery scenarios,
zero-wait injected-time retrofits). Both modules are hint-free on
purpose — retrieval, not recognition.

`tsbootcamp/08-debug-hunts` is the third rep and the odd one out: 12
files that compile clean under `tsc --strict` and are still wrong at
runtime — no type errors to lead you, so the types-are-the-todo-list
loop doesn't help. Tests ship red; find the bug, make the minimal fix.
Slot it after hour 5, when you've seen enough real TS to be suspicious
of it.

### Tired-brain mode

- `tsbootcamp/08-debug-hunts`, `bootcamp/24-debug-hunts`,
  `25-codebase-debug-hunts`, `26-security-hunts` — the code is written and
  already broken; you only have to read it. Reading beats writing on a
  fried brain, and it's the closest thing here to a live-coding screen
- `cheatsheets/typescript.md` — the "reading tsc errors" section pays
  rent forever
- `guides/07-working-with-ai.md` — why fundamentals matter MORE with AI,
  and how to review generated code the way you hunt a bug
- `cheatsheets/node-advanced.md` end to end
- `guides/06-how-node-actually-runs-your-code.md` — the threads and the
  process under the event loop; `05-http-from-first-principles.md` if
  hour 7 left you with questions
- Mop up ◐/◔ files: `node tsbootcamp/progress.js`
- `jstrain/` bonus course has a separate TS track (vitest-graded) if you
  want different reps on the same ideas: `cd jstrain && npm run test:ts`

### Landing checklist

1. Both scoreboards, screenshot.
2. Redo wrong quiz answers.
3. Write down the 3 type errors that confused you most — look them up in
   `cheatsheets/typescript.md` and confirm you now know why.
