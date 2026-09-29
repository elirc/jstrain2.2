# 07 · Async Mastery

Every JavaScript interview ends up here, and so does every production
incident. Not because promises are hard, but because "it works on my
machine" hides a pile of assumptions: that things happen in the order you
wrote them, that a `try` block catches what happens inside it, that
awaiting four things costs the same as awaiting one. This module makes the
machinery visible — you will predict event-loop output, rebuild
`Promise.all` from scratch, and write the five utilities (`withTimeout`,
`retry`, `mapLimit`, a task queue, a batcher) that separate people who use
async from people who understand it.

## The mental model

### 1. The event loop, in ten lines

JavaScript runs one thing at a time. There is one call stack, and two
queues of work waiting to get on it.

```
        ┌──────────────────────────────────────────┐
        │            CALL STACK                    │  ← runs to completion,
        │  (your synchronous code, one frame deep) │    never interrupted
        └───────────────────┬──────────────────────┘
                            │ empty?
                            ▼
        ┌──────────────────────────────────────────┐
        │   MICROTASK QUEUE   (drained to EMPTY)   │  ← .then/.catch/.finally,
        │   [ then, then, await-resume, ... ]      │    await resumptions,
        └───────────────────┬──────────────────────┘    queueMicrotask
                            │ empty?
                            ▼
        ┌──────────────────────────────────────────┐
        │   MACROTASK QUEUE   (ONE per turn)       │  ← setTimeout, setInterval,
        │   [ timer, I/O, timer, ... ]             │    I/O callbacks
        └───────────────────┬──────────────────────┘
                            └──► back to the microtask queue, forever
```

The rules that fall out of that picture:

1. Synchronous code always finishes before any callback runs.
2. Microtasks run before the next macrotask — a `.then` registered *later*
   still beats a `setTimeout(fn, 0)` registered *earlier*.
3. The microtask queue is drained until it is **empty**, including
   microtasks queued by other microtasks. An infinite microtask loop
   starves timers forever.
4. Between two timer callbacks, the microtask queue is drained again.

```js
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
console.log('sync');
// sync → promise → timeout
```

### 2. A promise is a value, not a callback

A promise is an object representing a result that does not exist yet. It
has three states — pending, fulfilled, rejected — and it settles **once**,
permanently. That single fact explains a lot of behaviour for free: a
double `resolve()` is ignored, a `reject()` after the timeout already won
does nothing, and a race's losers are harmless.

Because it is a value, you can store it, pass it around, and attach
handlers later — including *after* it has already settled.

```js
const p = fetchUser(1);   // the request is ALREADY running
const first = await p;    // both awaits get the same result,
const again = await p;    // the request does not run twice
```

Promises are **eager**: the work starts when you create the promise, not
when you await it. That is why a queue takes `() => job()` and not
`job()` — a function can be deferred, a promise cannot.

### 3. `async`/`await` is syntax over `.then`

`async` means "this function returns a promise, always". `await` means
"register the rest of this function as a `.then` handler and return to the
event loop". Nothing is blocked; only *this function* is suspended.

```js
async function f() { const u = await load(); return u.name; }
// ≈ function f() { return load().then((u) => u.name); }
```

A rejected promise that you `await` **throws** at the await point, which
is why ordinary `try/catch` works on async code, and why `throw` inside an
async function rejects its promise instead of exploding at the call site.

### 4. Concurrency is decided when you START, not when you await

```js
const one = await slow();
const two = await slow();                  // 2 trips, one after the other

const [x, y] = await Promise.all([slow(), slow()]);   // 2 trips at once
```

Both call `slow()` twice. The difference is that `Promise.all` lets both
requests be in flight at the same time. When the calls are independent,
sequential awaiting is pure latency you are paying for nothing.

## The details that bite

1. **A forgotten `await` returns a Promise, not a value.**
   `const n = getCount(); n + 1` → `"[object Promise]1"`. Nothing throws;
   you just get nonsense downstream.

2. **A floating promise crashes Node.**
   `doWork();` with no `await` and no `.catch` — if it rejects, Node 15+
   prints `UnhandledPromiseRejection` and **exits non-zero**. Either await
   it or attach a `.catch`.

3. **`await` in a loop serialises everything.**
   `for (const id of ids) out.push(await fetch(id))` over 50 ids is 50
   round trips end to end. `Promise.all(ids.map(fetch))` is one.

4. **`.forEach(async …)` does not wait at all.**
   `forEach` throws away the promises its callback returns, so the loop
   "finishes" instantly and your code runs before any of the work does.
   Use `for...of` with await, or `map` + `Promise.all`.

5. **`try` without `await` catches nothing.**
   `try { return load(); } catch {}` returns the pending promise and exits
   the try block; the rejection escapes to the caller. Write
   `return await load()` when you need the catch.

6. **A promise starts running the moment it is created.**
   `const p = deleteEverything();` has already deleted everything. Wrapping
   it in a `if (confirmed) await p` does not un-run it.

7. **`Promise.all` is all-or-nothing.**
   One rejection discards the other nine results — and does **not** cancel
   the other nine requests. Use `allSettled` when partial success is useful.

8. **`.then(fn())` calls fn immediately.**
   You wanted `.then(fn)`. With parentheses you pass fn's *return value*
   (usually `undefined`) as the handler, and the chain silently no-ops.

9. **A rejected string has no stack.**
   `reject('nope')` gives callers a string; `err.message` is undefined and
   the stack is gone. Always `reject(new Error('nope'))`.

10. **An uncleared timer keeps Node alive.**
    A 30-second timeout that lost the race still holds the event loop open
    for 30 seconds after your CLI printed its answer. `clearTimeout` in a
    `.finally`.

11. **A timeout is not a cancellation.**
    `withTimeout` only stops *waiting*; the work keeps running. Real
    cancellation needs an `AbortController` passed all the way down.

12. **Microtasks can starve timers.**
    A `.then` that queues another `.then` forever means `setTimeout` never
    fires. "It hangs but the CPU is at 100%" is the signature.

## Cheat table

| combinator | settles when | resolves with | rejects when |
|---|---|---|---|
| `Promise.all` | all fulfil, or one rejects | array of values, input order | first rejection |
| `Promise.allSettled` | all settle | array of `{status, value/reason}` | never |
| `Promise.race` | first settles | first settled value | first settlement is a rejection |
| `Promise.any` | first fulfils, or all reject | first fulfilled value | all reject → `AggregateError` |

| you want | reach for |
|---|---|
| everything, fail fast | `Promise.all` |
| everything, report each | `Promise.allSettled` |
| whichever answers first | `Promise.race` (also: timeouts) |
| any success, ignore failures | `Promise.any` |
| at most N at a time | `mapLimit` (exercise 23) |
| exactly one at a time | a task queue (exercise 24) |

## Exercises

| # | file | ★ | what you build |
|---|---|---|---|
| 01 | `01-order-basics.js` | ★☆☆ | predict sync vs `.then` vs `setTimeout` output |
| 02 | `02-order-nested.js` | ★★☆ | predict nested microtasks vs timers |
| 03 | `03-order-async-await.js` | ★★☆ | predict the classic async/await ordering puzzle |
| 04 | `04-callback-basics.js` | ★☆☆ | `divide(a, b, cb)` in error-first style |
| 05 | `05-callback-pyramid.js` | ★★☆ | chain three callback APIs — feel the pyramid |
| 06 | `06-promisify.js` | ★★★ | `promisify(fn)`: callbacks → promises |
| 07 | `07-delay.js` | ★☆☆ | `delay(ms)` with the Promise constructor |
| 08 | `08-delayed-value.js` | ★☆☆ | `delayedValue` and `failAfter` — resolve vs reject |
| 09 | `09-wrap-legacy.js` | ★★☆ | wrap a legacy success/error-handler API |
| 10 | `10-then-chain.js` | ★☆☆ | a four-link `.then` pipeline; returned promises flatten |
| 11 | `11-error-tunnel.js` | ★★☆ | one `.catch` for three steps; skipped handlers |
| 12 | `12-catch-recovery.js` | ★★☆ | recover in `.catch`, resume the chain, rethrow selectively |
| 13 | `13-finally.js` | ★★☆ | `.finally` cleanup and its pass-through rules |
| 14 | `14-my-promise-all.js` | ★★★ | rebuild `Promise.all` |
| 15 | `15-my-all-settled.js` | ★★★ | rebuild `Promise.allSettled` |
| 16 | `16-my-race.js` | ★★☆ | rebuild `Promise.race` |
| 17 | `17-my-any.js` | ★★★ | rebuild `Promise.any` with `AggregateError` |
| 18 | `18-await-rewrite.js` | ★★☆ | rewrite a `.then` chain with async/await |
| 19 | `19-try-catch-await.js` | ★★☆ | try/catch around await; rethrow with `{ cause }` |
| 20 | `20-parallel-vs-sequential.js` | ★★☆ | await-in-a-loop vs `Promise.all`, measured |
| 21 | `21-with-timeout.js` | ★★☆ | `withTimeout(promise, ms)` with timer cleanup |
| 22 | `22-retry-backoff.js` | ★★☆ | `retry(fn, times)` with exponential backoff |
| 23 | `23-map-limit.js` | ★★★ | `mapLimit(items, limit, fn)` worker pool |
| 24 | `24-task-queue.js` | ★★★ | a FIFO queue that runs one job at a time |
| 25 | `25-poll-until.js` | ★★☆ | `pollUntil(check, {intervalMs, timeoutMs})` |
| 26 | `26-batch-requests.js` | ★★★ | coalesce a tick of calls into one batched load |
| 27 | `27-abortable-delay.js` | ★★☆ | `AbortController`: cancel, clean up, no leaks |
| 28 | `28-once-event.js` | ★★★ | `once(emitter, event)` → promise, with listener hygiene |

Two-hour module: hour one = 01–13 (mechanics), hour two = 14–28
(combinators + patterns).

Do the warm-ups and core in order — 01–03 first, they pay for themselves
in every later file. Stretch if time allows; 23, 24 and 26 are the ones
worth putting on a résumé.

Run one file at a time:

```
node exercises/01-order-basics.js
```

Stuck? The matching file in `solutions/` has the same tests plus a
walkthrough explaining why. Read it, then close it and retype the
solution from memory.

### Extra reps

Twenty-four more, for when 01–28 stopped hurting. **29–34 are order
gauntlets** — same drill as 01–03: read the snippet, fill in
`export const answer = [...]`, then run. Every answer in this set was
verified by executing the snippet, so when you disagree with one, the
snippet is right and you have just found a bug in your mental model.

| # | file | ★ | what you build |
|---|---|---|---|
| 29 | `29-order-sync-throw.js` | ★★☆ | **order gauntlet** — a throw mid-chain; what a skipped handler costs |
| 30 | `30-order-finally.js` | ★★☆ | **order gauntlet** — `.finally` vs `.catch` and its two hidden ticks |
| 31 | `31-order-resolve-promise.js` | ★★★ | **order gauntlet** — `Promise.resolve(p)` vs resolving *with* a promise |
| 32 | `32-order-await-settled.js` | ★★☆ | **order gauntlet** — awaiting 42, a resolved promise, a thenable |
| 33 | `33-order-nested-async.js` | ★★☆ | **order gauntlet** — a→b→c: one tick per await on the way out |
| 34 | `34-order-race-loser.js` | ★★☆ | **order gauntlet** — the race loser that rejects 10ms too late |
| 35 | `35-dedupe-inflight.js` | ★★★ | `dedupe(fn)`: one request per key while it is in flight |
| 36 | `36-deferred.js` | ★☆☆ | the deferred pattern, by hand and with `Promise.withResolvers` |
| 37 | `37-waterfall-context.js` | ★★☆ | `runWaterfall(steps, initial)` — a context each step adds to |
| 38 | `38-partition-settled.js` | ★☆☆ | `allSettled` → `{ ok, failed }` with the original indexes |
| 39 | `39-retry-failures-only.js` | ★★★ | re-run only the items that rejected, never the successes |
| 40 | `40-fallback-any.js` | ★★☆ | `Promise.any` fallbacks that keep every reason |
| 41 | `41-retry-full-jitter.js` | ★★☆ | full jitter backoff, with random and sleep injected |
| 42 | `42-semaphore.js` | ★★★ | `Semaphore`: acquire/release over a FIFO waiter queue |
| 43 | `43-map-progress.js` | ★☆☆ | `mapWithProgress` — `onProgress(done, total)` |
| 44 | `44-cancelable-chain.js` | ★★★ | one `AbortSignal` through three steps, cleanup asserted |
| 45 | `45-emitter-async-iterator.js` | ★★★ | emitter → `for await`, buffered, no leaked listeners |
| 46 | `46-promisify-multi.js` | ★★☆ | `(err, a, b)` callbacks → a named object |
| 47 | `47-promisify-no-error.js` | ★☆☆ | callbacks with no error slot (the `fs.exists` trap) |
| 48 | `48-microtask-starvation.js` | ★★☆ | build the starvation bug on purpose and watch a timer hang |
| 49 | `49-chunked-yield.js` | ★★★ | the fix: yield to a macrotask every N items |
| 50 | `50-keyed-serial-queue.js` | ★★★ | serial per key, parallel across keys, no Map leak |
| 51 | `51-idempotency-key.js` | ★★☆ | same key, same answer — successes stick, failures do not |
| 52 | `52-ensure-ready.js` | ★★☆ | `ensureReady()` from forty call sites, init runs once |

Route through them: 29–34 in one sitting (they are quick and they
recalibrate everything else), then 35, 42, 44, 45, 49, 50 if you only
have time for six. 35/51/52 are three views of the same "store the
promise, not the value" idea — do them together and the difference
between their three cleanup rules is the whole lesson.

---

**Stuck?** `cheatsheets/promises-async.md` (ordering rules, the combinator table, the recipes) · **Deep dive:** `guides/01-the-event-loop-all-the-way-down.md` · **Self-check:** `quizzes/04-async-event-loop.md` · **Next:** `bootcamp/08-iterators-generators-modules`
