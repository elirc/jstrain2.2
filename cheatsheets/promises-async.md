# Promises & async/await

Event loop ordering, promise combinators, `async`/`await` patterns, and the bugs that eat your afternoon.

## Top of mind

| Question | Answer |
| --- | --- |
| Order of `setTimeout(f,0)` vs `.then` vs `nextTick`? | `nextTick` → `.then` (microtasks) → `setTimeout` (macrotask) |
| `await a; await b` — parallel? | **No.** Serial. Use `await Promise.all([a(), b()])` |
| `await` inside `.forEach()`? | Does nothing. `forEach` throws the promise away. Use `for...of` or `map`+`all` |
| Which combinator never rejects? | `Promise.allSettled` — always fulfils with `{status,value\|reason}[]` |
| Unhandled rejection in Node 22? | Crashes the process, exit code `1` |
| `return p` vs `return await p` in `try`? | `return await` lets the local `catch` see the rejection; `return` does not |

---

## The event loop

```txt
        ┌───────────────────────────────────────────────────────┐
        │  CALL STACK  (one frame at a time, runs to empty)     │
        │  script body · function calls · sync throws           │
        └───────────────────────────┬───────────────────────────┘
                                    │ stack empty
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │  NODE ONLY: process.nextTick queue   (drained FIRST)   │
        └───────────────────────────┬───────────────────────────┘
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │  MICROTASK QUEUE   — drained COMPLETELY, incl. any     │
        │  microtasks queued while draining (can starve loop)    │
        │  .then/.catch/.finally · await resumption ·            │
        │  queueMicrotask() · MutationObserver (browser)         │
        └───────────────────────────┬───────────────────────────┘
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │  MACROTASK / TASK QUEUE  — take exactly ONE, run it    │
        │  setTimeout · setInterval · I/O callbacks ·            │
        │  setImmediate (Node, check phase) · DOM events         │
        └───────────────────────────┬───────────────────────────┘
                                    │
                                    └──► back to microtask drain, repeat
```

**Rule in one line.** Run the stack to empty → drain **all** microtasks → run **one**
macrotask → drain microtasks again → next macrotask.

### Ordering rules

1. Synchronous code always finishes first. Nothing async interleaves with it.
2. `process.nextTick` callbacks (Node) run before promise microtasks, and its whole
   queue drains before the microtask queue is touched.
3. The microtask queue is drained **to empty** — microtasks queued by microtasks run in
   the same drain. An infinite `.then` chain starves timers forever.
4. Exactly **one** macrotask runs per turn; microtasks are drained again after it.
   So `setTimeout(a,0); setTimeout(b,0)` gives a full microtask drain *between* `a` and `b`.
5. `setTimeout(f, 0)` is clamped to ~1ms and means "a later turn", never "now".
6. `await x` costs at least one microtask tick even when `x` is not a promise.
7. Chained `.then`s go one link per drain pass, so two parallel chains interleave
   (`1 2 3 4 5 6`, not `1 3 5 2 4 6`).
8. **Node quirk.** At top level, `setTimeout(f,0)` vs `setImmediate(f)` is a genuine
   race (start-up timing decides). Inside an I/O callback, `setImmediate` **always** wins.

### The canonical quiz

```js
console.log('A sync');
setTimeout(() => console.log('F timeout'), 0);
setImmediate(() => console.log('G immediate'));
Promise.resolve().then(() => console.log('D promise'));
queueMicrotask(() => console.log('E microtask'));
process.nextTick(() => console.log('C nextTick'));
console.log('B sync end');
// logs: A sync, B sync end, C nextTick, D promise, E microtask, F timeout, G immediate
```

Verified on Node v22.16.0. `A`–`E` are guaranteed; `F`/`G` can swap at top level (rule 8).

```js
Promise.resolve().then(()=>console.log(1)).then(()=>console.log(3)).then(()=>console.log(5));
Promise.resolve().then(()=>console.log(2)).then(()=>console.log(4)).then(()=>console.log(6));
// logs: 1 2 3 4 5 6
```

---

## Promise states & anatomy

| Thing | Meaning / value |
| --- | --- |
| `pending` | Not settled yet. No callback has fired |
| `fulfilled` | Settled with a value. `.then(onFulfilled)` runs |
| `rejected` | Settled with a reason. `.catch`/`.then(_, onRejected)` runs |
| `settled` | Umbrella term: fulfilled **or** rejected. A promise settles **once**, forever |
| `new Promise((res, rej) => …)` | Executor runs **synchronously**, right now. A sync `throw` inside becomes a rejection |
| `Promise.resolve(v)` | Fulfilled promise. If `v` is already a promise, returns **the same object** |
| `Promise.reject(e)` | Rejected promise. Does **not** unwrap a promise `e` |
| `.then(f)` | Returns a **new** promise. `f`'s return value fulfils it |
| `.then(f)` where `f` returns a promise | Flattens (assimilates) — you get the inner value, not a nested promise |
| `.catch(f)` | Sugar for `.then(undefined, f)`. Recovering returns a **fulfilled** promise |
| `.finally(f)` | Passes the value/reason **through** — `f`'s return value is ignored |
| `.finally(f)` that **throws** | Overrides: the chain rejects with that error |
| `.finally(f)` that returns a promise | Chain waits for it before passing the original value through |
| thenable | Any object with a callable `.then`. `await`/`resolve` assimilate it automatically |

```js
Promise.resolve(1).finally(() => 2).then(v => console.log(v));  // logs: 1
Promise.resolve({ then(res) { res(42) } }).then(v => console.log(v));  // logs: 42
const p = Promise.resolve(1); console.log(Promise.resolve(p) === p);   // => true
```

**Gotcha.** `p.then(f) !== p`. Every `.then` mints a new promise, which is why
`.catch` at the end of a chain catches errors from every earlier link.

---

## Combinator table

| Combinator | Input | Resolves with | Rejects when | Settles when | Use for |
| --- | --- | --- | --- | --- | --- |
| `Promise.all` | iterable | array of values, **input order** | **first** rejection, with that reason (others discarded) | all fulfil, or one rejects | fan-out where every part is required |
| `Promise.allSettled` | iterable | array of `{status,value}` / `{status,reason}`, input order | **never** | every input settles | fan-out where partial failure is OK |
| `Promise.race` | iterable | value of first **settled** (fulfilled **or** rejected) | first settled is a rejection | first input settles | timeouts, "whoever answers first" |
| `Promise.any` | iterable | value of first **fulfilled** | **all** reject → `AggregateError` with `.errors[]` | first fulfilment, or all rejected | mirrors/fallbacks, first success wins |

Non-promise values in the iterable are wrapped with `Promise.resolve` first.

```js
Promise.allSettled([Promise.resolve(1), Promise.reject('nope')]).then(console.log);
// logs: [ { status: 'fulfilled', value: 1 }, { status: 'rejected', reason: 'nope' } ]
```

```js
Promise.any([Promise.reject(new Error('a')), Promise.reject(new Error('b'))])
  .catch(e => console.log(e.name, e.message, e.errors.map(x => x.message)));
// logs: AggregateError All promises were rejected [ 'a', 'b' ]
```

### Empty-iterable behaviour

| Call | Result |
| --- | --- |
| `Promise.all([])` | fulfils immediately (next microtask) with `[]` |
| `Promise.allSettled([])` | fulfils immediately with `[]` |
| `Promise.race([])` | **never settles** — pending forever, silently |
| `Promise.any([])` | rejects immediately with `AggregateError`, `.errors === []` |

**Gotcha.** `Promise.race([])` is the classic "my worker just hangs" bug: an empty
task list means `await` never returns and nothing errors.

---

## async / await

| Pattern | Code | Behaviour |
| --- | --- | --- |
| serial (usually wrong) | `const a = await f(); const b = await g();` | `g()` doesn't even start until `f()` resolves. ~200ms for two 100ms calls |
| parallel | `const [a,b] = await Promise.all([f(), g()]);` | both start now. ~100ms. Rejects fast on first failure |
| kick off, then await | `const pf = f(), pg = g(); const a = await pf, b = await pg;` | same parallelism, lets you interleave other work between |
| tolerant parallel | `const rs = await Promise.allSettled([f(), g()]);` | never throws; inspect each `rs[i].status` |
| `for await...of` | `for await (const v of src) …` | works on async iterables **and** on arrays of promises (awaits each) |
| deliberate serial loop | `for (const x of xs) await step(x);` | correct when steps depend on each other or you're rate-limiting |
| serial by accident | `for (const x of xs) results.push(await slow(x));` | N × latency. Use `Promise.all(xs.map(slow))` if independent |
| top-level `await` | `const cfg = await load();` at module top | **ESM only** (`.mjs` / `"type":"module"`). Blocks importers of that module |
| async always returns a promise | `const f = async () => 1; f() instanceof Promise` | `=> true`. Even `async () => {}` returns one |
| throw inside async | `async () => { throw e }` | returns a **rejected** promise; never throws synchronously |
| `await` a non-promise | `await 5` | `=> 5`, but still costs one microtask tick |
| `return p` in `try` | `try { return p } catch { … }` | the local `catch` **cannot** see `p`'s rejection — you already returned |
| `return await p` in `try` | `try { return await p } catch { … }` | the local `catch` **does** run. Use this inside try/catch |

```js
const boom = () => Promise.reject(new Error('boom'));
async function bad()  { try { return boom(); }       catch { return 'caught'; } } // => rejects
async function good() { try { return await boom(); } catch { return 'caught'; } } // => 'caught'
```

**Gotcha.** Outside a `try`, `return await p` is just an extra microtask tick — linters
flag it (`no-return-await`). Inside a `try`, dropping the `await` is a real bug.

---

## Error handling

| Technique | Code | Notes |
| --- | --- | --- |
| try/catch around `await` | `try { await f() } catch (e) { … }` | Only catches what you actually `await` |
| `.catch()` on a chain | `f().then(g).catch(h)` | Catches rejections from `f` **and** `g` — put it last |
| mid-chain recovery | `f().catch(() => fallback).then(g)` | `.catch` returns a fulfilled promise, so `g` still runs |
| `Promise.all` loses errors | `all([reject(A), reject(B)])` | You only ever see `A`. `B` is discarded (but not "unhandled") |
| keep every error | `await Promise.allSettled(ps)` then filter `status === 'rejected'` | The only way to report all failures |
| unhandled rejection | a rejected promise with no handler | **Node ≥15 crashes**: prints the error, exit code `1` |
| opt out (rarely) | `process.on('unhandledRejection', e => …)` | Suppresses the crash. Log and exit deliberately |
| cleanup | `try { … } finally { conn.release() }` | `finally` runs on both paths; also `.finally(fn)` on chains |
| error chaining | `throw new Error('load failed', { cause: err })` | `e.cause` keeps the original. ES2022 |
| cancellation | `const c = new AbortController(); c.abort()` | Pass `c.signal` to `fetch`, `fs`, `timers/promises` |
| check inside a loop | `signal.throwIfAborted()` | Throws `AbortError: This operation was aborted` |
| custom reason | `c.abort(new Error('user cancelled'))` | `signal.reason` is your error instead of `AbortError` |
| deadline signal | `AbortSignal.timeout(ms)` | Aborts with `TimeoutError`. Node 22: yes |
| combine signals | `AbortSignal.any([userSig, AbortSignal.timeout(5000)])` | First one to abort wins |

```js
const c = new AbortController(); c.abort();
try { c.signal.throwIfAborted() } catch (e) { console.log(e.name) }  // logs: AbortError
```

**Gotcha.** `AbortSignal.timeout(ms)` uses an **unref'd** timer — it will not keep a
Node process alive on its own. If nothing else is pending, the process exits first.

---

## Common bugs

| Bug | Symptom | Fix |
| --- | --- | --- |
| Forgot `await` (floating promise) | Function returns before work finishes; value is `Promise {…}` not data | `await` it, or `void p.catch(log)` if fire-and-forget is intentional |
| `try { asyncFn() } catch` | `catch` never fires; process crashes on unhandled rejection instead | `try { await asyncFn() } catch` |
| `await` inside `.forEach()` | Loop returns instantly, work runs "later", nothing is awaited | `for (const x of xs) await f(x)` (serial) or `Promise.all(xs.map(f))` (parallel) |
| `.map(async …)` without `Promise.all` | You get `[Promise, Promise, Promise]` | `await Promise.all(xs.map(async x => …))` |
| `await` in a loop over independent items | 100 items × 200ms = 20s | `Promise.all(xs.map(f))`, or a concurrency pool if the API rate-limits |
| `new Promise(async (res) => …)` | Rejections vanish: outer promise stays **pending forever** and the throw becomes an unhandled rejection (crash) | Never use an async executor. Just write an `async function` |
| Building promises before attaching handlers | `UnhandledPromiseRejection` even though you `.catch` later | Create the promise and attach the handler in the same tick; pass thunks (`() => f()`) when deferring |
| Creating promises *inside* `Promise.all(...)` args | Fine — `all` attaches handlers synchronously | Prefer `Promise.all([f(), g()])` over building `p1` on line 1 and `all` on line 40 |
| `.then(v => { doThing(v) })` — no `return` | Next `.then` receives `undefined`; chain doesn't wait | `return doThing(v)` (braces swallow, arrow-without-braces returns) |
| `Promise.race([])` / empty task list | Hangs silently, no error | Guard `if (!tasks.length) return []` |
| Reusing a settled promise expecting a retry | Same cached result/error every time | Wrap in a function: `const attempt = () => fetch(url)` |
| `await` inside a `.filter`/`.sort` callback | Predicate gets a truthy `Promise` — everything passes | Map to `{x, keep: await p}` first, then filter synchronously |

---

## Recipes

### sleep

Pause without blocking; optionally cancellable.

```js
const sleep = (ms, { signal } = {}) => new Promise((res, rej) => {
  const id = setTimeout(res, ms);
  signal?.addEventListener('abort', () => { clearTimeout(id); rej(signal.reason) }, { once: true });
});
```

Node has this built in: `import { setTimeout as delay } from 'node:timers/promises'`.

### Timeout wrapper

Fail a promise that takes too long.

```js
const withTimeout = (p, ms) => Promise.race([p,
  new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout after ${ms}ms`)), ms).unref())]);
// await withTimeout(sleep(200), 30)  // => rejects: timeout after 30ms
```

`race` doesn't cancel the loser — it just stops caring. For real cancellation:

```js
const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
// on timeout: rejects with TimeoutError: The operation was aborted due to timeout
```

### Retry with exponential backoff

Re-run a flaky operation, waiting longer each time.

```js
async function retry(fn, tries = 3, base = 100) {
  for (let i = 0; ; i++) {
    try { return await fn(i) }
    catch (err) { if (i >= tries - 1) throw err; await sleep(base * 2 ** i) }
  }
}
```

Add jitter (`base * 2 ** i * (0.5 + Math.random())`) when many clients retry at once.

### Limit concurrency (pool of N)

Run N at a time, preserving output order.

```js
async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  const worker = async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k) } };
  await Promise.all(Array.from({ length: n }, worker));
  return out;
}
// await pool([30,10,20,5], 2, async ms => { await sleep(ms); return ms * 2 })  // => [60,20,40,10]
```

One rejection kills the pool. Wrap `fn` in a `try/catch` returning a sentinel to be tolerant.

### promisify a callback API

Turn `(…args, cb(err, val))` into a promise-returning function.

```js
const promisify = fn => (...args) => new Promise((res, rej) =>
  fn(...args, (err, val) => (err ? rej(err) : res(val))));
// promisify(cbAdd)(2, 3)  // => 5
```

Node ships one: `import { promisify } from 'node:util'` — it also honours `util.promisify.custom`.

### Cancel stale results (last-write-wins)

Ignore responses from superseded calls — the search-box fix.

```js
function latest(fn) {
  let seq = 0;
  return async (...args) => {
    const my = ++seq; const v = await fn(...args);
    if (my !== seq) throw new Error('stale'); return v; };
}
```

Prefer an `AbortController` per call when the underlying API supports `signal`.

### Sequential map

`map` but one at a time, in order.

```js
async function mapSeries(items, fn) {
  const out = [];
  for (const [i, x] of items.entries()) out.push(await fn(x, i));
  return out;
}
```

### Async queue

Serialise tasks pushed from anywhere — writes to one file, one DB migration at a time.

```js
function queue() {
  let tail = Promise.resolve();
  return fn => (tail = tail.then(fn, fn));   // second `fn` keeps the chain alive after a failure
}
// const q = queue(); q(taskA); q(taskB);  // taskB starts only after taskA settles
```

### Deferred

A promise you resolve from outside — bridging events to promises.

```js
const { promise, resolve, reject } = Promise.withResolvers();   // ES2024, Node 22
setTimeout(() => resolve('later'), 10);
await promise;  // => 'later'
```

### Memoize an async function

Share one in-flight promise across concurrent callers; drop it on failure.

```js
function memoAsync(fn, key = (...a) => JSON.stringify(a)) {
  const cache = new Map();
  return (...args) => { const k = key(...args);
    if (!cache.has(k)) cache.set(k, fn(...args).catch(e => { cache.delete(k); throw e }));
    return cache.get(k); };
}
// Promise.all([m(3), m(3), m(4)])  // => [6,6,8], underlying fn called twice
```

Caching the **promise** (not the value) is what dedupes simultaneous callers.

### Collect an async iterable

Drain a stream or async generator into an array.

```js
const all = await Array.fromAsync(asyncIterable);            // ES2024, Node 22
const also = await Array.fromAsync([Promise.resolve(1), Promise.resolve(2)]);  // => [1, 2]
```

---
*See also: [js-gotchas.md](js-gotchas.md) · [es2020-plus.md](es2020-plus.md) · [node-api.md](node-api.md)*
