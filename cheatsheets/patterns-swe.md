# Patterns & SWE Judgement

The 12 patterns worth knowing in JS, SOLID translated out of Java, and the heuristics that decide the rest.

## Top of mind

| Situation | Reach for |
| --- | --- |
| A `switch` that grows every sprint | **Strategy** — an object of functions keyed by the case |
| "Wrap this function with logging/retry/cache" | **Decorator** — a higher-order function |
| Two modules need to talk without importing each other | **Observer** — an event bus |
| An error crossing a layer boundary | `throw new Error('context', { cause: err })` |
| A function with a `boolean` flag parameter | Split it into two named functions |

Every example below was executed on Node 22.16.

---

## The 12 patterns

### 1. Module / Revealing Module

**Intent.** Expose a small public surface; keep the state private.

```js
const counter = (() => {
  let n = 0;                                  // private — no way to reach it
  return { inc: () => ++n, get: () => n };    // the "revealed" surface
})();
counter.inc(); counter.get();                 // => 1   (counter.n => undefined)
```

**In the wild.** ESM itself — a module's non-exported bindings are unreachable. The IIFE form is what bundlers emitted before ES modules existed.
**Smell.** In modern code just write a module and `export` two functions. The IIFE is only for a single file with no build step.

### 2. Factory

**Intent.** Create objects without the caller knowing (or caring) which concrete type comes back.

```js
const makeUser = (name, role = 'viewer') => ({
  name, role,
  can: action => role === 'admin' || action === 'read',
});
makeUser('ada', 'admin').can('write');        // => true   (viewer => false)
```

**In the wild.** `document.createElement(tag)` and `React.createElement` both return a different internal type per tag.
**Smell.** A factory that only ever returns one shape is just a constructor with extra steps.

### 3. Builder

**Intent.** Assemble a complex object step by step, with a readable call chain, and validate at `build()`.

```js
class Query {
  #p = { from: '', where: [], limit: null };
  from(t) { this.#p.from = t; return this; }         // return this = chainable
  where(c) { this.#p.where.push(c); return this; }
  limit(n) { this.#p.limit = n; return this; }
  build() { const { from, where, limit } = this.#p;
    return `SELECT * FROM ${from}`
      + (where.length ? ` WHERE ${where.join(' AND ')}` : '')
      + (limit ? ` LIMIT ${limit}` : ''); }
}
new Query().from('users').where('age > 18').limit(10).build();
// => 'SELECT * FROM users WHERE age > 18 LIMIT 10'
```

**In the wild.** Knex and Kysely query builders; `URLSearchParams`; supertest's `request(app).get('/x').expect(200)`.
**Smell.** Fewer than four options? An options object (`makeQuery({ from, where })`) is shorter and order-independent.

### 4. Singleton

**Intent.** Exactly one instance, created lazily, shared by everyone.

```js
let instance;
export const getConfig = () => (instance ??= Object.freeze({ url: process.env.URL }));
getConfig() === getConfig();                  // => true
```

**In the wild.** Node's module cache makes every module a singleton by default; `console`, `process`, and a shared DB pool are all singletons.
**Smell.** It's global mutable state wearing a hat. It makes tests order-dependent — prefer passing the dependency in (see DIP below).

### 5. Strategy

**Intent.** Swap one interchangeable algorithm for another at runtime.

```js
const shipping = {
  standard: w => 5 + w * 0.5,
  express:  w => 15 + w * 1.2,
  free:     () => 0,
};
const quote = (kind, w) => (shipping[kind] ?? shipping.standard)(w);
quote('express', 10);                         // => 27   (unknown kind => 10)
```

**In the wild.** The comparator you pass to `Array.prototype.sort`; Passport.js authentication strategies; webpack loaders.
**Smell.** None — this is the highest-value pattern in JS. In a language with first-class functions, Strategy is just "pass the function".

### 6. Observer / PubSub

**Intent.** Let many listeners react to an event without the emitter knowing who they are.

```js
const bus = new Map();
const on = (evt, fn) => {
  if (!bus.has(evt)) bus.set(evt, new Set());
  bus.get(evt).add(fn);
  return () => bus.get(evt).delete(fn);       // return the unsubscribe
};
const emit = (evt, data) => bus.get(evt)?.forEach(fn => fn(data));
const off = on('save', d => console.log('saved', d));
emit('save', { id: 1 });                      // logs: saved { id: 1 }
```

**In the wild.** Node's `EventEmitter`, DOM `addEventListener`, RxJS, Redux subscriptions.
**Smell.** Always return an unsubscribe function — un-removed listeners are the #1 memory leak in long-lived apps. And a bus makes control flow invisible; don't route your core logic through one.

### 7. Adapter

**Intent.** Make an incompatible interface fit the one your code already speaks.

```js
const legacy = { fetchJSON: (url, cb) => cb(null, { url }) };   // callback style
const adapted = {
  get: url => new Promise((res, rej) =>
    legacy.fetchJSON(url, (e, d) => (e ? rej(e) : res(d)))),
};
await adapted.get('/x');                      // => { url: '/x' }
```

**In the wild.** Axios adapters (XHR in the browser, `http` in Node, same API); `node:util.promisify`; ORM database drivers.
**Smell.** If you're adapting one thing to one caller, just change the caller.

### 8. Decorator

**Intent.** Add behaviour around a function without editing it.

```js
const withLogging = fn => (...args) => {
  console.log(`-> ${fn.name}(${args.join(', ')})`);
  return fn(...args);
};
const add = (a, b) => a + b;
withLogging(add)(1, 2);                       // logs '-> add(1, 2)', => 3
```

**In the wild.** Express/Koa middleware, React higher-order components, `React.memo`, retry/cache wrappers.
**Smell.** Stack three decorators and the stack trace becomes unreadable. Name the returned function if you wrap deeply.

### 9. Facade

**Intent.** One simple call that hides several subsystems.

```js
const api = {
  async report(id) {
    const user = await db.user(id);
    return format.card(user, await metrics.for(user));
  },
};
await api.report(3);                          // => 'ada: 30 visits'
```

**In the wild.** `fetch` is a facade over XHR-era plumbing; jQuery was one giant facade over browser inconsistencies; an ORM over SQL.
**Smell.** A facade that grows a parameter for every subsystem behind it has stopped hiding anything.

### 10. Proxy

**Intent.** Intercept operations on an object — reads, writes, `in`, `delete`.

```js
const strict = obj => new Proxy(obj, {
  get(t, k) {
    if (!(k in t)) throw new ReferenceError(`no property ${String(k)}`);
    return t[k];
  },
});
strict({ a: 1 }).a;                           // => 1
strict({ a: 1 }).b;                           // => ReferenceError: no property b
```

**In the wild.** Vue 3 reactivity, MobX observables, Immer's draft objects — all built on the real `Proxy`.
**Smell.** Proxies defeat V8's inline caches and confuse debuggers. Use them for framework-level magic, not application code.

### 11. Command

**Intent.** Package an action as an object so it can be queued, logged, or undone.

```js
const history = [];
const run = cmd => { cmd.do(); history.push(cmd); };
const undo = () => history.pop()?.undo();
let text = '';
run({ do: () => (text += 'hi'), undo: () => (text = text.slice(0, -2)) });
undo();                                       // text goes 'hi' -> ''
```

**In the wild.** Redux actions (with the reducer as the executor), editor undo stacks, job queues where the payload *is* the command.
**Smell.** If nothing ever replays, queues, or undoes the action, you've written a function with ceremony.

### 12. Iterator

**Intent.** Expose a sequence without exposing the container — and produce values lazily.

```js
function* take(iterable, n) {
  for (const x of iterable) { if (n-- <= 0) return; yield x; }
}
function* naturals() { let i = 0; while (true) yield i++; }
[...take(naturals(), 3)];                     // => [0, 1, 2]   (infinite source!)
```

Make your own class iterable with `Symbol.iterator`:

```js
class Deck {
  constructor(cards) { this.cards = cards; }
  *[Symbol.iterator]() { yield* this.cards; }
}
[...new Deck(['A', 'K'])];                    // => ['A', 'K']
```

**In the wild.** `for...of`, spread, destructuring, `Map`/`Set` iteration, and the ES2025 iterator helpers (`.map`, `.take`, `.filter`) all speak this protocol.
**Smell.** None. Implementing `Symbol.iterator` is the cheapest way to make a custom collection feel native.

### Summary

| Pattern | Intent in one line | Reach for it when |
| --- | --- | --- |
| Module | Private state, public surface | Anything with internal state |
| Factory | Create without naming the concrete type | Construction has branching or defaults |
| Builder | Assemble step by step, chainable | 5+ optional parts, order matters |
| Singleton | Exactly one shared instance | Config, connection pool — and you accept the testing cost |
| Strategy | Interchangeable algorithms | A `switch` on "kind" keeps growing |
| Observer | Broadcast without knowing the listeners | Decoupling modules, UI events |
| Adapter | Translate one interface to another | Third-party API doesn't match yours |
| Decorator | Wrap behaviour around a function | Logging, retry, cache, auth |
| Facade | One call over many subsystems | Callers shouldn't learn your internals |
| Proxy | Intercept property operations | Reactivity, validation, virtualisation |
| Command | Action as data | Undo, queue, audit, replay |
| Iterator | Lazy sequence protocol | Custom collections, infinite streams |

---

## SOLID in JS terms

| Principle | What it means here | Smell it prevents | Fix |
| --- | --- | --- | --- |
| **S** — Single responsibility | A module has **one reason to change**, not "one thing it does" | `userService.js` that validates, hits the DB, sends email, and formats HTML | Split by *who asks for changes*: validation, persistence, notification |
| **O** — Open/closed | Add behaviour by **passing something in**, not by editing a `switch` | A `switch (type)` you edit for every new type | Strategy: `const handlers = { a, b }; handlers[type]?.(x)` |
| **L** — Liskov substitution | A duck-typed replacement must honour the **same contract**: same shape in, same shape out, no new throws | A subclass overriding `save()` to throw `NotSupported`; a mock returning `undefined` where the real one returns `[]` | If the subtype can't do the job, it isn't a subtype — use composition |
| **I** — Interface segregation | Don't force callers to supply things they don't use | A 15-key options object where every call site passes 3 and `undefined`s the rest | Small focused functions, or split the options into cohesive groups |
| **D** — Dependency inversion | Depend on an **injected** function/object, not a hard-wired concrete one | `import { db } from './db.js'` at the top of your business logic | Take it as a parameter: `makeService({ db, clock, logger })` |

```js
// OCP: closed for modification, open for extension
const handlers = { csv: parseCsv, json: JSON.parse };
const parse = (kind, raw) => (handlers[kind] ?? (() => { throw new Error(kind); }))(raw);
handlers.xml = parseXml;                       // extended without touching parse()
```

**SOLID is a smell detector, not a checklist.** Applying all five to a 40-line script produces worse code than not knowing them. Reach for a principle when you feel the pain it names.

---

## Composition vs inheritance

| Situation | Prefer | Why |
| --- | --- | --- |
| "A duck **is a** bird" and the hierarchy is genuinely stable | Inheritance | Shared identity and behaviour, one obvious parent |
| "A duck **can** fly and **can** swim" | Composition | Capabilities cross-cut; a single parent can't express both |
| You need to reuse 2 of the parent's 8 methods | Composition | Inheritance drags the other 6 along |
| The parent is third-party code you don't control | Composition | Their refactor becomes your outage |
| You're on the third level of `extends` | Composition | Depth > 2 means nobody can find where a method lives |
| Runtime behaviour must change | Composition | You can swap a collaborator; you can't swap a superclass |

```js
// inheritance: one axis, fixed at definition time
class Bird { constructor(name) { this.name = name; } }
class Duck extends Bird { fly() { return `${this.name} flies`; } }

// composition: capabilities mixed in, any combination
const canFly = o => ({ ...o, fly: () => `${o.name} flies` });
const canSwim = o => ({ ...o, swim: () => `${o.name} swims` });
const duck = canSwim(canFly({ name: 'duck' }));   // => 'duck flies' / 'duck swims'
```

**Rule of thumb.** *is-a* → maybe inheritance. *has-a* or *can-do* → composition. Inheritance couples you to the parent's **internals**, not just its interface; that's why "fragile base class" is a phrase.

---

## Error handling strategy

| Principle | What it means | In code |
| --- | --- | --- |
| **Throw early** | Validate at the boundary, before any state changes | `if (!id) throw new TypeError('id is required')` on line 1 |
| **Catch late** | Only catch where you can actually *do* something — retry, fall back, or show the user | Not in every function on the way up |
| **Wrap with `cause`** | Add context without losing the original stack | `throw new Error('loading user 7 failed', { cause: err })` |
| **Never swallow** | `catch {}` deletes the evidence | At minimum log it; better, rethrow wrapped |
| **Not for control flow** | Exceptions are for the exceptional | Return `null`/a result object for "not found" |
| **`finally` for cleanup** | Runs on both paths — but never `return` from it | `finally { await conn.release(); }` |

```js
const outer = new Error('loading user 7 failed', { cause: new Error('socket closed') });
outer.cause.message;                          // => 'socket closed'
// walk the chain: let e = outer; while (e) { log(e.message); e = e.cause; }
// => 'loading user 7 failed <- socket closed'
```

### Custom error types

```js
class NotFound extends Error {
  constructor(what) { super(`${what} not found`); this.name = 'NotFound'; }
}
const e = new NotFound('user');
[e.name, e.message, e instanceof NotFound];   // => ['NotFound', 'user not found', true]
```

Set `name` explicitly — it's what appears at the head of `.stack` (`NotFound: user not found`) and what generic loggers print.

### Operational vs programmer errors

| Kind | Examples | Response |
| --- | --- | --- |
| **Operational** — expected failures of a working program | Network timeout, 404, invalid user input, disk full | Handle it: retry, fall back, return a 4xx |
| **Programmer** — bugs | `undefined is not a function`, wrong argument type, broken invariant | Let it crash. Fix the code; don't `catch` it |

### The result-object alternative

```js
async function show(id) {
  const [err, user] = await to(getUser(id));   // to() resolves to [error, value]
  return err ? renderError(err) : renderCard(user);
}
```

Better when failure is **routine and expected** (form validation, parsing user input) — it forces the caller to handle it and shows up in the type signature. Worse when failure is rare, because every layer now has to plumb it through. Don't mix both styles in one module.

### Async specifics

| Trap | Fix |
| --- | --- |
| Unhandled rejection crashes the Node process | `await` it inside `try`, or attach `.catch()` |
| `Promise.all` reports only the first rejection | `Promise.allSettled` when you need every failure |
| `try/catch` around a non-awaited call catches nothing | Add the `await` |

Full detail in [promises-async.md](promises-async.md).

---

## Naming

| Kind | Convention | Good | Bad |
| --- | --- | --- | --- |
| Boolean | `is`/`has`/`can`/`should` prefix | `isActive`, `hasPermission`, `canEdit` | `active`, `flag`, `status` |
| Function | Verb first, says what it returns/does | `getUser`, `parseDate`, `calculateTotal` | `user()`, `data()`, `doStuff()` |
| Predicate passed to a filter | Reads as a sentence | `.filter(isOverdue)` | `.filter(check)` |
| Array / collection | Plural noun | `users`, `pendingOrders` | `userList`, `arr`, `data` |
| Map / lookup | `xByY` | `userById`, `countByStatus` | `map`, `lookup`, `obj` |
| Constant | `SCREAMING_SNAKE` for true module-level constants | `MAX_RETRIES` | `maxRetries = 3` at module scope |
| Class / type | `PascalCase`, a noun | `PaymentProcessor` | `ProcessPayment` |
| Private field | `#name` | `#cache` | `_cache` (a convention, not enforcement) |
| Event handler | `handleX` (the method) / `onX` (the prop) | `handleSubmit`, `onSubmit` | `submitClick`, `click2` |
| Async function | Name the result, not the mechanism | `fetchUser`, `loadConfig` | `userAsync`, `doFetchPromise` |

**Five heuristics.**
1. **Length scales with scope.** `i` is fine in a 3-line loop; a module-level export needs a full phrase.
2. **If you need a comment to explain the name, the name is the problem.**
3. **Banned as a whole name:** `data`, `info`, `item`, `obj`, `temp`, `manager`, `helper`, `utils`. They mean "I didn't decide what this is."
4. **Name the concept, not the type.** `users`, not `userArray`.
5. **Be consistent across the codebase.** One of `fetch`/`get`/`load` for the same operation, not all three.

---

## Small functions

| Heuristic | Why | Threshold |
| --- | --- | --- |
| One level of abstraction per function | Mixing "charge the card" with "loop over bytes" makes both unreadable | If you can't describe it in one sentence without "and", split it |
| Length is a smell, not a law | 30 clear lines beat 6 clever ones | Past ~20 lines, ask why; never split just to hit a number |
| ≤ 3 positional parameters | Call sites become unreadable and order-dependent | 4+ → an options object |
| No boolean flag parameters | The flag means the function does two things | Split into two named functions |
| Pure where you can | Same input → same output, no side effects → trivially testable | Push I/O to the edges |
| The name says **what**, the body says **how** | Lets a reader skip the body | |
| Early return over nesting | Nesting is where bugs hide | 3+ levels of `if` → invert and return |
| Command–query separation | A function either does something or answers something, not both | `save()` returning a formatted string is two functions |

```js
// flag parameter -> two functions
renderList(items, true);                        // true means... what?
renderList(items); renderNumberedList(items);   // => 'a, b'  /  '1. a 2. b'
```

```js
// nesting -> early return
const f = u => { if (u) { if (u.active) { if (u.email) return u.email; } } return null; };
const g = u => (!u?.active || !u.email ? null : u.email);   // same results, one line
```

---
*See also: [promises-async.md](promises-async.md) · [es2020-plus.md](es2020-plus.md) · [big-o.md](big-o.md)*
