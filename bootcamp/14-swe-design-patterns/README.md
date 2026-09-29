# 14 · SWE Design Patterns

Nobody gets promoted for reciting the Gang of Four. You get promoted for
opening a file, recognising the shape of the problem, and reaching for the
solution that a million people have already debugged. That is all a pattern
is: a **named answer to a recurring shape of change**. The name matters
because it is how you talk to other engineers ("make it a strategy"); the
shape matters because it tells you *when* the answer applies. The UML
diagram matters not at all — in JavaScript most of these patterns are a
function, a closure, or an object literal.

This module is the judgment half of levelling up. Every exercise is a
scenario you will meet: shipping rules, notifiers, payment providers, an
order lifecycle, an undo stack, a middleware chain.

## The mental model

**1. A pattern is picked by intent, not by shape.** Strategy, state and
command all look like "an object with a method". They differ in *why*:
strategy swaps an algorithm, state swaps behaviour as a lifecycle
advances, command captures an invocation so it can be stored and undone.
Learn the one-sentence intent and you can pick correctly under pressure.

```js
// same shape, three intents
const pricing = memberPrice;              // strategy: which algorithm?
const next = TRANSITIONS[state][event];   // state machine: what's legal?
stack.push(insertCommand('hi', 0));       // command: replay/undo later
```

**2. Make the part that varies a value.** Factory, strategy, adapter and
dependency injection are one idea wearing four hats — take the thing that
changes and pass it in, instead of branching on it. The test is simple:
when a new case appears, do you *add* code or *edit* code?

```js
// branching: every new tier edits this function
function price(tier, unit, qty) {
  if (tier === 'member') return unit * qty * 0.9;
  return unit * qty;
}

// value: a new tier is a new function + one registry entry
const PRICING = { regular: regularPrice, member: memberPrice };
const price = (tier, unit, qty) => (PRICING[tier] ?? regularPrice)(unit, qty);
```

**3. Wrap, don't edit.** Decorator, proxy and middleware all add behaviour
around something you are not allowed (or not willing) to change. The rule
that makes them stack: the wrapper must have the *same* interface as what
it wraps — same arguments in, same value out.

```js
const withLogging = (fn, log) => (...args) => {
  log('call', args);
  const result = fn(...args);      // forward everything
  log('return', result);
  return result;                   // return everything
};
const timedAndLogged = withTiming(withLogging(save, log), record);
```

**4. Push time, randomness and I/O to the edges.** A function that calls
`Date.now()`, `Math.random()` or a database directly cannot be tested —
only observed. Hand those in as collaborators and the same function
becomes trivially testable. Testability is a property of the *design*, not
a skill you apply afterwards.

```js
// untestable: what does it return? depends on the wall clock
const badId = () => `RPT-${Date.now()}-${Math.random()}`;

// testable: the test decides what "now" and "random" mean
const makeId = ({ clock, random }) =>
  `RPT-${clock()}-${Math.floor(random() * 1000)}`;
makeId({ clock: () => 1700000000000, random: () => 0.5 }); // deterministic
```

## The details that bite

1. **Pattern-itis is worse than no pattern.** A `NotificationStrategyFactory`
   with one implementation is not architecture, it is three files of
   indirection hiding a one-line function. Apply a pattern on the *second*
   time the shape appears, not the first — and never to code you predict
   will change.
   ```js
   const notify = (to, msg) => sendEmail(to, msg); // fine until channel #2
   ```

2. **Singletons leak between tests.** Module state survives every test in
   the file, so one test's `configure()` silently sets up the next test's
   failure — "passes alone, fails in the suite". If you ship a singleton,
   ship its reset.
   ```js
   let config = null;
   export const resetForTests = () => { config = null; }; // not optional
   ```

3. **A factory that grows a `switch` is closed for extension.** The point
   of the pattern is that a new type does not touch the factory. A registry
   gets you there; a switch does not.
   ```js
   registry[type] = factory;             // adding a type edits nothing
   ```

4. **Mutable builders contaminate their branches.** If `.where()` mutates
   and returns `this`, then two queries built from one base share clauses,
   and the bug shows up as a WHERE nobody wrote.
   ```js
   const recent = base.limit(5);         // must not touch `base`
   ```

5. **Every `on()` without an `off()` is a leak.** The bus holds the handler,
   the handler closes over the component, the component never dies. Always
   return an unsubscribe and always call it.
   ```js
   const stop = bus.on('tick', handler); // keep `stop`, or leak
   ```

6. **`??` is not "is it missing?".** For defaults, ask whether the key
   exists — `0`, `''` and `null` are real stored values.
   ```js
   const get = (o, k, fallback) => (k in o ? o[k] : fallback); // not o[k] ?? fallback
   ```

7. **Undo needs state captured at execute time.** A delete command built
   from `(at, count)` can restore the *length* but not the characters. It
   has to remember what it destroyed, and the only moment it can learn that
   is while destroying it.

8. **Guard clauses are for exits, not for dispatch.** Eight guards that
   each `return` a different branch of a decision table is fine. Eight
   guards that pick an algorithm should be a lookup table.

9. **A wrapper that changes the return type is a lie.** Adding a retry that
   makes a sync function async, or a decorator that swallows the return
   value, breaks every caller that trusted the signature.

10. **Booleans that describe a lifecycle should be one state.** Four flags
    mean sixteen combinations and eleven of them are nonsense. One
    `status` field plus a transition table makes the nonsense
    unrepresentable.
    ```js
    // isPaid && wasCancelled — what does that even mean?
    order.status = 'cancelled';           // one truth
    ```

## Cheat table

| pattern | intent (one line) | you have already used it in |
| --- | --- | --- |
| guard clauses | handle exits first, keep the happy path flat | `if (!user) return res.status(401)` |
| extract function | name each rule so it can be read and tested alone | any service layer |
| null object | a do-nothing collaborator so callers never branch on null | React default context, no-op loggers |
| factory | one place decides which implementation you get | `document.createElement`, `crypto.createHash` |
| strategy | make the algorithm a parameter | `[].sort(comparator)`, Passport |
| observer / pub-sub | announce without knowing who listens | EventEmitter, `addEventListener`, Redux subscribe |
| adapter | translate a foreign interface into yours | DB drivers, `fetch` polyfills |
| decorator | add behaviour around a function, same signature | Express middleware, React `memo`, tracing SDKs |
| dependency injection | hand a unit its collaborators | React context/hooks, Angular DI, NestJS |
| repository | one narrow interface for storage | Prisma/TypeORM repositories, DAOs |
| singleton | one instance, one access point | `console`, `process`, a shared DB client |
| facade | one call in front of a subsystem dance | `fetch` over XHR, `git pull`, `/api/checkout` |
| builder | assemble a complex object step by step | Knex, Prisma fluent client, supertest |
| command | package an action so it can be stored, replayed, undone | Redux actions, Photoshop history, WAL logs |
| proxy | intercept reads and writes on an object | Vue 3 reactivity, MobX, immer |
| state machine | one state plus a table of legal moves | XState, TCP, Stripe PaymentIntents |
| chain of responsibility | pass a request down a line of handlers | Express/Koa, Redux middleware, ASP.NET Core |
| flyweight | one shared immutable instance per distinct value | `Symbol.for`, glyph atlases, Java's Integer cache |
| memento | snapshot the whole state so it can be put back | `git stash`, DB savepoints, canvas undo buffers |
| mediator | peers talk through a hub, never to each other | socket.io rooms, Slack, air-traffic control |
| iterator | one way to walk a collection however it is stored | `for...of`, Octokit `paginate`, LINQ, Mongo cursors |
| visitor | one walk plus a table of per-node-type operations | Babel/ESLint visitors, `ts.forEachChild`, PostCSS |
| specification | business rules as values you can AND/OR/NOT | CASL abilities, Spring `Specification`, Stripe Radar |
| event sourcing | store the facts, fold them into current state | Kafka, git, Redux reducers, WAL/binlog |
| anti-corruption layer | translate a foreign model at the door | webhook normalisers, `zod` parse-at-the-edge |
| CQRS | one model to write with, another to read from | materialised views, an ES index beside Postgres |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-guard-clauses.js` | ★☆☆ | flatten a four-deep shipping-rules conditional into guards |
| 02 | `02-extract-function.js` | ★★☆ | split `processOrder` into four rules plus a composer |
| 03 | `03-null-object.js` | ★☆☆ | a no-op logger that kills every `if (logger)` |
| 04 | `04-factory-notifier.js` | ★★☆ | email/sms/slack notifiers from one registry-backed factory |
| 05 | `05-strategy-pricing.js` | ★★☆ | regular/member/sale pricing swapped at runtime |
| 06 | `06-observer-eventbus.js` | ★★☆ | an EventBus with on/off/emit, unsubscribe and a `*` channel |
| 07 | `07-watchable-value.js` | ★☆☆ | a value that notifies watchers only when it really changes |
| 08 | `08-adapter-payments.js` | ★★☆ | two payment SDKs behind one interface, one shared test suite |
| 09 | `09-decorator-wrappers.js` | ★★☆ | `withLogging`, `withTiming`, `withRetry` — and composing them |
| 10 | `10-dependency-injection.js` | ★★☆ | a ReportService driven by injected clock, random and store |
| 11 | `11-repository.js` | ★★☆ | an in-memory UserRepository and a service that only sees it |
| 12 | `12-singleton-config.js` | ★★☆ | module-scoped config + logger, with the reset tests need |
| 13 | `13-facade-checkout.js` | ★★☆ | one `place()` over inventory, payments, shipping and email |
| 14 | `14-builder-query.js` | ★★★ | an immutable fluent QueryBuilder that ends in a descriptor |
| 15 | `15-command-undo.js` | ★★★ | insert/delete commands with undo and redo stacks |
| 16 | `16-proxy-guards.js` | ★★★ | validation, default-value and negative-index Proxies |
| 17 | `17-state-machine.js` | ★★★ | the order lifecycle as a transition table |
| 18 | `18-middleware-chain.js` | ★★★ | an Express-style pipeline with onion ordering |

Do the warm-ups and core in order. Stretch if time allows.

Run one file at a time:

```
node exercises/01-guard-clauses.js
```

Every test should say `todo` until you write the code, then `all green`.
The matching file in `solutions/` has the same tests plus a walkthrough
that names the pattern's intent, says when *not* to use it, and points at
the library where you have already met it.

### Extra reps

Sixteen more, for the patterns 01–18 skipped and for the ones worth a
second, harder pass. Same contract: the tests are the spec.

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 19 | `19-flyweight-styles.js` | ★☆☆ | 300 cells sharing two frozen style objects |
| 20 | `20-memento-editor.js` | ★★☆ | opaque snapshots plus a caretaker that never looks inside |
| 21 | `21-chain-of-responsibility.js` | ★★☆ | a ticket chain where the first desk to accept it owns it |
| 22 | `22-visitor-schema-report.js` | ★★★ | one schema walk, per-type handlers, one report |
| 23 | `23-mediator-chatroom.js` | ★★☆ | a chat room that routes so members never hold each other |
| 24 | `24-observer-priorities.js` | ★★★ | priorities, `once`, and (un)subscribing during an emit |
| 25 | `25-iterator-pagination.js` | ★★☆ | a paginated API behind `[Symbol.iterator]` |
| 26 | `26-iterator-lazy-cursor.js` | ★★☆ | lazy map/filter/take that terminates on an infinite source |
| 27 | `27-proxy-lazy-audit.js` | ★★☆ | build-on-first-touch and log-every-access proxies |
| 28 | `28-decorator-notifier-class.js` | ★★★ | retry and logging wrappers — and why nesting order matters |
| 29 | `29-specification-rules.js` | ★★★ | order rules with `and`/`or`/`not` and a `describe()` |
| 30 | `30-di-container.js` | ★★☆ | `register(name, factory, deps)` + `resolve` |
| 31 | `31-di-container-graph.js` | ★★★ | scopes, cycle detection with the path, `dependenciesOf` |
| 32 | `32-event-sourcing.js` | ★★★ | an append-only log folded into cart state, replayable |
| 33 | `33-anti-corruption-layer.js` | ★★☆ | two vendor payloads, one domain type, one shared suite |
| 34 | `34-cqrs-read-model.js` | ★★★ | a read model fed by writes, one flush per tick |

19 is the warm-up. 30 → 31 and 32 → 34 are pairs: do them in order.

---

**Stuck?** `cheatsheets/patterns-swe.md` (12 patterns, SOLID in JS terms) · **Self-check:** `quizzes/10-interview-verbal.md` · **Next:** `bootcamp/15-capstones`
