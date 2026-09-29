# Quiz bank — 453 questions, offline, answers hidden

A self-test companion to `bootcamp/`. Every answer sits inside a collapsed
`<details>` block, so you can read a file top to bottom without spoiling
yourself. Every "what does this print" answer in here was produced by
actually running the snippet under Node 22 — and every "does this compile"
answer in file 11 by running it through `tsc --noEmit --strict`. If your
reasoning disagrees with an answer, the answer is what the engine did.

## The files

| # | File | Q | What it drills |
|---|------|---|----------------|
| 01 | [`01-language-core.md`](01-language-core.md) | 39 | types, coercion, `==` vs `===`, truthiness, TDZ, destructuring, spread, `??` |
| 02 | [`02-functions-this-closures.md`](02-functions-this-closures.md) | 39 | closures, `this`, arrows, hoisting, `bind`/`call`/`apply`, currying |
| 03 | [`03-arrays-objects.md`](03-arrays-objects.md) | 41 | mutation vs copy, `reduce`, sort traps, references, JSON |
| 04 | [`04-async-event-loop.md`](04-async-event-loop.md) | 45 | output ordering, promises, `await`, microtasks vs timers |
| 05 | [`05-strings-regex-collections.md`](05-strings-regex-collections.md) | 28 | string methods, reading regex, `Map`/`Set`/`WeakMap` |
| 06 | [`06-classes-prototypes.md`](06-classes-prototypes.md) | 28 | prototype chain, `new`, `instanceof`, fields, `super`, `#private` |
| 07 | [`07-data-structures-algorithms.md`](07-data-structures-algorithms.md) | 35 | big-O of common ops, which structure fits, pattern recognition |
| 08 | [`08-node-and-web.md`](08-node-and-web.md) | 18 | Node loop, modules, streams, HTTP, DOM events, storage |
| 09 | [`09-spot-the-bug.md`](09-spot-the-bug.md) | 24 | one classic defect per snippet — name it and fix it (async, SQL, security) |
| 10 | [`10-interview-verbal.md`](10-interview-verbal.md) | 24 | open questions with model answers you can deliver out loud (+ system-design-lite) |
| 11 | [`11-typescript.md`](11-typescript.md) | 28 | inference, `unknown` vs `any`, narrowing, generics, utility types, reading `tsc` errors |
| 12 | [`12-node-advanced.md`](12-node-advanced.md) | 22 | processes vs threads, loop lanes, streams & backpressure, HTTP, `node:sqlite`, testing |
| 13 | [`13-sql.md`](13-sql.md) | 30 | JOIN semantics, `NULL`, `GROUP BY` vs `WHERE`, indexes, N+1 — drills `bootcamp/22-sql-joins` |
| 14 | [`14-mixed-gauntlet.md`](14-mixed-gauntlet.md) | 45 | cross-topic final gauntlet: no file heading tells you which idea is being tested |
| 15 | [`15-stack-traces.md`](15-stack-traces.md) | 7 | read a real Node stack trace, name the culprit line — the on-call skill |
| | **Total** | **453** | |

Difficulty ramps *within* each file: the first third is warm-up, the middle
is solid, the last third is where people get caught. Don't skip to the end.

Files 11, 12 and 13 are the TypeScript, advanced-Node and SQL add-ons. They
assume files 01–08; if you're on the TS/Node track, run them in place of
block 5 below and push files 05–07 into the second pass. File 14 is the
cross-topic gauntlet — save it for last and take it cold. It's the exit
exam, not a warm-up.

## How to use it

**One question at a time, and commit before you look.** Cover the answer,
say the exact output out loud — or write it down — then reveal. "Something
like `undefined`" is a wrong answer. The entire value of this format is the
gap between what you thought and what happened; if you peek first, that gap
never opens and nothing sticks.

**Mark every miss.** Put a `✗` next to the question number right in the file
(or keep a list of `04-Q17`-style tags on paper). You are building the redo
list for the back half of the flight.

**Space the repeats.** Don't grind one file until it's perfect. Do a file,
move to a different one, come back later. Recalling something after you've
partly forgotten it is what moves it into long-term memory; re-reading it
while it's still fresh feels productive and isn't.

**Say module 10 out loud, at full length.** Reading those answers silently
teaches you nothing you don't already know — the skill being tested is
fluency under pressure, and that only comes from producing sentences. If
you're on a plane, mutter. Aim for 30–60 seconds per answer.

## A 10-hour flight plan

This is the zero-energy alternate — the quiz-only route, for when you are too
tired to write code. The main schedules live in
[`../FLIGHTPLAN.md`](../FLIGHTPLAN.md) and
[`../FLIGHTPLAN-NODE-TS.md`](../FLIGHTPLAN-NODE-TS.md); those already slot
these files in five minutes at a time. Ten hours does not cover 453
questions — this is the spine, not the whole bank.

| Block | Time | What |
|-------|------|------|
| 1 | 0:00–1:15 | Files 01 + 02 — the foundation everything else assumes |
| 2 | 1:15–2:30 | File 03, then file 04 slowly; 04 is the densest in the bank |
| 3 | 2:30–3:00 | Break. Genuinely close the laptop. |
| 4 | 3:00–4:15 | Files 05 + 06 |
| 5 | 4:15–5:30 | Files 07 + 08 — swap in 11/12/13 if you're on the TS/Node track |
| 6 | 5:30–6:15 | File 09 — full speed, name the bug in under 30 seconds |
| 7 | 6:15–7:15 | File 10 out loud, twice through the ones that came out mushy |
| 8 | 7:15–8:30 | **Redo every question you marked `✗`**, cold, from the top |
| 9 | 8:30–10:00 | File 14 cold — the mixed gauntlet, nothing telling you which idea is being tested — then a second pass on whichever file had the most misses |

Block 8 is the one that matters. A question you got wrong and never revisited
is worse than one you never saw, because you now have a false sense of
coverage.

## Reading the answers

Each answer opens with the literal output in bold and a one-sentence reason,
then two to four sentences naming the underlying rule. If you got the output
right but can't state the rule, that's a partial credit — mark it. Knowing
that `[] == false` is `true` is trivia; knowing that `==` sends the boolean
to a number and the array through `ToPrimitive` is the thing that
generalizes to the next surprise.

## Related

- `bootcamp/` — the lessons and hands-on exercises these questions test.
- `bootcamp/_lib/FORMAT.md` — the authoring contract for the bootcamp modules.
