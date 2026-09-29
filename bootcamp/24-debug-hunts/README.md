# 24 · Debug Hunts

Every other module in this bootcamp hands you an empty function. This one
hands you a full one — it runs, it looks reasonable, and it is wrong. That
is the shape of most working days: you inherit a file, you review a pull
request, or an interviewer turns a laptop around and says "this is failing
in prod, talk me through it." Writing from a blank page is the skill you
practise most and use least. Reading somebody else's code fast enough to
find the one line that is lying is the skill you get paid for, and almost
nobody drills it on purpose.

So: no TODOs here. Each exercise ships complete and buggy, with tests that
describe the CORRECT behaviour, which means at least one test is red before
you touch anything. Exactly one bug per file — three in the last one — and
your job is to find it and fix it with the smallest change that turns the
file green. Not to rewrite it. A rewrite that passes proves you can write
code, which was never in question; a two-character fix proves you found the
bug, which is the whole exercise.

## The mental model

A hunt is four steps, and the order is the method. Most of the time people
lose to a bug is step 4 attempted first.

### 1 · Read the failing test before the code

The test was written by someone who knew what right looks like. Read its
name, its input, and the two numbers in the diff — then read the tests that
PASS, because the difference between a passing input and a failing one is
usually the entire story:

```
  ✔ counts a window in the middle
  ✘ counts a window that reaches the last value
      expected: 2
      received: 1
```

That is not "the function is broken". That is "one short, and only at the
edge" — a hypothesis, before you have opened the implementation at all.

### 2 · Follow one concrete value through the code

Pick the single value the failing test argues about and walk it from where
it enters to where it leaves, printing at every hop. Don't predict, print —
the code you are running is not the code you are imagining:

```js
console.log('in   ', from, to);     // 3, 7
console.log('slice', page.length);  // 4  ← already wrong, before the sort
console.log('out  ', result);       // the symptom you were shown
```

The first hop where the value stops matching what you would write on paper
is the bug's neighbourhood. Everything after it is downstream noise.

### 3 · Name the shape before you touch anything

Bugs feel infinite and are not. Say out loud "this is a stale-closure bug"
and you have converted an open-ended read into a lookup — you now know what
to grep for and what the fix looks like. These twenty-three families cover
essentially every logic bug in a JavaScript codebase. Files 01–16 plant
one of the first fourteen each; the second wave (17–22) plants the six
async and SQL ones, and the third (23–25) the three that only show up
once state is durable:

| bug class | what it looks like from the outside |
| --- | --- |
| off-by-one / boundary | only the first or last item is wrong; the middle is perfect |
| mutating while iterating | a cleanup pass leaves survivors, often every other one |
| shared reference | writing to one thing changes another; a "copy" that isn't |
| loose equality / coercion | `0`, `''` and `false` vanish; `'12' + 1` becomes `'121'` |
| sort comparator | an order that ignores you, or is exactly backwards |
| shadowed accumulator | the inner total climbs, the outer one stays at zero |
| stale closure | every function in a list behaves like the last one built |
| lost `this` | fine as `obj.method()`, broken the moment it is passed along |
| float money | a total ending in `…00000004`; an exact comparison never hits |
| un-awaited async | the result is empty on return and correct one tick later |
| swallowed error | corrupt input reports success and leaves nothing in the log |
| cache key / state leak | the second caller is handed the first caller's answer |
| stale response / race | an older response lands last and wins |
| shared mutable Date | the first call is right, every call after it drifts |
| `Promise.all` collapse | one bad item blanks every good one |
| cleanup before the await | the guard reopens while the work is still inside |
| listener leak | fires twice after every restart; detach does nothing |
| completion-order scramble | right data, wrong rows — and only under load |
| LEFT JOIN turned inner | the report loses exactly the rows with nothing to show |
| join fan-out | totals only ever too high, worst for busy parents |
| commit-on-error | a failure is written down anyway; the retry can't run |
| lost update | concurrent writers all read the same number and drift low |
| rounding vs conservation | the parts no longer add up to the whole |

### 4 · Make the smallest fix, then re-run

One change, then run the file. If it is still red, undo it before you try
the next thing — two speculative edits at once and you no longer know which
one helped. When it goes green, ask the last question: *why did the test
suite not catch this before?* The answer is almost always "the fixture was
too tidy", and that is the habit you take to your own tests.

```
node exercises/09-floating-point-money.js
```

## The details that bite

1. **Fixing the symptom at the wrong layer.** The total is off by a cent,
   so you round it at the end. Now the total is right and the line items
   still disagree with it. Fix a value where it is created, not where it is
   displayed — and never fix a bug by loosening the assertion that caught
   it.
2. **Rewriting instead of diffing.** Deleting the function and writing your
   own passes the tests and teaches nothing, because you never found out
   what was wrong. Worse, in a real codebase you have just traded one known
   bug for an unknown number of new ones.
3. **Trusting the name over the body.** `bestCoupon` returning the worst
   coupon is not exotic; names are written once and the body is edited for
   years. When a test disagrees with a function's name, believe the test.
4. **Predicting instead of printing.** You will re-read a line five times
   and see what you expect. One `console.log` settles it in four seconds.
   Instrument first, theorise second.
5. **"It only breaks with some inputs" is a clue, not luck.** Data-dependent
   failures point straight at representation: which numbers are exact in
   binary, which strings collide when concatenated, which index is the last
   one. Find the smallest input that still fails.
6. **The passing test next to the failing one is evidence.** Two tests, one
   green and one red, that call the same function with slightly different
   arguments have already localised the bug for you. Diff the arguments,
   not the source.

## Exercises

| # | file | ★ | what's planted |
| --- | --- | --- | --- |
| 01 | `01-off-by-one-pagination.js` | ★☆☆ | a pagination slice that lies |
| 02 | `02-mutating-while-iterating.js` | ★☆☆ | a cleanup that leaves survivors |
| 03 | `03-shared-reference.js` | ★☆☆ | a fresh grid that is not as fresh as it looks |
| 04 | `04-loose-equality-filter.js` | ★☆☆ | a query cleaner that eats a value the user asked for |
| 05 | `05-sort-comparator.js` | ★★☆ | a leaderboard nobody can climb |
| 06 | `06-shadowed-accumulator.js` | ★★☆ | a grand total that refuses to grow |
| 07 | `07-stale-closure.js` | ★★☆ | validators that agree a little too much |
| 08 | `08-lost-this.js` | ★★☆ | four green methods, one red, one shared helper |
| 09 | `09-floating-point-money.js` | ★★☆ | an invoice that will not admit it is paid |
| 10 | `10-foreach-async.js` | ★★☆ | a report that finishes before the work does |
| 11 | `11-swallowed-error.js` | ★★☆ | an import that calls a disaster a success |
| 12 | `12-cache-key-collision.js` | ★★☆ | a permission check that answers for the wrong user |
| 13 | `13-binary-search-bounds.js` | ★★★ | a search that cannot see the last shelf |
| 14 | `14-stale-response-race.js` | ★★★ | results belonging to a keystroke you already replaced |
| 15 | `15-date-mutation.js` | ★★★ | a calendar that changes when you read it |
| 16 | `16-boss-code-review.js` | ★★★ | one cart, three bugs, one very unhappy customer |
| 17 | `17-promise-all-collapse.js` | ★★☆ | one flapping feed, a whole board of blank tiles |
| 18 | `18-cleanup-before-await.js` | ★★☆ | a mutex that guards the doorway, not the room |
| 19 | `19-listener-leak.js` | ★★☆ | a ticker that unsubscribes into thin air |
| 20 | `20-map-limit-order.js` | ★★★ | fast workers, scrambled rows — only when busy |
| 21 | `21-left-join-gone.js` | ★★★ | a LEFT JOIN that read the book and missed the point |
| 22 | `22-group-by-fanout.js` | ★★★ | revenue that multiplies in the joining |
| 23 | `23-migration-half-applied.js` | ★★★ | a failed migration that every later deploy trips over |
| 24 | `24-lost-update-race.js` | ★★★ | a view counter that only undercounts popular posts |
| 25 | `25-property-only-bug.js` | ★★★ | four green example tests and one red property |

Four ★☆☆, eleven ★★☆, ten ★★★. Do 01–16 in order: the warm-ups teach
you the four-step method on bugs you can see from across the room, and
the stretch files assume you have stopped guessing. Finish the first pass
with 16 — it is the only file where you do not know how many bugs are
left, which is the realistic part.

Files 17–22 are the **second wave**: four async hunts and two SQL hunts,
one notch nastier because the symptom sits further from the cause. They
assume module 07 (async) and, for 21–22, module 22 (joins) — come back
for them after those, or save them as second-flight reps.

Files 23–25 are the **third wave**, and each one plants a bug the tests
you would normally write cannot reach. 23 is only visible on the failure
path of a transaction; 24 only when two calls overlap;
25 only when something other than a human picks the inputs — it ships
with a seeded property test already red, and the lesson is why the four
example tests beside it are all green. Take them after
`20-testing-and-quality` and `27-sql-data`, or as the hardest reps in a
second flight.

```
node exercises/09-floating-point-money.js   # yours, red until you fix it
node solutions/09-floating-point-money.js   # the fix + the walkthrough
node ../verify.js 24                        # the whole module at once
node ../progress.js 24                      # the scoreboard
```

Two things are inverted in this module. **Red is the starting state** — a
file that fails on the first run is working as designed, not broken, and a
debug exercise that passes untouched would be the actual bug. And in the
scoreboard a file you have not solved shows as 🐛 *(bug not fixed yet)*
rather than ✘, because there is nothing to feel bad about until you have
read it. ✔ means you found it.

Read the solution's `Walkthrough:` after your attempt, not during. It names
the bug class, points at the tell — the thing that should have raised your
eyebrow on the first read — explains why the minimal fix is minimal, and
describes the wilder variant of the same bug you will eventually meet in
production. The tell is the part worth memorising; it is what turns the
next hunt into a two-minute job.

---

**No "Stuck?" line here, on purpose** — reinforcement and hunt modules send you looking for the reference yourself; that retrieval is the rep. · **Next:** `bootcamp/25-codebase-debug-hunts` — the same skill, with the cause in another file
