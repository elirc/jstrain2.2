# Node, advanced

Processes and threads, the loop's lanes, streams and backpressure, `node:sqlite`, HTTP, and CLI conventions.

Every runnable claim here was executed on **Node v22.16.0** (Windows) rather than recalled.

## Top of mind

| Question | Answer |
| --- | --- |
| Child process or worker thread? | Another **program** → `child_process`. Your own **CPU-bound JS** → `worker_threads`. I/O → neither |
| What runs first? | Sync → `nextTick` queue → microtasks → timers → I/O → `setImmediate` |
| `setTimeout(fn,0)` vs `setImmediate`? | Inside an I/O callback, **immediate always wins**. At the top level it's a genuine race |
| `write()` returned `false` — now what? | Stop writing, wait for `'drain'`. Or just use `pipeline` and never think about it |
| `pipe` or `pipeline`? | **`pipeline`** — `pipe` forwards no errors and leaks the other stream |
| Safest way to write a file? | Write `file.tmp`, `fsync`, then `rename` over the target |
| Exit code? | `process.exitCode = n` and return — not `process.exit(n)` |

## The event loop's lanes

```
   ┌─ your synchronous code ───────────────────────────────┐
   │  runs to completion, always, before anything below    │
   └───────────────────────────┬───────────────────────────┘
                               ▼
   ╔═══════════════════════════════════════════════════════╗
   ║  process.nextTick queue   → drained to exhaustion     ║  ← between EVERY step below
   ║  microtask queue          → drained to exhaustion     ║    (promises + queueMicrotask)
   ║  ...repeat until both are empty                       ║
   ╚═══════════════════════════╤═══════════════════════════╝
                               ▼
   ┌───────────────────────────────────────────────────────┐
   │ 1. timers        setTimeout / setInterval callbacks    │
   │ 2. pending       a few deferred system callbacks       │
   │ 3. poll          I/O: fs, sockets, incoming requests   │  ← the loop parks here when idle
   │ 4. check         setImmediate callbacks                │
   │ 5. close         'close' events (socket.on('close'))   │
   └───────────────────────────┬───────────────────────────┘
                               └──► back to 1
```

### Ordering cheat table

| Snippet | Output | Why |
| --- | --- | --- |
| `sync` / `setTimeout 0` / `nextTick` / `Promise.then` / `queueMicrotask` | sync, **nextTick**, promise, queueMicrotask, timeout | Ticks before microtasks; both before any phase |
| Ticks that schedule ticks | `tick1, tick2, tick1.1` before any promise | The tick queue drains *including* new arrivals |
| A `nextTick` scheduled inside a `.then` | Runs after the **whole** microtask queue empties | Drain ticks, drain microtasks, repeat |
| `setImmediate` vs `setTimeout(fn,0)` **inside an fs callback** | **immediate**, then timeout | You're in *poll*; *check* is the very next phase |
| `setImmediate` vs `setTimeout(fn,0)` **at the top level** | Either order | `setTimeout(fn,0)` is clamped to 1 ms; startup timing decides |
| Recursive `process.nextTick` | Timers/I/O **never run** | The tick drain never ends — this is loop starvation |
| Recursive `setImmediate` | Loop keeps turning | Each one lands in the *next* check phase |

| Primitive | Lane | Use it for |
| --- | --- | --- |
| `process.nextTick(fn)` | before everything | Node-only. Emitting an event *after* the constructor returns. Rarely what you want |
| `queueMicrotask(fn)` | microtask | The standard way to defer without allocating a promise |
| `setImmediate(fn)` | check phase | "After the current I/O", yielding to the loop — the safe way to break up CPU work |
| `setTimeout(fn, ms)` | timers | Actual delays. `ms` is a **minimum**, never a guarantee |
| `setInterval` | timers | Drifts and stacks under load; prefer a self-rescheduling `setTimeout` |

## child_process

| API | Shell? | Returns | Reach for it when |
| --- | --- | --- | --- |
| `exec(cmd, cb)` | **yes** | buffered `stdout`/`stderr` strings | You truly need pipes/globs — and **no** user input touches the string |
| `execFile(file, args[], cb)` | no | buffered `stdout`/`stderr` | The safe default: known binary, args as an array |
| `spawn(file, args[])` | no | a child with `.stdout` / `.stderr` **streams** | Large or streaming output, long-running processes |
| `fork(module.js)` | no | a Node child + `.send()` / `'message'` IPC | The child is another Node script you own |

Every one has a `…Sync` twin (`execFileSync`, `spawnSync`) that blocks the loop — fine in a build
script, never in a server.

```js
const { execFile, spawn } = require('node:child_process');

execFile(process.execPath, ['-e', 'console.log("hi")'], (err, stdout, stderr) => {
  // err is null on exit 0; on failure err.code is the exit status, err.killed a boolean,
  // and err.message starts with "Command failed: ..."
});

const child = spawn('git', ['log', '--oneline']);
let out = '';
child.stdout.on('data', d => out += d);
child.on('close', (code, signal) => {});   // code = exit status, signal = null unless killed
```

**The injection difference, measured.** With `evil = "hello & echo INJECTED"`:

| Call | Result |
| --- | --- |
| `execFile(node, ['-e', '…', evil])` | The argument arrives verbatim: `hello & echo INJECTED` |
| `exec(\`${node} -e "…" ${evil}\`)` | The shell splits on `&` — stdout contains **`INJECTED`**. The attacker's command ran |

Other gotchas: `exec`/`execFile` buffer everything and **kill the child** past `maxBuffer`
(1 MB default) — use `spawn` for big output. Pass `{ cwd, env, timeout, signal }` rather than
building shell strings. On Windows, `spawn` cannot run `.cmd`/`.bat` shims without `shell: true`,
which reintroduces the injection surface — pass the real executable instead.

## worker_threads

```js
const { Worker } = require('node:worker_threads');

// Inline worker — handy for a quick experiment; a real one takes a file path
const w = new Worker(`
  const { parentPort } = require('node:worker_threads');
  parentPort.on('message', n => parentPort.postMessage(n * 2));
`, { eval: true, workerData: { seed: 1 } });

w.on('message', m => { console.log(m); w.terminate(); });   // 42
w.on('error', e => {});                    // uncaught error inside the worker
w.on('exit', code => {});                  // 0 normally, 1 after terminate()
w.postMessage(21);
```

Inside the worker: `parentPort`, `workerData`, `threadId` (main thread is `0`), `isMainThread`.

| Crossing the boundary | Behaviour |
| --- | --- |
| `postMessage(obj)` | **Structured clone** — a deep copy. Handles `Map`/`Set`/`Date`/`RegExp`/cycles; throws `DataCloneError` on functions and class identity |
| Mutating the received copy | Invisible to the sender — `received === original` is `false` |
| `postMessage(buf, [buf])` | **Transfer** an `ArrayBuffer` in O(1); the sender's copy is left detached |
| `new SharedArrayBuffer(n)` | Genuinely shared memory; a worker's `Atomics.store(view, 0, 99)` is visible in the main thread immediately |

**When workers pay off.** Measured on this laptop: spinning up a worker and completing one message
round trip cost **~434 ms**, against **~482 ms** for a `fib(32)` on the main thread. A one-shot
worker barely breaks even — so **pool them** (start N at boot, hand out jobs, keep them alive) and
only for work measured in hundreds of milliseconds. Never wrap async I/O in a worker; libuv already
does that off-thread.

## Streams

### Backpressure in ten lines

```js
const w = new Writable({ highWaterMark: 16, write(chunk, enc, cb) { setTimeout(cb, 5); } });
w.write('a'.repeat(8));          // true  — buffered, still under the mark
w.write('b'.repeat(8));          // false — "I took it, but STOP"
w.write('c'.repeat(8));          // false — ignoring the signal grows the buffer without limit
w.writableLength;                // 24  (over the 16-byte highWaterMark)
w.once('drain', () => { /* buffer is empty again — resume writing */ });
```

`write()` **always accepts the chunk**; the boolean is advisory. Ignoring it is how a fast producer
feeding a slow consumer turns into unbounded memory growth with no error until the process dies.
`highWaterMark` is bytes for binary streams, objects for `objectMode`.

### Pipelines

```js
const { pipeline } = require('node:stream/promises');
const fs = require('node:fs');
const zlib = require('node:zlib');

await pipeline(fs.createReadStream('in.txt'), zlib.createGzip(), fs.createWriteStream('out.gz'));

// Async generators as stages — the modern replacement for a Transform subclass
await pipeline(
  Readable.from(['a', 'b', 'c']),
  async function* (source) { for await (const c of source) yield c.toUpperCase(); },
  async function (source) { for await (const c of source) out.push(c); },
);   // out → ['A','B','C']; a throwing stage rejects the promise with that error
```

| | `src.pipe(dst)` | `pipeline(src, …, dst)` |
| --- | --- | --- |
| Backpressure | ✅ | ✅ |
| Forwards errors | ❌ → **uncaught exception, process dies** | ✅ one error, once |
| Cleans up the other streams | ❌ leaks the fd/socket | ✅ destroys every stage |

`stream.finished(s, cb)` is the single-stream equivalent when you didn't build the chain.

### Consuming as an async iterable

```js
for await (const chunk of readable) { /* backpressure handled; throws are catchable */ }
// `break` destroys the stream — no leaked handle
const text = (await fs.promises.readFile(p)).toString();      // small files: just read them
```

Also useful: `Readable.from(iterable)` (array or async generator → stream),
`stream.Readable.toWeb`/`fromWeb` to bridge to web streams, and `objectMode: true` when the chunks
aren't bytes.

## node:sqlite

```js
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(':memory:');          // or a file path
db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)');

const insert = db.prepare('INSERT INTO users (name) VALUES (?)');
insert.run('Ada');                    // → { lastInsertRowid: 1, changes: 1 }

db.prepare('SELECT * FROM users WHERE id = ?').get(1);    // one row, or undefined
db.prepare('SELECT * FROM users').all();                  // array of rows
db.prepare('SELECT name FROM users WHERE age > :min').all({ min: 40 });   // named params

db.exec('BEGIN');
try { /* many inserts */ db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
db.close();
```

| Method | Returns |
| --- | --- |
| `run(...params)` | `{ lastInsertRowid, changes }` |
| `get(...params)` | The first row, or **`undefined`** (not `null`) |
| `all(...params)` | Array of rows |
| `db.exec(sql)` | Nothing — DDL and multi-statement scripts, **no parameters** |

- Rows are **null-prototype objects**: `row.hasOwnProperty` doesn't exist. Use `Object.hasOwn(row, k)`.
- **Never concatenate values into SQL.** Bound as a parameter, `"Bobby'); DROP TABLE users; --"`
  is stored as ordinary text and the table survives; concatenated, it wouldn't.
- Errors throw with `e.code === 'ERR_SQLITE_ERROR'` and SQLite's own message (`no such table: nope`).
- Wrap bulk inserts in one transaction — N disk syncs become one.
- Everything is **synchronous**, so a slow query blocks the loop. Fine for a CLI, risky in a server.
- Node 22 prints `ExperimentalWarning: SQLite is an experimental feature and might change at any time`
  on first use. **That's expected** — silence it with `--no-warnings` if it clutters output.

## HTTP

```js
const http = require('node:http');
const server = http.createServer((req, res) => {
  req.method;  req.url;  req.headers['content-type'];   // lowercase header names, always
  res.statusCode = 201;
  res.setHeader('Location', '/things/1');
  res.end(JSON.stringify({ id: 1 }));       // headers flush with the first body byte
});
server.listen(0, '127.0.0.1', () => console.log(server.address().port));
```

| Behaviour | What Node does unasked |
| --- | --- |
| No `Content-Length` set | Sends `Transfer-Encoding: chunked` |
| HTTP/1.1 | `Connection: keep-alive` unless you say otherwise |
| `setHeader` after the body started | Throws `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client` |
| `writeHead(...)` | Returns `res`, so `res.writeHead(304).end()` chains |

**Loopback test pattern** — listen on port `0`, let the OS pick, then hit yourself:

```js
server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const res = await new Promise(r => http.get({ host: '127.0.0.1', port, path: '/' }, r));
  // ...assert on res.statusCode / res.headers, then server.close()
});
```

**ETag / 304.** Stamp a version, honour the echo:

```js
const etag = '"abc123"';
if (req.headers['if-none-match'] === etag) return res.writeHead(304).end();   // no body on a 304
res.writeHead(200, { ETag: etag }).end(body);
```

**Keep-alive, measured.** Three requests with `new http.Agent({ keepAlive: true })` opened **1** TCP
connection; with `keepAlive: false`, **3**. Node's global agent has keep-alive on since v19, but an
agent you construct defaults to `false`. `maxSockets` caps per-host concurrency (everything beyond
it silently queues), a pooled agent keeps the process alive until `agent.destroy()`, and a
keep-alive client must be ready to retry an idempotent request on `ECONNRESET`.

**gzip.** `zlib.gzipSync(body)` took a 112-byte JSON payload down to **39 bytes** (magic bytes
`1f 8b`); `gunzipSync` round-trips exactly. In a server, prefer streaming
(`pipeline(source, zlib.createGzip(), res)`) and only when the client sent
`Accept-Encoding: gzip` — and set `Content-Encoding: gzip` when you do.

## AsyncLocalStorage in eight lines

```js
const { AsyncLocalStorage } = require('node:async_hooks');
const als = new AsyncLocalStorage();

function log(msg) { const s = als.getStore(); console.log(`[${s?.requestId ?? 'none'}] ${msg}`); }

async function handler(id) {
  await als.run({ requestId: id }, async () => {
    log('start');                                  // [req-1] start
    await new Promise(r => setTimeout(r, 10));
    log('after await');                            // [req-1] after await — context survived
  });
}
```

Two overlapping calls stay separate (`[req-1]` and `[req-2]` never mix), and outside any `run` the
store is `undefined`. This is how request IDs, tenant IDs, and trace spans reach deep code without
being threaded through every signature. It is *not* a global: nothing leaks between concurrent
requests. Costs a little performance; don't put mutable business state in it.

## CLI conventions

| Situation | Exit code |
| --- | --- |
| Success | **0** — and nothing else means success |
| Generic failure | 1 (also: uncaught exception, unhandled rejection) |
| Specific failures you want callers to branch on | 2, 3, 4… |
| Avoid | ≥126 — the shell uses 126 (not executable), 127 (not found), 128+N (killed by signal N) |

```js
process.exitCode = 4;          // preferred: set it, let the process end naturally
process.exit(4);               // tears down immediately, skipping pending work
```

Node's docs warn that `process.exit()` may not flush pending stdout writes. (A 200 KB
`console.log` through a pipe *wasn't* truncated on this Windows box — which is exactly why you
shouldn't rely on either behaviour.)

**stdout is the program's output; stderr is everything else.** Progress, logs, warnings, and
prompts go to stderr, so `mytool > out.json` still yields a clean file and the human still sees
progress. `console.log` → stdout, `console.error`/`console.warn` → stderr.

| ANSI | Code |
| --- | --- |
| Reset | `\x1b[0m` |
| Bold / dim | `\x1b[1m` / `\x1b[2m` |
| Red / green / yellow / blue | `\x1b[31m` / `\x1b[32m` / `\x1b[33m` / `\x1b[34m` |

Suppress colour when `!process.stdout.isTTY` (piped or redirected), when `process.env.NO_COLOR` is
set, or when `TERM=dumb` — otherwise your log files fill with escape noise.

## Atomic write and lockfile

```js
// Atomic replace: a reader sees the whole old file or the whole new one, never a half
const tmp = `${target}.${process.pid}.tmp`;
const fh = await fsp.open(tmp, 'w');
await fh.writeFile(data);
await fh.sync();                 // fsync — durability, not just atomicity
await fh.close();
await fsp.rename(tmp, target);   // atomic on the same filesystem
```

`fs.writeFile` alone opens with `w`, which **truncates first** — a crash mid-write leaves an
unparseable file. The temp file must live on the same filesystem as the target, or `rename` fails
with `EXDEV`.

```js
// Lockfile: 'wx' fails if the path exists — an atomic test-and-set
try {
  const lock = await fsp.open(`${target}.lock`, 'wx');
  await lock.writeFile(String(process.pid));
  // ...work...
  await lock.close();
  await fsp.unlink(`${target}.lock`);
} catch (e) {
  if (e.code === 'EEXIST') { /* someone else holds it — read the PID, decide if it's stale */ }
}
```

Write the PID (and a timestamp) inside the lock so a crashed run's stale lock can be identified
rather than blocking you forever. Always release in a `finally`.

## AbortSignal

```js
const ac = new AbortController();
setTimeout(() => ac.abort(), 100);
await fetch(url, { signal: ac.signal });          // rejects: AbortError / "This operation was aborted"

await sleep(500, null, { signal: AbortSignal.timeout(20) });
// AbortError · code ABORT_ERR · "The operation was aborted"

AbortSignal.timeout(ms)      // self-aborting deadline (reason is a TimeoutError)
AbortSignal.any([a, b])      // combine a caller's signal with your own timeout
```

One cancellation protocol for the whole platform: `fetch`, `fs`, `http.request`, `events.on/once`,
every `node:timers/promises` function, `readline`, streams. `abort()` is idempotent, sets
`signal.aborted`, and fills `signal.reason`. In your own cancellable functions, reject with
`signal.reason` so callers can branch on `e.name === 'AbortError'` — "cancelled on purpose" versus
"actually broke".

## EventEmitter semantics

```js
bus.emit('data', 42);     // SYNCHRONOUS: every listener runs now, in registration order
                          // → true if there was a listener, false if there were none
bus.once('go', fn);       // removed before it fires — re-entrant emits are safe
```

- **`'error'` is special**: emitting it with no listener **throws the error**. Synchronously, so a
  `try/catch` around the `emit` catches it — but in an I/O callback there's no such catch, and it
  becomes an `uncaughtException` that kills the process. Attach an `error` handler to every stream,
  socket, and server.
- Over 10 listeners on one event logs `MaxListenersExceededWarning` — a leak detector, not a limit.
- `events.once(emitter, 'name')` returns a promise that **rejects** on `'error'`.

## Testing

| Term | What it is | Assert on |
| --- | --- | --- |
| **Fake** | A working implementation with a shortcut (in-memory repo, `DatabaseSync(':memory:')`) | Resulting **state** — survives refactors. Prefer this |
| **Mock** | A stand-in with recorded expectations | The **interaction** — only when the interaction *is* the behaviour (email sent, card charged once) |
| **Stub** | Canned return values, no assertions | Nothing — it just unblocks the path |
| **Spy** | Records calls to a real function | Calls, while the real thing still runs |

**Deterministic time:** inject the clock (`function token(now = Date.now)`) or install fake timers
(`vi.useFakeTimers()`, `t.mock.timers.enable()` in `node:test`) and advance it explicitly. Same for
randomness, UUIDs, and temp paths. A test that really sleeps is slow *and* flaky.

**Property-based testing:** assert an invariant over hundreds of generated inputs instead of one
example — `reverse(reverse(xs)) === xs`, `parse(format(x)) === x`, idempotence, or agreement with a
slow obvious reference. The library **shrinks** any counterexample to the smallest failing input,
which is where the value is: it finds the empty array, the duplicate key, the lone surrogate.

---
*See also: [node-api.md](node-api.md) · [promises-async.md](promises-async.md) · [typescript.md](typescript.md) · [webdev-fundamentals.md](webdev-fundamentals.md)*
