# 01 · The Event Loop, All the Way Down

You can get a long way on "microtasks before macrotasks". You cannot debug
a hung server with it, or explain why the same file prints a different
order as `.mjs` than as `.cjs`, or say what `await` costs. Those need the
actual machine: a stack, four queues with different draining rules, and a
loop with phases.

This guide builds that machine from the bottom, then walks **six traces**
of increasing difficulty with the queue state drawn at every step. Predict
each one before you read on — that's the whole exercise.

Everything here was executed on **Node v22.16.0** (Windows). Where an
ordering is genuinely nondeterministic, it says so and shows the spread
rather than pretending.

---

## 1 · The stack, and why anything else is needed

JavaScript has one call stack. Functions push frames, returns pop them, and
**nothing interrupts a frame**. That's the run-to-completion guarantee, and
it's the best thing about the language: while your function runs, no other
JavaScript can observe or mutate anything. No locks, no data races, no
`synchronized`.

The price is that the stack must empty for anything else to happen.

```
   call stack (grows down)          the guarantee
   ┌──────────────────┐
   │ handleRequest()  │   while ANY frame is here, no callback,
   │   parseBody()    │   no timer, no promise handler, no I/O
   │     JSON.parse() │   completion can run. Not "won't" — CANNOT.
   └──────────────────┘
```

So an environment that wants to do more than one thing needs somewhere to
put work that isn't ready yet. That's the queues, and the loop that feeds
them onto the empty stack.

The critical inversion: **the event loop is not part of JavaScript.** V8
runs your code and hands back an empty stack; the loop belongs to the host
— libuv in Node, the browser's task scheduler on the web. That's why the
spec only defines *microtasks* (the "jobs" queue), while timers, I/O and
`setImmediate` are the host's business — and why their rules differ between
Node and the browser.

---

## 2 · Four queues, not two

The two-queue picture (microtasks, macrotasks) is enough for browser work.
Node has four lanes, and they drain with different rules:

```
  ┌─────────────────────────────────────────────────────────────────┐
  │ 1. process.nextTick queue     drained COMPLETELY, first          │
  │ 2. microtask (promise) queue  drained COMPLETELY, second         │
  │       ↑ these two run BETWEEN every phase, and after every       │
  │         individual macrotask callback                            │
  ├─────────────────────────────────────────────────────────────────┤
  │ 3. the phase queues (timers / poll / check / close)              │
  │ 4. ...one callback at a time, then back to 1 and 2               │
  └─────────────────────────────────────────────────────────────────┘
```

And the loop that walks them:

```
        ┌───────────────────────────────────────────────┐
   ┌───▶│ TIMERS        setTimeout / setInterval due now │
   │    └────────────────────┬──────────────────────────┘
   │      nextTick ▶ microtasks
   │    ┌────────────────────▼──────────────────────────┐
   │    │ PENDING       deferred system callbacks (some  │
   │    │               TCP errors, etc.)                │
   │    └────────────────────┬──────────────────────────┘
   │      nextTick ▶ microtasks
   │    ┌────────────────────▼──────────────────────────┐
   │    │ POLL          ← the loop BLOCKS here waiting   │
   │    │               for I/O. Runs completed I/O      │
   │    │               callbacks. This is where a Node  │
   │    │               process spends its idle life.    │
   │    └────────────────────┬──────────────────────────┘
   │      nextTick ▶ microtasks
   │    ┌────────────────────▼──────────────────────────┐
   │    │ CHECK         setImmediate callbacks           │
   │    └────────────────────┬──────────────────────────┘
   │      nextTick ▶ microtasks
   │    ┌────────────────────▼──────────────────────────┐
   │    │ CLOSE         'close' events (socket.on(…))    │
   │    └────────────────────┬──────────────────────────┘
   └─────────────────────────┘   anything left to do? loop. else exit.
```

### Why it's shaped like this

Every part of that diagram is an engineering answer to a real problem:

- **Poll blocks.** An idle server should use 0% CPU, not spin. So the loop
  parks in a `epoll_wait`/`IOCP` call until the OS wakes it. Timers are the
  reason it can't block *forever*: the loop computes how long until the
  next timer is due and passes that as the poll timeout.
- **Timers come first** so that a due timer isn't delayed by a burst of
  incoming I/O.
- **`setImmediate` exists as a separate phase** so you can say "after the
  I/O I'm currently handling, before any timers". Inside an I/O callback,
  `setImmediate` beats `setTimeout(…, 0)` **deterministically** — that's
  the whole reason it exists (trace 4).
- **`process.nextTick` jumps the queue** because Node needed a way to
  finish setting something up before *any* user code sees it — emitting an
  event on an object whose constructor hasn't returned yet, for example.
  It's a Node-only escape hatch, and it can starve everything (trace 5).
- **Microtasks drain completely, not one at a time**, so a promise chain
  resolves as one atomic-looking step rather than smeared across turns of
  the loop.

The two rules that fall out and matter most:

> **1.** Sync code always finishes first. A `.then` registered now cannot
> run before the current function returns.
>
> **2.** Both the nextTick and microtask queues drain *to empty*, including
> what they queue themselves. That's the power (fair resolution) and the
> danger (starvation).

---

## 3 · Six traces

Read the code, predict the output, then check. Queue states are drawn as
they are *at the moment marked*.

### Trace 1 — the baseline

```js
console.log('sync start');
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('then'));
queueMicrotask(() => console.log('queueMicrotask'));
console.log('sync end');
```

State when the last line finishes, stack about to empty:

```
   stack:      [ main ]                    (about to pop)
   nextTick:   []
   microtask:  [ then, queueMicrotask ]
   timers:     [ timeout ]
```

The loop can't start until the stack is empty. Then microtasks drain (both
of them), *then* the timer phase runs.

```
sync start
sync end
then
queueMicrotask
timeout
```

`queueMicrotask` and `.then` share one queue in registration order —
there's no promise-vs-queueMicrotask precedence to remember.

### Trace 2 — microtasks queued by microtasks, and by timers

```js
console.log('A');
setTimeout(() => { console.log('B'); Promise.resolve().then(() => console.log('C')); }, 0);
setTimeout(() => console.log('D'), 0);
Promise.resolve().then(() => { console.log('E'); Promise.resolve().then(() => console.log('F')); });
console.log('G');
```

```
   after sync:   microtask: [ E ]           timers: [ B-cb, D-cb ]
   E runs:       microtask: [ F ]  ← E queued F, and the drain CONTINUES
   F runs:       microtask: []              timers: [ B-cb, D-cb ]
   B-cb runs:    microtask: [ C ]  ← drained before the NEXT timer callback
```

```
A
G
E
F
B
C
D
```

The line to remember is **B, C, D** — not B, D, C. Microtasks are drained
after *each* macrotask callback, not after the whole phase. Two timers due
in the same tick are still two separate callbacks with a full microtask
checkpoint between them.

### Trace 3 — `await`, desugared

```js
async function one() { console.log('one:start'); await two(); console.log('one:after-await'); }
async function two() { console.log('two:body'); }

console.log('script:start');
setTimeout(() => console.log('timeout'), 0);
one();
Promise.resolve().then(() => console.log('then-1')).then(() => console.log('then-2'));
console.log('script:end');
```

`await` is not a pause. It is **"return a promise now, and register the
rest of this function as a `.then` handler"**:

```js
async function one() {           // ≈  function one() {
  console.log('one:start');      //      console.log('one:start');
  await two();                   //      return two().then(() => {
  console.log('one:after-await');//        console.log('one:after-await');
}                                //      });
                                 //    }
```

So everything *before* the first `await` runs **synchronously**, right
where you called it. Only the continuation is deferred.

```
   one() called:  logs one:start, calls two() → logs two:body, returns promise
                  → continuation parked on the microtask queue
   microtask: [ one:after-await, then-1 ]
```

```
script:start
one:start
two:body
script:end
one:after-await
then-1
then-2
timeout
```

Two consequences worth carrying around: an `async` function that does
expensive work before its first `await` blocks the caller completely — the
`async` keyword buys you nothing there. And the continuation goes on the
microtask queue, so **all** awaits resolve before any timer.

### Trace 4 — Node's four lanes, and a surprise

```js
// t4.cjs — a CommonJS file
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
queueMicrotask(() => console.log('queueMicrotask'));
process.nextTick(() => { console.log('nextTick-2'); process.nextTick(() => console.log('nextTick-nested')); });
console.log('sync');
```

```
   after sync:   nextTick:  [ nextTick, nextTick-2 ]
                 microtask: [ promise, queueMicrotask ]
                 timers:    [ timeout ]      check: [ immediate ]

   drain nextTick → nextTick-2 queues nextTick-nested, which is ALSO
   drained now (the queue empties, including what it grows)
   only then does the microtask queue get a turn.
```

```
sync
nextTick
nextTick-2
nextTick-nested
promise
queueMicrotask
timeout
immediate
```

Now the surprise. **Save the identical code as `.mjs` and the order
changes:**

```
sync
promise
queueMicrotask
nextTick          ← after the promises now!
nextTick-2
nextTick-nested
immediate         ← and the timer/immediate order flipped too
timeout
```

Both outputs are real, from the same eight lines. The reason: an ES module
is *evaluated as part of a promise job*. The microtask queue is already
being drained when your top-level code runs, so the drain continues before
the loop gets back to the nextTick queue.

Do not learn "nextTick beats promises" as a top-level fact. Learn the rule
that holds everywhere — **inside a callback**:

```js
setTimeout(() => {
  process.nextTick(() => console.log('nextTick'));
  Promise.resolve().then(() => console.log('promise'));
  console.log('sync-in-timer');
}, 0);
// logs: sync-in-timer → nextTick → promise      (in .mjs AND .cjs)
```

That is the only version worth memorising, and it's the one that describes
your actual application code, which lives in callbacks and handlers.

### Trace 5 — the `setTimeout` vs `setImmediate` race

At the top level of a CommonJS file, this ordering is **genuinely
nondeterministic**:

```js
setTimeout(() => process.stdout.write('T'), 0);
setImmediate(() => process.stdout.write('I'));
```

Twelve consecutive runs on this machine:

```
T I T I I T I T I T I T I T I T T I I T I T T I I T
```

Both orders, repeatedly. The reason is a race against the clock: `0` is
clamped to `1` ms, and whether that millisecond has elapsed by the time the
loop reaches the timers phase depends on how long process startup took.
Slow start → the timer is already due → `T` first. Fast start → not yet due
→ the loop moves on to check → `I` first.

Put the same two lines **inside an I/O callback** and it becomes
deterministic forever:

```js
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
  process.nextTick(() => console.log('nextTick'));
  Promise.resolve().then(() => console.log('promise'));
});
// nextTick → promise → immediate → timeout      (every time)
```

You are already *in* the poll phase, so **check** is the very next phase
and the immediate fires; timers don't come round again until the next
iteration. This is the concrete reason `setImmediate` exists: "run right
after the current I/O, before any timers" is otherwise unsayable.

### Trace 6 — everything at once

Stable across five consecutive runs. Predict it before reading the output;
this is the one worth getting right.

```js
const fs = require('node:fs');

async function work() {
  console.log('work:start');
  await null;
  console.log('work:after-await-1');
  process.nextTick(() => console.log('work:nextTick'));
  await Promise.resolve();
  console.log('work:after-await-2');
}

console.log('script:start');
setTimeout(() => {
  console.log('timer');
  process.nextTick(() => console.log('timer:nextTick'));
  Promise.resolve().then(() => console.log('timer:promise'));
}, 0);
setImmediate(() => console.log('immediate'));
fs.readFile(__filename, () => {
  console.log('io:callback');
  setImmediate(() => console.log('io:immediate'));
});
work();
process.nextTick(() => console.log('script:nextTick'));
Promise.resolve().then(() => console.log('script:promise'));
console.log('script:end');
```

State when the stack empties:

```
   nextTick:   [ script:nextTick ]
   microtask:  [ work:after-await-1, script:promise ]   ← work() ran to its
                                                          await synchronously
   timers:     [ timer ]     check: [ immediate ]     poll: readFile pending
```

Now walk it:

```
   1. nextTick drains        → script:nextTick
   2. microtasks drain       → work:after-await-1
                                 ├ queues work:nextTick on the NEXTTICK queue
                                 └ queues work's continuation (microtask)
                             → script:promise
                             → work:after-await-2      (still draining!)
   3. nextTick queue again   → work:nextTick   ← it waited for the drain
   4. TIMERS phase           → timer, then its nextTick, then its promise
   5. CHECK phase            → immediate
   6. next iteration, POLL   → io:callback (the read completed)
   7. CHECK                  → io:immediate
```

```
script:start
work:start
script:end
script:nextTick
work:after-await-1
script:promise
work:after-await-2
work:nextTick
timer
timer:nextTick
timer:promise
immediate
io:callback
io:immediate
```

Three things this trace teaches that none of the others do:

1. **A `nextTick` queued from inside a microtask waits for the whole
   microtask queue to drain** (`work:after-await-2` before `work:nextTick`).
   "nextTick has priority" is about the *checkpoint*, not about preemption.
2. **`work()` ran synchronously up to its first `await`** — `work:start`
   appears before `script:end`.
3. **The I/O callback lost to `immediate`** even though the read was
   started earlier. A `readFile` completion isn't ready in the first poll
   phase; `setImmediate` was already sitting in check. "I/O is faster" is
   not a scheduling rule.

### What `await` actually costs, in ticks

Not all awaits are equal. Instrument it by racing a plain promise chain:

```js
function ticker(n) { let p = Promise.resolve(); for (let i=1;i<=n;i++) p = p.then(() => console.log('tick'+i)); }

async function awaitValue()    { await 1;                     console.log('>> resumed'); }
async function awaitPromise()  { await Promise.resolve(1);    console.log('>> resumed'); }
async function awaitThenable() { await { then: (r) => r(1) }; console.log('>> resumed'); }
```

```
await 1                  →  >> resumed, tick1, tick2, …     (resumes first: 1 tick)
await Promise.resolve(1) →  >> resumed, tick1, tick2, …     (also 1 tick)
await { then: … }        →  tick1, >> resumed, tick2, …     (one tick LATER)
```

Native promises get a fast path (this was a real V8 change — older Node
charged three ticks for `await promise`). A **thenable** — any object with
a `.then` method — does not: the engine must wrap it, which costs an extra
microtask. If you ever wondered why mixing a userland promise library into
an async codebase subtly reorders things, this is why.

It matters less than it sounds for correctness and a lot for reasoning: if
two chains interleave "wrongly", count ticks before assuming a bug.

---

## 4 · Starvation, measured

Both prioritised queues drain to empty. Recursion in either one means the
loop never advances. A 10 ms timer, versus three ways of being busy:

```js
setTimeout(() => console.log(`timer fired after ${Date.now() - t0}ms`), 10);
// then: 2,000,000 recursive process.nextTick / Promise.then, or a 300ms sync block
```

```
2M recursive process.nextTick   →  timer fired after 2024 ms
2M recursive Promise.then       →  timer fired after  951 ms
300 ms synchronous while-loop   →  timer fired after  338 ms
```

The lesson isn't the milliseconds, it's that **all three look identical
from outside**: the process is at 100% CPU, responsive to nothing,
producing no logs, with a healthy-looking stack if you attach a debugger at
the wrong moment. The signature of microtask/nextTick starvation
specifically is *"hung, but the CPU is pegged, and timers never fire"* — as
opposed to a deadlock, where CPU is idle.

The escape, if you must do a long CPU job on the JS thread, is to yield to
the *macrotask* queue — not the microtask queue:

```js
// WRONG: never yields the loop, timers still starve
await Promise.resolve();
// RIGHT: yields to the check phase, letting timers and I/O run
await new Promise((r) => setImmediate(r));
```

Better still: don't do the long CPU job on the JS thread at all. Guide 06
measures what that costs and when a worker pays for itself.

---

## 5 · Where this shows up in production

**Blocked loops become p99 latency.** One 300 ms synchronous
`JSON.parse` on a 5 MB payload delays *every* concurrent request by up to
300 ms, not just the one that caused it. This is the mechanism behind "the
service is fine at p50 and terrible at p99". Watch it directly:

```js
import { monitorEventLoopDelay } from 'node:perf_hooks';
const h = monitorEventLoopDelay({ resolution: 10 });
h.enable();
setInterval(() => console.log('loop p99', Math.round(h.percentile(99) / 1e6), 'ms'), 30_000).unref();
```

With one caveat learned the hard way: that histogram samples *when the loop
turns*, so one catastrophic freeze can register as zero. It finds chronic
lag; a health check with a timeout finds the freeze.

**Health checks time out and orchestrators kill you.** A blocked loop can't
answer `GET /healthz` either. Kubernetes sees a failed liveness probe and
restarts the pod — so the incident presents as "random restarts", and the
CPU-bound handler that caused it is three services away in the trace.

**Missed frames in the browser.** At 60 fps you have **16.7 ms** per frame
for everything: your JS, style, layout, paint. A 50 ms handler doesn't make
one frame late, it drops three. And because microtasks drain before the
browser can render, an unbounded promise chain blocks paint just as
effectively as a `while` loop. Long work goes in `requestIdleCallback`,
chunks yielded with `setTimeout`, or a Web Worker.

**Unhandled rejections crash the process.** Since Node 15 the default is
`--unhandled-rejections=throw`:

```js
async function boom() { throw new Error('nobody caught me'); }
boom();                                        // ← no await, no .catch
setTimeout(() => console.log('this line never runs'), 50);
```

```
Error: nobody caught me
    at boom (t8.cjs:1:31)
exit code: 1
```

The timer never fires. The process is gone. And the reason it's a *loop*
topic: the rejection is detected at the end of a microtask checkpoint, so
attaching a `.catch` later in the same tick is fine, while attaching it in
a `setTimeout` is far too late. Either `await` it, `.catch` it, or hand it
to something that does (`Promise.allSettled`, a task queue). "Fire and
forget" is not a thing here — it's fire and crash.

---

## Now go do

| file | what it drills |
| --- | --- |
| [`bootcamp/07-async-mastery/exercises/01-order-basics.js`](../bootcamp/07-async-mastery/exercises/01-order-basics.js) → [`02-order-nested.js`](../bootcamp/07-async-mastery/exercises/02-order-nested.js) → [`03-order-async-await.js`](../bootcamp/07-async-mastery/exercises/03-order-async-await.js) | Traces 1–3 as graded exercises. Predict on paper, then run — that gap is the whole lesson. |
| [`bootcamp/17-node-async-advanced/exercises/02-order-lanes.js`](../bootcamp/17-node-async-advanced/exercises/02-order-lanes.js) | Trace 4: nextTick vs microtask vs immediate vs timeout, in Node's four lanes. |
| [`bootcamp/17-node-async-advanced/exercises/03-order-in-io.js`](../bootcamp/17-node-async-advanced/exercises/03-order-in-io.js) | Trace 5's deterministic half — why `setImmediate` exists at all. |
| [`bootcamp/21-interleaved-drills/exercises/09-gauntlet-queues.js`](../bootcamp/21-interleaved-drills/exercises/09-gauntlet-queues.js) | Cold reps once you think you've got it. If you can't do these, you can't do trace 6. |
| [`bootcamp/23-node-drills/exercises/01-lane-gauntlet-timer.js`](../bootcamp/23-node-drills/exercises/01-lane-gauntlet-timer.js) → [`03-lane-gauntlet-await.js`](../bootcamp/23-node-drills/exercises/03-lane-gauntlet-await.js) | The await-desugaring reps, which are the ones that actually stick. |

## Self-test

**1.** Give the output, and say which line the "promises beat timers" rule
does *not* help you with.

```js
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => setTimeout(() => console.log(3), 0));
setTimeout(() => Promise.resolve().then(() => console.log(4)), 0);
```

<details>
<summary>Answer</summary>

**`1 2 4 3`** — verified, and identical in `.cjs` and `.mjs`.

Sync first: `1`. Then the microtask queue drains, and here is the trap: the
`.then` body prints nothing. It *schedules a timer*. So the only effect of
the promise winning the race is that a third timer joins the queue —
**behind** the two registered during the synchronous run.

Timers queue: `[ prints-2, schedules-4, prints-3 ]`, in registration order.

- `prints-2` fires → `2`.
- `schedules-4` fires, queues a microtask; the microtask checkpoint after
  that callback runs it → `4`.
- `prints-3` fires → `3`.

The rule that doesn't help is line 3. "Microtasks run before macrotasks"
tells you *when the `.then` executes*, not when the timer it creates
executes — a promise handler confers no priority on the work it schedules.
Timers fire in the order they became due, and a timer registered later is
later, no matter who registered it. The general habit: track what each
callback *queues*, not just when it runs.
</details>

**2.** A request handler runs `await pool.query(...)` and, elsewhere in the
process, a `for` loop over 200,000 records builds an index. Users report
that *some* requests take 400 ms and others 3 ms, with no pattern. Explain
the mechanism and how you'd confirm it.

<details>
<summary>Answer</summary>

The index build is synchronous, so it occupies the call stack for its whole
duration. Any request whose continuation — the code after `await
pool.query(...)` — becomes runnable *during* that block cannot resume until
the loop turns again. It is not slow because of the database; the response
was ready and the thread was busy.

The "no pattern" is the tell. Requests that happen to land while the loop
is free take 3 ms. Requests that land during a block take however much of
the block remains, plus their real work. Two requests with identical SQL
and identical data differ by 400 ms purely on arrival timing.

Confirming it: enable `monitorEventLoopDelay` and correlate its p99 with
the slow requests — a delay histogram that spikes when the index rebuild
runs is the proof. Log a timestamp immediately before and immediately after
the `await`, and compare the *gap* against the database's own reported
query time; a large difference is queue-wait, not query time. A CPU profile
(`--cpu-prof`) will show the index loop dominating samples.

Fixes, in order of preference: move the index build off the JS thread (a
worker — guide 06 measures when that pays), or chunk it and yield with
`await new Promise(r => setImmediate(r))` every few thousand records, which
lets the loop serve requests between chunks. Yielding with `await
Promise.resolve()` does **not** work: microtasks don't let the loop
advance.
</details>

**3.** In a `.cjs` file, `process.nextTick` callbacks run before promise
callbacks. In a `.mjs` file with identical code, they run after. Explain
why, and say which rule you should actually rely on.

<details>
<summary>Answer</summary>

An ES module is evaluated as part of a **promise job** — module loading is
asynchronous by specification, so by the time your top-level statements
run, the engine is already inside a microtask drain. Microtasks queued
during a drain are appended to the queue currently being drained, so they
run before control returns to the loop and, with it, to the nextTick
checkpoint. In CommonJS the module body is executed synchronously from the
loader, so the stack empties into the normal checkpoint order — nextTick
queue first, then microtasks.

(The same shift explains the second difference in trace 4: the
`setTimeout`-vs-`setImmediate` ordering flipped as well, because module
evaluation changes how much time has passed by the time the loop first
reaches the timers phase.)

What to rely on: **the ordering inside a callback**, which is identical in
both module systems — nextTick queue drains completely, then microtasks
drain completely, then the loop continues. Verified in both. Since
essentially all application code (route handlers, event listeners, timer
bodies, stream callbacks) runs inside a callback, that rule covers real
code; the top-level difference is a startup artifact.

The deeper lesson is to distrust ordering puzzles whose setup is
"at the top level of a file". They're testing the host's bootstrap, not the
event loop. And it's a good argument for never using `process.nextTick` in
application code: `queueMicrotask` has the same effect with no lane-order
surprises, and it's standard.
</details>

---
**Pairs with:** [`bootcamp/07-async-mastery`](../bootcamp/07-async-mastery/) · **Cheatsheet:** [`promises-async.md`](../cheatsheets/promises-async.md) · **Next guide:** [`06-how-node-actually-runs-your-code.md`](06-how-node-actually-runs-your-code.md)
