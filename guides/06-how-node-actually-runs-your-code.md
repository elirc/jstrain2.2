# 06 · How Node Actually Runs Your Code

"Node is single-threaded" is the sentence that gets everyone through the
interview and nobody through the incident. It is single-threaded in the
only place that matters — your JavaScript — and comfortably multi-threaded
everywhere else, which is why `crypto.pbkdf2` scales to four concurrent
calls and then falls off a cliff, why `fs.readFileSync` is *faster* than
`fs.promises.readFile` and still the wrong choice, and why spawning a
worker for a 130 ms task makes your program twice as slow.

This guide is the architecture underneath that, with numbers. **Every
measurement below was taken on this machine** — Node v22.16.0, Windows 11,
8 logical CPUs — while other work was running, so treat them as honest
orders of magnitude rather than benchmark-grade figures. The ratios are the
lesson; the absolute milliseconds are yours to re-measure.

---

## 1 · The three parts

Node is not a language runtime. It is a **binding layer** that glues a
JavaScript engine to an event-driven I/O library:

```
   ┌───────────────────────────────────────────────────────────────┐
   │  YOUR JAVASCRIPT                                              │
   ├───────────────────────────────────────────────────────────────┤
   │  Node's JS layer:  fs, http, streams, EventEmitter, ...        │
   ├───────────────────────────────────────────────────────────────┤
   │  C++ bindings  (node_file.cc, node_crypto.cc, ...)             │
   ├──────────────────────────────┬────────────────────────────────┤
   │           V8                 │            libuv               │
   │  parses, compiles, optimises │  event loop, thread pool,      │
   │  runs JS, owns the heap      │  epoll/kqueue/IOCP, timers,    │
   │  and the garbage collector   │  fs, dns, sockets, processes   │
   └──────────────────────────────┴────────────────────────────────┘
            one JS thread                  several OS threads
```

**V8** turns your source into machine code and runs it. It owns the heap,
the GC, and the *call stack* — and it has exactly one of those per isolate.
That is the "single thread".

**libuv** owns everything that waits. It has the event loop, an OS-level
readiness mechanism (IOCP on Windows, epoll on Linux, kqueue on BSD/macOS),
and — critically — a **pool of worker threads** for work that has no
async OS primitive.

The division of labour is the whole architecture:

> If the OS can say "tell me when this is ready" (sockets, pipes, timers),
> libuv uses the readiness API and **no thread is consumed while waiting**.
> If it can't (filesystem calls, DNS lookups, `crypto`, `zlib`), libuv
> hands the job to its **thread pool**.

That single distinction explains almost every performance surprise in Node,
including all of §2 and §3.

For the event loop's phases and the queue ordering, read
[`01-the-event-loop-all-the-way-down.md`](01-the-event-loop-all-the-way-down.md).
This guide is about the threads underneath it.

---

## 2 · The thread pool, and why it is four

libuv's default pool size is **4**, regardless of how many CPUs you have.
You can watch it saturate. `crypto.pbkdf2` is a pool job, so N concurrent
calls should take one call's time until N exceeds the pool, then step:

```js
const one = () => new Promise((res) =>
  crypto.pbkdf2('pw', 'salt', 60_000, 64, 'sha512', (e, k) => res(k)));

await Promise.all(Array.from({ length: n }, one));   // time this for n = 1,2,4,5,8
```

Measured (best of 2 runs, machine under load):

```
UV_THREADPOOL_SIZE = 4 (default)          UV_THREADPOOL_SIZE = 8
   1 concurrent :  449 ms                    1 concurrent :  508 ms
   2 concurrent :  557 ms                    2 concurrent :  672 ms
   4 concurrent : 1352 ms                    4 concurrent : 1151 ms
   5 concurrent : 1297 ms                    5 concurrent : 1364 ms
   8 concurrent : 2642 ms                    8 concurrent : 1842 ms
```

Read the two extremes: with the default pool, eight concurrent hashes cost
**5.9×** one hash. With the pool doubled, the same eight cost **3.6×**. The
staircase isn't the clean textbook one because this laptop was busy and
only has 8 cores to share between pool threads and everything else — but
the conclusion survives the noise: **the pool is a fixed-width pipe, and
you can widen it.**

```
   8 pbkdf2 calls, pool of 4:

   thread 1  ████████ ████████        each ████ = one hash
   thread 2  ████████ ████████
   thread 3  ████████ ████████        calls 5–8 do not start until
   thread 4  ████████ ████████        a thread frees up
             └── round 1 ──┘└─ 2 ─┘
```

What actually uses the pool: **`fs` (everything except watchers)**,
**`dns.lookup`** (but not `dns.resolve*`, which uses the network directly),
**`crypto`'s expensive functions** (`pbkdf2`, `scrypt`, `randomBytes`,
key generation), **`zlib`**, and any native addon that opts in.

What does *not*: TCP/HTTP sockets, pipes, `setTimeout`, `setImmediate`,
`child_process` — all of those are readiness-based and cost no thread.

Practical rules:

- `UV_THREADPOOL_SIZE` must be set **before** the pool is created, i.e. as
  a real environment variable at launch, not `process.env.X = …` at the top
  of your file (by then it's usually too late).
- Raising it is right when you're pool-bound (lots of `fs` or `crypto`) and
  wrong when you're CPU-bound — 32 threads on 8 cores just adds context
  switching. Start at `min(cores, what-you-actually-queue)`.
- A saturated pool looks *exactly* like a slow disk or a slow database from
  the outside: latency climbs, CPU is idle, nothing is obviously broken.
  If your p99 gets worse with concurrency but your CPU doesn't move, count
  your pool jobs.

---

## 3 · What blocks, measured

Here is the experiment that should settle the question forever. Schedule a
timer for 10 ms, do some work, and see when the timer *actually* fires:

```js
const timerFired = new Promise((r) => setTimeout(() => r(performance.now() - t0), 10));
doTheWork();
```

If the work is on the JS thread, the timer cannot fire until it finishes —
because the event loop can't turn while your function is on the stack.

```
operation                        work     the 10ms timer fired at
------------------------------------------------------------------
JSON.parse (3.4 MB, sync)        245ms          262ms   ← 25× late
zlib.gzipSync (3.4 MB)           140ms          175ms
crypto.pbkdf2Sync (150k iter)   1214ms         1214ms   ← 121× late
fs.readFileSync (3.4 MB, warm)    12ms           12ms
3M-iteration for loop             37ms           38ms
--- same work, off-thread versions ---
fs.promises.readFile             161ms           26ms
zlib.gzip (callback)             804ms           12ms   ← work: 804ms, timer: on time
crypto.pbkdf2 (callback)        1658ms           52ms
```

The bottom three rows are the entire point of Node. `zlib.gzip` took
**804 ms of wall clock** and the event loop stayed responsive the whole
time — the compression happened on a pool thread while JavaScript kept
running. The sync version took less wall clock (140 ms) and **froze
everything** for all of it.

### The counter-intuitive part: async is slower

Look again at `fs.readFileSync` (12 ms) versus `fs.promises.readFile`
(161 ms) for the same file. The async version is **13× slower in wall
clock** — it pays for the hop to a pool thread, the completion callback,
and promise machinery.

That is not a reason to use the sync one. It is the trade Node makes:

> Async I/O is not faster for one request. It is faster for **the other
> hundred requests** that get served while this one waits.

Which gives the actual rules:

| use sync | use async |
| --- | --- |
| CLI scripts, one-shot tooling | anything serving concurrent users |
| startup: config, certs, migrations | anything after the server is listening |
| tests, build steps | request handlers, always |

`readFileSync` at module load is fine and often clearer. `readFileSync`
inside a request handler is a production incident with a 3-month fuse.

### Blocking you can't see

Four things block that don't look like blocking:

1. **`JSON.parse` / `JSON.stringify` on big payloads.** 245 ms here for
   3.4 MB, and it is *synchronous, in C++, uninterruptible*. A 10 MB
   webhook body will stall every other request. Cap body size (module 18's
   `08-body-text.js` does exactly this) and stream when you can.
2. **Accidentally quadratic loops.** A nested loop over a 5,000-item array
   is 25 million iterations. See `cheatsheets/big-o.md`.
3. **Regexes with catastrophic backtracking.** `/(a+)+$/` against a long
   non-matching string can run effectively forever, on the JS thread. This
   is ReDoS — a supply-chain-shaped denial of service you write yourself.
4. **A `.then` that queues another `.then`, forever.** Microtask
   starvation: the loop never reaches the timer phase. CPU at 100%, no
   progress, nothing in the logs. Guide 01 has the trace.

To catch these in production, measure the loop itself:

```js
import { monitorEventLoopDelay } from 'node:perf_hooks';
const h = monitorEventLoopDelay({ resolution: 10 });
h.enable();
setInterval(() => console.log('p99 loop delay', Math.round(h.percentile(99) / 1e6), 'ms'), 30_000).unref();
```

One honest caveat learned while writing this guide: that histogram only
records samples **when the loop turns**, so a single enormous synchronous
block can register as *zero* delay — there were no samples to take. It is
excellent for chronic lag, blind to one catastrophic freeze. For that, an
external watchdog (a health check that times out) is what catches you.

---

## 4 · Workers and child processes: when they pay

A `Worker` is a **separate V8 isolate on a separate OS thread**, inside the
same process. Separate heap, separate event loop, no shared objects (except
`SharedArrayBuffer`); you communicate by message passing, and messages are
**structured-cloned** — see guide 03 for what that copies and what it
costs.

The thing nobody tells you is that they are not free. Measured:

```
one worker spawn + roundtrip       : 276 ms
one child_process fork + roundtrip : 374 ms
```

That's a new isolate, a new module graph, and Node's bootstrap. Now the
payoff calculation, same CPU task, four of them, on this 8-core machine:

```
task ≈ 136 ms each | 4 serial on main:  435 ms | 4 workers:  822 ms | speedup 0.53×
task ≈ 524 ms each | 4 serial on main: 2861 ms | 4 workers: 2214 ms | speedup 1.29×
```

For 136 ms tasks, four workers made the program **twice as slow**. The
crossover on this machine is somewhere around half a second of CPU per
task — below that, spawn cost eats the parallelism.

```
   payoff ≈ (task_ms × count) − (task_ms × count / cores) − (spawn_ms × count)
                ▲ serial cost      ▲ parallel cost          ▲ what you pay

   with spawn ≈ 276ms, "count" small, and a 130ms task, this is NEGATIVE.
```

Which produces the decision table:

| situation | answer |
| --- | --- |
| waiting on I/O (db, http, disk) | **plain async.** Workers add nothing — you weren't using the CPU |
| CPU work, < ~200 ms, occasional | just do it inline |
| CPU work, > ~500 ms, or bursty | **worker pool** — spawn N once, reuse them, never per-task |
| must run untrusted or crashy code | **child process** — a segfault takes down a worker's whole process too, but a child is already separate |
| need a different runtime/binary | child process (`spawn`) |
| shared mutable state across threads | `SharedArrayBuffer` + `Atomics`, and think hard first |

The word doing the work in row 3 is **pool**. Spawn your workers at
startup, keep them alive, correlate replies by id — which is exactly
`bootcamp/17-node-async-advanced/exercises/09-worker-roundtrip.js` and
`10-run-in-worker.js`. A fresh `new Worker()` per request is the most
common way people make their server slower while believing they made it
faster.

**Workers vs child processes**, precisely:

|  | `worker_threads` | `child_process.fork` |
| --- | --- | --- |
| isolation | same process, separate isolate | separate process |
| startup (measured) | ~276 ms | ~374 ms |
| memory | shares the process's; own heap | fully separate heap |
| crash blast radius | can take the process down | contained |
| transfer | structured clone; `ArrayBuffer` transferable, zero-copy | serialize over a pipe (JSON-ish) |
| use for | CPU-bound JS you own | untrusted code, other binaries, isolation |

---

## 5 · Module resolution, as executed behaviour

Two module systems, one runtime. The differences are not stylistic — they
change *when your code runs* and *what your imports see*.

### Live bindings vs a copied snapshot

This is the difference that actually bites. ESM imports are **live
bindings** — a view onto the exporting module's variable:

```js
// a.mjs
export let counter = 0;
export const bump = () => { counter++; };

// test.mjs
import { counter, bump } from './a.mjs';
bump(); bump();
console.log(counter);   // => 2      ← the import sees the update
```

CommonJS exports are **values copied onto an object** at export time:

```js
// b.cjs
let counter = 0;
module.exports = { counter, bump: () => { counter++; }, get live() { return counter; } };

// consumer
const b = require('./b.cjs');
b.bump(); b.bump();
console.log(b.counter, b.live);   // logs: 0 2
```

`b.counter` is stuck at `0` forever — it was a copy of the number at the
moment the object literal was built. The getter sees `2` because a getter
re-reads. This is why CJS libraries that let you swap a config at runtime
always export a function or a getter, never a bare value.

### Everything else, verified on Node v22.16.0

```js
typeof __dirname            // ESM: 'undefined'   → use import.meta.dirname
import.meta.url             // 'file:///…/test.mjs'
await fetch(…)              // top-level await: works in ESM, impossible in CJS
```

```js
await import('./a');        // ERR_MODULE_NOT_FOUND — ESM does NOT guess extensions
require('./b');             // works — CJS tries .js, .json, .node, then /index.js
```

ESM's specifier resolution is strict on purpose: no extension guessing, no
directory-index magic, no walking `node_modules` by trying suffixes. It
costs you keystrokes and buys deterministic, cacheable, browser-compatible
resolution.

**`require()` of an ES module now works** — this changed recently, and the
old "you can never require ESM" advice is out of date:

```js
const ns = require('./a.mjs');
// => object | keys: bump,counter | Symbol.toStringTag: Module
```

…with one hard limit, and the error message names it exactly:

```js
require('./tla.mjs');
// ERR_REQUIRE_ASYNC_MODULE: require() cannot be used on an ESM graph with
// top-level await. Use import() instead.
```

Which makes sense: `require` is synchronous and top-level await isn't. In
the other direction, `import` of CJS has always worked, with
`module.exports` arriving as the `default` export.

### Circular imports fail differently

ESM hoists and links the graph before evaluating, so a cycle gives you a
**TDZ error at the exact line**, not `undefined`:

```
ReferenceError: Cannot access 'one' before initialization
    at c2.mjs:3
```

CJS gives you a half-built `module.exports` object instead — usually
`undefined` for the properties not yet assigned, and a bug five files away.
ESM's version is louder and much easier to fix. (Both are telling you the
same thing: break the cycle.)

### The rules that decide which system a file gets

```
   file ends .mjs                          → ESM, always
   file ends .cjs                          → CJS, always
   file ends .js  ──▶ nearest package.json "type" field
                        │
                        ├─ "module"    → ESM
                        └─ "commonjs"  or absent → CJS
```

Which is why `bootcamp/package.json` contains `"type": "module"` — one line
that makes every `.js` file in the tree an ES module, so exercises can use
`import` and top-level `await` with no build step.

**Opinion:** write ESM for everything new. Use `.cjs` deliberately for the
rare file that must be `require`d from a CJS world. Don't dual-publish
unless you're shipping a library — the `exports` map with `import`/`require`
conditions is a real maintenance cost, and the "dual package hazard" (two
copies of your module, two copies of its state, `instanceof` failing across
them) is a genuinely nasty bug class.

---

## 6 · Memory limits in practice

V8's heap is capped, and the default depends on the machine:

```
default heap limit here                       : 4144 MB
node --max-old-space-size=64  → actual limit  :  112 MB
```

Note that second line: asking for 64 MB yields a **112 MB** limit. The flag
caps the *old space* only — young generation, code space, and large-object
space are extra. Treat the number as a knob, not a total.

When you exceed it, the crash is unmistakable:

```
<--- Last few GCs --->
[25900:...] 564 ms: Mark-Compact 63.7 (97.1) -> 63.7 (97.1) MB, ... allocation failure
<--- JS stacktrace --->
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

`63.7 -> 63.7` means a full collection freed nothing: everything is
reachable. That's a leak, and raising the flag buys hours, not a fix — see
guide 03 for the four leak shapes and how to find them.

Practical notes:

- **In containers, set it explicitly, below the container limit** (~75–80%
  of the cgroup memory limit). Node's default sizing does read cgroup
  limits in modern versions, but being explicit costs one flag and removes
  a class of "works on my laptop, OOM-killed in prod" surprises. A V8 heap
  error gives you a stack trace; an OOM kill gives you exit code 137 and
  silence.
- **Buffers live outside the JS heap.** A process handling large uploads
  can sit at 200 MB of `rss` with a 40 MB heap. `--max-old-space-size`
  won't protect you from that; `process.memoryUsage().external` is where
  you watch it.
- **Each worker thread has its own heap**, and `--max-old-space-size`
  applies per isolate. Four workers can use four times what you budgeted;
  set `resourceLimits: { maxOldGenerationSizeMb }` per worker when it
  matters.
- **`--max-old-space-size` is also a debugging tool.** Run a soak test with
  a small heap and a slow leak reproduces in minutes instead of days.

---

## Now go do

| file | what it drills |
| --- | --- |
| [`bootcamp/17-node-async-advanced/exercises/12-perf-timing.js`](../bootcamp/17-node-async-advanced/exercises/12-perf-timing.js) | `perf_hooks` measurement discipline — do this first so §3's numbers become something you can reproduce. |
| [`bootcamp/17-node-async-advanced/exercises/08-worker-cpu.js`](../bootcamp/17-node-async-advanced/exercises/08-worker-cpu.js) | A CPU task in a Worker, promise-wrapped. Time it against the main thread and find *your* crossover point. |
| [`bootcamp/17-node-async-advanced/exercises/09-worker-roundtrip.js`](../bootcamp/17-node-async-advanced/exercises/09-worker-roundtrip.js) and [`10-run-in-worker.js`](../bootcamp/17-node-async-advanced/exercises/10-run-in-worker.js) | The long-lived worker with correlated replies — §4's "pool, don't spawn per task". |
| [`bootcamp/17-node-async-advanced/exercises/07-child-pool.js`](../bootcamp/17-node-async-advanced/exercises/07-child-pool.js) | N children with a concurrency limit: the same lesson where isolation, not speed, is the goal. |
| [`bootcamp/17-node-async-advanced/exercises/17-stream-pipeline.js`](../bootcamp/17-node-async-advanced/exercises/17-stream-pipeline.js) and [`18-stream-backpressure.js`](../bootcamp/17-node-async-advanced/exercises/18-stream-backpressure.js) | The alternative to "load it all into memory then `JSON.parse` it" — the §3 and §6 failure modes, avoided by design. |
| [`bootcamp/23-node-drills/exercises/12-worker-lifecycle.js`](../bootcamp/23-node-drills/exercises/12-worker-lifecycle.js) | Cold reps on spawn/terminate/error handling, where the leaks actually live. |

## Self-test

**1.** A service does `await fs.promises.readFile()` on ten small files per
request, plus one `crypto.pbkdf2` for a password check. Under load, p99
latency triples but CPU sits at 30%. What is the bottleneck, and name two
fixes.

<details>
<summary>Answer</summary>

The **libuv thread pool**, saturated. Both `fs` and `pbkdf2` are pool jobs,
and the default pool is 4 threads. Eleven pool jobs per request means five
concurrent requests have 55 jobs queued behind 4 threads. The queue is
invisible from JavaScript: no CPU is burned waiting, so CPU stays low while
latency climbs — the exact signature described in §2, and the reason people
misdiagnose it as "slow disk".

Fix one: raise `UV_THREADPOOL_SIZE` (as a real env var at launch) to
something like the core count. This is the one-line mitigation, and it has
a ceiling — more threads than cores just adds switching.

Fix two: remove pool jobs. Cache the ten files at startup (they're small
and probably static); read them once into memory rather than per request.
That takes 10 of the 11 jobs to zero.

Fix three, if the hash is the real cost: move password hashing to a worker
pool or a dedicated service, and turn the cost parameter down to whatever
your threat model actually needs. A `pbkdf2` at 150k iterations measured
1.2–1.7 s here; at a few hundred concurrent logins no pool size saves you.

The diagnostic that distinguishes these: log the *queue* time — timestamp
before the call and inside the callback. Pool starvation shows as a long
gap with no CPU attached.
</details>

**2.** A colleague moves image resizing into `worker_threads` and reports
that throughput got worse. The resize takes about 80 ms. What went wrong,
and when would the same change have worked?

<details>
<summary>Answer</summary>

They're paying ~276 ms of spawn cost (measured, §4) to parallelise 80 ms of
work — assuming a fresh `new Worker()` per image, which is the usual
mistake. That's a guaranteed loss: measured here, four 136 ms tasks across
four fresh workers ran at **0.53×** the speed of just doing them inline.

There's a second, quieter cost: the image buffer is **structured-cloned**
into the worker and the result cloned back. For a multi-megabyte buffer
that copy is real work on both threads. `ArrayBuffer` can be *transferred*
instead (zero-copy, and the sender loses access), which is the right move
for exactly this workload.

The change works when (a) the workers are spawned once at startup and
**pooled**, so spawn cost is amortised to roughly zero per task, and (b)
the tasks are big enough that parallelism beats message-passing overhead —
on this machine, around half a second of CPU each. At 80 ms per image with
a warm pool, it's genuinely marginal; the honest framing is that the win
isn't throughput, it's **keeping the event loop free** so the HTTP server
stays responsive while resizing happens. That's a latency argument, not a
throughput one, and it's the right reason to do it.

Worth noting: if the resize library releases the JS thread already (many
native addons do their work on the pool), the correct answer may be "use
the async API and raise `UV_THREADPOOL_SIZE`" — no workers at all.
</details>

**3.** A `.js` file in your project uses `import` and throws
`SyntaxError: Cannot use import statement outside a module`. Give the three
ways to fix it and the trade-off of each. Then: your teammate says "just
use `require()` for that ESM-only dependency" — when does that work now?

<details>
<summary>Answer</summary>

**Rename to `.mjs`.** Always ESM, no config, no ambiguity. Trade-off: the
extension is unusual to some tooling and you've now got mixed extensions in
one tree.

**Add `"type": "module"` to the nearest `package.json`.** Every `.js` file
under it becomes ESM. Cleanest for a new project — it's what
`bootcamp/package.json` does. Trade-off: it flips *every* `.js` file at
once, so any file still using `require`/`module.exports` breaks and must be
renamed `.cjs`. In an existing codebase this is a migration, not a flag.

**Convert the file to `require`/`module.exports`.** Zero config, works
today. Trade-off: no top-level await, no live bindings, and you're moving
away from where the ecosystem is going.

On `require()` of ESM: as of Node 22.16 (verified) it **works** — you get
the module namespace object back, `Symbol.toStringTag` of `'Module'`, named
exports and all. The hard limit is top-level await anywhere in that
module's graph:

```
ERR_REQUIRE_ASYNC_MODULE: require() cannot be used on an ESM graph with
top-level await. Use import() instead.
```

Because `require` is synchronous and TLA is not, no amount of cleverness
resolves that — the fix is `await import('pkg')`, which works from CJS
today and is the portable answer. So the teammate is right more often than
they used to be, and the failure, when it comes, names itself precisely.
</details>

---
**Pairs with:** [`bootcamp/17-node-async-advanced`](../bootcamp/17-node-async-advanced/) · **Cheatsheet:** [`node-advanced.md`](../cheatsheets/node-advanced.md) · **Next guide:** [`01-the-event-loop-all-the-way-down.md`](01-the-event-loop-all-the-way-down.md)
