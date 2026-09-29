# 15 · Capstones

Everything before this module was a drill: one idea, five minutes, four
tests. A capstone is different. Each file here is a real miniature of a
tool you already use — Node's EventEmitter, Zustand, Express, Handlebars,
p-limit, marked, vitest, lodash, zod, ActiveRecord, node-cron — with 21
to 25 tests grouped into four stages you unlock one at a time. Nobody
hands you a two-hour problem at work either; they hand you a one-line
request and you discover the stages yourself. Here they are written down, so you can practise the thing that
actually separates a mid from a junior: keeping a 200-line file coherent
while it grows.

## The mental model

**1. The spec is above, the contract is below.** Read the header block,
then read the tests for stage 1 ONLY. Write until those pass. Then read
stage 2. Reading all 23 tests up front is how you end up designing for
requirements you have not understood yet.

```
node exercises/01-event-emitter.js     # after every stage. Every time.
```

**2. Closure over state, object of functions out.** Most of these
capstones are this one shape. The state is unreachable except through the
functions you return — no `this`, no leaks, no accidental mutation from
outside.

```js
function createCounter(start) {
  let n = start;                       // private, forever
  return { get: () => n, inc: () => (n += 1) };
}
```

**3. Anything you register, you must be able to unregister — and the
cleanest handle is a function.** `on()`, `subscribe()`, `addEventListener`,
`useEffect`: they all converge on returning a disposer, because the caller
cannot lose it and it works with anonymous arrow functions.

```js
const stop = bus.on('tick', () => {});
stop();                                // no name to remember, no map lookup
```

**4. Wrap, do not edit.** Retries, timeouts, logging, caching: take a
function, return a function with the same shape. The thing being wrapped
never learns about it, and wrappers compose in any order.

```js
const guarded = retry(withTimeout(fetchUser, 50), { times: 3 });
```

## The details that bite

1. **Iterate a copy when a callback can unregister during dispatch.**
   `for (const fn of [...list]) fn()` — mutating the array you are looping
   over silently skips the next element.
2. **`Object.is`, not `===`.** `Object.is(NaN, NaN)` is `true` and
   `Object.is(0, -0)` is `false`. That is what you want for change
   detection, and `===` gets both backwards.
3. **Spread is one level deep.** `{ ...state, ...patch }` gives a new top
   object whose nested values are the SAME references — which is exactly
   why `prev.items === next.items` is a valid "nothing changed here" test.
4. **Any counter you increment needs `try/finally`.** One throw inside a
   `batch()` without a `finally` leaves the depth stuck above zero and the
   store never notifies again.
5. **Escape first, then insert markup.** Escaping after you have built
   `<strong>` escapes your own tags. And escape in ONE pass over a
   character class, or the `&` you emit gets escaped again.
6. **Regex alternation is ordered.** `/\{\{\{...\}\}\}|\{\{...\}\}/` finds
   `{{{raw}}}`; swap the two branches and it never will.
7. **Workers pull, chunks stall.** N loops sharing one cursor keep the pool
   full; slicing the array into groups of N makes every group wait for its
   own slowest member.
8. **`clearTimeout` in both settle paths.** A pending timer keeps the Node
   process alive after the work is done — that is the classic "my script
   finished but the terminal is still hanging".
9. **A timed-out promise is not cancelled.** It keeps running; you just
   stopped listening. There is no abort in a plain promise.
10. **`JSON.stringify(undefined)` is `undefined`, not `'undefined'`.**
    Formatting helpers need `JSON.stringify(v) ?? String(v)`.
11. **Rows from `node:sqlite` have a NULL prototype.**
    `Object.getPrototypeOf(row) === null`, so `row.hasOwnProperty(x)`
    throws. Spread once at the boundary: `{ ...row }`.
12. **Date arithmetic in local time is a scheduling bug.** Use
    `Date.UTC(y, m, d + 1)` and the `getUTC*` readers; overflow
    (`d + 1` past the end of the month) is handled for you, and daylight
    saving cannot make a job run twice.

## Pattern → where you have already met it

| Pattern in these files | Real name | You have used it in |
| --- | --- | --- |
| register / dispatch / unregister | observer, pub-sub | DOM events, Node streams |
| state + subscribers + change check | store | Redux, Zustand, Svelte |
| pattern list + specificity score | routing table | Express, React Router |
| escape, then substitute | template engine | Handlebars, JSX escaping |
| N workers, one cursor | worker pool | p-limit, thread pools, job queues |
| block pass, then inline pass | two-phase parser | marked, markdown-it |
| collect a tree, then walk it | collect/run split | vitest, jest, mocha |
| clone the spine, share the branches | structural sharing | Immer, Redux, React state |
| reversible actions on two stacks | command pattern | every editor's Ctrl+Z |
| many children, one parent entry | composite | groups in Figma, transactions |
| recurse with the path as accumulator | tree walk | zod, JSON Schema, form errors |
| property assignment that records itself | active record | ActiveRecord, Sequelize |
| ids in, one `IN (…)` out | eager loading / batching | DataLoader, Prisma `include` |
| a clock you pass in | dependency injection | fake timers, `vi.setSystemTime` |

## The capstones

| # | file | ★ | time | what you build |
| --- | --- | --- | --- | --- |
| 1 | `01-event-emitter.js` | ★★★ | 30–40 min | on/off/once/emit, unsubscribe functions, `'*'` wildcards, one throwing listener that cannot take down the rest |
| 2 | `02-reactive-store.js` | ★★★ | 40–50 min | get/set/subscribe, patch and updater writes, silence when nothing changed, computed values, and `batch()` coalescing many writes into one notification |
| 3 | `03-router.js` | ★★★ | 30–40 min | `/users/:id` matching, query parsing, specificity scoring so static beats param beats `'*'`, and `buildPath` for reverse routing |
| 4 | `04-template-engine.js` | ★★★ | 45–55 min | `{{name}}` with dot paths, escaping by default with `{{{raw}}}` opt-out, `{{#if}}` and `{{#each}}` blocks that nest |
| 5 | `05-task-runner.js` | ★★★ | 45–55 min | an async pool with a real concurrency limit and input-ordered results, plus `retry` and `withTimeout` decorators and an allSettled mode |
| 6 | `06-markdown-lite.js` | ★★★ | 40–50 min | headings, paragraphs, lists, bold/italic/code/links, and source HTML escaped — as two clean passes, block then inline |
| 7 | `07-test-framework.js` | ★★★ | 35–45 min | describe/it collecting a tree, `expect().toBe/.toEqual/.toThrow`, and a `run()` that reports instead of printing. The bootcamp's harness tests yours |
| 8 | `08-json-path.js` | ★★★ | 30–40 min | `getPath` with defaults, immutable `setPath` that clones only the spine, `deletePath`, `select` projection, and a prototype-pollution guard |
| 9 | `09-undo-manager.js` | ★★★ | 35–45 min | undo/redo stacks over do/undo commands, a bounded history with labels, `beginGroup`/`endGroup` collapsing many edits into one, and typing bursts that coalesce on an injected clock |
| 10 | `10-validation-engine.js` | ★★★ | 40–50 min | schema-driven validation: built-in and custom rules, nested objects and array items as dotted paths, every error collected into one map, `when()` conditions, and async rules queued one at a time |
| 11 | `11-mini-orm.js` | ★★★ | 45–60 min | active record over `node:sqlite`: `defineModel` with accessors, dirty tracking that updates only changed columns, a statement cache, `hasMany` with lazy loading — and eager loading that proves 2 queries beats N+1 |
| 12 | `12-cron-scheduler.js` | ★★★ | 35–45 min | a 5-field cron parser, `nextRun` by UTC date math (including the day-of-month/day-of-week OR rule), and a scheduler on an injected clock with overlap protection and per-job error isolation |

All twelve are ★★★ — that is what makes them capstones. They are
independent: nothing here imports anything else, so start anywhere.
`11-mini-orm` is the one exception to "no setup" — it needs Node 22 for
`node:sqlite`, and it is the hardest file in the module.

## How to work them

**Pick TWO for hours 9 and 10 of the flight.** Not five. Two finished
capstones teach more than five half-built ones, and the last hour of a
long flight is not when you want three unfinished files open.

**`01-event-emitter` + `02-reactive-store` is the classic pairing.** The
emitter teaches dispatch and subscription; the store is the same machinery
plus change detection and scheduling, so the second one lands twice as
hard. Other good pairs: `03-router` + `08-json-path` (both are "parse a
string into data, then it is easy"), `04-template-engine` +
`06-markdown-lite` (two parsers, one escaping lesson), `05-task-runner` +
`07-test-framework` (async control flow, then the tool that measures it).

**Second flight: `09-undo-manager` + `12-cron-scheduler`, or
`10-validation-engine` + `11-mini-orm`.** The first pair is the injected
clock twice over — one merges events that happen close together, the
other decides what is due — and neither test suite waits a single
millisecond for real time. The second pair is the data pair: a recursive
walk over a schema tree, then the layer that turns rows into objects and
back. Take 11 last; it is the one file here that talks to a database.

**Do the stages in order, and run the file after every stage.** The tests
are grouped by stage with a `// ── stage N: ... ──` divider, and the stages
are ordered so each one is buildable with what you have. Stage 4 is always
the one that hurts — wildcards and error isolation, batching, precedence
scoring, nested blocks, coalescing, async rules, eager loading, overlap
protection. Getting stages 1 to 3 green and stopping is a perfectly good
outcome for a 40-minute sitting.

**Do not peek at the solution to get unstuck — peek to compare.** When your
stage is green, open `solutions/<same-file>` and read the walkthrough at
the top. It names the pattern you just invented and the classic wrong turn
you may have taken. That five minutes is where the transfer happens.

```
node exercises/02-reactive-store.js     # your version
node solutions/02-reactive-store.js     # the reference, all green
node ../progress.js 15                  # scoreboard for this module
```

---

**Stuck?** the cheatsheet matching the capstone — `cheatsheets/patterns-swe.md` (01, 02, 05, 09), `cheatsheets/regex.md` (04, 06, 12), `cheatsheets/array-methods.md` (08, 10), `cheatsheets/webdev-fundamentals.md` (03), `cheatsheets/node-advanced.md` (11) · **Related modules:** 19 (`node:sqlite`) and 22 (joins and N+1) before or after `11-mini-orm` · **Self-check:** `quizzes/09-spot-the-bug.md` · **Next:** the TS track (`tsbootcamp/01-types-and-annotations`) or FLIGHTPLAN-NODE-TS.md
