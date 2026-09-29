# 17 · Node Async, Advanced

Module 07 taught you promises and the two queues every JavaScript engine
has. Node has more than two. It has a nextTick queue that outranks
microtasks, a libuv loop with named phases, a thread pool doing your file
I/O behind your back, and three different ways to get work off the main
thread — none of which are interchangeable. This is the module where "it
works on my machine" stops being about your code and starts being about
the runtime underneath it: why `setImmediate` beats `setTimeout(fn, 0)`
inside a read callback but not at the top of your program, why an `async`
event listener can kill your process, why a worker that answers in 3 ms
still costs 40 ms, and why the copy loop that ignored one boolean got
OOM-killed at 2 a.m.

## The mental model

### 1 · One JavaScript thread, several other threads

Your code runs on exactly one thread. That never changes. What changes is
how much work is NOT your code.

```
   ┌─────────────────────────────────────────────────────┐
   │  MAIN THREAD — your JavaScript, one frame at a time  │
   └───────────────┬─────────────────────────┬───────────┘
                   │ hands work off          │ gets callbacks back
                   ▼                         │
   ┌───────────────────────────┐             │
   │ libuv THREAD POOL (4)     │─────────────┘
   │ fs, dns, zlib, crypto     │   ← C++ threads you never see
   └───────────────────────────┘
   ┌───────────────────────────┐
   │ KERNEL (epoll/kqueue/IOCP)│   ← sockets: no thread at all
   └───────────────────────────┘
```

A socket read costs no thread — the kernel tells libuv when bytes arrive.
A file read costs one of four pool threads. And a `for` loop over a
million numbers costs the main thread, which is why no amount of `async`
makes it stop blocking. `await` only yields at a real suspension point;
there is nothing to suspend on in arithmetic.

### 2 · Five places to be, not two

Between "your function returns" and "your next callback runs", Node walks
a fixed order. Get this picture right and every ordering puzzle collapses
into looking things up.

```
  your synchronous code runs to completion
            │
            ▼
  ┌──────────────────────┐
  │  nextTick queue      │  process.nextTick — drained to EMPTY, and it
  │  (Node only)         │  outranks everything below it
  └──────────┬───────────┘
             ▼
  ┌──────────────────────┐
  │  microtask queue     │  .then / await resume / queueMicrotask —
  │  (V8)                │  drained to EMPTY
  └──────────┬───────────┘
             ▼
  ┌───────── libuv loop, one turn ──────────────────────────┐
  │  timers      setTimeout / setInterval that came due      │
  │  pending     deferred system callbacks                   │
  │  poll        I/O: fs, sockets — this is where it waits   │
  │  check       setImmediate                                │
  │  close       'close' events                              │
  └──────────────────────┬───────────────────────────────────┘
             └── after EVERY callback: drain nextTick, then microtasks ──┘
```

Two rules do most of the work:

1. `process.nextTick` beats `queueMicrotask`/`.then`, and both beat
   anything libuv has scheduled.
2. `setImmediate` is not "a fast timer". It is the *check* phase. From
   inside an I/O callback (the *poll* phase) the loop reaches check next,
   so `setImmediate` always wins there.

```js
fs.readFile(file, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
// immediate → timeout, every single time
```

### 3 · Processes vs workers vs plain async

Three different tools for three different problems. Picking the wrong one
is the most expensive mistake in this module.

| you have | reach for | why |
|---|---|---|
| waiting on I/O | plain `async`/`await` | no thread is blocked; the loop is already doing this |
| a CPU-bound function | `worker_threads` | shares the process, ~10–50 ms to start, messages are structured clones |
| another program, or code you do not trust | `child_process` | separate heap, separate crash, its own exit code — ~100–300 ms to start |

A Worker is a second V8 isolate with its own heap and its own event loop
inside your process. Nothing is shared except what you postMessage (a
structured clone — no functions, no closures) or a `SharedArrayBuffer`.

```js
const worker = new Worker(source, { eval: true, workerData: 1e7 });
worker.once('message', (answer) => { …; worker.terminate(); });
```

Startup is the whole economics: a worker that computes for 3 ms and cost
40 ms to start is a 13× pessimisation. Workers pay off when the work is
long (hundreds of ms) or when you start them once and keep them.

### 4 · Cancellation and context are ambient, not parameters

Two Node APIs exist because threading a value through every function
signature does not scale.

`AbortSignal` is the standard "stop" channel. It composes:
`AbortSignal.timeout(ms)` makes a deadline, `AbortSignal.any([a, b])`
merges a deadline with a user cancel, and every modern API — `fetch`,
`fs.promises`, `events.once`, `events.on` — accepts one.

`AsyncLocalStorage` is the standard "who am I doing this for" channel. It
follows the async causal chain, so a value set at the top of a request is
readable four awaits deep without any function in between knowing it
exists.

```js
requests.run(id, () => handle(req));  // anywhere inside:
requests.getStore();                  // → id, even after 3 awaits
```

## The details that bite

1. **`process.nextTick` can starve everything, including timers.**
   A tick callback that queues another tick is drained in the same pass,
   forever. `function loop() { process.nextTick(loop); }` — 100 % CPU, no
   timer ever fires, no promise ever settles. Microtasks starve timers;
   ticks starve microtasks too.

2. **`setImmediate` vs `setTimeout(fn, 0)` at the top level is a coin
   flip.** It depends on whether process startup took long enough for the
   1 ms timer to be due on the loop's first pass. Inside any I/O callback
   it is deterministic. Never write code that depends on the top-level
   race; exercise 03 shows the version you can rely on.

3. **The lane order changes depending on where you schedule from.**
   From a timer or I/O callback: ticks, then microtasks. From inside a
   `.then` (already in a microtask drain): the microtask queue finishes
   first, and the tick you queued runs after it. Same three lines, two
   orders. If an ordering matters to your correctness, it is a bug.

4. **A zero-delay timer is not zero.** `setTimeout(fn, 0)` is clamped to
   1 ms, and it still waits for the timers phase to come round.

5. **Worker startup costs more than most jobs.** Tens of milliseconds for
   a fresh V8 isolate, plus a structured clone in each direction. Measure
   before you thread: `countPrimes(10)` in a worker is hundreds of times
   slower than inline.

6. **A live Worker or child keeps the process alive.** Both ref the event
   loop like an open socket. A CLI that prints its answer and then hangs
   forever has almost always forgotten `worker.terminate()` — or is
   waiting on a child whose stdin it never closed.

7. **Zombie children.** Spawn a child and never wait for `'close'`, or
   kill the parent without killing the child, and it keeps running with
   your file handles. Always handle `'error'` (a missing executable is
   reported asynchronously, and with no listener it is an uncaught
   exception) and prefer `'close'` over `'exit'` — `'exit'` can fire
   while buffered stdout is still in flight.

8. **`exec` runs a shell; `execFile` does not.** Anything interpolated
   into an `exec` string is a command-injection hole (`; rm -rf /`).
   `execFile(bin, [args])` passes the array straight to the OS.

9. **An `async` event listener is an unhandled rejection waiting to
   happen.** `emitter.emit()` throws the returned promise away. Since
   Node 15 an unhandled rejection terminates the process. Use
   `new EventEmitter({ captureRejections: true })` **and** an `'error'`
   listener — an emitter that emits `'error'` with nobody listening
   throws instead.

10. **`emit()` never waits for your async listeners.** It is synchronous
    and returns before the first `await` inside a handler resumes. If you
    need "everything finished", collect the promises yourself.

11. **Ignoring `write()`'s return value buffers without limit.**
    `false` means "over the high-water mark". A loop that ignores it
    keeps the whole file in memory. `pipeline()` handles this for you;
    hand-written write loops do not.

12. **`.pipe()` leaks on error.** If one stream fails, the others stay
    open holding handles and sockets. `pipeline()` destroys the whole
    chain and rejects once. There is no good reason to use `.pipe()` in
    new code.

13. **A timeout is not a cancellation — but now it can be.**
    `Promise.race([work, timeout])` leaves `work` running. Passing an
    `AbortSignal.timeout(ms)` down to whatever is actually waiting stops
    it. Read `reason.name` to tell `'TimeoutError'` from a user abort.

14. **`AsyncLocalStorage.enterWith()` has no exit.** It leaks the value
    into everything that runs after it on the same chain. Use
    `run(value, fn)`, which scopes itself.

## Cheat table

| you want | call | lands in |
|---|---|---|
| before anything else async | `process.nextTick(fn)` | nextTick queue |
| after this microtask batch | `queueMicrotask(fn)` | microtask queue |
| after this loop turn's I/O | `setImmediate(fn)` | check phase |
| in ≥ N ms | `setTimeout(fn, n)` | timers phase |

| API | use it for |
|---|---|
| `execFile(bin, args)` | run a program, buffer its output, no shell |
| `spawn(bin, args)` | run a program and stream its stdio |
| `child.stdin.end(text)` | feed a child and let it see end-of-input |
| `new Worker(src, { eval: true })` | CPU work on a second thread |
| `AsyncLocalStorage` | request id, tenant, trace span |
| `AbortSignal.timeout(ms)` | a deadline that cancels the work |
| `AbortSignal.any([…])` | one signal from several |
| `events.once(em, name, { signal })` | the next event, cancellably |
| `events.on(em, name, { signal })` | every event, as a `for await` loop |
| `pipeline(a, b, c)` | a stream chain that cannot leak |

## Exercises

| # | file | ★ | what you build |
|---|---|---|---|
| 01 | `01-lane-helpers.js` | ★☆☆ | `defer(lane, fn)` over all four scheduling lanes |
| 02 | `02-order-lanes.js` | ★★☆ | predict nextTick vs microtask vs immediate vs timeout |
| 03 | `03-order-in-io.js` | ★★☆ | predict the order inside an `fs.readFile` callback |
| 04 | `04-exec-node.js` | ★★☆ | promisified `execFile`: stdout, stderr, exit codes |
| 05 | `05-spawn-stream.js` | ★★☆ | `spawn` and collect stdio chunk by chunk |
| 06 | `06-child-stdin.js` | ★★★ | pipe data INTO a child and close its stdin |
| 07 | `07-child-pool.js` | ★★★ | N children with a concurrency limit, order preserved |
| 08 | `08-worker-cpu.js` | ★★☆ | run a prime count in a Worker, promise-wrapped |
| 09 | `09-worker-roundtrip.js` | ★★★ | one long-lived worker, replies correlated by id |
| 10 | `10-run-in-worker.js` | ★★★ | `runInWorker(fnSource, arg)` — code as data |
| 11 | `11-async-local-storage.js` | ★★★ | a request id that follows the async chain |
| 12 | `12-perf-timing.js` | ★☆☆ | `timeIt(fn)`, plus marks and measures read back |
| 13 | `13-once-with-signal.js` | ★☆☆ | `events.once` with an `AbortSignal` |
| 14 | `14-capture-rejections.js` | ★★★ | route async listener failures to `'error'` |
| 15 | `15-events-iterator.js` | ★★★ | `events.on` + `for await` + abort to stop |
| 16 | `16-abort-compose.js` | ★★☆ | `AbortSignal.timeout`/`any`, cancel a chain, clean up |
| 17 | `17-stream-pipeline.js` | ★★☆ | an async-generator transform through `pipeline` |
| 18 | `18-stream-backpressure.js` | ★★★ | honour `write() === false`, count the drains |

Do the warm-ups and core in order — 01–03 first, they are what the rest
of the module assumes. Stretch if time allows; 07, 09 and 18 are the ones
that show up in real incident reports.

Run one file at a time:

```
node exercises/01-lane-helpers.js
```

The child-process and worker files start real processes and threads, so
they take a couple of seconds each — that startup cost IS the lesson.

Stuck? The matching file in `solutions/` has the same tests plus a
walkthrough explaining why. Read it, then close it and retype the
solution from memory.

---

**Stuck?** `cheatsheets/node-advanced.md` (the event loop's lanes + ordering cheat table) · **Deep dive:** `guides/01-the-event-loop-all-the-way-down.md` + `guides/06-how-node-actually-runs-your-code.md` · **Self-check:** `quizzes/12-node-advanced.md` · **Next:** `bootcamp/18-node-http-apis`

Builds on `bootcamp/07-async-mastery` (promises, combinators) and `bootcamp/12-node-fundamentals` (processes, streams).
