# ✈️ FLIGHTPLAN — 10 hours, no internet, maximum gains

Everything you need is on this laptop. No npm install, no docs lookups —
`cheatsheets/` is your MDN for the flight.

**You will not finish everything. That is by design.** There are ~890
exercises across the JS and TypeScript tracks plus a second full course
(`jstrain/`) — enough for several flights. The plan below is the highest-value path through it.

## How to work

1. Open the module's `README.md`, read it (~10 min). Don't skip it.
2. Work `exercises/` in order. Run a file after every change:
   `node exercises/01-whatever.js` — fix until `all green — next file!`
3. Stuck > 10 minutes? Read the solution's walkthrough, understand it,
   close it, and rewrite the code from memory. That still counts.
4. End of each hour: 5 minutes of the matching quiz in `quizzes/`,
   answers covered, out loud.
5. Check your scoreboard anytime: `node bootcamp/progress.js`

Do the ★☆☆ and ★★☆ exercises first; ★★★ stretch problems are for when a
module feels easy — skip them guilt-free, they'll be here after landing.

## The schedule

| Hour | Block | Why |
| --- | --- | --- |
| 1 | `bootcamp/01-language-core` | Types, coercion, scope — the traps everything else stands on |
| 2 | `bootcamp/02-functions-and-closures` | Closures + `this` — the #1 interview filter |
| 3 | `bootcamp/03-arrays-and-objects` | The daily-driver methods. Highest-rep drill block |
| 4 | `bootcamp/07-async-mastery` (first half) | Event loop + promises, the modern-JS heart |
| 5 | `bootcamp/07-async-mastery` (finish core) → `05-prototypes-and-classes` | Async patterns, then what `class` really is |
| 6 | `bootcamp/09-data-structures` | Stacks → maps → trees → LRU. Interview bread and butter |
| 7 | `bootcamp/10-algorithms-and-patterns` | Named patterns: two pointers, sliding window, binary search, DP-lite |
| 8 | **Pick ONE lane** (below) | Depth beats coverage |
| 9–10 | `bootcamp/15-capstones` — pick TWO | Build real miniatures: event emitter, store, router… |

### Spaced reinforcement (the science bit)

New material fades without retrieval. After hours 3, 5, and 7, spend
~15 minutes on ONE mixed set from `bootcamp/21-interleaved-drills` —
short problems from earlier modules, deliberately shuffled so you must
pick the tool yourself. The event-loop gauntlets (21/09–11) slot right
after module 07; the cold rebuilds (21/12–14) are for the flight home.

### Hour 8 — pick your lane

- **Webdev lane** → `13-dom-and-browser` (open the HTML files in a
  browser — no server needed; finale is a full todo app)
- **Backend lane** → `12-node-fundamentals` (fs, streams, and an actual
  HTTP server tested against itself)
- **Language-depth lane** → `04-strings-regex-collections` +
  `08-iterators-generators-modules`
- **Craft lane** → `14-swe-design-patterns` (+ `11-functional-programming`)

`06-errors-and-robustness` (30 exercises) isn't on any lane — slot it in
whenever you're ahead of schedule; its first half pairs naturally after
hour 5.

### Tired-brain mode

Long-haul fatigue is real. When focus dips, switch to one of these — all
low-effort, still compounding:

- `bootcamp/24-debug-hunts` (and `25-codebase-debug-hunts`,
  `26-security-hunts`) — the code is written, the tests are red, you just
  have to *see* it. Reading beats writing when you're fried, and it is the
  closest thing here to a live-coding interview screen
- `quizzes/09-spot-the-bug.md` — find the bug, reveal, next
- `quizzes/15-stack-traces.md` — read the trace, name the culprit line
- `guides/07-working-with-ai.md` — why fundamentals matter MORE with AI
- `quizzes/10-interview-verbal.md` — rehearse answers out loud (quietly)
- Read a cheatsheet end to end (`js-gotchas.md` is the fun one)
- Read a guide end to end — `guides/01-the-event-loop-all-the-way-down.md`
  is the flagship
- Re-run `node bootcamp/progress.js` and mop up ◐ half-done files

### Landing checklist (last 20 minutes)

1. `node bootcamp/progress.js` — screenshot your score.
2. Redo every quiz question you got wrong during the flight.
3. Write 5 bullet points: the things that surprised you most. Those are
   what you actually learned.

## Round 2 (the flight home?)

- **[`FLIGHTPLAN-NODE-TS.md`](FLIGHTPLAN-NODE-TS.md)** — a full second
  10-hour plan: the TypeScript track (`tsbootcamp/`, graded by
  tsc --strict + tests) and advanced Node (modules 16–20: CLIs, workers,
  a toy Express, persistence + SQL, testing craft)
- `bootcamp/21-interleaved-drills` cold rebuilds (12–14) — debounce,
  mapLimit, LRU from memory; `bootcamp/22-sql-joins` — the JOIN drills;
  `bootcamp/23-node-drills` — Node second reps
- `bootcamp/24-debug-hunts` — 25 planted bugs, one per file: tests start
  red, you make the minimal fix. Interview prep disguised as a nap. Then
  `25-codebase-debug-hunts` (bugs across files) and `26-security-hunts`
  (injection, XSS, IDOR, open redirect, ReDoS, CSRF — the CRUD-interview
  security round)
- `bootcamp/29-write-the-test` — the flip side of the hunts: write the
  edge-case test that would have caught the bug
- The stretch (★★★) exercises you skipped
- The lanes you didn't pick, and the remaining capstones
- `jstrain/` — a second, separate 274-problem course with a TypeScript
  track and a React track (vitest-graded, deps preinstalled):
  `cd jstrain && npm test`
