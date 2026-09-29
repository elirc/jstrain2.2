# 11 · Functional Programming

Nobody is asking you to learn category theory. What you are after is much
narrower and much more useful: code where a function's answer depends only
on its arguments, where data is replaced rather than edited, and where big
behaviour is assembled out of small pieces you can test one at a time. That
combination is why a React reducer, a Redux store, a `map` over an API
response and a well-behaved backend service all look strangely alike. This
module builds the toolkit from scratch — `pipe`, `curry`, predicates, a
Maybe — not because you will ship these files, but because after you write
them the libraries stop looking like magic.

## The mental model

**1 · Pure core, impure shell.** A pure function reads its arguments and
returns a value. No clock, no network, no globals, no writing to the thing
it was handed. Impurity is unavoidable — but it belongs in a thin outer
layer, so the interesting logic stays trivially testable.

```js
// impure: needs a database and a clock to test at all
function chargeOrder(order) {
  const total = order.lines.reduce((s, l) => s + l.qty * l.price, 0);
  db.save({ total, at: Date.now() });
}

// pure core + impure shell
const orderTotal = (order) =>
  order.lines.reduce((s, l) => s + l.qty * l.price, 0);

function chargeOrder(order, deps) {          // the shell
  deps.save({ total: orderTotal(order), at: deps.now() });
}
```

`orderTotal` is now testable with `eq(orderTotal(order), 28.75)` and no
test doubles at all. That is the entire payoff.

**2 · Data in, new data out.** Never edit what you were given. Produce a
new value and let the caller decide what to do with it. The upside is not
purity for its own sake: it is that `previous !== next` becomes a reliable
"something changed" signal, which is exactly what React, memoisation and
undo stacks are built on.

```js
const withDone = (todos, id) =>
  todos.map((t) => (t.id === id ? { ...t, done: true } : t));
// items that did not change come back BY REFERENCE — cheap and correct
```

**3 · Composition over inheritance.** Instead of a `BaseFormatter` that
subclasses override, you write four small functions and connect them.
Behaviour is assembled at the call site, in the open, where you can read
the whole flow in one line.

```js
const processSignup = pipe(normalize, validate, format);
```

Each step is separately testable, reorderable and deletable. There is no
hierarchy to reason about — just "what shape goes in, what shape comes
out".

**4 · Functions are configuration.** Give a function some of its inputs
early and get back a function that wants the rest. Closures do this with no
ceremony; `curry` generalises it.

```js
const gbp = makeFormatter({ symbol: '£', decimals: 2 });
gbp(1234.5);                                  // '£1,234.50'
```

## The details that bite

1. **Spread is shallow.** `{ ...state }` copies one level. The nested
   objects are shared with the original, so editing them edits both.
   ```js
   const copy = { ...state };
   copy.profile.theme = 'light';   // state.profile.theme is 'light' too
   ```

2. **`Object.freeze` is shallow too**, and in non-strict code it fails
   *silently*. ESM modules are always strict, so in this bootcamp a
   mutation throws — which is why the fixtures are frozen.
   ```js
   const o = Object.freeze({ a: { b: 1 } });
   o.a.b = 2;      // works fine. only the top level is frozen.
   ```

3. **`sort`, `reverse`, `splice`, `push`, `fill` and `copyWithin` mutate.**
   `sort` is the one that catches everyone, because it also *returns* the
   array, so it looks like `map`.
   ```js
   const top = scores.sort((a, b) => b - a).slice(0, 3);  // scores reordered!
   const top = [...scores].sort((a, b) => b - a).slice(0, 3);   // fine
   const top = scores.toSorted((a, b) => b - a).slice(0, 3);    // Node 20+
   ```

4. **A copied array still holds the original objects.** `[...cart]` gives
   you a new array of the *same* line objects. Copy the level you intend to
   change, not just the outer container.

5. **`reduce` with a mutable accumulator is a loop in disguise.** It is
   fine — but if the accumulator is an object you push into, you have all
   the aliasing risks of the loop and none of its readability.

6. **`map` with an async callback gives you an array of promises**, not an
   array of values. `await` does nothing useful there; you want
   `Promise.all(items.map(fn))`, or a sequential loop when order matters.

7. **`fn.length` ignores default and rest parameters.** `curry` reads arity
   from it, so `(a, b = 2) => ...` curries as arity 1 and `(...xs) => ...`
   as arity 0 and fires immediately.

8. **Premature abstraction costs more than duplication.** `pipe(pipe(a, b),
   compose(not(isEmpty), prop('x')))` is not senior code; it is a puzzle.
   Two similar functions are cheaper than one wrong abstraction — extract
   on the third occurrence, when you can see what actually varies.

9. **Optional chaining is often enough.** `a?.b?.c ?? fallback` beats a
   Maybe for a straight property walk. Reach for the wrapper when steps
   involve conditions and you want one fallback at the end.

## Cheat table

| want | mutating (avoid) | copying (prefer) |
| --- | --- | --- |
| add to end | `arr.push(x)` | `[...arr, x]` |
| add to front | `arr.unshift(x)` | `[x, ...arr]` |
| remove by id | `arr.splice(i, 1)` | `arr.filter((v) => v.id !== id)` |
| replace one | `arr[i] = v` | `arr.map((v, j) => (j === i ? next : v))` |
| sort | `arr.sort(f)` | `[...arr].sort(f)` / `arr.toSorted(f)` |
| reverse | `arr.reverse()` | `[...arr].reverse()` / `arr.toReversed()` |
| set a field | `o.a = 1` | `{ ...o, a: 1 }` |
| drop a field | `delete o.a` | `const { a, ...rest } = o` |

The toolkit you build in this module:

| tool | shape | what it is for |
| --- | --- | --- |
| `pipe` / `compose` | `(...fns) => fn` | wire small steps into one |
| `not` / `allPass` / `anyPass` | `(preds) => pred` | combine conditions |
| `evolve` | `(obj, transforms) => obj` | per-key immutable update |
| `setIn` / `updateIn` | `(obj, path, x) => obj` | deep immutable update |
| `curry` | `(fn) => fn` | supply arguments over time |
| `pipeAsync` | `(...fns) => async fn` | the same, over promises |
| `Maybe` | `(value) => box` | null-safety without `if` walls |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-pure-cart-total.js` | ★☆☆ | cart total + `withItem` over a frozen cart |
| 02 | `02-next-state.js` | ★☆☆ | `nextState(state, event)` replacing in-place edits |
| 03 | `03-immutable-list-ops.js` | ★☆☆ | add / remove / update returning new arrays |
| 04 | `04-nested-update.js` | ★★☆ | three-level settings update, then `setIn` / `updateIn` |
| 05 | `05-evolve.js` | ★★★ | `evolve(obj, transforms)`, recursive and immutable |
| 06 | `06-compose-pipe.js` | ★★☆ | `pipe` and `compose` from scratch |
| 07 | `07-build-pipeline.js` | ★★☆ | normalize → validate → format as a real pipeline |
| 08 | `08-declarative-refactor.js` | ★★☆ | three imperative loops rewritten as chains |
| 09 | `09-predicates.js` | ★★☆ | `not` / `allPass` / `anyPass` + a product-search filter |
| 10 | `10-closure-config.js` | ★★☆ | `makeFormatter`, `makeTaxCalculator` — configure once |
| 11 | `11-make-validator.js` | ★★☆ | `makeValidator(rules)` with rules as data |
| 12 | `12-curry.js` | ★★★ | general `curry` for any arity |
| 13 | `13-pipe-async.js` | ★★★ | `pipeAsync`, short-circuiting on the first failure |
| 14 | `14-maybe.js` | ★★★ | a tiny Maybe: `map` / `chain` / `filter` / `getOrElse` |
| 15 | `15-maybe-lookup.js` | ★★☆ | refactor a wall of null checks into two chains |
| 16 | `16-pure-core-impure-shell.js` | ★★★ | order processing as pure functions + one shell |

Do the warm-ups and core in order. Stretch if time allows.

Run one file at a time — `node exercises/01-pure-cart-total.js` — and keep
going until it says `all green`. The matching file in `solutions/` has the
same tests plus a walkthrough of why the answer is shaped the way it is;
read it after you have your own version working, not before.

### Extra reps

A second pass over the same ideas, at library scale: these are the shapes
you will recognise in Ramda, immer, Redux and transducer libraries. Each
one is self-contained — take them in any order, or cherry-pick.

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 17 | `17-lens-basics.js` | ★★★ | `lens(get, set)` with `view` / `set` / `over` |
| 18 | `18-lens-compose.js` | ★★★ | `composeLens` + `lensPath` — deep updates that share |
| 19 | `19-produce-immer-lite.js` | ★★★ | `produce(state, recipe)`: mutable draft, immutable result |
| 20 | `20-memoize-identity.js` | ★★☆ | WeakMap memoisation keyed on object identity |
| 21 | `21-memoize-lru.js` | ★★☆ | a size-capped memoize that evicts the least recently used |
| 22 | `22-lazy-value.js` | ★★☆ | thunks and a Lazy box with `map` / `force` |
| 23 | `23-lazy-list.js` | ★★☆ | an infinite list from closures; `take` only what you need |
| 24 | `24-either-deeper.js` | ★★★ | `mapError` / `orElse` / `sequence` / `traverse` |
| 25 | `25-validate-all.js` | ★★☆ | applicative validation — every error, not just the first |
| 26 | `26-undoable-reducer.js` | ★★★ | undo/redo as a wrapper around any reducer |
| 27 | `27-transducer-lite.js` | ★★★ | map + filter fused into a single reduce pass |
| 28 | `28-point-free.js` | ★★☆ | three lambda-heavy pipelines rebuilt from combinators |
| 29 | `29-pipe-tracing.js` | ★★☆ | `tap` and a traced pipe with an injected logger |
| 30 | `30-group-map-values.js` | ★☆☆ | `groupBy` + `mapValues`, and two reports built on them |

Start with 30 and 25 if you want warm ones; 19, 26 and 27 are the three
that pay the most back per line.

---

**Stuck?** `cheatsheets/array-methods.md` (the 15 recipes) · `cheatsheets/patterns-swe.md` (composition over inheritance) · **Self-check:** `quizzes/03-arrays-objects.md` · **Next:** `bootcamp/12-node-fundamentals`
