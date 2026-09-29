# 08 · Node and the Web — runtime APIs, the Node loop, HTTP, DOM, storage

Cover the answer, commit out loud, then reveal. Snippets here are Node; the concept questions apply everywhere.

---

### Q1 — the CommonJS globals

What does this print?

```js
const path = require('node:path');
console.log(path.posix.join('a', 'b', '..', 'c'));
console.log(path.posix.normalize('a//b/./c'));
console.log(path.extname('report.final.pdf'));
console.log(path.basename('/tmp/report.pdf', '.pdf'));
console.log(typeof __dirname, typeof module, typeof require);
```

<details><summary>Answer</summary>

**`a/c`**, **`a/b/c`**, **`.pdf`**, **`report`**, **`string object function`** — `path` resolves `..` and `.` textually, without touching the disk.

`extname` returns the last extension including the dot, `basename` optionally strips a suffix you name. Always use `path.join`/`path.resolve` instead of string concatenation with `/`, because the separator is `\` on Windows — `path.posix` and `path.win32` let you force one. `__dirname`, `__filename`, `module`, `exports`, and `require` exist because Node wraps every CommonJS file in a function that receives them as parameters; **none of them exist in an ES module**, where you use `import.meta.url` and `import.meta.dirname` instead.
</details>

---

### Q2 — module caching

What does this print?

```js
// mod.js contains:  console.log("module body ran"); module.exports = { n: Math.random() };
const first = require('./mod.js');
const second = require('./mod.js');
console.log(first === second, first.n === second.n);
```

<details><summary>Answer</summary>

**`module body ran`** once, then **`true true`** — a module's body executes exactly once per resolved path, and the exports object is cached and shared.

Every later `require` of the same file returns the same object from `require.cache`. That's what makes a module a de facto singleton — a database pool or a config object defined at module scope is shared by every importer. The flip side: module-level mutable state is global state, so one consumer mutating `first` changes it for everyone. ES modules behave the same way (evaluated once, live bindings shared), so the lesson carries over.
</details>

---

### Q3 — Node's ordering primitives

What does this print, in what order?

```js
console.log('sync');
setTimeout(() => console.log('timeout'), 0);
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
```

<details><summary>Answer</summary>

**`sync`, `nextTick`, `promise`, `timeout`** — `process.nextTick` jumps the queue ahead of promise microtasks, and both beat any timer.

Node keeps two "run this right after the current operation" queues: the nextTick queue and the microtask (promise) queue. The nextTick queue is drained first and completely, then microtasks, and only then does the event loop advance to its next phase (timers, pending I/O, poll, check, close). `nextTick` is a Node-only API; in a browser there is only the microtask queue.
</details>

---

### Q4 — setTimeout versus setImmediate

What does this print, in what order?

```js
const fs = require('node:fs');
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout inside I/O'), 0);
  setImmediate(() => console.log('immediate inside I/O'));
});
```

<details><summary>Answer</summary>

**`immediate inside I/O`, then `timeout inside I/O`** — inside an I/O callback, `setImmediate` always wins.

Node's loop runs phases in a fixed cycle: timers → pending callbacks → poll (where I/O callbacks fire) → **check** (where `setImmediate` fires) → close. From inside the poll phase, the check phase is the very next stop, while timers have to wait for the next full lap. Ask this same question at the *top level* of a script and the answer is genuinely nondeterministic — it depends on how many milliseconds process startup took — which is itself a favorite interview follow-up.
</details>

---

### Q5 — nextTick starvation

What does this print, in what order?

```js
process.nextTick(() => {
  console.log('tick 1');
  process.nextTick(() => console.log('tick 2'));
});
Promise.resolve().then(() => console.log('promise 1'));
console.log('sync');
```

<details><summary>Answer</summary>

**`sync`, `tick 1`, `tick 2`, `promise 1`** — the nextTick queue is drained *recursively* to empty before promises get a turn.

`tick 2` was scheduled during the drain, and it still runs before the already-queued promise callback. Take that to its conclusion: a `process.nextTick` that schedules another `process.nextTick` forever starves the entire event loop — no timers, no I/O, no promises, ever. That's why the Node docs steer you toward `setImmediate` for "run soon" and reserve `nextTick` for narrow cases like emitting an error after the current call returns.
</details>

---

### Q6 — sync versus async file I/O

What does this print, in what order?

```js
const fs = require('node:fs');
const f = 'note.txt';
fs.writeFileSync(f, 'hello');
console.log('1 sync read:', fs.readFileSync(f, 'utf8'));
fs.readFile(f, 'utf8', (err, data) => {
  console.log('3 async read:', data);
});
console.log('2 after async call');
```

<details><summary>Answer</summary>

**`1 sync read: hello`, `2 after async call`, `3 async read: hello`** — the `*Sync` variants block the entire thread; the callback form returns immediately.

There is one thread running your JavaScript, so every `readFileSync` in a request handler stops all other requests, all timers, and all I/O for the duration. Sync is fine at startup (loading config, reading a certificate) and in CLI scripts; it is a serious bug in a server. Note the error-first callback signature `(err, data)` — Node's pre-promise convention, and ignoring `err` is how you get a `data` that's `undefined`. Modern code uses `require('node:fs/promises')` with `await`.
</details>

---

### Q7 — EventEmitter

What does this print?

```js
const EventEmitter = require('node:events');
const bus = new EventEmitter();
bus.on('job', (n) => console.log('handler A', n));
bus.once('job', (n) => console.log('handler B once', n));
console.log('listeners:', bus.listenerCount('job'));
bus.emit('job', 1);
bus.emit('job', 2);
console.log('after:', bus.listenerCount('job'));
console.log('emit unknown:', bus.emit('nothing'));
```

<details><summary>Answer</summary>

**`listeners: 2`**, **`handler A 1`**, **`handler B once 1`**, **`handler A 2`**, **`after: 1`**, **`emit unknown: false`** — handlers run **synchronously**, in registration order, and `once` unsubscribes itself after firing.

`emit` is not async: it calls every listener right there on the stack and returns `true` if there was at least one, `false` otherwise. So a throwing listener propagates to the `emit` caller, and a slow listener blocks. Two gotchas: emitting `'error'` with no listener attached **crashes the process**, and forgetting to `off`/`removeListener` is the classic Node memory leak — Node warns you at 11 listeners for the same event.
</details>

---

### Q8 — streams

What does this print, in what order?

```js
const { Readable } = require('node:stream');
const src = Readable.from(['a', 'b', 'c']);
const chunks = [];
src.on('data', (c) => chunks.push(String(c)));
src.on('end', () => console.log('end', chunks.join('')));
console.log('sync after wiring');
```

<details><summary>Answer</summary>

**`sync after wiring`, then `end abc`** — attaching a `data` listener starts the flow, but chunks are delivered asynchronously.

The point of a stream is that you never hold the whole payload in memory: a 4GB file moves through in 64KB chunks with constant memory. The vocabulary to have ready: **Readable** (source), **Writable** (sink), **Transform** (both — gzip, encryption, CSV parsing), **pipe/pipeline** to connect them, and **backpressure**, the mechanism by which a slow writer tells a fast reader to pause. Use `pipeline()` rather than `.pipe()` so errors and cleanup propagate correctly.
</details>

---

### Q9 — Buffers and encodings

What does this print?

```js
const buf = Buffer.from('héllo', 'utf8');
console.log(buf.length, 'héllo'.length);
console.log(buf.toString('utf8'));
console.log(buf.toString('base64'));
console.log(Buffer.from('aMOpbGxv', 'base64').toString());
```

<details><summary>Answer</summary>

**`6 5`**, **`héllo`**, **`aMOpbGxv`**, **`héllo`** — a `Buffer` counts *bytes*, a string counts UTF-16 code units, and `é` is two bytes in UTF-8.

`Buffer` is Node's raw binary type (a `Uint8Array` subclass) and it's what file reads, sockets, and crypto actually produce. Any time you slice a buffer at an arbitrary byte offset you risk cutting a multi-byte character in half — that's what `StringDecoder` and the stream decoders exist to handle. Base64 is an encoding, not encryption: it's fully reversible by anyone, as the last line demonstrates.
</details>

---

### Q10 — URL parsing

What does this print?

```js
const url = new URL('https://ex.com:8443/a/b?q=hi&n=2#frag');
console.log(url.protocol, url.hostname, url.port, url.pathname);
console.log(url.searchParams.get('q'), url.searchParams.get('missing'));
console.log([...url.searchParams.keys()], url.hash);
const p = new URLSearchParams({ a: '1', b: 'x y' });
console.log(p.toString());
```

<details><summary>Answer</summary>

**`https: ex.com 8443 /a/b`**, **`hi null`**, **`[ 'q', 'n' ] #frag`**, **`a=1&b=x+y`** — `protocol` keeps the colon, a missing param is `null`, and `URLSearchParams` encodes for you.

`URL` and `URLSearchParams` are web standards available in Node, Deno, and browsers alike — never build query strings by concatenation, because you'll miss the encoding (note the space became `+`) and open yourself to injection. `hostname` excludes the port while `host` includes it. The fragment (`#frag`) is client-side only and is never sent to the server.
</details>

---

### Q11 — errors and causes

What does this print?

```js
const err = new Error('outer', { cause: new Error('inner') });
console.log(err.message, err.cause.message);
console.log(err instanceof Error, typeof err.stack);
try {
  JSON.parse('{bad}');
} catch (e) {
  console.log(e.constructor.name, e.message.slice(0, 20));
}
```

<details><summary>Answer</summary>

**`outer inner`**, **`true string`**, **`SyntaxError Expected property na`** — the `cause` option (ES2022) lets you rethrow with context without losing the original error.

The pattern is `throw new Error('could not load config', { cause: err })` — the caller gets a message in their vocabulary and the full chain for debugging. `stack` is a non-standard-but-universal string; it's captured at construction, not at throw. `JSON.parse` throws `SyntaxError` on bad input, so *always* wrap it — parsing a response body, a `localStorage` value, or an env var without a try/catch is a crash waiting for one malformed byte.
</details>

---

### Q12 — fetch does not throw on 404

Does `await fetch(url)` reject when the server returns 404 or 500? What does the code below reveal?

```js
// stand-in for the response fetch() resolves with on a 404
const res = { ok: false, status: 404, json: async () => ({ error: 'missing' }) };
(async () => {
  console.log('threw?', false, 'ok:', res.ok, 'status:', res.status);
  if (!res.ok) console.log('must check ok manually:', await res.json());
})();
```

<details><summary>Answer</summary>

**No.** It prints **`threw? false ok: false status: 404`**, then **`must check ok manually: { error: 'missing' }`** — `fetch` only rejects on *network* failure, never on an HTTP error status.

A 404, a 500, a 403 — all of them resolve normally with `res.ok === false`. So `try { await fetch() } catch {}` catches DNS failures, refused connections, and CORS blocks, but happily passes a 500 through as success, and the next line parses an error page as if it were data. Every fetch wrapper you write needs `if (!res.ok) throw new Error(...)`. Axios throws on 4xx/5xx by default, which is the main behavioral difference between them.
</details>

---

### Q13 — localStorage stores strings

What does this print, given `localStorage` semantics?

```js
localStorage.setItem('count', 5);
localStorage.setItem('user', { id: 1 });
console.log(localStorage.getItem('count'), typeof localStorage.getItem('count'));
console.log(localStorage.getItem('user'));
console.log(localStorage.getItem('nope'));
localStorage.setItem('user', JSON.stringify({ id: 1 }));
console.log(JSON.parse(localStorage.getItem('user')).id);
```

<details><summary>Answer</summary>

**`5 string`**, **`[object Object]`**, **`null`**, **`1`** — every value is coerced with `String()`, so an object becomes the useless literal `"[object Object]"`.

Always `JSON.stringify` on the way in and `JSON.parse` (inside a try/catch — see Q11) on the way out. A missing key returns `null`, not `undefined`. Also worth knowing: `localStorage` is synchronous and blocks the main thread, capped around 5MB, per-origin, and readable by any script on the page — so never store tokens or PII there. `sessionStorage` has the same API but dies with the tab; cookies are smaller, sent on every request, and can be `HttpOnly` (invisible to JS), which is why sessions belong there; `IndexedDB` is the async option for real data.
</details>

---

### Q14 — debounce versus throttle

What does this print, and which is which?

```js
let d = 0;
let th = 0;
const deb = debounce(() => d++, 30);   // fires once, 30ms after the last call
const thr = throttle(() => th++, 30);  // fires at most once per 30ms window
for (let i = 0; i < 5; i++) {
  deb();
  thr();
}
setTimeout(() => console.log('debounced calls:', d, 'throttled calls:', th), 60);
```

<details><summary>Answer</summary>

**`debounced calls: 1 throttled calls: 1`** — both collapse the burst to one call, but for different reasons and with different timing.

**Debounce** resets a timer on every call and only fires after the input goes quiet — use it for search-as-you-type, autosave, and resize-end. **Throttle** fires immediately and then ignores calls until the window expires — use it for scroll position, mousemove, and anything that must stay responsive *during* the burst. The tell: debounce may never fire while the user keeps typing; throttle fires at a steady rate. Both are closures over a timer id or a timestamp, which is why they're a favorite implement-it-live question.
</details>

---

### Q15 — DOM events: bubbling and delegation

An `<ul>` contains 500 `<li>` items. Explain event bubbling and capturing, and why you'd attach one listener to the `<ul>` instead of 500 to the items.

<details><summary>Answer</summary>

**An event travels down from `window` to the target (capture phase), fires on the target, then travels back up (bubble phase).** `addEventListener` defaults to the bubble phase; pass `{ capture: true }` for the other.

**Event delegation** puts a single listener on the `<ul>` and uses `event.target.closest('li')` to figure out which item was hit. That's one listener instead of 500 — less memory, no setup cost, and it keeps working for `<li>` elements added later, which is the real win in a dynamic list. Know the difference between `event.target` (what was actually clicked, possibly a nested `<span>`) and `event.currentTarget` (the element whose listener is running). `stopPropagation()` halts the travel; `preventDefault()` cancels the browser's default action — they're independent, and `return false` in a jQuery handler used to do both, which is why people confuse them.
</details>

---

### Q16 — HTTP fundamentals

Which HTTP methods are safe and which are idempotent? What do 200, 201, 204, 301, 400, 401, 403, 404, 409, 422, 429, 500, and 502 mean?

<details><summary>Answer</summary>

**Safe** (no server state change): GET, HEAD, OPTIONS. **Idempotent** (N identical calls = 1 call): GET, HEAD, OPTIONS, PUT, DELETE. **Not idempotent:** POST and PATCH.

That's why a client or proxy may retry a failed GET or PUT automatically but must not retry a POST without an idempotency key. Status codes: **200** OK, **201** Created (with a `Location` header), **204** No Content; **301** moved permanently, **302/307** temporary; **400** malformed request, **401** not authenticated, **403** authenticated but not allowed, **404** not found, **409** conflict (version/state clash), **422** well-formed but semantically invalid, **429** rate limited (respect `Retry-After`); **500** server bug, **502** bad gateway, **503** unavailable, **504** gateway timeout. The 4xx/5xx split is "your fault / my fault" — getting 401 vs 403 and 400 vs 422 right is a common junior-to-mid tell.
</details>

---

### Q17 — CORS

Your `fetch` to `https://api.example.com` fails with a CORS error, but the same URL works in the browser address bar and in curl. What is happening and where is the fix?

<details><summary>Answer</summary>

**The browser made the request and the server answered — the browser then refused to hand you the response because the server didn't opt in with the right `Access-Control-Allow-Origin` header.**

CORS is enforced by the browser, not the server, which is exactly why curl and the address bar (a top-level navigation, not a cross-origin XHR) are unaffected. The fix belongs on the **server**: it must return `Access-Control-Allow-Origin` matching your origin, plus `Allow-Methods`/`Allow-Headers` for anything beyond a simple request. Non-simple requests (custom headers, `PUT`/`DELETE`, JSON content type) trigger a **preflight** `OPTIONS` call first, which your server must also answer. Sending cookies needs `credentials: 'include'` *and* `Access-Control-Allow-Credentials: true` *and* a specific origin — the wildcard `*` is rejected with credentials. No front-end code change can bypass it; a dev proxy just moves the request out of the browser.
</details>

---

### Q18 — page load and rendering

What is the difference between `DOMContentLoaded` and `load`? What is a reflow versus a repaint, and why does reading `offsetHeight` in a loop hurt?

<details><summary>Answer</summary>

**`DOMContentLoaded` fires when the HTML is parsed and the DOM is built; `load` waits for every stylesheet, image, and iframe.** Attach app initialization to the first — waiting for `load` delays interactivity for no reason.

A **repaint** redraws pixels (a color change). A **reflow** (layout) recomputes geometry — positions and sizes — and is much more expensive, because it can cascade to ancestors and descendants. The browser batches your DOM writes into a queue, but *reading* a layout property (`offsetHeight`, `getBoundingClientRect`, `scrollTop`, `getComputedStyle`) forces it to flush that queue and lay out immediately. Alternating write/read/write/read in a loop is **layout thrashing**: you force a synchronous reflow on every iteration. The fix is to batch — read everything first, then write everything — and to animate with `transform` and `opacity`, which the compositor can handle without any layout at all.
</details>
