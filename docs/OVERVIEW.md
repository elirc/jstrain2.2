# The project, on one page — and the path through it

This repo is a personal, fully offline coding bootcamp with one goal:
take a junior developer with shaky fundamentals to **mid-level, ready to
contribute to a real CRUD web team** — able to pass interviews, read
unfamiliar code fast, and use AI assistance as a power tool instead of a
crutch. Every `bootcamp/` exercise runs with plain `node <file>`. No
installs, no wifi, no test runner, no config. The two exceptions need one
`npm install` on a connected machine: `tsbootcamp/` (for the TypeScript
compiler) and `jstrain/` (for vitest).

## What's on the shelves

| shelf | size | what it is |
| --- | --- | --- |
| `bootcamp/` | 29 modules, ~770 exercises | The main event. Each exercise is one self-contained file: prompt in comments, a function that throws `TODO`, tests underneath. Run it, write code, re-run until `all green — next file!` |
| `tsbootcamp/` | 8 modules, ~125 exercises | The TypeScript track. Graded twice: `tsc --strict` for types, the same harness for behavior. Type errors ARE the todo list |
| `quizzes/` | 15 files, 453 questions | Rapid-fire recall, answers hidden in collapsed blocks. Every "what does this print" answer was produced by running the snippet |
| `cheatsheets/` | 15 sheets | Your offline MDN: array methods, promises, regex, big-O, Node APIs, TS errors, gotchas, the non-code interview |
| `guides/` | 8 essays | The long-form *why*: event loop, `this`/prototypes, memory, coercion, HTTP, how Node runs code, working with AI, React bug classes |
| `jstrain/` | 274 problems | A second, separate course (vitest-graded, `npm install` once) with TypeScript and React tracks — different reps on the same ideas |
| `FLIGHTPLAN.md` / `FLIGHTPLAN-NODE-TS.md` | 2 × 10 hours | The curated schedules. Start there |
| `docs/` | this folder | The map: this overview, and `IMPROVEMENTS.md` — known gaps and the roadmap |

Three module families inside `bootcamp/`:

- **Build modules (01–20, 27–29)** — the classic shape: empty function,
  you fill it in. Language core → closures/`this` → arrays/objects →
  strings/regex → classes → errors → async → iterators → data structures
  → algorithms → FP → Node (fs/streams/http) → DOM → design patterns →
  capstones → CLIs → advanced async → HTTP APIs → persistence → testing;
  plus `27-sql-data` (transactions, UPSERT, pagination, schema,
  migrations), `28-api-consumer` (retry/backoff, cursors, idempotency,
  validation), and `29-write-the-test` (write the test that catches the
  bug, graded by a meta-test).
- **Reinforcement modules (21–23)** — interleaved cold reps, SQL joins,
  Node gauntlets. Deliberately shuffled and hint-free: retrieval, not
  recognition.
- **Hunt modules (24, 25, 26, `tsbootcamp/08`, and three files in 13)** —
  the inverted format: the code arrives finished and broken, tests start
  red, you find the planted bug and make the smallest fix. `24-debug-hunts`
  (single-file, 23 bug classes), `25-codebase-debug-hunts` (bugs across
  files — symptom here, cause there), `26-security-hunts` (close the
  vuln). This is the code-reading and interview core; unsolved files show
  🐛, not ✘.

Grading marks everywhere: `☐` untouched · `◐` started · `✘` failing ·
`✔` done · `🐛` debug-hunt bug not caught yet. Scoreboards:
`node bootcamp/progress.js` and `node tsbootcamp/progress.js NN`.

## The recommended path

The two flightplans are the spine; this is the whole skeleton. Each phase
has an exit test — don't move on because you finished the files, move on
because the exit test feels easy.

### Phase 1 — Core JavaScript (FLIGHTPLAN.md, ~10 focused hours)

Modules in this order: `01` language core → `02` closures and `this` →
`03` array/object drills → `07` async → `05` classes/prototypes → `09`
data structures → `10` algorithm patterns. After every 2–3 hours: one
mixed set from `21-interleaved-drills` and five minutes of the matching
quiz, answers covered, **out loud**. Hour 8 picks one lane (DOM, Node,
language depth, or craft), hours 9–10 build two capstones from `15`.

*Exit test:* `quizzes/01`–`04` mostly right on a cold pass, and you can
rebuild debounce and an LRU from memory (`21`'s cold rebuilds).

### Phase 2 — Reading code (the interview edge)

`bootcamp/24-debug-hunts` in order, then `25-codebase-debug-hunts` (bugs
across files) and `26-security-hunts` (the CRUD-interview security round),
plus `quizzes/09-spot-the-bug.md` and `15-stack-traces.md` at full speed.
Guide `08-react-bug-classes.md` carries the same class names into
components, if the React track in `jstrain/` is on your list.
The four-step hunt method in module 24's README is the thing to
internalize — it's also exactly the skill for reviewing AI output, which
`guides/07-working-with-ai.md` makes explicit. Close the loop with
`29-write-the-test`: write the edge-case test the bug slips through.

*Exit test:* given a failing test on unfamiliar code, you name the bug
class before you touch the file.

### Phase 3 — Node + TypeScript (FLIGHTPLAN-NODE-TS.md, ~10 hours)

TS lane: `tsbootcamp/01`–`04`, then `06` (job TS). Node lane: `17`
workers/backpressure → `18` build a toy Express → `19` persistence →
`22` SQL joins (reading) → `27-sql-data` (transactions, UPSERT, keyset
pagination, schema, migrations) → `28-api-consumer` (retry/backoff,
cursors, idempotency, validation) → `20` testing craft. Reinforce with
`tsbootcamp/07` cold reps and `tsbootcamp/08-debug-hunts` (compiles
clean, still wrong — what `--strict` can't catch), plus `23`'s Node
gauntlets.

*Exit test:* `quizzes/11`–`13` mostly right; you can explain to a
rubber duck why a dropped promise type-checks.

### Phase 4 — Consolidation and interview prep

- `quizzes/14-mixed-gauntlet.md` cold — the exit exam of the quiz bank.
- `quizzes/10-interview-verbal.md` out loud, at full length, twice —
  including the new system-design-lite questions.
- `cheatsheets/interview-behavioral.md` — STAR stories and the
  design-lite template for the round that isn't a coding screen.
- Guides `01` (event loop) and `02` (`this`/prototypes) — the two that
  produce the most interview questions.
- `node bootcamp/redo.js 5` — restore five solved exercises to rebuild
  from memory. Redo every quiz question you ever marked ✗, too. The redo
  list is worth more than new material.

### Phase 5 — Volume (ongoing)

The ★★★ stretch files you skipped, the lanes you didn't pick, remaining
capstones, and `jstrain/` for a second full course with React — the one
frontend-framework rep in the repo (`cd jstrain && npm test`).

## Rules of engagement (they are the pedagogy)

1. **Stuck >10 min** → read the solution's walkthrough, close it,
   rewrite from memory. Reconstructing counts; copy-pasting doesn't.
2. **★★★ is optional.** Skipping stretch files is a strategy.
3. **Quizzes are spoken.** Recall beats recognition; "something like
   `undefined`" is a wrong answer.
4. **Space the reps.** A file redone after partly forgetting it moves to
   long-term memory; a file re-read while fresh just feels productive.
5. **In debug modules, red is the starting state.** Minimal fixes only —
   a rewrite that passes proves nothing you didn't already know.
