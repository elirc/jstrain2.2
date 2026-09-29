# 21 · Interleaved Drills

This module teaches you nothing new. Every concept in it is a SECOND rep
of something from modules 01–10 — deliberately mixed, deliberately
unlabelled, deliberately later. Module 03 taught you `groupBy` while you
were thinking about reduce; this module asks for it while you are
thinking about `this`, regex and the event loop. That gap is the point.
The first time through a module you are learning; this time you are
finding out what you actually kept.

## Why interleaving beats blocked practice

Blocked practice — twenty-four reduce exercises in a row — feels great
and measures almost nothing. Once you know the answer is "reduce", the
only work left is typing. Your accuracy climbs inside the block, you feel
fluent, and you have trained the wrong skill: executing a chosen tool
rather than choosing one. Then a week later a real problem arrives with
no chapter heading on it, you reach for the tool and it is not there. The
research name for this is the illusion of fluency: performance during
practice and retention afterwards come apart, and the conditions that
make practice feel easiest are usually the ones that teach least.

Interleaving costs you speed on purpose. Every problem starts with the
retrieval you actually need in the wild — "what KIND of problem is this?"
— before any implementation begins, and that discrimination step is the
one blocked practice hides. Mixing also spaces each concept out: you meet
`??` in set A, then not again until set D, so each meeting is a real
recall from a colder memory instead of a copy of the line above. Expect
to feel slower and get more wrong than you did in module 03. That is the
trade: worse practice performance, better retention. Struggling to
retrieve something and eventually getting it strengthens the memory more
than reading it fluently ever does.

## The rules of this module

These are deliberate deviations from the rest of the bootcamp:

1. **No hints.** Every other module gives you a `hint:` line on ★★☆ and
   up. Not here. If you cannot start, that is data — see the rubric.
2. **No topic labels.** The header says `concepts: mixed` because naming
   the concept does most of the work for you.
3. **Short prompts.** Input → output and nothing else. Inferring the rule
   from the examples is part of the exercise.
4. **One sitting per file.** A set is 5 functions and ~20 minutes. Do the
   whole set before you check anything.
5. **From memory first.** No scrolling back to module 03, no opening the
   old solution, until you have finished the file or hit the wall
   properly. Looking it up too early converts a retrieval rep into a
   reading rep, and reading is the cheap one.

## How to schedule it

Do NOT do this module as a block — that would undo the whole point.
Sprinkle it:

| When | What | Why then |
| --- | --- | --- |
| After hour 3 of FLIGHTPLAN 1 | one mixed set (01) | closures + arrays are 2 hours cold |
| After hour 5 | one mixed set (02–03) | `this` and prototypes just landed; test them against older material |
| After hour 7 | one mixed set (04–05) | longest gap yet on the module-01/02 material |
| Right after module 07 | gauntlets 09 → 10 → 11 | the event loop is loaded; find out how much of it is real |
| Flight home / the day after | cold rebuilds 12 → 13 → 14 | 24h+ of forgetting is what makes a rebuild worth anything |
| Any leftover slot | sets 06–08 | tired-brain compatible; they are short |

If you only have time for three files in the whole module, do **09**,
**12** and **13** — event-loop order and those two builds are what
interviews actually ask for.

## Exercises

| # | file | ★ | what you do |
| --- | --- | --- | --- |
| 01 | `01-mixed-set-a.js` | ★★☆ | bike-share kiosk: merge config without eating `0`/`''`/`false`, a label built entirely in the parameter list, a counter factory, a lookup table that will not leak `toString`, a `key=value` parser |
| 02 | `02-mixed-set-b.js` | ★★☆ | bakery: rescue a method torn off its object, tally by pastry, sort by two keys without touching a frozen array, catch a rejection that a naive `try` would miss, find the busiest hour |
| 03 | `03-mixed-set-c.js` | ★★☆ | climbing gym: one closure per route, group by grade, an immutable nested update that still shares the branches it did not touch, dedupe by key, kebab-case |
| 04 | `04-mixed-set-d.js` | ★★☆ | podcast app: `??` defaults, a factory whose methods survive being pulled apart, `new` written by hand, an async load that actually awaits, a two-way index |
| 05 | `05-mixed-set-e.js` | ★★☆ | plant nursery: rename + default two levels down, keyBy, a descending multi-key ranking on frozen data, settle every task without a rejection escaping, mask a reference |
| 06 | `06-mixed-set-f.js` | ★★☆ | ferry timetable: wrap methods so they keep their receiver, an id generator, immutable update through an array, own keys vs inherited keys, set difference |
| 07 | `07-mixed-set-g.js` | ★★☆ | chess club: `??` where `null` means "use the default", a crosstable reduce, a three-key sort, a piece table that answers 0 for `valueOf`, an anchored regex parse |
| 08 | `08-mixed-set-h.js` | ★★☆ | print shop: destructure a job, a class method that survives being handed off as a callback, `once`, an immutable reassign, first-success-wins over failing tasks |
| 09 | `09-gauntlet-queues.js` | ★★☆ | predict the output of three snippets: timers queued from microtasks, the synchronous `new Promise` executor, an async function racing a then-chain |
| 10 | `10-gauntlet-chains.js` | ★★★ | harder: `queueMicrotask` and `.then` share one queue, the classic async/await interview snippet, and what `return promise` costs versus `return await promise` |
| 11 | `11-gauntlet-finale.js` | ★★★ | the tricky ones: a thenable's extra tick, `Promise.resolve(p)` as identity versus `new Promise(res => res(p))`, and awaiting things that are already settled |
| 12 | `12-rebuild-debounce-throttle.js` | ★★★ | cold rebuild, no hint: `debounce` AND `throttle`, spy + sleep tested |
| 13 | `13-rebuild-maplimit-lru.js` | ★★★ | cold rebuild, no hint: `mapLimit` (a real worker pool) AND an LRU cache |
| 14 | `14-rebuild-search-window.js` | ★★★ | cold rebuild, no hint: first/last occurrence by binary search — with a read-counting test that catches an O(n) walk — AND longest substring without repeats |

Nine ★★☆, five ★★★, 98 graded checks. Order does not matter for 01–08;
09 → 10 → 11 and 12 → 13 → 14 are each worth doing in order.

```
node exercises/01-mixed-set-a.js     # yours
node solutions/01-mixed-set-a.js     # the reference, all green
node ../verify.js 21                 # the whole module at once
```

## Score yourself

Grade each FILE, not each function, and write the score down. The number
is worthless; the sorting is the point.

| Result | What it means | What to do |
| --- | --- | --- |
| 🟢 **Green first try** — all tests pass, no peeking, no flailing | The concept is retrievable, not just recognisable. It is now safe to leave alone for weeks. | Nothing. Do not re-drill it — that is blocked practice with extra steps. |
| 🟡 **Needed the old solution** — you knew the shape, but had to check a detail (argument order, `??` vs `\|\|`, which side of the comparator) | The idea is there; the API is not. This is the most common and least worrying result. | Write the one line you missed on a card or in the margin of the cheatsheet. Re-attempt the same file in 2–3 days, not today. |
| 🔴 **Could not start** — you read the prompt and had no candidate approach at all | Not a memory failure, a coverage failure: this concept never got encoded properly the first time. | Go back to the source module and redo the ORIGINAL exercise, reading the walkthrough. Then come back to this set a day later. |

Two extra signals worth catching:

- **A test you did not expect to fail.** Usually the frozen-input test,
  the `0`/`''`/`false` test, or the "left edge never moves backwards"
  test. Those are the edges everyone's mental model is missing; they are
  worth more attention than a whole file you passed.
- **Green but slow.** If a ★★☆ set took 45 minutes, it counts as 🟡. On a
  whiteboard, slow and correct reads as unsure.

## Spoilers: what each set was drilling

Read this AFTER you have done the sets — it is the priming this module
spent fourteen files avoiding.

| Concept | Sets |
| --- | --- |
| `??` vs `\|\|` in options merging | 01 · 04 · 07 |
| destructuring with defaults + rename in params | 01 · 05 · 08 |
| `this` loss on method extraction (bind / arrow factory / wrapper / class) | 02 · 04 · 06 · 08 |
| closure state, per-call vs shared | 01 · 03 · 06 · 08 |
| reduce → countBy / groupBy / keyBy / summary | 02 · 03 · 05 · 07 |
| sort comparators: multi-key, descending, copy-first on frozen | 02 · 05 · 07 |
| immutable nested update (spread per level) | 03 · 06 · 08 |
| prototype mechanics (`hasOwn` vs `in`, table leaks, what `new` does) | 01 · 04 · 06 · 07 |
| promise error paths (missing `await` in `try`, `forEach(async)`) | 02 · 04 · 05 · 08 |
| Map/Set choice (dedupe, frequency, two-way lookup, set algebra) | 02 · 03 · 04 · 06 |
| string/regex quickies (parse, case convert, mask, anchored match) | 01 · 03 · 05 · 07 |

Anything with a 🔴 next to it in two different sets is your real gap.

---

**No "Stuck?" line here, on purpose** — reinforcement and hunt modules send you looking for the reference yourself; that retrieval is the rep. · **Next:** `bootcamp/22-sql-joins`
