# 03 · Values, References, and Memory

Two variables point at the same object, one mutates it, and a test that
passed yesterday fails today in a file nobody touched. A cache grows for
eleven days and the pod gets OOM-killed at 3am. A `const` config object
changes underneath you. Same lesson, three costumes: **you have to know
what a variable holds, who else holds it, and who is still holding it after
you stopped caring.**

This is mechanism, not vocabulary — by the end you should be able to draw
the boxes and arrows for any snippet, predict which clone strategy costs
what, and name the four shapes a JavaScript leak takes.

Everything here was measured on **Node v22.16.0, Windows 11, this laptop**,
warm process, rounded. Your numbers will differ; the *ratios* mostly won't.

---

## 1 · There are exactly two kinds of value

JavaScript has seven primitive types (`string`, `number`, `bigint`,
`boolean`, `undefined`, `symbol`, `null`) and one everything-else type:
objects — arrays, functions, `Date`, `Map`, `RegExp`, class instances,
promises. The distinction that matters is not "primitive vs object":

> **A primitive value is the thing itself. An object value is a reference
> to the thing.**

A variable is a labelled box. The box is always small — a number, or an
address. When you write `{ a: 1 }`, the object goes on the heap and the box
gets its address.

```
   let n = 42;                 let o = { a: 1 };

   ┌──────────┐                ┌──────────┐         ┌─────────────┐
   │ n │  42  │                │ o │ ──●──┼────────▶│  { a: 1 }   │
   └──────────┘                └──────────┘         └─────────────┘
    the value IS                the value is an       the object lives
    in the box                  ADDRESS               on the heap
```

Everything else in this guide falls out of that picture.

### The stack/heap story, and where it's a lie

The usual teaching model: primitives live on the stack, objects live on the
heap, the stack is fast and automatic, the heap is slower and
garbage-collected.

That model is *useful* and *not literally true*. Real V8 tags small
integers inline (SMIs), so a `number` holding `42` genuinely is the box
while one holding `0.1` may be a heap-allocated double; it does escape
analysis, so an object that provably never leaves a function may never be
allocated at all; and it shares string data, so a `.slice()` of a huge
string can keep the whole parent alive.

Use the stack/heap picture for reasoning about **identity and sharing**,
which is what it models correctly. Don't use it to reason about
performance; measure that instead.

---

## 2 · Assignment copies the box, never the thing

```js
let a = { n: 1 };
let b = a;        // copies the ADDRESS
b.n = 2;
console.log(a.n, b.n, a === b);   // logs: 2 2 true

let x = 1;
let y = x;        // copies the VALUE
y = 2;
console.log(x, y);                // logs: 1 2
```

```
   ┌─────┐                     ONE object, two names.
   │  a  │──●──┐               `b.n = 2` follows the arrow, so
   └─────┘     │  ┌──────────┐ the change is visible through BOTH.
   ┌─────┐     ├─▶│ { n: 2 } │
   │  b  │──●──┘  └──────────┘ `b = {}` would only repoint b's box.
   └─────┘
```

There is no "copy the object" operator. `=` never deep copies, never shallow
copies, never anything — it moves an address.

### `===` on objects compares addresses

```js
console.log({ a: 1 } === { a: 1 });   // => false  — two allocations
```

Which is why every test framework ships a `toEqual`, and why
`array.includes(someObject)` finds nothing unless it's literally the same
object.

---

## 3 · `const` freezes the binding, not the value

`const` is a promise about the **box**: nobody will point this box
somewhere else. It says nothing about the thing at the other end of the
arrow.

```js
const cfg = { debug: false };
cfg.debug = true;
console.log(cfg.debug);   // => true      ← mutation is fine
cfg = {};                 // TypeError: Assignment to constant variable.
```

```
   const cfg = { debug:false }

   ┌───────┐   this arrow is frozen     ┌──────────────────┐
   │  cfg  │══════════════════════════▶ │ { debug: false } │  ← this is NOT
   └───────┘                            └──────────────────┘
```

To freeze the *thing*, you need `Object.freeze` — and it is **shallow**:

```js
const frozen = Object.freeze({ a: 1, nested: { b: 2 } });
frozen.a = 9;             // TypeError: Cannot assign to read only property 'a' of object '#<Object>'
frozen.nested.b = 99;     // ...works fine
console.log(frozen.nested.b, Object.isFrozen(frozen), Object.isFrozen(frozen.nested));
// logs: 99 true false
```

Two things to internalise:

1. That `TypeError` only appears in **strict mode**. In sloppy mode the
   assignment fails *silently*. All ESM modules are strict, so in this
   bootcamp you get the throw — in a `<script>` tag or a `.cjs` file
   without `'use strict'`, you get a silent no-op, which is worse.
2. Freezing is per-object. A deep freeze is a recursive walk you write
   yourself:

```js
function deepFreeze(o) {
  if (o === null || typeof o !== 'object' || Object.isFrozen(o)) return o;
  Object.freeze(o);                       // freeze first — handles cycles
  for (const v of Object.values(o)) deepFreeze(v);
  return o;
}
```

Freeze first, recurse second — that ordering is what stops a cyclic object
from blowing the stack. **Opinion:** deep-freeze in tests and dev builds,
where "who mutated my fixture?" costs you an afternoon; not in hot paths,
where you pay for the walk and deoptimise property access.

---

## 4 · Arguments: call by sharing

JavaScript is call-by-value — but when the value is a reference, "by value"
means the *address* is copied. The name for this is **call by sharing**, and
it produces the rule beginners find contradictory:

> A function can change *what your object contains*. It cannot change
> *which object your variable points at*.

```js
function mutate(o)   { o.hit = true; }         // reaches through the arrow
function reassign(o) { o = { hit: 'nope' }; return o; }   // repoints its OWN box

const t = {};
mutate(t);
const r = reassign(t);
console.log(JSON.stringify(t), JSON.stringify(r));
// logs: {"hit":true} {"hit":"nope"}
```

`mutate` follows the arrow, so the caller sees it. `reassign` overwrites
its *own* box, so the caller sees nothing.

The consequence: a function that mutates its object argument is an
**out-parameter**, and out-parameters are invisible at the call site.
`normalize(user)` tells the reader nothing; `const clean = normalize(user)`
does. Prefer returning new values — `bootcamp/11-functional-programming`
drills exactly this.

---

## 5 · Four levels of equality

| level | operator | `NaN` | `+0`/`-0` | `{a:1}` vs `{a:1}` | coerces? |
| --- | --- | --- | --- | --- | --- |
| loose | `==` | not equal | equal | false | **yes** |
| strict | `===` | not equal | **equal** | false | no |
| SameValue | `Object.is` | **equal** | **not equal** | false | no |
| SameValueZero | `includes`, `Map`/`Set` keys | **equal** | equal | false | no |
| structural | `deepEqual` | your choice | your choice | **true** | no |

`==` is a whole algorithm and it has its own guide — see
[`04-coercion-without-tears.md`](04-coercion-without-tears.md). Here we care
about the other three.

```js
console.log(NaN === NaN, Object.is(NaN, NaN));   // logs: false true
console.log(0 === -0,    Object.is(0, -0));      // logs: true false
```

`===` has exactly two bugs, both deliberate: `NaN` isn't itself (IEEE-754
says so) and `-0` is `0` (you almost always want that). `Object.is` fixes
both. **SameValueZero** is the third rule — `NaN` equals itself, `-0`
equals `0` — and it's what modern collection APIs use, which is why these
two disagree:

```js
console.log([NaN].indexOf(NaN), [NaN].includes(NaN));   // logs: -1 true
console.log(new Set([NaN, NaN]).size, new Set([0, -0]).size);  // logs: 1 1
```

`indexOf` predates SameValueZero and is stuck with `===` forever.
`includes` (ES2016) got the better rule. Same array, opposite answers.

`Map` goes one step further and **normalises `-0` to `+0` on the way in**:

```js
const m = new Map();
m.set(-0, 'a');
const [k] = m.keys();
console.log(m.get(0), k, Object.is(k, -0));   // logs: a 0 false
```

You cannot store a `-0` key in a Map. It is converted at the door.

### Structural equality: what a real `deepEqual` must handle

Node ships one — verified present in 22.16:

```js
import { isDeepStrictEqual } from 'node:util';
console.log(isDeepStrictEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }));  // => true
console.log(isDeepStrictEqual(NaN, NaN), isDeepStrictEqual(0, -0));          // logs: true false
```

Note the last line: it uses SameValue for `NaN` but still distinguishes
`-0`. Every deep-equal makes a *policy* choice there and they disagree with
each other — read your test framework's docs before asserting on `-0`.

A compact version, so you can see the policy surface:

```js
function deepEqual(a, b, seen = new Map()) {
  if (Object.is(a, b)) return true;                       // NaN, identity
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (seen.get(a) === b) return true;                     // cycles
  seen.set(a, b);
  if (a instanceof Date)   return a.getTime() === b.getTime();
  if (a instanceof RegExp) return a.source === b.source && a.flags === b.flags;
  if (a instanceof Map) {
    return a.size === b.size &&
      [...a].every(([k, v]) => b.has(k) && deepEqual(v, b.get(k), seen));
  }
  if (a instanceof Set) {                                 // identity for objects!
    return a.size === b.size && [...a].every((v) => b.has(v));
  }
  const ka = Reflect.ownKeys(a);
  return ka.length === Reflect.ownKeys(b).length &&
    ka.every((k) => Object.hasOwn(b, k) && deepEqual(a[k], b[k], seen));
}
```

Seven policy decisions are hiding in there, every one of them arguable in
review: `NaN`, `-0`, prototypes, cycles, `Date`/`RegExp` special cases,
`Set` membership of *object* elements (unsolvable without an O(n²) match),
and symbol keys. That's why "just write a deepEqual" is a two-hour task,
not a five-minute one.

---

## 6 · Copying: four strategies, measured

Since `=` never copies, you pick a strategy. Measured against a realistic
payload — 200 orders × 5 line items, **101,500 bytes of JSON, ~2,400 object
nodes**, averaged over 200 runs on this machine:

| strategy | depth | this payload | preserves |
| --- | --- | --- | --- |
| `{ ...obj }` / `Object.assign` | 1 level | **0.002 ms** | nothing below level 1 (shared refs) |
| hand-written recursive clone | full | **3.5 ms** | plain objects/arrays only |
| `JSON.parse(JSON.stringify(x))` | full | **12.6 ms** | JSON types only, silently lossy |
| `structuredClone(x)` | full | **22.5 ms** | Date, Map, Set, RegExp, cycles, typed arrays |

Read that table twice, because it contradicts two pieces of folklore:

1. **`structuredClone` is not the fast one.** On plain-JSON data it was the
   *slowest* deep option here — it pays for generality (cycle tracking,
   type tags, the serialize/deserialize boundary). Reach for it because it
   is *correct*, not because it is fast.
2. **The shallow copy is ~1000× cheaper than any deep copy.** Deep-cloning
   in a reducer on every keystroke is your frame budget, gone. Most
   "immutable update" code wants a shallow copy of the spine plus shared
   subtrees — which is
   `bootcamp/11-functional-programming/exercises/04-nested-update.js`.

### Shallow means shallow

```js
const orig = { a: 1, deep: { b: 2 } };
const copy = { ...orig };
copy.deep.b = 99;
console.log(orig.deep.b, copy.deep === orig.deep);   // logs: 99 true
```

Level 1 copied, level 2 shared — the single most common "immutable" bug in React
codebases.

### What the JSON round-trip destroys

```js
const src = {
  when: new Date('2020-01-01T00:00:00Z'),
  tags: new Set(['a']),
  index: new Map([['k', 1]]),
  missing: undefined,
  fn() {},
  nope: NaN,
  big: Infinity,
  re: /ab+c/gi,
};
console.log(JSON.stringify(JSON.parse(JSON.stringify(src))));
// logs: {"when":"2020-01-01T00:00:00.000Z","tags":{},"index":{},"nope":null,"big":null,"re":{}}
```

Count the casualties: `Date` → string, `Set` → `{}`, `Map` → `{}`,
`undefined` → key *deleted*, function → key deleted, `NaN` → `null`,
`Infinity` → `null`, `RegExp` → `{}`. Cycles don't degrade, they throw:

```js
const cyc = { name: 'root' }; cyc.self = cyc;
JSON.stringify(cyc);   // TypeError: Converting circular structure to JSON
```

The dangerous part: **none of the rest throws**. Your `Map` becomes `{}`,
the code carries on, and the bug surfaces three layers away as
`.get is not a function`.

### What `structuredClone` gets right, and its two limits

```js
const cc = structuredClone(cyc);
console.log(cc.self === cc, cc !== cyc);   // logs: true true   ← cycles survive
structuredClone({ fn: () => {} });         // DOMException: () => {} could not be cloned.
```

Types survive (`Date`, `Map`, `Set`, `RegExp`, `NaN`, `Infinity`,
`undefined` — all verified). Functions are a hard error. And the limit that
bites in real code, **class identity is lost**:

```js
class User { constructor(n) { this.n = n; } greet() { return 'hi ' + this.n; } }
const uc = structuredClone(new User('ada'));
console.log(uc instanceof User, Object.getPrototypeOf(uc) === Object.prototype);
// logs: false true
```

A plain object with the right fields and no methods: the algorithm copies
*data*, and a prototype is not data. If you need instances back you need a
revive step — the same argument as "parse, don't validate" at a boundary.

**Decision rule:**

```
   Do I need level 2+ ?
    │
    ├─ no ──▶ spread / Object.assign            (0.002 ms)
    │
    └─ yes ─▶ Date/Map/Set/cycles/typed arrays?
                │
                ├─ yes ──▶ structuredClone      (22 ms — correct, not fast)
                │
                └─ no ──▶ hot path?
                            ├─ yes ──▶ hand-written recursive  (3.5 ms)
                            └─ no  ──▶ JSON round-trip (12.6 ms, lossy —
                                       know exactly what you're losing)
```

---

## 7 · Garbage collection, only as much as you need

The rule is **reachability**, not reference counting:

> An object is garbage when the collector cannot reach it by walking
> pointers from the roots.

Roots are the stack of every active frame, the global object, module scopes,
and a few engine-internal handles. That's the whole model, and it has one
important consequence: **cycles are not leaks**. Two objects pointing at each
other, with nothing pointing at either, are unreachable and get collected.

```
        ROOTS (stack frames, globals, module scopes)
          │
          ├──▶ [A] ──▶ [B] ──▶ [C]          reachable → kept
          │
          └──▶ [D]
                                 [E] ⇄ [F]  cycle, unreachable → collected
```

### Mark & sweep, and why it's generational

Naive mark & sweep: stop the world, walk everything from the roots marking
what you find, sweep the unmarked. Cost is proportional to the *live* set,
so a big long-lived heap makes every collection expensive. V8 exploits the
**generational hypothesis** — most objects die very young — and splits the
heap:

```
    ┌─────────────── young generation (small, a few MB) ──────────────┐
    │  nursery  ──copy survivors──▶  intermediate  ──promote──▶       │
    │  Scavenger: fast, frequent, copies live objects, ~0.1–5 ms      │
    └──────────────────────────────────┬──────────────────────────────┘
                                       │ survived two scavenges
                                       ▼
    ┌────────────── old generation (hundreds of MB) ──────────────────┐
    │  Mark-Compact: slower, rarer, marks + compacts, tens of ms      │
    │  much of the marking runs CONCURRENTLY on helper threads        │
    └─────────────────────────────────────────────────────────────────┘
```

You can watch it happen. `node --trace-gc` on a loop that allocates 60
arrays and keeps every tenth one:

```
[19692:...] 574 ms: Scavenge 7.3 (12.3) -> 5.8 (10.7) MB, pooled: 0 MB,  4.30 / 0.00 ms  ... allocation failure;
[19692:...] 612 ms: Scavenge 7.7 (12.7) -> 6.2 (11.1) MB, pooled: 0 MB, 33.17 / 0.00 ms  ... allocation failure;
```

How to read a line: `Scavenge` is the young-gen collector,
`7.7 (12.7) -> 6.2 (11.1) MB` is heap-used (heap-total) before → after, and
`33.17 ms` is how long your JavaScript thread was **stopped**. That 33 ms
line is a real p99 spike. Nothing ran during it — not your handler, not
your timers, not the health-check response.

That's the connection back to
[`01-the-event-loop-all-the-way-down.md`](01-the-event-loop-all-the-way-down.md):
GC pauses are the one source of latency that isn't in your code and can't
be found by reading it. Allocation rate is a latency feature.

---

## 8 · What leaks actually look like

A JavaScript "leak" is never lost memory — it is memory you can **still
reach and no longer want**. Four shapes cover almost all of them.

### Shape 1 — the unbounded cache

The most common production leak, by a distance.

```js
const cache = new Map();
function handle(i) {
  const payload = { id: i, body: 'x'.repeat(1024) };
  cache.set(`req_${i}`, payload);      // nothing ever removes this
  return payload.id;
}
```

Measured, 100,000 calls each, identical work, only eviction differs:

```
start                  heapUsed    4.1 MB   rss   42.0 MB
after 100k bounded     heapUsed    9.8 MB   rss   52.2 MB     (100 entries kept)
after 100k leaky       heapUsed   40.6 MB   rss  109.6 MB     (100,000 entries kept)
```

The bounded version is the same loop with four extra characters of policy:

```js
bounded.set(key, payload);
if (bounded.size > 100) bounded.delete(bounded.keys().next().value);
```

That works because **`Map` preserves insertion order**, so `keys().next()`
is the oldest entry — a FIFO cache in one line. Promote it to a real LRU and
you have `bootcamp/09-data-structures/exercises/20-lru-cache.js`.

> **Rule:** every cache needs an eviction policy chosen when the cache is
> created. A cache without a bound is a memory leak with good intentions.

### Shape 2 — the closure that captures more than it uses

This one is subtle, and the naive demo doesn't reproduce it. V8 only
context-allocates variables that some inner function **actually
references** — so this does *not* leak:

```js
function onlySmallCaptured() {
  const big = new Array(131072).fill(0);   // ~1 MB
  const count = big.length;
  return { get: () => count };             // nothing mentions `big`
}
```

But closures in the same scope **share one context object**. So if a
*sibling* closure mentions `big`, keeping *any* of them keeps `big`:

```js
function siblingHoldsIt() {
  const big = new Array(131072).fill(0);
  const count = big.length;
  return {
    get:   () => count,          // you keep this one...
    debug: () => big.length,     // ...and this one pins `big` for both
  };
}
```

Measured — 50 of each, keeping only `.get`, with `global.gc()` between:

```
start                     heapUsed  3.8 MB
50 x only-small captured  heapUsed  4.0 MB      ← `big` collected
50 x sibling-holds-it     heapUsed 54.0 MB      ← 50 MB pinned by a debug helper
```

50 MB held alive by a function nobody ever calls. That's the shape: a
`debug()` helper or error-reporting callback that mentions a big local,
sitting in a scope whose *other* closure is stored long-term.

Fix: narrow the scope, null the reference when you're done with it, or pass
the small value into a factory so the big one is never in scope.

### Shape 3 — listeners and timers that outlive their owner

```js
emitter.on('tick', onTick);     // registered once per component instance
setInterval(poll, 1000);        // never cleared
```

An `EventEmitter` holds a **strong** reference to every listener, and a
listener usually closes over its whole component. Register on mount, remove
on unmount — and in Node, `setInterval` also keeps the process alive, so
`unref()` background timers. The browser flavour is the detached DOM node:
the element is gone from the document, but a listener array still points at
it, so the whole subtree stays.

`AbortController` is the tidy answer — one `abort()` removes every listener
registered with that signal:

```js
const ac = new AbortController();
target.addEventListener('x', fn, { signal: ac.signal });
ac.abort();   // one call, everything unhooked
```

### Shape 4 — module-scope accumulation

```js
export const requestLog = [];              // top-level = lives forever
export function log(req) { requestLog.push(req); }
```

Module scope is a root — anything pushed into a top-level array or Map
lives until the process exits. Easy to spot in review, nearly invisible in
a profiler graph, because it looks like normal growth.

### The weak toolbox

`WeakMap`/`WeakSet` hold keys weakly: the entry disappears when the key
does, so metadata dies with the thing it describes. That's the fix for
"I need to attach data to objects I don't own."

```js
const meta = new WeakMap();
meta.set(session, { lastSeen: Date.now() });   // no leak: session dies → entry dies
```

`WeakRef` and `FinalizationRegistry` go further — verified under
`node --expose-gc`:

```js
let target = { big: 'x'.repeat(1000) };
const ref = new WeakRef(target);
const reg = new FinalizationRegistry((tag) => console.log('finalized:', tag));
reg.register(target, 'the-target');

console.log('before gc:', ref.deref() !== undefined);   // logs: before gc: true
target = null;
global.gc();
console.log('after gc: ', ref.deref() !== undefined);   // logs: after gc:  false
// later, after the process drains: logs: finalized: the-target
```

Note the finalizer ran **last**, after the rest of the script — it is
scheduled, not synchronous, and the spec permits it to never run at all. So:

> **Rule:** `WeakRef`/`FinalizationRegistry` are for caches and diagnostics.
> Never release a resource (file handle, socket, lock) in a finalizer — use
> `try/finally`, `Symbol.dispose`, or an explicit `close()`.

---

## 9 · Finding a leak on purpose

Four tools, in the order you should reach for them.

**1. `process.memoryUsage()` deltas.** Cheap, works in production, tells
you whether you have a problem.

```js
setInterval(() => console.log(process.memoryUsage()), 10_000).unref();
```

Read the fields properly: `heapUsed` is live JS objects, `heapTotal` is
what V8 reserved, `rss` is everything the OS gave the process, and
`external`/`arrayBuffers` are Buffers and typed arrays — which live
**outside** the JS heap, so a Buffer leak barely moves `heapUsed` while
`rss` climbs (exactly what Shape 1's numbers show).

The signature of a leak is not "memory is high". It is **the floor after
each GC being higher than the floor before**. Sawtooth with a flat bottom
is healthy; sawtooth with a rising bottom is a leak.

**2. `--trace-gc`.** Confirms the diagnosis and shows the pause cost. Mark-Compact
running back to back with the "after" number barely below the "before" number
means the heap is full of live objects and you are minutes from an OOM.

**3. Heap snapshots.** The tool that actually names the culprit.

```js
import v8 from 'node:v8';
v8.writeHeapSnapshot();     // -> Heap.20260821.194648.10024.0.001.heapsnapshot
```

Measured here: a 20,000-object heap took **2.76 s** and produced a **15 MB**
file. That is a fully blocking stop — snapshot a canary instance, never the
pod serving your p99. Then the three-snapshot technique:

```
  1. snapshot → after warm-up, caches filled          (baseline)
  2. run the suspect operation N times
  3. snapshot → GC first                              (candidate)
  4. run it N times again
  5. snapshot → GC first                              (confirmation)

  DevTools → Memory → load all three → "Comparison", snapshot 3 vs 2.
  Sort by "# Delta": anything with a delta of exactly N is your leak.
  Click it, read "Retainers" — that path IS the reference you forgot.
```

Drag `.heapsnapshot` files into Chrome DevTools' Memory panel; it works
fully offline, which matters on a plane. Two numbers to know: **shallow
size** is the object itself, **retained size** is everything that would be
freed if it died. Sort by retained size and look for the outlier that
shouldn't be near the top.

**4. `--max-old-space-size`.** Both a lever and a diagnostic.

```
default heap limit on this machine:          4144 MB
node --max-old-space-size=64  →  limit:       112 MB
```

Note that setting it to 64 gives a *112 MB* limit — the flag caps the **old
space**, not the whole heap; young generation, code space and large-object
space are extra. Don't treat the number as a total.

The crash, when it comes, is unmistakable:

```
<--- Last few GCs --->
[25900:...] 564 ms: Mark-Compact 63.7 (97.1) -> 63.7 (97.1) MB, ... allocation failure; scavenge might not succeed
<--- JS stacktrace --->
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

`63.7 -> 63.7` is the tell: a full Mark-Compact freed **nothing**. Every
byte is reachable. That is a leak, not a tuning problem, and raising the
flag buys you hours, not a fix.

Three practical notes. In a container, set it **below** the container limit
(~75–80% of the cgroup limit) — otherwise the OOM killer takes the process
first, and a V8 heap error gives you a stack trace where an OOM kill gives
you exit code 137 and silence. Raising it is legitimate for a genuinely
large working set, never as a response to a rising floor. And lowering it
is a debugging tool: run the soak test with `--max-old-space-size=128` and
a 6-hour bug becomes a 6-minute bug.

---

## Now go do

| file | what it drills |
| --- | --- |
| [`bootcamp/01-language-core/exercises/22-value-vs-reference.js`](../bootcamp/01-language-core/exercises/22-value-vs-reference.js) | The boxes-and-arrows model, in code — start here if any diagram above felt hand-wavy. |
| [`bootcamp/01-language-core/exercises/23-deep-copy.js`](../bootcamp/01-language-core/exercises/23-deep-copy.js) and [`bootcamp/03-arrays-and-objects/exercises/24-deep-clone.js`](../bootcamp/03-arrays-and-objects/exercises/24-deep-clone.js) | Writing the clone yourself, which is the only way the JSON round-trip's casualty list sticks. |
| [`bootcamp/01-language-core/exercises/04-same-value.js`](../bootcamp/01-language-core/exercises/04-same-value.js) | `Object.is` from scratch — `NaN` and `-0`, the two holes in `===`. |
| [`bootcamp/03-arrays-and-objects/exercises/28-deep-equal.js`](../bootcamp/03-arrays-and-objects/exercises/28-deep-equal.js) | Structural equality and all seven policy decisions in §5. |
| [`bootcamp/09-data-structures/exercises/20-lru-cache.js`](../bootcamp/09-data-structures/exercises/20-lru-cache.js) | The eviction policy that turns Shape 1's leak into a bounded cache. Do this one *because* of this guide. |

## Self-test

**1.** This function is called on every WebSocket message and the process
grows steadily. `sessions` is a `Map` that is correctly cleaned up on
disconnect, and there are never more than 200 connections. Where is the
leak?

```js
const sessions = new Map();
function onMessage(id, frame) {
  const session = sessions.get(id);
  session.history.push(frame);
  session.lastFrame = frame.slice(0, 32);
  return session.lastFrame;
}
```

<details>
<summary>Answer</summary>

Two candidates, both real.

`session.history.push(frame)` is Shape 1 in disguise: the *number of
sessions* is bounded, the memory *per session* isn't. A bounded collection
of unbounded things is still unbounded. Cap the history, or don't keep it.

The subtler one is `frame.slice(0, 32)`. If `frame` is a **Buffer**, that
slice is an alias of the same `ArrayBuffer`, not a copy — verified:

```js
const big = Buffer.alloc(1024, 7);
const s = big.slice(0, 32);
s[0] = 9;
console.log(big[0] === 9, s.buffer === big.buffer, s.buffer.byteLength);
// logs: true true 1024        ← 32 "bytes" retaining 1024
```

So `lastFrame` pins the entire frame. Use `Buffer.from(frame.subarray(0,32))`,
or `Uint8Array.prototype.slice`, which *does* copy (verified: its `.buffer`
differs). If `frame` is a **string**, the same trap exists in softer form —
V8 may keep the slice as a view into the parent.

Diagnosis: `rss` climbing much faster than `heapUsed` points at the Buffer
version; a three-snapshot comparison sorted by retained size names either.

</details>

**2.** A colleague replaces `JSON.parse(JSON.stringify(state))` with
`structuredClone(state)` "for performance" in a Redux-style reducer. Give
two concrete reasons this could make things *worse*, and the one reason it
might still be the right change.

<details>
<summary>Answer</summary>

Worse, reason one: it's slower for plain-JSON data. Measured here on a
101 KB payload — 22.5 ms for `structuredClone` vs 12.6 ms for the JSON
round-trip. Nearly 2× the cost, in a function that runs on every dispatch.

Worse, reason two: it changes semantics silently in the *permissive*
direction. The JSON version was destroying `Date`s and `Map`s, and
downstream code may be written against that — `new Date(state.when)` now
gets a `Date` where it expected a string. It also stops throwing on cycles,
so a cycle that used to fail loudly in a test now clones happily.

Right change, though: **it stops the data loss**. If the state legitimately
holds `Date`s, `Map`s, `Set`s or `undefined`, the JSON round-trip corrupts
them on every dispatch. But the honest framing is "fixing data loss, costs
10 ms" — and for a hot reducer the real answer is neither: shallow-copy the
spine, share the untouched subtrees, clone ~5 objects instead of 2,400.
</details>

**3.** `const` prevents reassignment, `Object.freeze` prevents mutation.
Why does a deeply-frozen object still not give you the guarantee a
functional programmer wants, and what does?

<details>
<summary>Answer</summary>

Three gaps. It's **silent in sloppy mode** — the write fails and returns
the value, so enforcement depends on where the *caller* runs, not where you
froze. It blocks `[[Set]]`/`[[Delete]]`/`[[DefineOwnProperty]]` on that
object but **not the contents of a `Map`, `Set` or `Date`** —
`Object.freeze(new Map())` is a frozen box around a fully mutable
collection, and `.set()` works fine. And it's a runtime property with no
compile-time visibility, so nothing stops a caller from trying; you get a
crash at 3am instead of a type error at build time.

What actually gives you the guarantee: not handing out the mutable
reference. Return new values instead of mutating (module 11), keep state
private behind a closure or `#private` field (modules 02 and 05), and use
`readonly`/`Readonly<T>` in the TypeScript track so the compiler rejects
the write before it exists. Freeze is a *tripwire for finding bugs in
tests*, not a design.
</details>

---
**Pairs with:** [`bootcamp/01-language-core`](../bootcamp/01-language-core/) · **Cheatsheet:** [`object-map-set.md`](../cheatsheets/object-map-set.md) · **Next guide:** [`04-coercion-without-tears.md`](04-coercion-without-tears.md)
