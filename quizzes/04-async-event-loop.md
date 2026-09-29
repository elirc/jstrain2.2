# 04 · Async and the Event Loop — ordering, promises, await, microtasks

Cover the answer, commit out loud, then reveal. Say the exact output order before you look.

---

### Q1 — the three queues

What does this print, in what order?

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
```

<details><summary>Answer</summary>

**`A`, `D`, `C`, `B`** — synchronous code first, then all microtasks, then timers.

The call stack runs to completion before anything async happens, so `A` and `D` print first. When the stack empties, the engine drains the **microtask queue** — promise callbacks and `queueMicrotask`, which share one FIFO queue — completely. Only then does it take one **macrotask** (timers, I/O) from the task queue. `setTimeout(fn, 0)` does not mean "now" — it means "after the current turn and after every pending microtask."

Node adds one queue *in front* of that: `process.nextTick` callbacks are not microtasks, and Node drains the whole nextTick queue before it touches promise callbacks. It makes no difference here, but see [`12-node-advanced.md`](12-node-advanced.md) Q2–Q3 for the ordering it does change.
</details>

---

### Q2 — the executor is synchronous

What does this print, in what order?

```js
console.log('outer start');
new Promise((resolve) => {
  console.log('executor');
  resolve('resolved');
}).then((v) => console.log('then', v));
console.log('outer end');
```

<details><summary>Answer</summary>

**`outer start`, `executor`, `outer end`, `then resolved`** — the function you pass to `new Promise` runs immediately, synchronously.

Nothing about `new Promise` defers anything: the executor is called during construction, on the current stack. Only the `.then` *callback* is deferred to the microtask queue, and it's deferred even though the promise is already resolved by the time `.then` is attached — a `.then` callback never runs synchronously, ever. That guarantee (called "no releasing Zalgo") is what makes promise-based control flow predictable.
</details>

---

### Q3 — async is sync until await

What does this print, in what order?

```js
async function run() {
  console.log('start');
  await null;
  console.log('after await');
}
console.log('before');
run();
console.log('after call');
```

<details><summary>Answer</summary>

**`before`, `start`, `after call`, `after await`** — an `async` function body runs synchronously up to the first `await`.

Calling `run()` does not schedule anything; it executes the body on the spot until it hits `await`, at which point the function suspends, returns a pending promise to the caller, and the rest of the body is queued as a microtask. So `start` beats `after call`, but `after await` loses to it. Corollary: input validation at the top of an async function throws synchronously-ish (into the returned promise) before any I/O begins.
</details>

---

### Q4 — throwing inside async

What does this print?

```js
async function fetchIt() {
  throw new Error('nope');
}
const p = fetchIt();
console.log(p instanceof Promise);
p.then(() => console.log('then')).catch((e) => console.log('caught:', e.message));
```

<details><summary>Answer</summary>

**`true`, then `caught: nope`** — an `async` function always returns a promise, and a `throw` inside it becomes a rejection.

There is no way for an `async` function to throw synchronously to its caller; the error is captured and used to reject the returned promise. That's why `try { fetchIt() } catch {}` without an `await` catches nothing. The `.then` handler is skipped because the promise rejected, and the rejection falls through to `.catch`. Note the flip side: an unhandled rejection crashes Node by default (since v15).
</details>

---

### Q5 — the missing await

What does this print?

```js
function getUser() {
  return Promise.resolve({ id: 1 });
}
async function main() {
  const user = getUser();
  console.log(user.id);
  const real = await getUser();
  console.log(real.id);
}
main();
```

<details><summary>Answer</summary>

**`undefined`, then `1`** — without `await`, `user` is the Promise object itself, and a Promise has no `id`.

This is the number-one async bug and it is silent: no crash, no warning, just `undefined` propagating downstream until something far away breaks. Tells that you forgot an `await`: a value that logs as `Promise { <pending> }`, a `.length` of `undefined`, or a `try/catch` that never fires. TypeScript catches this class of bug outright, which is a large part of why it's worth using.
</details>

---

### Q6 — parallel with Promise.all

What does this print?

```js
function delay(ms, label) {
  return new Promise((r) => setTimeout(() => r(label), ms));
}
async function main() {
  const t = Date.now();
  const results = await Promise.all([delay(30, 'one'), delay(30, 'two')]);
  console.log(results, Date.now() - t < 60);
}
main();
```

<details><summary>Answer</summary>

**`[ 'one', 'two' ] true`** — both timers were started before the `await`, so they overlap and the total is about 30ms, not 60.

`Promise.all` takes an iterable of already-started promises; the parallelism comes from *calling* both `delay`s in the array literal, not from `all` itself. The results array preserves input order regardless of which settles first, which is why you can safely destructure `const [user, posts] = await Promise.all([...])`. If one rejects, `all` rejects immediately with that reason — the others keep running, their results are just discarded.
</details>

---

### Q7 — sequential awaits

What does this print?

```js
function delay(ms, label) {
  return new Promise((r) => setTimeout(() => r(label), ms));
}
async function main() {
  const t = Date.now();
  const one = await delay(30, 'one');
  const two = await delay(30, 'two');
  console.log(one, two, Date.now() - t >= 60);
}
main();
```

<details><summary>Answer</summary>

**`one two true`** — each `await` blocks the function until it settles, so the two 30ms waits add up.

Same values as Q6, twice the wall time. This is the "await in a waterfall" performance bug: if the second request doesn't depend on the first result, you just doubled your latency for nothing. The fix is to start both, then await: `const pOne = delay(...); const pTwo = delay(...); const [a, b] = [await pOne, await pTwo];` — or just `Promise.all`. Sequential is correct only when there's a real data dependency.
</details>

---

### Q8 — awaiting things that aren't promises

What does this print?

```js
const thenable = {
  then(resolve) {
    resolve('from thenable');
  },
};
(async () => {
  console.log(await thenable);
  console.log(await 42);
})();
```

<details><summary>Answer</summary>

**`from thenable`, then `42`** — `await` accepts anything; non-promises are wrapped, and any object with a `then` method is adopted.

The spec defines a "thenable" as any object with a callable `then` property, and `await` (like `Promise.resolve`) will call it and adopt its outcome. That's how promise libraries from before ES6 interoperate with native promises. `await 42` wraps `42` in a resolved promise and yields it back — the value is unchanged, but you still pay one microtask tick, which matters for ordering questions.
</details>

---

### Q9 — nested microtasks

What does this print, in what order?

```js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => {
  console.log('3');
  Promise.resolve().then(() => console.log('4'));
});
Promise.resolve().then(() => console.log('5'));
console.log('6');
```

<details><summary>Answer</summary>

**`1`, `6`, `3`, `5`, `4`, `2`** — a microtask that queues another microtask gets drained in the same pass, before any timer.

Sync code gives `1` and `6`. The microtask queue then holds `[3-handler, 5-handler]`. Running the first prints `3` and *appends* the `4`-handler to the same queue. The loop keeps draining until the queue is empty, so `5` (already queued) comes before `4` (queued during the drain), and only then does the timer fire. Because the drain is exhaustive, an infinitely self-queueing microtask starves timers and I/O forever.
</details>

---

### Q10 — two independent chains

What does this print, in what order?

```js
Promise.resolve()
  .then(() => console.log('chain A1'))
  .then(() => console.log('chain A2'))
  .then(() => console.log('chain A3'));
Promise.resolve()
  .then(() => console.log('chain B1'))
  .then(() => console.log('chain B2'))
  .then(() => console.log('chain B3'));
```

<details><summary>Answer</summary>

**`A1, B1, A2, B2, A3, B3`** — the two chains interleave, one link per microtask pass.

Each `.then` returns a *new* promise, and its handler is queued only when the previous one settles. So the initial queue holds `[A1, B1]`. Running `A1` queues `A2` at the back — behind `B1`, which is already there. This tick-by-tick interleaving is the mental model to hold: a chain of N `.then`s costs N sequential microtask turns, and independent chains take turns.
</details>

---

### Q11 — awaiting an async function

What does this print, in what order?

```js
async function a() {
  console.log('a1');
  await b();
  console.log('a2');
}
async function b() {
  console.log('b1');
}
a();
console.log('sync');
Promise.resolve().then(() => console.log('micro'));
```

<details><summary>Answer</summary>

**`a1`, `b1`, `sync`, `a2`, `micro`** — `b()`'s body runs synchronously, and `await` on a native promise costs exactly one tick.

`a()` prints `a1`, then calls `b()` which prints `b1` immediately and returns an already-resolved promise. `await` suspends `a` and queues its continuation as microtask #1. Sync code prints `sync` and queues the `.then` as microtask #2. Drain order gives `a2` then `micro`. Worth knowing for interviews: before the 2019 "await optimization" this took three ticks and `micro` printed first — so old blog posts get this question wrong.
</details>

---

### Q12 — throwing mid-chain

What does this print, in what order?

```js
Promise.resolve('v')
  .then(() => {
    throw new Error('mid');
  })
  .then(() => console.log('skipped'))
  .catch((e) => console.log('catch:', e.message))
  .then(() => console.log('continues'));
```

<details><summary>Answer</summary>

**`catch: mid`, then `continues`** — a rejection skips every fulfillment handler until it finds a rejection handler, and the chain recovers afterward.

`.then(onFulfilled)` with no second argument passes rejections straight through, so `skipped` never runs. `.catch(fn)` is just `.then(undefined, fn)`. Crucially, `catch` *handles* the rejection and returns a fulfilled promise (with `undefined`), so the chain continues normally — that's why `continues` prints. Put `.catch` at the end of a chain, not in the middle, unless you intend to recover and keep going.
</details>

---

### Q13 — catch, then finally

What does this print, in what order?

```js
Promise.reject(new Error('x'))
  .catch((e) => 'recovered:' + e.message)
  .then((v) => console.log(v))
  .finally(() => console.log('finally'));
```

<details><summary>Answer</summary>

**`recovered:x`, then `finally`** — the value returned from `catch` becomes the fulfillment value of the next link.

`catch` isn't a dead end; whatever it returns resolves the promise it produced, which is how you supply fallback data after a failed request. `finally` runs on both paths and is for cleanup — hiding a spinner, closing a handle. Note it receives no argument and is at the very end here, so it prints last.
</details>

---

### Q14 — all versus allSettled

What does this print, in what order?

```js
const ok = Promise.resolve('ok');
const bad = Promise.reject(new Error('boom'));
(async () => {
  try {
    await Promise.all([ok, bad]);
  } catch (e) {
    console.log('all rejected:', e.message);
  }
  const settled = await Promise.allSettled([ok, bad]);
  console.log(settled.map((s) => s.status).join(','));
  console.log(settled[1].reason.message);
})();
```

<details><summary>Answer</summary>

**`all rejected: boom`**, **`fulfilled,rejected`**, **`boom`** — `all` is fail-fast, `allSettled` never rejects.

`Promise.all` rejects with the first rejection reason and discards the successful results, which is right for "I need all of these or nothing." `allSettled` always fulfills with one descriptor per input: `{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }`. Use it for batch jobs where partial success is useful — sending 100 emails, warming 20 caches. Note `reason` holds the Error object, not its message.
</details>

---

### Q15 — race versus any

What does this print, in what order?

```js
function delay(ms, v, fail) {
  return new Promise((res, rej) =>
    setTimeout(() => (fail ? rej(new Error(v)) : res(v)), ms)
  );
}
Promise.race([delay(10, 'fast'), delay(50, 'slow')]).then((v) =>
  console.log('race', v)
);
Promise.any([delay(10, 'err', true), delay(30, 'second')]).then((v) =>
  console.log('any', v)
);
```

<details><summary>Answer</summary>

**`race fast`, then `any second`** — `race` settles on the first promise to settle *either way*; `any` waits for the first to **fulfill**.

`race` is the timeout primitive: `Promise.race([work, rejectAfter(5000)])`. Because it takes the first settlement, a fast rejection wins a race — which is often what you want, and sometimes a nasty surprise. `any` ignores rejections and only gives up when *all* inputs reject, in which case it rejects with an `AggregateError` holding every reason. Neither one cancels the losers; JavaScript promises are not cancellable, you need `AbortController` for that.
</details>

---

### Q16 — map with an async callback

What does this print?

```js
async function main() {
  const results = [1, 2, 3].map(async (n) => n * 2);
  console.log(results);
  console.log(await Promise.all(results));
}
main();
```

<details><summary>Answer</summary>

**`[ Promise { 2 }, Promise { 4 }, Promise { 6 } ]`**, then **`[ 2, 4, 6 ]`** — an `async` callback returns a promise, so `map` collects promises.

`map` has no idea what `async` means; it just stores whatever each callback returns. That gives you an array of promises, which is actually the *good* pattern: all three started concurrently, and `Promise.all` waits for them together. The bug is forgetting the `Promise.all` and treating `results` as data. If you need them sequential, use a `for...of` loop with `await` inside.
</details>

---

### Q17 — forEach does not await

What does this print, in what order?

```js
async function main() {
  const ids = [1, 2, 3];
  const out = [];
  ids.forEach(async (id) => {
    await null;
    out.push(id);
  });
  console.log('after forEach:', out);
  for (const id of ids) {
    await null;
    out.push(id * 10);
  }
  console.log('after for-of:', out);
}
main();
```

<details><summary>Answer</summary>

**`after forEach: []`**, then **`after for-of: [ 1, 2, 3, 10, 20, 30 ]`** — `forEach` ignores the promises its callback returns and moves on immediately.

The three async callbacks all suspend at `await null` and their continuations sit in the microtask queue. `forEach` returns instantly, so `out` is still empty when logged. The `for...of` loop's first `await` yields control, letting those three queued continuations run and push `1, 2, 3` — before the loop pushes `10`. `for...of` with `await` is the only loop form that actually sequences; `map` + `Promise.all` is the concurrent form.
</details>

---

### Q18 — try, catch, finally in async

What does this print, in what order?

```js
async function risky() {
  try {
    await Promise.reject(new Error('inner'));
  } catch (e) {
    console.log('caught in async:', e.message);
    return 'handled';
  } finally {
    console.log('finally runs');
  }
}
risky().then((v) => console.log('resolved with:', v));
```

<details><summary>Answer</summary>

**`caught in async: inner`**, **`finally runs`**, **`resolved with: handled`** — `await` converts a rejection into a thrown exception that ordinary `try/catch` can handle.

That's the whole point of `async/await`: it makes asynchronous errors behave like synchronous ones. `finally` runs *after* the `return` value is computed but *before* the function actually returns — so the log order is catch, finally, caller. Because the error was handled and a value returned, the promise fulfills rather than rejects. (Careful: a `return` inside `finally` would override the one in `catch`.)
</details>

---

### Q19 — a microtask inside a timer

What does this print, in what order?

```js
console.log('script start');
setTimeout(() => {
  console.log('timeout');
  Promise.resolve().then(() => console.log('micro inside timeout'));
}, 0);
setTimeout(() => console.log('timeout 2'), 0);
Promise.resolve().then(() => console.log('micro'));
console.log('script end');
```

<details><summary>Answer</summary>

**`script start`, `script end`, `micro`, `timeout`, `micro inside timeout`, `timeout 2`** — the microtask queue is drained after *every* macrotask, not just after the main script.

After the first timer callback finishes, the engine drains microtasks before picking up the second timer — so `micro inside timeout` beats `timeout 2` even though `timeout 2` was queued much earlier. This "one macrotask, then drain all microtasks" rhythm is the entire event loop in one sentence. (Node's loop has extra phases and `process.nextTick` jumps ahead of even promises, but this rule holds in both Node and browsers.)
</details>

---

### Q20 — nested async ordering

What does this print, in what order?

```js
async function main() {
  console.log('1');
  const r = await (async () => {
    console.log('2');
    return '3';
  })();
  console.log(r);
}
main().then(() => console.log('4'));
console.log('5');
```

<details><summary>Answer</summary>

**`1`, `2`, `5`, `3`, `4`** — both async bodies run synchronously up to their awaits, and each suspension costs a tick.

`main()` prints `1`, then immediately invokes the inner async IIFE, whose body prints `2` synchronously and returns a resolved promise. `await` suspends `main` and queues its continuation, so control returns to the top level and `5` prints. Draining microtasks resumes `main` (printing `3`), which then resolves `main()`'s promise and queues the `.then` — printing `4` last.
</details>

---

### Q21 — for await of

What does this print, in what order?

```js
async function* gen() {
  yield 1;
  yield 2;
}
(async () => {
  for await (const v of gen()) console.log('got', v);
  console.log('done');
})();
console.log('sync after');
```

<details><summary>Answer</summary>

**`sync after`, `got 1`, `got 2`, `done`** — `for await...of` suspends on every iteration, so the whole loop is asynchronous.

Unlike Q3, there is no synchronous head start here: calling an async generator returns an async iterator without running any body code, and the first `await` happens before the first `yield` is delivered. Each iteration awaits the `next()` promise, so the loop naturally sequences. This is the right shape for consuming streams, paginated APIs, and line-by-line file reads — you get backpressure for free because you don't ask for the next chunk until you've handled this one.
</details>

---

### Q22 — a promise settles once

What does this print?

```js
const p = new Promise((resolve, reject) => {
  resolve('first');
  resolve('second');
  reject(new Error('third'));
});
p.then((v) => console.log('settled with:', v)).catch(() => console.log('never'));
```

<details><summary>Answer</summary>

**`settled with: first`** — a promise transitions from pending exactly once; every later `resolve`/`reject` is a no-op.

This immutability is the core guarantee that separates promises from callbacks: once settled, the state and value can never change, and any handler attached later (even much later) gets that same value. The extra calls don't throw or warn, they're simply ignored — which is convenient in an executor that races several sources, but also means a bug where you resolve early is completely silent. Note `resolve` does not return from the executor; code after it still runs.
</details>

---

### Q23 — finally costs extra ticks

What does this print, in what order?

```js
Promise.resolve('original')
  .finally(() => 'ignored')
  .then((v) => console.log('1:', v));
Promise.resolve('original')
  .then(() => 'replaced')
  .then((v) => console.log('2:', v));
```

<details><summary>Answer</summary>

**`2: replaced`, then `1: original`** — `finally` passes the original value straight through, and it takes more microtask turns to do it.

The `finally` callback's return value is discarded (unless it throws or returns a rejected promise), so chain 1 still carries `'original'`. `then` replaces the value with whatever the callback returns, so chain 2 carries `'replaced'`. The ordering surprise comes from the spec's definition of `finally`: it's implemented as `then(v => resolve(cb()).then(() => v))`, and adopting that inner promise costs extra ticks — so the shorter-looking chain finishes last.
</details>

---

### Q24 — the lost update

What does this print?

```js
let value = 0;
async function inc() {
  const current = value;
  await null;
  value = current + 1;
}
Promise.all([inc(), inc(), inc()]).then(() => console.log('value:', value));
```

<details><summary>Answer</summary>

**`value: 1`** — all three calls read `value` as `0` before any of them writes, so two increments are lost.

JavaScript is single-threaded but it is *not* free of race conditions. Every `await` is a place where other code can interleave, and here all three functions run their read phase synchronously (before their first `await`) and their write phase afterwards. This is the classic read-modify-write race, and it appears in real code as double-spent credits, clobbered caches, and lost form edits. Fix it by reading and writing without an `await` in between, or by serializing the operations behind a promise chain / mutex.
</details>

---

### Q25 — return versus return await

What does this print, in what order?

```js
async function bad() {
  try {
    return Promise.reject(new Error('escaped'));
  } catch (e) {
    return 'caught';
  }
}
async function good() {
  try {
    return await Promise.reject(new Error('escaped'));
  } catch (e) {
    return 'caught';
  }
}
const label = (p) =>
  p.then((v) => 'resolved ' + v, (e) => 'rejected ' + e.message);
(async () => {
  console.log('bad  ->', await label(bad()));
  console.log('good ->', await label(good()));
})();
```

<details><summary>Answer</summary>

**`bad  -> rejected escaped`**, then **`good -> resolved caught`** — a bare `return promise` escapes the `try` block before the promise ever settles.

`return somePromise` hands the promise to the async machinery, which adopts it *outside* the `try/catch` — so the `catch` block is already out of scope when the rejection arrives, and it propagates to the caller. `return await somePromise` waits for it *inside* the block, so the rejection becomes a throw that `catch` can see. Outside a `try` (or a `finally`), `return await` is a redundant extra tick and linters flag it; inside one, it is load-bearing.
</details>

---

### Q26 — a finally that throws

What does this print?

```js
Promise.reject(new Error('original'))
  .finally(() => {
    throw new Error('from finally');
  })
  .catch((e) => console.log('caught:', e.message));
```

<details><summary>Answer</summary>

**`caught: from finally`** — a throw inside `finally` replaces whatever the chain was already carrying, and the original error is gone.

`finally` normally passes both fulfillment values and rejection reasons straight through (Q23), but only if its callback completes normally. If it throws, the promise it returns rejects with *that* reason instead, and the original `Error('original')` is discarded with no trace anywhere — not logged, not chained, not in `e.cause`. This is why cleanup code belongs in its own `try/catch`: a failing `span.end()` or `conn.release()` should never be able to overwrite the real failure you were trying to report.
</details>

---

### Q27 — a finally that returns a rejection

What does this print?

```js
Promise.resolve('value')
  .finally(() => Promise.reject(new Error('cleanup failed')))
  .then((v) => console.log('then:', v))
  .catch((e) => console.log('catch:', e.message));
```

<details><summary>Answer</summary>

**`catch: cleanup failed`** — `finally` ignores its callback's *value* but not its *rejection*.

The spec implements `finally(cb)` as roughly `then(v => Promise.resolve(cb()).then(() => v))`, so the callback's return value is awaited before the original value is passed on. A returned plain value is thrown away, which is why `finally(() => 'ignored')` cannot change the result — but a returned *rejected* promise poisons the chain, and the successful `'value'` never reaches the `then`. Returning anything from a `finally` callback is almost always a mistake; make it a statement, not an expression.
</details>

---

### Q28 — return inside finally

What does this print?

```js
function f() {
  try {
    return 'from try';
  } finally {
    return 'from finally';
  }
}
console.log(f());
async function g() {
  try {
    throw new Error('boom');
  } finally {
    return 'swallowed';
  }
}
g().then((v) => console.log('g:', v));
```

<details><summary>Answer</summary>

**`from finally`**, then **`g: swallowed`** — a `return` in `finally` overrides everything, including a pending exception.

The `try` block computes `'from try'` and stores it as the pending completion, then `finally` runs and *replaces* that completion entirely. The async version is the dangerous one: the thrown error is fully discarded and the promise fulfills, so a caller's `.catch` never fires and the failure vanishes. Linters flag `no-unsafe-finally` for exactly this. The same applies to `break` and `continue` inside a `finally` — cleanup blocks should not control flow.
</details>

---

### Q29 — an await inside finally

What does this print?

```js
const order = [];
async function work() {
  try {
    return 'result';
  } finally {
    order.push('finally-start');
    await null;
    order.push('finally-end');
  }
}
work().then((v) => order.push('resolved:' + v));
Promise.resolve()
  .then(() => order.push('m1'))
  .then(() => order.push('m2'))
  .then(() => order.push('m3'));
setTimeout(() => console.log(order.join(' ')), 0);
```

<details><summary>Answer</summary>

**`finally-start finally-end m1 resolved:result m2 m3`** — the return value is computed before `finally` runs, but the function cannot resolve until `finally` finishes awaiting.

`return 'result'` evaluates immediately and parks the value; `finally` then runs synchronously up to `await null`, which suspends the whole function and queues its continuation *before* the `m1` handler is registered. When that continuation resumes it pushes `finally-end` and only then resolves `work()`'s promise, so `resolved:result` lands behind `m1` in the queue. Every `await` in a cleanup block delays the caller by a tick — which is exactly how a slow `finally` turns a fast handler into a bottleneck.
</details>

---

### Q30 — a thenable that oversteps

What does this print?

```js
const thenable = {
  then(resolve, reject) {
    console.log('then called:', typeof resolve, typeof reject);
    resolve('first');
    resolve('second');
    reject(new Error('ignored'));
  },
};
Promise.resolve(thenable).then(
  (v) => console.log('got', v),
  () => console.log('rejected')
);
```

<details><summary>Answer</summary>

**`then called: function function`**, then **`got first`** — the adopting machinery hands your `then` both callbacks and guards them so only the first call counts.

`Promise.resolve` on a thenable queues a job that invokes `then(resolvingFunctions)`. Those functions carry an `alreadyResolved` flag, so the second `resolve` and the `reject` are silent no-ops — the same once-only guarantee a real promise gives you (Q22), enforced on foreign code that has no idea about it. That's what makes it safe to adopt a thenable from a library you don't control: the worst a badly written `then` can do is settle you once.
</details>

---

### Q31 — then that isn't callable

What does this print?

```js
const notThenable = { then: 'not a function', value: 1 };
console.log(Promise.resolve(notThenable) instanceof Promise);
Promise.resolve(notThenable).then((v) => console.log(typeof v, v.then, v.value));
```

<details><summary>Answer</summary>

**`true`**, then **`object not a function 1`** — the thenable test checks that `then` is *callable*, not merely present.

`Promise.resolve` reads `x.then`, and if it isn't a function the value is treated as an ordinary non-promise and wrapped as-is. So the object arrives at the handler intact, `then` string and all. This matters because plenty of real data has a `then` field — a workflow record, a form with a "then do this" step, anything parsed from user JSON — and only a *callable* one hijacks the chain. The dangerous case is the reverse: an object that accidentally has a callable `then` can never be the resolution value of a promise, because the machinery will always unwrap it.
</details>

---

### Q32 — a thenable wrapping a thenable

What does this print?

```js
const inner = { then: (res) => res('inner') };
const outer = { then: (res) => res(inner) };
const order = [];
Promise.resolve(outer).then((v) => order.push('outer:' + v));
Promise.resolve()
  .then(() => order.push('m1'))
  .then(() => order.push('m2'))
  .then(() => order.push('m3'))
  .then(() => order.push('m4'));
setTimeout(() => console.log(order.join(' ')), 0);
```

<details><summary>Answer</summary>

**`m1 m2 outer:inner m3 m4`** — each layer of thenable costs one extra microtask turn, so the value arrives on tick three.

Adopting a thenable is not free: the engine queues a job to *call* `outer.then` (tick 1), that call resolves with `inner`, which is itself a thenable, so another job is queued to call `inner.then` (tick 2), and only then is the fulfillment handler scheduled (tick 3). Native promises are cheaper because `Promise.resolve` short-circuits them entirely (Q34). If you're ever counting ticks in an ordering puzzle and the answer is one late, look for a thenable — a jQuery deferred, a Bluebird promise, or a hand-rolled mock in a test.
</details>

---

### Q33 — returning a thenable from a handler

What does this print?

```js
const order = [];
Promise.resolve()
  .then(() => ({ then: (res) => res('adopted') }))
  .then((v) => order.push('A:' + v));
Promise.resolve()
  .then(() => 'plain')
  .then((v) => order.push('B:' + v));
setTimeout(() => console.log(order.join(' ')), 0);
```

<details><summary>Answer</summary>

**`B:plain A:adopted`** — chain B is shorter in ticks even though both chains have the same number of `.then` calls.

Returning a plain value from a handler resolves the next promise immediately, so B's second handler runs on tick 2. Returning a *thenable* makes the machinery queue a job to call its `then`, so A's value only lands on tick 3 and A finishes last. The lesson is that "number of `.then`s" is not the unit of latency — what a handler returns is. Returning a promise or thenable from a handler is normal and correct; just know it costs turns, which is the same reason `return await` outside a `try` gets flagged.
</details>

---

### Q34 — resolve of a promise is a no-op

What does this print?

```js
const p = Promise.resolve('x');
console.log(Promise.resolve(p) === p, new Promise((r) => r(p)) === p);
const order = [];
Promise.resolve(p).then(() => order.push('resolve(p)'));
new Promise((r) => r(p)).then(() => order.push('new-Promise'));
Promise.resolve()
  .then(() => order.push('m1'))
  .then(() => order.push('m2'))
  .then(() => order.push('m3'));
setTimeout(() => console.log(order.join(' ')), 0);
```

<details><summary>Answer</summary>

**`true false`**, then **`resolve(p) m1 m2 new-Promise m3`** — `Promise.resolve` returns its argument untouched when it's already a native promise; wrapping it by hand costs two extra ticks.

`Promise.resolve(x)` checks whether `x` is a promise whose `constructor` is the same as its own, and if so hands it straight back — same object, zero cost, which is why it's the safe idempotent way to normalize "value or promise". `new Promise(r => r(p))` cannot do that: it must create a fresh promise and then *adopt* `p`, which queues a job to call `p.then` and another to propagate the result. That's the anti-pattern behind `new Promise(resolve => resolve(fetchIt()))` — a wrapper that adds latency and a second failure surface for nothing.
</details>

---

### Q35 — three shapes racing through the queue

What does this print?

```js
const order = [];
Promise.resolve()
  .then(() => order.push('A1'))
  .then(() => order.push('A2'));
(async () => {
  order.push('B0');
  await 1;
  order.push('B1');
  await 2;
  order.push('B2');
})();
Promise.resolve().then(() => order.push('C1'));
setTimeout(() => console.log(order.join(' ')), 0);
```

<details><summary>Answer</summary>

**`B0 A1 B1 C1 A2 B2`** — one link per turn, in registration order, with the async body's synchronous head start out in front.

Sync execution registers A1's handler, runs the async IIFE far enough to push `B0` and suspend at the first `await` (queuing its continuation second), then registers C1's handler third. Tick 1 therefore drains `[A1, B-resume, C1]`, and each of those queues its own successor at the back: A2 and B2 land on tick 2, in that order. An `await` on a non-promise costs exactly one turn, the same as a `.then` link — which is what makes async functions and explicit chains interleave so predictably once you count registrations rather than reading top to bottom.
</details>

---

### Q36 — the loop versus the batch

What does this print?

```js
const order = [];
const task = (n) => Promise.resolve().then(() => order.push('run' + n));
(async () => {
  for (const n of [1, 2]) await task(n);
  order.push('loop-done');
  await Promise.all([3, 4].map(task));
  order.push('all-done');
  console.log(order.join(' '));
})();
```

<details><summary>Answer</summary>

**`run1 run2 loop-done run3 run4 all-done`** — the printed order is identical, and that is exactly why the performance difference is invisible in a log.

In the loop, `task(2)` is not even *created* until `task(1)` has settled, so the work is strictly serial and total latency is the sum. In the `map`, both promises are constructed in the same synchronous pass — `run3` and `run4` are already in flight before `Promise.all` is called — so total latency is the max, not the sum. Same trace, different wall clock. When you're auditing code for the waterfall bug (Q7), look at where the calls are *made*, not at where they're awaited.
</details>

---

### Q37 — withResolvers

What does this print?

```js
const { promise, resolve } = Promise.withResolvers();
console.log(typeof resolve, promise instanceof Promise);
promise.then((v) => console.log('resolved with', v));
setTimeout(() => resolve('later'), 0);
```

<details><summary>Answer</summary>

**`function true`**, then **`resolved with later`** — `Promise.withResolvers()` (ES2024, Node 22) hands you the promise and its two settle functions as a plain object.

Before it, everyone wrote the "deferred" pattern by hand: declare `let resolve`, construct `new Promise(r => { resolve = r })`, and rely on the executor running synchronously to fill the variable in. That works but is noisy and easy to get wrong. This is the shape you want whenever the thing that settles the promise is *elsewhere* — an event listener, a WebSocket message, a queue consumer, a callback-style API you're promisifying. If the settling logic fits inside the executor, keep using `new Promise`.
</details>

---

### Q38 — deduping in-flight work

What does this print?

```js
let calls = 0;
const cache = new Map();
const load = (id) => {
  if (!cache.has(id)) {
    calls += 1;
    cache.set(id, Promise.resolve('data-' + id).finally(() => cache.delete(id)));
  }
  return cache.get(id);
};
(async () => {
  const [a, b] = await Promise.all([load(7), load(7)]);
  console.log(a, b, calls, cache.size);
  await load(7);
  console.log(calls);
})();
```

<details><summary>Answer</summary>

**`data-7 data-7 1 0`**, then **`2`** — caching the *promise* rather than the result collapses concurrent callers into one fetch, and the `finally` makes it an in-flight cache rather than a result cache.

Two simultaneous `load(7)` calls get the identical promise object, so only one request is made and both awaits resolve from it. Then `finally` removes the entry as soon as it settles, which is why `cache.size` is already `0` and the later call counts as a second fetch. That eviction is the load-bearing line: without it a *rejected* promise stays cached forever and every future caller replays the same failure — the classic "one blip and the endpoint is broken until restart" bug.
</details>

---

### Q39 — a concurrency limiter

What does this print?

```js
async function pool(limit, items, fn) {
  const it = items[Symbol.iterator]();
  await Promise.all(
    Array.from({ length: limit }, async () => {
      for (const item of it) await fn(item);
    })
  );
}
let active = 0;
let peak = 0;
const done = [];
const job = async (n) => {
  active += 1;
  peak = Math.max(peak, active);
  await null;
  done.push(n);
  active -= 1;
};
pool(2, [1, 2, 3, 4, 5], job).then(() => console.log(peak, done.join('')));
```

<details><summary>Answer</summary>

**`2 12345`** — never more than two jobs in flight, and every item is processed exactly once.

The trick is the *shared iterator*: `limit` worker loops all pull from the same `it`, and because `for...of` calls `next()` synchronously, no two workers can ever receive the same item. Each worker takes a new item only after its previous `await` resolves, so the pool self-balances toward slow items instead of pre-partitioning the work. This is the fix for `await Promise.all(thousandUrls.map(fetch))`, which opens a thousand sockets at once and gets you rate-limited; it is roughly what `p-limit` does in twelve lines.
</details>

---

### Q40 — Node's three fast lanes

What does this print?

```js
const order = [];
setTimeout(() => order.push('timeout'), 0);
Promise.resolve().then(() => order.push('then'));
queueMicrotask(() => order.push('queueMicrotask'));
process.nextTick(() => order.push('nextTick'));
order.push('sync');
setTimeout(() => console.log(order.join(' ')), 0);
```

<details><summary>Answer</summary>

**`sync nextTick then queueMicrotask timeout`** — `process.nextTick` jumps the whole microtask queue, and `queueMicrotask` shares one FIFO queue with promise callbacks.

Node keeps the nextTick queue separate and drains it *completely* before it touches microtasks, regardless of registration order — that's why `nextTick` beats a `.then` registered two lines earlier. The exact rule is "drain ticks, drain microtasks, repeat", which is why this holds for top-level script code but not from *inside* a microtask: save these same lines as an `.mjs` file and the module body is already running as a promise job, so the tick has to wait for the microtask queue and you get `sync then queueMicrotask nextTick timeout`. `queueMicrotask` and `.then` are the same lane, so between them it is pure registration order. Timers are a full macrotask phase later. The practical rule: `queueMicrotask` for "after this stack unwinds", `nextTick` almost never in application code, because a recursive `nextTick` starves promises, timers, and I/O forever.
</details>

---

### Q41 — for await over an array

What does this print?

```js
const order = [];
const delay = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));
(async () => {
  const promises = [delay(50, 'slow'), Promise.resolve('fast')];
  for await (const v of promises) order.push(v);
  console.log(order.join(' '));
})();
```

<details><summary>Answer</summary>

**`slow fast`** — `for await` over a plain array awaits each element in *index* order, not in settle order.

The array's ordinary sync iterator yields the promises one at a time and `for await` awaits each before moving on, so the loop blocks 50ms on the first element even though the second was ready immediately. Both timers still started in the array literal, so nothing is serialized — you just receive the results in a fixed order. That makes this shape safe for "process results in order" but useless for "handle whichever finishes first"; for that you need `Promise.race` in a loop, or a library's `allSettled`-with-callbacks.
</details>

---

### Q42 — a hand-written async iterable

What does this print?

```js
const source = {
  [Symbol.asyncIterator]() {
    let n = 0;
    return { next: async () => (n < 3 ? { value: n++, done: false } : { done: true }) };
  },
};
(async () => {
  const out = [];
  for await (const v of source) out.push(v);
  console.log(out, typeof source[Symbol.iterator]);
})();
```

<details><summary>Answer</summary>

**`[ 0, 1, 2 ] undefined`** — the whole async-iteration protocol is one method returning an object with a promise-returning `next`.

`for await...of` looks for `Symbol.asyncIterator` first and only falls back to `Symbol.iterator` (awaiting each yielded value) if there isn't one — this object has no sync iterator at all, so `for (const v of source)` would throw. A result is `{ value, done }`, and `done: true` ends the loop with its `value` discarded. Async generators (Q21) are sugar over exactly this, and every Node stream, `readline` interface, and paginated API client you consume with `for await` is implementing it.
</details>

---

### Q43 — what Promise.all accepts

What does this print?

```js
const order = [];
Promise.all([]).then((v) => order.push('empty:' + JSON.stringify(v)));
Promise.all([1, Promise.resolve(2), 'three']).then((v) => order.push('mixed:' + v.join('|')));
Promise.resolve()
  .then(() => order.push('m1'))
  .then(() => order.push('m2'))
  .then(() => order.push('m3'));
setTimeout(() => console.log(order.join(' ')), 0);
```

<details><summary>Answer</summary>

**`empty:[] m1 mixed:1|2|three m2 m3`** — `all` takes any iterable of *values*, promises or not, and the empty case fulfills a tick sooner than the populated one.

Every element is put through `Promise.resolve` internally, so plain values pass through untouched and land in the results array in input position. `Promise.all([])` has nothing to wait for and fulfills with `[]` on the first turn, which is what makes `Promise.all(items.map(...))` correct for an empty list instead of hanging. The populated version needs one extra turn to attach handlers to each element and collect them, which is why it lands behind `m1`. Note `Promise.race([])` is the opposite trap: it stays pending forever.
</details>

---

### Q44 — cancelling and its limits

What does this print, in what order?

```js
const ac = new AbortController();
const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve('done'), ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(signal.reason);
    });
  });
let finished = 0;
const track = (ms) => new Promise((r) => setTimeout(() => (finished += 1, r(ms)), ms));
Promise.race([track(0), track(50)]).then((v) => console.log('race won by', v, 'finished', finished));
wait(50, ac.signal).catch((e) => console.log(e.name + ':', e.message));
ac.abort();
setTimeout(() => console.log('at 100ms finished', finished), 100);
```

<details><summary>Answer</summary>

**`AbortError: This operation was aborted`**, **`race won by 0 finished 1`**, **`at 100ms finished 2`** — aborting rejects because *you* wired it to; losing a race does nothing at all.

`AbortController` is not a promise feature — it is an event emitter plus a `reason`, and the cancellation only happens because `wait` listens for `abort` and clears its own timer. `signal.reason` defaults to a `DOMException` named `AbortError`, which is the convention `fetch` and Node's own APIs follow, so `if (e.name === 'AbortError')` is how you distinguish "I cancelled this" from "it failed". The race half is the counterpoint: the 50ms loser keeps running and still increments `finished`, because a promise is a notification of a result, not a handle on the work.
</details>

---

### Q45 — when a rejection counts as unhandled

What does this print?

```js
process.on('unhandledRejection', (e) => console.log('UNHANDLED:', e.message));
async function boom() {
  throw new Error('sync-ish');
}
const p = boom();
console.log('after call:', p instanceof Promise);
Promise.resolve().then(() => p.catch((e) => console.log('microtask catch:', e.message)));
const q = Promise.reject(new Error('too late'));
setTimeout(() => q.catch((e) => console.log('macrotask catch:', e.message)), 0);
```

<details><summary>Answer</summary>

**`after call: true`**, **`microtask catch: sync-ish`**, **`UNHANDLED: too late`**, **`macrotask catch: too late`** — the "is anyone handling this?" check runs once the microtask queue drains, so a handler attached a tick later is fine and one attached a turn later is not.

`boom()` throws before any `await`, which still produces a rejected promise rather than a synchronous exception — hence `after call` printing normally. Attaching `.catch` from inside a microtask happens before the check, so nothing is reported. `q` survives the entire drain with no handler, so `unhandledRejection` fires (and without a listener, Node v15+ would exit with a non-zero code). Attaching the handler afterwards still works, but Node emits a `PromiseRejectionHandledWarning` to tell you the rejection was already reported — that pair of messages in a log almost always means a promise was stored now and awaited later.
</details>
