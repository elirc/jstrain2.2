# 10 · Interview Verbal — say the whole answer out loud

Cover the answer, deliver yours out loud at full length, then reveal. Fluency is the skill being tested.

---

### Q1 — explain the event loop

"Explain the JavaScript event loop."

<details><summary>Answer</summary>

**JavaScript runs your code on a single thread, so anything slow has to be handed off and picked up later — the event loop is the mechanism that decides what runs next.**

There's one call stack, and it runs the current function to completion; nothing can interrupt it. When you call something async — a timer, a network request, a file read — the runtime (the browser or Node, not the language) starts that work elsewhere and takes your callback. When the work finishes, the callback is placed in a queue. The event loop's job is simple: whenever the call stack is empty, take the next callback from a queue and run it. The critical detail is that there are two tiers of queue: the **microtask** queue holds promise callbacks and drains *completely* after every single task, while the **macrotask** queue holds timers and I/O and gives up only one item per turn. That's why `Promise.resolve().then(f)` always beats `setTimeout(f, 0)`, and why a long synchronous loop freezes the page — the loop can't do anything until the stack clears.

*If they push further:* mention that microtasks queued during a drain are also drained in the same pass, so an infinitely self-queueing microtask starves timers forever; and that Node adds `process.nextTick`, which runs ahead of even promises.
</details>

---

### Q2 — explain closures

"What is a closure? Give me an example."

<details><summary>Answer</summary>

**A closure is a function together with the variable environment it was defined in — the function keeps access to those variables even after the outer function has returned.**

```js
function makeCounter() {
  let count = 0;
  return () => ++count;
}
const a = makeCounter();
const b = makeCounter();
console.log(a(), a(), b()); // 1 2 1
```

Every call to `makeCounter` creates a fresh scope with its own `count`, so `a` and `b` are fully independent — that's the giveaway that the state lives in the closure, not in the function. `count` is unreachable from anywhere else in the program: there is no syntax that can touch it except calling the returned function. That's genuine encapsulation, and it's the mechanism behind private state, the module pattern, memoization, `once`, and rate limiters like debounce and throttle. The one thing to be precise about is that a closure captures the **variable**, not a snapshot of its value — which is exactly why a `var` in a loop gives every callback the same final value, and why `let` (a fresh binding per iteration) fixes it.
</details>

---

### Q3 — == versus ===

"What's the difference between `==` and `===`?"

<details><summary>Answer</summary>

**`===` compares type and value with no conversion; `==` converts the operands toward a common type first, and the conversion rules are not intuitive.**

So `0 == '0'` and `0 == false` and `'' == false` are all `true`, while all three are `false` under `===`. The rules are genuinely surprising in places: `null == undefined` is `true`, but `null == 0` is `false` even though `null >= 0` is `true`, because relational operators use a different algorithm. `[] == false` is `true` because the array stringifies to `''` which numifies to `0`. My rule is `===` everywhere, with one deliberate exception: `x == null` is a clean, idiomatic check for "null or undefined" and I'll use it on purpose. `Object.is` is a third option for the edge cases — it's `===` except that it treats `NaN` as equal to itself and distinguishes `+0` from `-0`.
</details>

---

### Q4 — what is `this`

"What is `this` in JavaScript?"

<details><summary>Answer</summary>

**`this` is not determined by where a function is written — it's determined by how the function is called, and there are four call patterns.**

Called as a method, `obj.fn()`, `this` is `obj`. Called plainly, `fn()`, `this` is the global object in sloppy mode and `undefined` in strict mode or an ES module. Called with `new`, `this` is the freshly created object. Called via `call`, `apply`, or `bind`, `this` is whatever you passed. Arrow functions are the exception that proves the rule: they have no `this` of their own, so `this` inside one resolves lexically to the enclosing scope — and `call`/`bind` cannot change it. The practical consequence is that a method loses its `this` the moment you detach it: `setTimeout(obj.render, 0)` or `items.map(obj.add)` both break, because the receiver is gone. Fix it with an arrow wrapper, `.bind(obj)`, or an arrow class field.
</details>

---

### Q5 — map versus forEach

"When would you use `map` versus `forEach`? What about `reduce`?"

<details><summary>Answer</summary>

**`map` transforms — it returns a new array of the same length. `forEach` is for side effects — it returns `undefined`, so you can't chain off it.**

Neither mutates the source array. The practical test: if you're pushing into an array you declared just above the loop, you wanted `map`; if you're ignoring the return value, you wanted `forEach` — or better, a plain `for...of`, which supports `break`, `continue`, and `await`, none of which work in `forEach`. `filter` selects a subset, `find` returns the first matching element, `some`/`every` return booleans and short-circuit. `reduce` is the general case: it folds a collection into a single value of any shape — a sum, a grouped object, a `Map` index. Two things I always do with `reduce`: pass the initial value (without it, an empty array throws), and remember to return the accumulator from every branch. If a `reduce` is getting hard to read, it's usually a `for...of` loop wearing a costume.
</details>

---

### Q6 — var, let, const

"What's the difference between `var`, `let`, and `const`?"

<details><summary>Answer</summary>

**`var` is function-scoped and hoisted to `undefined`; `let` and `const` are block-scoped and sit in a temporal dead zone until their declaration line.**

That means a `var` declared inside an `if` or a `for` block leaks to the whole function, and reading it before the declaration gives you `undefined` instead of an error. With `let`/`const` the binding exists from the top of the block but touching it early throws a `ReferenceError` — even `typeof` throws, which is the one place `typeof` isn't safe. `const` prevents *rebinding*, not mutation: `const cfg = {}` still allows `cfg.x = 1`; use `Object.freeze` if you need the value locked, and remember that's shallow too. My default is `const` everywhere, `let` when I genuinely reassign, and `var` never. The concrete win is the loop case: `for (let i ...)` creates a fresh binding per iteration, so closures capture the right value, while `var` gives every callback the same final `i`.
</details>

---

### Q7 — callbacks to async/await

"Walk me through callbacks, promises, and async/await."

<details><summary>Answer</summary>

**They're three generations of the same idea: express "do this when that finishes" without blocking the thread.**

Callbacks came first — you pass a function to be called on completion, with Node's error-first `(err, data)` convention. They work, but nesting them produces the pyramid of doom, error handling has to be repeated at every level, and it's easy to call a callback twice or never. Promises fix that by making the pending result a **value** you can pass around, chain, and combine: a promise settles exactly once, errors propagate down the chain to a single `.catch`, and combinators like `Promise.all`, `allSettled`, and `race` express concurrency directly. `async/await` is syntax over promises — the function still returns a promise, but the code reads top-to-bottom and ordinary `try/catch` works on asynchronous errors. The trap I watch for is turning concurrent work into sequential work: two independent `await`s in a row double your latency, so start both promises first and then `await Promise.all`.
</details>

---

### Q8 — deep versus shallow copy

"What's the difference between a shallow and a deep copy? How do you make each?"

<details><summary>Answer</summary>

**A shallow copy duplicates the top level and shares every nested object by reference; a deep copy duplicates the whole graph.**

`{ ...obj }`, `Object.assign({}, obj)`, and `arr.slice()` are all shallow — `copy.name = 'x'` is isolated, but `copy.address.city = 'x'` mutates the original too. That's the number-one source of "my state changed and I don't know who did it" bugs, and it's what makes React re-render incorrectly, since a mutated nested object keeps the same identity. For a real deep copy the modern answer is `structuredClone(obj)`, which handles cycles, Dates, Maps, and Sets. The old `JSON.parse(JSON.stringify(obj))` trick is lossy in several ways: `undefined` and functions vanish, `NaN` and `Infinity` become `null`, Dates become strings, and it throws on cycles. Both approaches drop the prototype, so a class instance comes back as a plain object with no methods — if that matters, give the class its own `clone()`.
</details>

---

### Q9 — prototypal inheritance

"Explain prototypal inheritance."

<details><summary>Answer</summary>

**Every object has a hidden link to another object, its prototype; when you read a property that isn't on the object, the engine walks that chain until it finds it or hits `null`.**

That's the whole mechanism. `class` is syntax sugar over it: methods you write in a class body go on `ClassName.prototype`, defined once and shared by every instance, while anything the constructor assigns to `this` becomes a per-instance own property. `extends` links the two prototype objects together, and `instanceof` is literally "does this constructor's `.prototype` appear anywhere in that object's chain." Two details worth stating: **writes never travel the chain** — assigning to `obj.x` always creates an own property that shadows the inherited one — and the chain terminates at `Object.prototype`, whose own prototype is `null`, which is why a missing property returns `undefined` instead of looping. The difference from classical inheritance is that there are no classes at runtime, only objects delegating to other objects, which is why you can change behavior for every instance at once by editing the prototype.
</details>

---

### Q10 — what happens when you type a URL

"What happens when you type a URL into the browser and press Enter?"

<details><summary>Answer</summary>

**In one sentence: resolve the name, open a connection, send an HTTP request, get bytes back, then parse and render them — and answer at whatever depth they steer you toward.**

First the browser checks its caches and resolves the hostname via **DNS** (browser cache → OS → resolver → root/TLD/authoritative), yielding an IP. Then it opens a **TCP** connection (three-way handshake) and, for HTTPS, negotiates **TLS** — certificate validation and key exchange. It sends an **HTTP request** with method, path, and headers including cookies; the server responds with a status line, headers, and a body. The browser parses the HTML into the **DOM**, and CSS into the **CSSOM**; scripts block parsing unless marked `async` or `defer`. Those combine into a render tree, then **layout** computes geometry, **paint** fills pixels, and the compositor puts layers on screen. Subresources — images, CSS, JS, fonts — trigger their own requests along the way, and once the DOM is ready `DOMContentLoaded` fires, with `load` waiting for everything.

*Good places to go deeper if asked:* HTTP caching headers, connection reuse and HTTP/2 multiplexing, CDNs and edge caching, the critical rendering path, or what makes the page interactive versus merely visible.
</details>

---

### Q11 — REST and idempotency

"How would you design the endpoints for a 'todo' resource? What does idempotent mean and which methods are?"

<details><summary>Answer</summary>

**Model resources as nouns and use the HTTP methods as the verbs: `GET /todos`, `GET /todos/:id`, `POST /todos`, `PUT /todos/:id`, `PATCH /todos/:id`, `DELETE /todos/:id`.**

**Idempotent** means making the same request N times leaves the server in the same state as making it once. GET, HEAD, PUT, and DELETE are idempotent; POST and PATCH are not. GET, HEAD, and OPTIONS are additionally **safe**, meaning they shouldn't change state at all. This matters practically: a client, proxy, or load balancer may safely retry a timed-out GET or PUT, but retrying a POST could create two orders — which is why payment APIs require an **idempotency key** header so the server can deduplicate. Status codes carry the rest of the contract: `201` with a `Location` header for a created resource, `204` for a successful delete with no body, `400` for malformed input versus `422` for well-formed but invalid, `401` for not-authenticated versus `403` for not-allowed, `409` for a version conflict, `429` for rate limiting. I'd also paginate collections rather than returning unbounded lists, and version the API from day one.
</details>

---

### Q12 — CORS and same-origin

"What is CORS and why does it block my request?"

<details><summary>Answer</summary>

**The same-origin policy stops a page on one origin from reading responses from another origin; CORS is the server's way of opting out of that restriction for specific callers.**

An origin is scheme + host + port, so `https://app.com` and `https://api.app.com` are different origins. The key thing people get backwards: the browser usually *does* send the request and the server *does* answer — the browser then refuses to hand the response to your JavaScript unless the server returned `Access-Control-Allow-Origin` matching your origin. That's why the same URL works fine in curl or the address bar. Anything beyond a "simple" request — a custom header, `PUT`/`DELETE`, a JSON content type — triggers a **preflight** `OPTIONS` request that the server must also answer correctly. Sending cookies requires `credentials: 'include'` on the client *and* `Access-Control-Allow-Credentials: true` on the server *and* a specific origin, because the wildcard is rejected with credentials. The fix always lives on the server or in a proxy; there is no front-end flag that disables it, and that's the point — it's what stops a malicious page from reading your bank's API using your session cookie.
</details>

---

### Q13 — race conditions

"JavaScript is single-threaded. Can you still have a race condition?"

<details><summary>Answer</summary>

**Yes. Single-threaded means no two lines run *simultaneously*; it doesn't mean operations are atomic across an `await`.**

Every `await` and every callback boundary is a point where other code can interleave. The classic case is read-modify-write: three handlers each read `balance`, all suspend on an `await`, then all write back `original + 1`, and two increments are lost. Another everyday version is the stale response — the user types fast, three searches are in flight, and the slowest one resolves last and overwrites the newest results. Fixes depend on the shape: keep the read and the write in the same synchronous block with no `await` between them; serialize work behind a promise chain or a simple mutex; use a request sequence number or `AbortController` to discard superseded responses; or push the atomicity down to the database with a transaction, a conditional update, or optimistic locking on a version column. In React the same class of bug shows up as a stale closure, and the fix there is the functional updater — `setCount(c => c + 1)` instead of `setCount(count + 1)`.
</details>

---

### Q14 — debugging a slow page

"A page in production feels slow. How do you find out why?"

<details><summary>Answer</summary>

**Measure before guessing — I want to know whether it's slow to load, slow to respond, or slow to update, because those have completely different causes.**

I'd start in DevTools: the **Network** panel tells me if it's payload size, request waterfalls, or a slow API; the **Performance** panel records a profile and shows whether time is going to scripting, layout, or paint; and Lighthouse gives me the Core Web Vitals — LCP for load, INP for responsiveness, CLS for layout stability. Common culprits by category: an oversized JS bundle or unoptimized images for load; long tasks blocking the main thread, or an accidental O(n²) loop for scripting; layout thrashing — reading `offsetHeight` between DOM writes forces a synchronous reflow every iteration — for rendering; and an N+1 query pattern or a missing index for the API side. Once I have a hypothesis I confirm it with a measurement, fix one thing, and re-measure — code splitting, virtualizing a long list, debouncing an expensive handler, memoizing a hot computation, or batching DOM reads and writes. And I'd check whether it's slow for everyone or only on certain devices and networks, because a laptop on office wifi hides most performance problems.
</details>

---

### Q15 — error handling strategy

"How do you handle errors in a real application?"

<details><summary>Answer</summary>

**Handle errors where you can actually do something about them, and let everything else bubble up to one place that logs and reports.**

Concretely: I don't wrap every call in a `try/catch`, because a `catch` that just logs and continues turns a crash into corrupted state — which is much harder to debug. At the boundaries — an HTTP handler, a job runner, a React error boundary — I catch everything, log with enough context to reproduce, and return a clean message to the user. In between, I throw typed errors (`class NotFoundError extends Error`) so callers can branch on `instanceof` instead of matching on message strings, and I use `new Error(msg, { cause: original })` to add context without losing the original stack. Async specifics: every promise chain needs a terminal `.catch`, an unhandled rejection crashes Node by default, and `fetch` doesn't reject on 404 or 500 — you must check `res.ok` yourself. I also distinguish expected failures from bugs: a validation failure is a `400` and normal control flow, while a `TypeError` is a defect that should page someone. And I never swallow an error silently; an empty `catch {}` block is a code review blocker.
</details>

---

### Q16 — walk me through a bug you fixed

"Tell me about a difficult bug and how you tracked it down."

<details><summary>Answer</summary>

**Structure it as a hunt, not a war story — localize, identify, fix minimally, prevent.**

The strongest version follows the method: "The symptom was X. I reproduced it, then I didn't guess — I followed one concrete value through the code, printing at each hop, until it stopped matching what I expected. That pointed at [the tell]. It turned out to be [bug class] — say, a `LEFT JOIN` a `WHERE` had quietly turned inner, so the report was dropping exactly the rows with nothing to show. I made the smallest fix that addressed the cause rather than the symptom, added a test that would have caught it — a fixture with the edge case the original test was too tidy to include — and checked for the same pattern elsewhere." What they're listening for: a repeatable method, resisting the urge to rewrite, fixing the cause not the crash site, and closing the loop with a test. Naming the bug class ("stale closure", "join fan-out") signals you've seen it before and will again. Have a real, specific instance ready — the details are what make it credible.
</details>

---

### Q17 — REST design

"How would you design the REST endpoints for a todo list?"

<details><summary>Answer</summary>

**Resources are nouns, HTTP methods are the verbs, and status codes carry the outcome.**

`GET /todos` lists (with pagination), `POST /todos` creates and returns `201` with the new resource, `GET /todos/:id` reads one (`404` if missing), `PATCH /todos/:id` partially updates, `PUT /todos/:id` replaces, `DELETE /todos/:id` removes and returns `204`. The methods carry semantics: `GET` is safe (no side effects) and cacheable; `PUT` and `DELETE` are idempotent (same request twice = same state), `POST` is not — which is why a retried `POST` can double-create and may need an idempotency key. Status codes matter: `2xx` success, `400` the client's fault (bad input — don't retry), `401`/`403` auth, `404` missing, `409` conflict, `5xx` the server's fault (maybe retry with backoff). I'd paginate the list with a cursor rather than a page number so it stays stable and fast as it grows, and I'd validate the request body at the boundary into a known shape before it touches the rest of the app.
</details>

---

### Q18 — SQL vs NoSQL

"When would you reach for a relational database versus a document store?"

<details><summary>Answer</summary>

**Default to relational; reach for a document store when the access pattern genuinely doesn't fit tables.**

Relational databases give you the things CRUD apps lean on constantly: JOINs across related data, transactions for all-or-nothing writes, constraints (UNIQUE, FOREIGN KEY) that enforce correctness on every path, and a schema that documents the shape. Most "users have orders have line items" applications are relational to the bone, and the honest default is Postgres. A document store earns its place when the data is genuinely hierarchical and read as a unit (a document with deeply nested, variable structure), when you need horizontal scale beyond what a single relational primary can serve, or when the schema really is unknown up front. The trap is choosing NoSQL to "avoid migrations" and then reinventing joins and transactions in application code, badly. I'd also mention that modern Postgres has a JSONB column type, so you can keep the relational backbone and store the occasional schemaless blob without leaving the database.
</details>

---

### Q19 — what happens when I type a URL

"Walk me through what happens from typing a URL to seeing the page."

<details><summary>Answer</summary>

**DNS, then a connection, then a request, then a response, then the browser builds the page — I can go as deep as you like at any step.**

The browser resolves the domain to an IP via DNS (checking caches first), opens a TCP connection and, for HTTPS, a TLS handshake to negotiate encryption. It sends an HTTP request — method, path, headers including cookies. The server routes it, does its work (often a database query or two), and returns a response with a status code and a body. The browser parses the HTML into a DOM, fetches referenced CSS and JS (CSS blocks rendering, so it's high priority; scripts can block parsing unless `async`/`defer`), builds the render tree, does layout and paint. Then JavaScript runs and can mutate the DOM, kicking off more requests via `fetch`. Things I'd flag depending on their interest: caching at every layer (DNS, CDN, browser cache, `ETag`/`304`), why a CDN makes the static assets fast, CORS if the JS calls a different origin, and that the whole thing is one round trip after another — latency, not bandwidth, is usually what makes it feel slow.
</details>

---

### Q20 — idempotency

"What does idempotent mean, and why should I care?"

<details><summary>Answer</summary>

**An operation is idempotent if doing it twice leaves the same state as doing it once — and it's what makes retrying safe.**

`GET`, `PUT`, and `DELETE` are idempotent by design: reading twice, setting to the same value twice, deleting twice all end in the same place. `POST` generally isn't — two "create order" calls make two orders. Why it matters: networks fail after the server did the work but before the response got back, so any robust client retries — and retrying a non-idempotent write double-charges, double-orders, double-emails. The fix is an idempotency key: the client generates a unique key per logical operation and sends the same one on every retry; the server performs the work at most once per key and returns the stored result to repeats. So the pairing is: retries make a call reliable, idempotency makes those retries safe. In a database, the same idea shows up as an UPSERT (`INSERT ... ON CONFLICT DO UPDATE`) — running it twice converges instead of duplicating.
</details>

---

### Q21 — indexes

"What is a database index, and what's the cost of adding one?"

<details><summary>Answer</summary>

**An index is a sorted lookup structure that turns a full-table scan into a fast seek — paid for with slower writes and disk space.**

Without an index, `WHERE email = ?` scans every row, O(n). An index on `email` (usually a B-tree) lets the database jump straight to the match in O(log n), and it keeps rows in sorted order so `ORDER BY` and range queries over the indexed column are cheap too. The costs are real: every `INSERT`, `UPDATE`, and `DELETE` now has to maintain the index as well as the row, so writes get slower, and the index takes disk. So you index the columns you filter, join, and sort on — foreign keys almost always, the columns in your hot `WHERE` clauses — and you don't index everything by reflex. I'd verify an index is actually used with `EXPLAIN QUERY PLAN`; a common surprise is that wrapping the column in a function (`WHERE lower(email) = ?`) defeats the index unless you built a matching functional index. Composite indexes are order-sensitive — `(a, b)` helps a query filtering on `a`, or `a` and `b`, but not `b` alone.
</details>

---

### Q22 — testing philosophy

"What should be tested, and how much?"

<details><summary>Answer</summary>

**Test behavior at the edges and the risky logic in the middle — coverage is a means, not a goal.**

I think in terms of the testing pyramid: many fast unit tests over pure logic and edge cases, fewer integration tests over how pieces fit (a handler through to the database), and a small number of end-to-end tests over the critical user flows. What I actually target is the code that would hurt if it broke and the cases that are easy to get wrong — the empty input, the boundary value, the concurrent call, the error path — because that's where bugs live and where a too-tidy fixture hides them. I test behavior, not implementation: a test that asserts "the total is 12200 for this cart" survives a refactor; one that asserts "this private method was called" breaks the moment you rename it. And I'm wary of the coverage number as a target — 100% coverage of the happy path proves nothing, while one well-chosen edge-case test can be worth twenty. If I'm fixing a bug, the first thing I write is the failing test that reproduces it; that both proves the fix and stops the regression.
</details>

---

### Q23 — caching and its hazards

"When would you add a cache, and what makes it dangerous?"

<details><summary>Answer</summary>

**Cache when reads vastly outnumber writes and the data tolerates being slightly stale — and respect that cache invalidation is one of the genuinely hard problems.**

The case for a cache is a hot read path over data that changes rarely: a config, a rendered page, an expensive aggregate. You put the result in a fast store (in-memory, Redis, a CDN) keyed by the inputs, and serve from there. The dangers are all about correctness over time. Staleness: the underlying data changed but the cache didn't, so you serve old data — you manage it with a TTL (accept staleness for a bounded window) or explicit invalidation on write (correct but easy to get wrong). Key collisions: a cache key that isn't specific enough serves one user's data to another — a real security bug, not just a correctness one. The thundering herd: an entry expires and a thousand requests all miss and recompute at once. And plain "did I remember to invalidate this on every write path" — miss one and the bug is intermittent and awful to reproduce. So I only add a cache when the read pressure justifies the complexity, I make the staleness window explicit, and I make the key carry everything that distinguishes one result from another.
</details>

---

### Q24 — the system-design-lite round

"Design a URL shortener" (or a rate limiter, a paginated feed, a like button).

<details><summary>Answer</summary>

**Four moves, in order — entities, endpoints, storage, then the one hard part — and narrate the reasoning out loud.**

For a URL shortener: *Entities* — `links(id, slug UNIQUE, target_url, owner_id, created_at)`. *Endpoints* — `POST /links` creates and returns a slug; `GET /:slug` redirects and is the hot path by orders of magnitude. *Storage* — index on `slug` because every redirect is a lookup by it; the slug is a short random token, not an auto-increment id, or it's guessable and enumerable. *The hard part* — reads dwarf writes, so you cache slug→url aggressively and accept that a just-edited link may serve stale for a few seconds; name that trade-off explicitly, because it's what the question is actually testing. Every one of these prompts has exactly one interesting trade-off — for a rate limiter it's the counter and the clock, for a feed it's keyset vs offset pagination, for a like button it's the idempotent, write-heavy counter — and the interviewer wants to watch you find it and reason about it, not recite a big-box architecture. State your assumptions ("single region, relational DB — say if you'd like me to revisit that") and keep talking. `cheatsheets/interview-behavioral.md` has the full template and more worked examples.
</details>
