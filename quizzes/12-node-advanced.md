# 12 · Node, advanced — processes, the loop's lanes, streams, HTTP, SQLite, testing

Cover the answer, commit out loud, then reveal. Every "what does this print" answer below was
produced by running the snippet on **Node v22.16.0** (Windows). Where an ordering is genuinely
racy, the question says so rather than pretending there's one right answer.

---

### Q1 — two ways to get another thread of execution

You have two slow jobs: (a) resize 500 images with a CPU-bound library, (b) shell out to `git log` and parse the output. Which of `child_process` and `worker_threads` fits each, and what is the actual difference?

<details><summary>Answer</summary>

**(a) is `worker_threads`. (b) is `child_process`.**

A **child process** is a whole separate OS process with its own V8 isolate, its own memory, and its own PID. Communication is bytes over pipes (stdout/stderr/stdin) or, with `fork()`, JSON-ish messages. Use it when you're running *someone else's program* — `git`, `ffmpeg`, `python` — or when you want crash isolation, because a segfault in a child cannot take your server down.

A **worker thread** is another thread inside the *same* process, with its own V8 isolate but a shared address space, so it can share raw memory through `SharedArrayBuffer` and `ArrayBuffer` transfers. Use it when the work is *your own JavaScript*, CPU-bound, and would otherwise block the event loop — image processing, crypto, big JSON, parsing.

The rules of thumb: **another program → child process; your own CPU-heavy JS → worker thread**. Neither is for I/O — Node's async I/O is already off-thread in libuv, and wrapping a database call in a worker just adds overhead. On this laptop a worker cost **~434 ms** to spin up and round-trip its first message, so the job needs to be worth hundreds of milliseconds before a fresh worker pays for itself; that's why real code uses a worker *pool*.
</details>

---

### Q2 — the ordering primitives

What does this print, and in what order?

```js
console.log('sync 1');
setTimeout(() => console.log('timeout'), 0);
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
queueMicrotask(() => console.log('queueMicrotask'));
console.log('sync 2');
```

<details><summary>Answer</summary>

**`sync 1`, `sync 2`, `nextTick`, `promise`, `queueMicrotask`, `timeout`.**

All synchronous code runs first — always, no exceptions. Then, before the loop advances to any phase, Node drains two queues in a fixed order: **the `nextTick` queue first, then the microtask queue** (promise callbacks and `queueMicrotask`, which share one queue in FIFO order). Only then does the loop reach the **timers** phase and fire the `setTimeout`.

`process.nextTick` is Node-only and not part of the event loop at all — it's a "before anything else" queue that Node drains between every operation. `queueMicrotask` is the standard-library way to schedule a microtask without allocating a promise; it lands in the same queue as `.then`, so its position depends purely on registration order.
</details>

---

### Q3 — two queues, not one

What does this print?

```js
process.nextTick(() => {
  console.log('tick 1');
  process.nextTick(() => console.log('tick 1.1'));
  Promise.resolve().then(() => console.log('promise inside tick'));
});
process.nextTick(() => console.log('tick 2'));
Promise.resolve().then(() => {
  console.log('promise 1');
  process.nextTick(() => console.log('tick inside promise'));
});
```

<details><summary>Answer</summary>

**`tick 1`, `tick 2`, `tick 1.1`, `promise 1`, `promise inside tick`, `tick inside promise`.**

The nextTick queue is drained **to exhaustion, including ticks added while draining** — that's why `tick 1.1`, scheduled during `tick 1`, still runs before any promise. Only when that queue is empty does Node run microtasks, and it drains those to exhaustion too, which is why `promise inside tick` (queued during `tick 1`, so *after* the already-queued `promise 1`) runs in the same pass.

Then the loop repeats: after the microtask queue empties, Node checks the nextTick queue again and finds `tick inside promise`. So the real rule is not "ticks always beat promises" but **"drain ticks, drain microtasks, repeat until both are empty"** — and only then advance the event loop.
</details>

---

### Q4 — timeout versus immediate

What does this print? And why would the same two lines at the top level of the file be a trick question?

```js
const fs = require('node:fs');
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
  console.log('inside the I/O callback');
});
```

<details><summary>Answer</summary>

**`inside the I/O callback`, `immediate`, `timeout`** — deterministic, every run.

The loop visits phases in a fixed cycle: **timers → pending callbacks → poll (I/O) → check (`setImmediate`) → close**. Inside an I/O callback you are in the *poll* phase, and **check comes immediately after poll**, so `setImmediate` always wins there. The timer has to wait for the loop to wrap all the way around to the timers phase.

At the **top level**, the same pair is a genuine race: `setTimeout(fn, 0)` is clamped to 1 ms, so whether it's already expired when the loop first reaches the timers phase depends on how long process startup took. Both orders are legal and both happen in practice — which makes it a fine interview question about *why*, and a terrible thing to depend on in code. **`setImmediate` means "after the current poll phase"; `setTimeout(fn, 0)` means "in at least a millisecond, probably more."**
</details>

---

### Q5 — a tick scheduled from inside a microtask

What does this print?

```js
async function main() {
  console.log('A');
  await null;
  console.log('B');
  process.nextTick(() => console.log('C tick'));
  await null;
  console.log('D');
}
main();
console.log('E');
process.nextTick(() => console.log('F tick'));
```

<details><summary>Answer</summary>

**`A`, `E`, `F tick`, `B`, `D`, `C tick`.**

`main()` runs synchronously to its first `await`, printing `A`, then suspends — `await null` still yields, because `await` always schedules the continuation as a microtask even on a non-promise. So `E` prints next, then the nextTick queue drains (`F tick`), then microtasks resume `main`: `B`, then `C tick` is *queued*, then the second `await` schedules another microtask, which prints `D`.

The lesson is the last two lines: **`C tick` waits for the entire microtask queue to empty**, including continuations queued after it. A `process.nextTick` called from inside promise code is not "right now" — it's "after all pending promise work." That's the subtlety that makes mixed `nextTick`/`async` code so hard to reason about, and the reason most style guides say to just use `queueMicrotask` and stay in one queue.
</details>

---

### Q6 — starving the loop

What does this print, and what would happen if the guard said `<= 3_000_000`?

```js
let n = 0;
setTimeout(() => console.log('timer'), 0);
function spin() {
  if (++n <= 3) { console.log('tick', n); process.nextTick(spin); }
}
process.nextTick(spin);
```

<details><summary>Answer</summary>

**`tick 1`, `tick 2`, `tick 3`, `timer`** — and with a big enough guard, `timer` **never runs**.

The nextTick queue is drained completely before the loop advances, and callbacks added *during* the drain go on the end of that same drain. A recursive `process.nextTick` therefore starves the event loop indefinitely: no timers, no I/O, no incoming HTTP requests, and your process looks hung while burning 100% CPU. Recursive `setImmediate` does not do this — each one lands in the *next* check phase, so the loop keeps turning and I/O still gets served.

Two related facts worth having: `setTimeout(fn, 0)` is clamped to **1 ms** by the spec (measured at 1 ms here), and timers guarantee only a *minimum* delay — a busy loop or a long synchronous callback pushes every pending timer late.
</details>

---

### Q7 — how `emit` actually behaves

What does this print?

```js
const { EventEmitter } = require('node:events');
const bus = new EventEmitter();
bus.on('data', d => console.log('handler 1', d));
bus.on('data', d => console.log('handler 2', d));
console.log('emit returned:', bus.emit('data', 42));
console.log('no listeners:', bus.emit('nothing'));
bus.once('go', () => console.log('once fired'));
bus.emit('go');
bus.emit('go');
```

<details><summary>Answer</summary>

**`handler 1 42`, `handler 2 42`, `emit returned: true`, `no listeners: false`, `once fired`** — and the second `emit('go')` prints nothing.

`emit` is **synchronous**: it calls every listener in registration order, on the current stack, and only then returns. There's no queue and no deferral, so a listener that throws propagates straight out of your `emit` call, and a slow listener blocks the emitter. It returns `true` if there was at least one listener and `false` if there were none — the only feedback you get, and the reason `bus.emit('metrics', x)` can silently go nowhere.

`once` removes the listener *before* invoking it, so re-entrant emits are safe. Adding more than 10 listeners for one event prints a `MaxListenersExceededWarning` — that's a leak detector, not a limit; raise it deliberately with `setMaxListeners` if you really need more.
</details>

---

### Q8 — the `error` event is special

What does each half of this do?

```js
const { EventEmitter } = require('node:events');
const a = new EventEmitter();
try { a.emit('error', new Error('boom')); } catch (e) { console.log('caught:', e.message); }

const b = new EventEmitter();
b.on('error', e => console.log('handled:', e.message));
b.emit('error', new Error('boom'));
```

<details><summary>Answer</summary>

**First: `caught: boom`. Second: `handled: boom`.**

`'error'` is the one event name with built-in semantics: if you emit it and **no listener is registered**, the EventEmitter *throws the error argument* rather than dropping it. Because `emit` is synchronous, that throw happens on the emitting stack — so a `try/catch` around the `emit` catches it, as above.

In real code the emit almost always happens inside an I/O callback, where no `try/catch` of yours is on the stack — so it becomes an **`uncaughtException` and kills the process**. That's why "attach an `error` handler to every stream, socket, and server" is the single most repeated piece of Node advice. Two conveniences: `events.once(emitter, 'name')` returns a promise that *rejects* on `'error'`, and `AbortSignal` support in `events.on`/`once` lets you unsubscribe without leaking listeners.
</details>

---

### Q9 — backpressure in the raw

What does this print?

```js
const { Writable } = require('node:stream');
const w = new Writable({ highWaterMark: 16, write(chunk, enc, cb) { setTimeout(cb, 5); } });
const ok1 = w.write('a'.repeat(8));
const ok2 = w.write('b'.repeat(8));
const ok3 = w.write('c'.repeat(8));
console.log('write returns:', ok1, ok2, ok3);
console.log('buffered:', w.writableLength, 'hwm:', w.writableHighWaterMark);
w.once('drain', () => console.log('drain, buffered now', w.writableLength));
```

<details><summary>Answer</summary>

**`write returns: true false false`**, then **`buffered: 24 hwm: 16`**, then **`drain, buffered now 0`**.

`write()` **always accepts the chunk** — the return value is advisory. `true` means "the buffer is still under the high-water mark, keep going"; `false` means "I've taken this one, but stop writing until I emit `'drain'`." Ignoring that boolean is how a fast reader feeding a slow writer turns into unbounded memory growth: the buffer just keeps swelling (here it reached 24 bytes against a 16-byte mark) and nothing errors until the process dies.

That's the whole of backpressure. You almost never implement it by hand, because `pipe` and `pipeline` do this dance for you — and `for await (const chunk of readable)` gets it right too, since the loop only pulls the next chunk when the body finishes.
</details>

---

### Q10 — `pipe` versus `pipeline`

The write side fails in both. What is the difference in outcome?

```js
// A
src.pipe(dst);

// B
const { pipeline } = require('node:stream');
pipeline(src, dst, err => console.log('pipeline err:', err && err.message,
  '| src destroyed:', src.destroyed, '| dst destroyed:', dst.destroyed));
```

<details><summary>Answer</summary>

**A crashes the process with an uncaught `Error: write failed`. B prints `pipeline err: write failed | src destroyed: true | dst destroyed: true`.**

`pipe` forwards data and manages backpressure, but it does **not** forward errors and does **not** clean up the other stream when one end fails. An error on either side becomes an unhandled `'error'` event — and per Q8, that's an `uncaughtException`. Worse, the surviving stream is left open, leaking a file descriptor or socket per failure.

`pipeline` (and its promise form, `require('node:stream/promises').pipeline`) wires up error forwarding and destroys **every** stream in the chain on failure, then reports once. **Use `pipeline`, always** — the only reason `pipe` still shows up in examples is that it's older. `stream.finished` is the equivalent for a single stream you didn't build the chain for.
</details>

---

### Q11 — consuming streams as async iterables

What does this print?

```js
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
(async () => {
  const s = Readable.from([1, 2, 3]);
  for await (const c of s) { if (c === 2) break; }
  console.log('after break, destroyed:', s.destroyed);

  const out = [];
  await pipeline(
    Readable.from(['a', 'b', 'c']),
    async function* (source) { for await (const c of source) yield c.toUpperCase(); },
    async function (source) { for await (const c of source) out.push(c); },
  );
  console.log('transformed:', out);
})();
```

<details><summary>Answer</summary>

**`after break, destroyed: true`**, then **`transformed: [ 'A', 'B', 'C' ]`**.

Any readable stream is an async iterable, so `for await` is the most readable way to consume one: backpressure is automatic (the source is paused while your loop body awaits), errors surface as a normal `throw` you can `try/catch`, and **breaking out of the loop destroys the stream** — no leaked handle, no manual cleanup.

The second half is the modern replacement for hand-writing a `Transform` class: `pipeline` accepts **async generator functions** as stages. Each stage takes the previous stream as an async iterable and `yield`s its output; the final function is a sink. Errors anywhere in the chain reject the returned promise — the same snippet with a throwing stage rejects with `transform blew up` — and every stage is destroyed for you.
</details>

---

### Q12 — what the HTTP server sends without being asked

A handler does `res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('hi');` and then tries `res.setHeader('X-Late', '1')`. What does the client see, and what does the late call do?

<details><summary>Answer</summary>

**The client sees `200`, body `hi`, `connection: keep-alive`, `transfer-encoding: chunked`, and *no* `content-length`.** The late call throws:

```
Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
```

Three things Node does on your behalf. **Keep-alive** is the HTTP/1.1 default, so the socket stays open for the next request unless you send `Connection: close`. **Chunked transfer encoding** is chosen automatically because you never declared a `Content-Length` — Node cannot know the size in advance once you `end()` with a body, so it frames the response instead. And **headers are flushed the moment the first byte of the body goes out**, which is what makes the late `setHeader` an error: the bytes are already on the wire.

The practical consequences: set every header *before* the first `write`/`end`; `res.statusCode = 201` and `res.setHeader(...)` are equivalent to `res.writeHead(201, {...})` as long as you're still ahead of the body; and a handler that calls `res.end()` twice, or writes after an error path already responded, is the usual source of this error in real code.
</details>

---

### Q13 — conditional requests

Trace both requests. What does the server send each time?

```js
const etag = '"abc123"';
if (req.headers['if-none-match'] === etag) { res.writeHead(304).end(); return; }
res.writeHead(200, { ETag: etag, 'Content-Type': 'application/json' });
res.end(JSON.stringify({ ok: true }));
```

<details><summary>Answer</summary>

**First request: `200`, `etag: "abc123"`, body `{"ok":true}`. Second request (with `If-None-Match: "abc123"`): `304`, empty body.**

That's the whole revalidation dance. The server stamps a version identifier on the response; the client sends it back on the next request as `If-None-Match`; if it still matches, the server replies **304 Not Modified** with **no body** — the client reuses what it already has. `Last-Modified` / `If-Modified-Since` is the same idea with a timestamp and one-second resolution; ETags are preferred because they're exact.

Details that matter: a **304 must not have a body** (Node's `.end()` with no argument is right, and `writeHead` returns `res` so it chains), the ETag value is a *quoted* string, and a weak validator is written `W/"abc123"`. This is separate from `Cache-Control`: `max-age` avoids the request entirely, while ETags make the request cheap when it does happen.
</details>

---

### Q14 — keep-alive, measured

The same client makes 3 requests to the same server, once with `new http.Agent({ keepAlive: true })` and once with `keepAlive: false`. How many TCP connections does the server see?

<details><summary>Answer</summary>

**1 with keep-alive, 3 without** — counted with a `server.on('connection')` handler.

Every new connection costs a TCP handshake (and a TLS handshake on HTTPS, which is far more expensive), so reusing one socket for a burst of requests is the cheapest performance win available to an HTTP client. Node's default global agent has `keepAlive: true` since v19, but any agent you construct yourself defaults to `false` — and the built-in `fetch` (undici) pools connections on its own.

Things to remember when you're the client: `maxSockets` caps concurrency per host and everything beyond it queues (a common mystery-latency source); a pooled agent holds the process open until you call `agent.destroy()`; and idle sockets can be closed by the *server* at any time, so a keep-alive client must be prepared to retry an idempotent request on `ECONNRESET`. As the server, `server.keepAliveTimeout` decides how long you'll hold an idle socket.
</details>

---

### Q15 — prepared statements versus string concatenation

What does this print, and what would the equivalent string-concatenation version have done?

```js
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(':memory:');
db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)');
const insert = db.prepare('INSERT INTO users (name) VALUES (?)');
console.log(insert.run('Ada'));
insert.run("Bobby'); DROP TABLE users; --");
console.log(db.prepare('SELECT COUNT(*) AS n FROM users').get());
console.log(db.prepare('SELECT * FROM users WHERE id = ?').get(2));
console.log(db.prepare('SELECT * FROM users WHERE id = ?').get(99));
```

<details><summary>Answer</summary>

```
{ lastInsertRowid: 1, changes: 1 }
[Object: null prototype] { n: 2 }
[Object: null prototype] { id: 2, name: "Bobby'); DROP TABLE users; --" }
undefined
```

The attack string was stored **as data** — the table survives, and the row contains the literal text. With `db.exec("INSERT INTO users (name) VALUES ('" + name + "')")` the quote would have closed the string, the `;` would have started a second statement, and `--` would have commented out the wreckage: the table would be gone.

This is *why* parameters exist. The SQL is parsed once, into a statement with holes; values are bound afterwards and can never become syntax. The API shape is worth memorizing: **`run()`** for writes (returns `{ lastInsertRowid, changes }`), **`get()`** for one row (`undefined` when nothing matches — not `null`), **`all()`** for an array of rows, **`exec()`** for DDL and multi-statement scripts with no parameters. Rows come back as **null-prototype objects**, so `row.hasOwnProperty` doesn't exist; use `Object.hasOwn(row, k)`. Named parameters work too: `prepare('… WHERE age > :min').all({ min: 40 })`. And `node:sqlite` prints `ExperimentalWarning: SQLite is an experimental feature` on Node 22 — that's expected, not a misconfiguration.
</details>

---

### Q16 — transactions and errors

What does `COUNT(*)` report at the end, and what does a bad query throw?

```js
db.exec('BEGIN');
db.prepare('INSERT INTO users (name) VALUES (?)').run('temp');
db.exec('ROLLBACK');
console.log(db.prepare('SELECT COUNT(*) AS n FROM users').get());
try { db.prepare('SELECT * FROM nope').all(); } catch (e) { console.log(e.code, '|', e.message); }
```

<details><summary>Answer</summary>

**The count is unchanged by the rolled-back insert**, and the bad query throws `ERR_SQLITE_ERROR | no such table: nope`.

`node:sqlite` is synchronous by design (`DatabaseSync`), so transactions are just `exec('BEGIN')` / `exec('COMMIT')` / `exec('ROLLBACK')` around your statements, and the natural pattern is `try { BEGIN; …; COMMIT } catch { ROLLBACK; throw }`. Synchronous also means a slow query blocks the event loop — fine for a CLI or a small local tool, a problem for a server under load.

Two more things that pay for themselves: wrapping a bulk insert in a single transaction turns N disk syncs into one and is typically orders of magnitude faster, and errors arrive as normal exceptions with a `code` property (`ERR_SQLITE_ERROR`) plus SQLite's own message — which is usually specific enough to fix the query without a debugger.
</details>

---

### Q17 — writing a file without corrupting it

What is wrong with `fs.writeFile(path, JSON.stringify(state))` for a file your program reloads on startup, and what is the fix?

<details><summary>Answer</summary>

**A crash, a power loss, or a concurrent reader mid-write leaves a truncated, unparseable file** — `writeFile` opens with `w`, which truncates to zero length *first* and then streams the new bytes in.

The fix is **write-temp-then-rename**, because `rename` over an existing path is atomic on the same filesystem: a reader sees either the whole old file or the whole new one, never a half:

```js
const tmp = `${target}.${process.pid}.tmp`;
const fh = await fsp.open(tmp, 'w');
await fh.writeFile(data);
await fh.sync();          // fsync: force it to the platter before we swap
await fh.close();
await fsp.rename(tmp, target);
```

Verified end to end: the target holds the complete content and the temp file is gone. Two caveats — the temp file must be on the **same filesystem** as the target (a cross-device rename fails with `EXDEV`), and the `fsync` is what makes it durable rather than merely atomic. For a **lockfile**, open with the `wx` flag: it fails with `EEXIST` if the file already exists, which is an atomic test-and-set. Put the PID inside it so a stale lock from a crashed run can be identified and cleared.
</details>

---

### Q18 — AbortSignal

What are the name and message of the error each of these produces?

```js
const ac = new AbortController();
ac.abort();
console.log(ac.signal.aborted, ac.signal.reason.name);

const { setTimeout: sleep } = require('node:timers/promises');
await sleep(500, null, { signal: AbortSignal.timeout(20) });
```

<details><summary>Answer</summary>

**`true AbortError`**, and the sleep rejects with **`AbortError`**, code **`ABORT_ERR`**, message **`The operation was aborted`**.

`AbortController` is the one cancellation protocol shared across the whole platform: `fetch`, `fs.readFile`, `http.request`, `events.on/once`, every `node:timers/promises` function, `readline`, and streams all take `{ signal }`. Calling `abort()` is idempotent, sets `signal.aborted`, fills in `signal.reason` (a `DOMException` named `AbortError` by default, or whatever you pass to `abort(reason)`), and fires the `'abort'` event once.

The two static helpers save a lot of boilerplate: `AbortSignal.timeout(ms)` aborts itself on a deadline (its reason is a `TimeoutError`), and `AbortSignal.any([a, b])` combines a caller's signal with your own timeout. When you support cancellation in your own function, reject with `signal.reason` rather than inventing an error — callers branch on `e.name === 'AbortError'` to tell "cancelled on purpose" from "actually failed."
</details>

---

### Q19 — exec, execFile, spawn, fork

`evil` is the string `hello & echo INJECTED`. What does each of these do?

```js
execFile(node, ['-e', 'console.log(process.argv[1])', evil], cb);
exec(`${node} -e "console.log(1)" ${evil}`, cb);
```

<details><summary>Answer</summary>

**`execFile` passes it through untouched** — stdout is the literal `hello & echo INJECTED`. **`exec` runs it through a shell**, which treats `&` as a command separator: stdout contains `INJECTED`, i.e. the attacker's command ran.

That is the entire difference, and it decides which one you use:

| API | Shell? | Gives you | Reach for it when |
| --- | --- | --- | --- |
| `exec` | **yes** | buffered stdout/stderr strings | You genuinely need pipes/globs, with **no** user input in the string |
| `execFile` | no | buffered stdout/stderr | You know the binary and pass args as an array — the safe default |
| `spawn` | no | **streams** | Output is large or long-running, or you want it incrementally |
| `fork` | no | a Node child + `.send()`/`'message'` IPC channel | The child is another Node script you own |

`exec` and `execFile` also buffer everything in memory (`maxBuffer` defaults to 1 MB and *kills* the child when exceeded), so anything with big output wants `spawn`. Their callback error carries the exit status: `err.code` was `7` for a child that called `process.exit(7)`, with `err.killed === false` and a message beginning `Command failed:`. With `spawn`, the `'close'` event gives you `(code, signal)` directly — `code` is the exit status and `signal` is non-null only when something killed it.
</details>

---

### Q20 — what crosses the worker boundary

A worker receives an object, sets `o.mutated = true`, and posts it back. What does the main thread see, and what does the *original* object look like?

<details><summary>Answer</summary>

**The returned message is `{ a: 1, mutated: true }`, the original is unchanged (`obj.mutated` is `undefined`), and `received === original` is `false`.**

`postMessage` uses the **structured clone algorithm**: a deep copy crosses the boundary. That's why it handles `Map`, `Set`, `Date`, `RegExp`, `ArrayBuffer`, and cycles — but silently cannot carry functions, class identity, DOM-ish handles, or anything with a closure (those throw `DataCloneError`). Two threads never share ordinary objects, which is exactly what makes workers free of data races.

When copying is too expensive there are two escapes. **Transfer** an `ArrayBuffer` (`postMessage(buf, [buf])`) to move it in O(1) — the sender's copy is left detached and unusable. Or use a **`SharedArrayBuffer`**, which really is shared memory: a worker doing `Atomics.store(view, 0, 99)` was immediately visible as `99` in the main thread. `Atomics` exists because plain reads and writes on shared memory have no ordering guarantees.

Sizing note from this laptop: **~434 ms** to spin up a worker and complete a message round trip, against **~482 ms** for a `fib(32)` that would otherwise block the loop. A single one-shot worker barely breaks even — pool them, and keep them alive.
</details>

---

### Q21 — CLI conventions

What is the exit code in each case, and where should a progress message go?

```js
process.exit(0)            // A
process.exit(2)            // B
throw new Error('boom')    // C  (uncaught, top level)
Promise.reject(new Error('x'))   // D  (unhandled)
process.exitCode = 4; console.log('still runs')   // E
```

<details><summary>Answer</summary>

**A → 0, B → 2, C → 1, D → 1, E → 4** (and E prints `still runs` first).

The contract every shell, CI system, and `&&` chain relies on: **0 means success, anything else means failure.** Reserve 1 for "it failed", and use distinct small codes (2, 3, …) when callers need to branch on *why*; codes above 125 collide with shell conventions (126 not executable, 127 not found, 128+N killed by signal N).

Prefer **`process.exitCode = n` and let the process end naturally** over `process.exit(n)`. `process.exit` tears down immediately, skipping pending work — Node's own docs warn that writes to stdout may not have flushed (it didn't reproduce on this Windows box, which is exactly why you shouldn't rely on either behaviour).

And the stream split: **stdout is the program's output, stderr is everything else.** Progress bars, logs, warnings, and prompts go to stderr, so that `mytool > out.json` still produces a clean file and a human still sees the progress. That's also why colour codes should be suppressed when `process.stdout.isTTY` is false — ANSI is `\x1b[31m` to start red, `\x1b[0m` to reset, and it's line noise in a log file.
</details>

---

### Q22 — testing vocabulary

Define **fake** vs **mock**, explain how to make a test that depends on the current time deterministic, and say what property-based testing buys you.

<details><summary>Answer</summary>

**A fake is a working implementation with a shortcut** — an in-memory repository instead of Postgres, `DatabaseSync(':memory:')` instead of a file. You assert on the *state* afterwards ("the user is in the store"). **A mock is a stand-in with recorded expectations** — you assert on the *interaction* ("`sendEmail` was called once with this address"). A **stub** just returns canned answers with no assertions. Prefer fakes: they survive refactoring, because they test what the code accomplished rather than which methods it happened to call. Reach for a mock only when the interaction *is* the behaviour — that an email was sent, that a payment was charged exactly once.

**Deterministic time** comes from not reading the clock directly. Either inject it (`function makeToken(now = Date.now)` and pass `() => 1700000000000` in tests) or install fake timers (`vi.useFakeTimers()` / `t.mock.timers.enable()` in `node:test`), which let you advance time by an exact amount and fire pending timeouts on demand. The same rule applies to randomness (inject the RNG), UUIDs, and the filesystem's temp paths. A test that sleeps for real is slow *and* flaky.

**Property-based testing** replaces example-by-example assertions with an invariant plus a generator: instead of `reverse([1,2,3]) === [3,2,1]`, you assert `reverse(reverse(xs)) === xs` for a few hundred generated arrays. The library hunts for a counterexample and then **shrinks** it to the smallest failing input — which is where the value is, because it finds the empty array, the duplicate key, the `-0`, the lone surrogate that no one thinks to write a test for. Good invariants to look for: round-trips (`parse(format(x)) === x`), idempotence, commutativity, and agreement with a slow-but-obvious reference implementation.
</details>
