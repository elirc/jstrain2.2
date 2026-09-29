# 02 · Functions and Closures

Almost everything that feels like magic in JavaScript — callbacks, React
hooks, middleware, event handlers, `debounce`, dependency injection — is
one of three ideas wearing a costume: functions are values, functions
remember where they were born, and `this` is chosen by the caller. Get
these three right and the rest of the language stops surprising you. Get
them wrong and you spend an afternoon wondering why your counter always
prints `3`.

## The mental model

**1. A function is a value.** It can be stored in a variable, put in an
array, passed to another function, and returned from one. There is
nothing special about the name — that is just a variable pointing at it.

```js
const ops = { add: (a, b) => a + b };
const run = (fn, a, b) => fn(a, b);
run(ops.add, 2, 3); // 5
```

**2. A closure is a function plus the environment it was born in.** When
a function is created, it keeps a live reference to the variables in
scope around it — not a copy. Those variables stay alive as long as the
function does, which is how a function can have private state.

```js
function makeCounter() {
  let count = 0;              // one binding per CALL to makeCounter
  return () => (count += 1);  // the arrow keeps it alive
}
const next = makeCounter();
next(); next(); // 1, 2   — and no one else can touch `count`
```

Every call to `makeCounter` builds a new `count`, which is why two
counters never interfere. That is the whole trick behind `once`,
`memoize`, `debounce` and the module pattern.

**3. `this` is decided at call time, not at write time.** It is an
implicit argument, filled in by *how* you call the function: whatever is
left of the dot becomes `this`; with no dot there is no receiver (and in
module code that means `undefined`, so `this.x` throws).

```js
const gauge = { n: 0, add() { this.n += 1; return this.n; } };
gauge.add();               // 1        — receiver is `gauge`
const loose = gauge.add;
loose();                   // TypeError — same function, no receiver
loose.call(gauge);         // 2        — receiver supplied by hand
```

**4. Arrows opt out.** An arrow has no `this`, no `arguments`, no
`prototype`, and cannot be `new`-ed. It uses the `this` of the scope it
was *written* in. That makes an arrow wrong as an object method and
right as a callback inside one.

```js
const timer = {
  ticks: [],
  addAll(values) { values.forEach((v) => this.ticks.push(v)); }, // ✅ arrow
  broken: () => this.ticks.push(1),                              // ❌ arrow
};
```

## The details that bite

1. **Function declarations hoist; function expressions do not.**
   `hoisted()` works above its definition; a function expression does
   not — and *which* error you get depends on the declaration keyword.
   `var` hoists the binding as `undefined`, so the call fails at the
   call: `TypeError: fn is not a function`. `const`/`let` leave the
   binding in the TDZ, so you never reach the call:
   `ReferenceError: Cannot access 'later' before initialization` —
   even via `typeof`.
   ```js
   hoisted();               // fine
   fn();                    // TypeError: fn is not a function
   later();                 // ReferenceError: Cannot access 'later'
   function hoisted() {}
   var fn = () => {};
   const later = () => {};
   ```
2. **An extracted method loses its receiver.** `setTimeout(obj.method,
   0)`, `arr.map(obj.method)` and `const m = obj.method` all hand you a
   bare function. Fix with `obj.method.bind(obj)` or `(x) =>
   obj.method(x)`.
3. **`bind` is permanent.** `f.bind(a).bind(b)` is still bound to `a`.
   Binding twice is a silent no-op, not an error.
4. **`var` in a loop shares one binding.** All three closures below read
   the same `i`, which is `3` by the time anyone calls them. `let` gets a
   fresh binding per iteration.
   ```js
   const fns = [];
   for (var i = 0; i < 3; i++) fns.push(() => i);
   fns.map((f) => f()); // [3, 3, 3]   — with `let`: [0, 1, 2]
   ```
5. **Closures capture variables, not values.** Reassign the variable and
   every closure sees the new value. A closure that reads a variable
   nobody updates any more is a *stale closure* — the usual cause of "my
   handler keeps seeing the old state".
6. **Defaults are expressions evaluated per call.** `f(x, bucket = [])`
   allocates a fresh array every call, and `f(x, id = nextId())` only
   calls `nextId` when the argument is omitted.
7. **Only `undefined` triggers a default.** `f(x, null)` keeps `null`.
   That is also why `opts = opts || {}` is not the same thing — `||`
   swallows `''`, `0` and `false` too.
8. **`fn.length` lies.** It counts parameters *before* the first default
   or rest parameter: `((a, b = 1, ...r) => {}).length === 1`.
9. **`arguments` is array-like, not an array** — and arrows do not have
   one at all, they see the enclosing function's. Use `...rest`.
10. **Truthiness is the wrong cache check.** `if (cache[key])` recomputes
    forever when the cached answer is `0`, `''` or `undefined`. Use
    `cache.has(key)`, and for `once` keep a separate boolean flag.
11. **Keep timer state inside the factory.** A `timerId` or `lastRun`
    declared outside `debounce`/`throttle` is shared by every wrapper you
    create — one handler then cancels another's timer.

## Cheat table

| you want | write | receiver | arguments |
| --- | --- | --- | --- |
| call it now, with a receiver | `fn.call(obj, a, b)` | `obj` | listed |
| call it now, args in an array | `fn.apply(obj, [a, b])` | `obj` | array |
| a new function for later | `fn.bind(obj, a)` | `obj`, forever | presets + later |
| a new function, no receiver | `partial(fn, a)` | untouched | presets + later |
| one argument at a time | `curry2(fn)(a)(b)` | untouched | one per call |

| wrapper | when it runs | typical use |
| --- | --- | --- |
| `once(fn)` | first call only, then replays the result | init, pay, redirect |
| `memoize(fn)` | once per distinct argument | pure, expensive work |
| `debounce(fn, ms)` | `ms` after the calls *stop* | search box, autosave |
| `throttle(fn, ms)` | at most once per `ms`, leading edge | scroll, resize, drag |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-function-flavors.js` | ★☆☆ | the same `sum` as a declaration, an expression and an arrow — then read the differences |
| 02 | `02-hoisting-and-tdz.js` | ★★☆ | a probe that reports what happens when you call each flavor early |
| 03 | `03-default-parameters.js` | ★☆☆ | `greet`, `repeat`, `pageRange` with defaults built from earlier params |
| 04 | `04-defaults-at-call-time.js` | ★★☆ | prove defaults are re-evaluated per call, with a spy on the id generator |
| 05 | `05-rest-parameters.js` | ★☆☆ | `sumRest`, `tail`, and the old `arguments` object side by side |
| 06 | `06-this-at-call-time.js` | ★★☆ | a gauge object: lose its receiver, then fix it with bind, call and an arrow |
| 07 | `07-my-bind.js` | ★★★ | re-implement `Function.prototype.bind` from scratch |
| 08 | `08-make-counter.js` | ★☆☆ | `makeCounter` and `makeAccumulator` — state that lives in a closure |
| 09 | `09-private-state.js` | ★★☆ | `createAccount` whose balance cannot be read or corrupted from outside |
| 10 | `10-once.js` | ★★☆ | `once(fn)` — including the "first result was undefined" trap |
| 11 | `11-make-id-generator.js` | ★☆☆ | `makeIdGenerator('user')` → `user-1`, `user-2`, … |
| 12 | `12-loop-closures.js` | ★★☆ | write the classic `var` bug, then fix it twice (`let` and an IIFE) |
| 13 | `13-returning-functions.js` | ★☆☆ | `multiplierOf`, `prefixer`, `propertyGetter` |
| 14 | `14-make-validator.js` | ★★☆ | rules in, a reusable validator out |
| 15 | `15-functions-as-arguments.js` | ★★☆ | `times`, `unless`, `tap` — control flow as callbacks |
| 16 | `16-curry.js` | ★★☆ | `curry2` and `curry3`, and why nothing runs until the last argument |
| 17 | `17-partial-application.js` | ★★☆ | a general `partial`, then a configured logger built on it |
| 18 | `18-compose-and-pipe.js` | ★★☆ | variadic `pipe` and `compose`, identity case included |
| 19 | `19-debounce.js` | ★★★ | `debounce(fn, ms)` with a real timer |
| 20 | `20-throttle.js` | ★★★ | `throttle(fn, ms)`, leading edge, no trailing call |
| 21 | `21-memoize.js` | ★★☆ | `memoize` for one argument, `memoizeWith` for many |
| 22 | `22-recursion-basics.js` | ★★☆ | `countdown`, `sumNested`, `deepFlatten` |
| 23 | `23-tree-traversal.js` | ★★★ | walk a directory tree: `totalSize`, `listPaths`, `findPath` |
| 24 | `24-module-pattern.js` | ★★★ | a stateful task board built with an IIFE — the pre-ESM module |

Do the warm-ups and core in order; they build on each other (06 sets up
07, 13 sets up 16 and 17). Stretch if time allows.

Run one file at a time:

```
node exercises/01-function-flavors.js
```

Every test should say `todo` before you start and `all green — next
file!` when you are done. Stuck for more than ten minutes? Read the
matching file in `solutions/` — the walkthrough comment at the top
explains the why, not just the what.

### Extra reps

Same three ideas, fresh scenarios. Take them in any order once 01–24
are green — they are drills, not a second course.

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 25 | `25-memoize-with-ttl.js` | ★★☆ | a cache whose entries go stale, with the clock injected as a parameter |
| 26 | `26-sliding-window-counter.js` | ★★★ | "5 per minute" done properly: timestamps in a closure, pruned before counting |
| 27 | `27-toggle-and-cycle.js` | ★☆☆ | `makeToggle` and `cycle(...values)` — the two smallest state machines |
| 28 | `28-once-resettable.js` | ★★☆ | `once` with a `reset()` hanging off the returned function |
| 29 | `29-named-function-expressions.js` | ★★☆ | recurse through the expression's own private name — survives being detached |
| 30 | `30-function-introspection.js` | ★☆☆ | what `fn.length` and `fn.name` really report, and an arity audit |
| 31 | `31-method-borrowing.js` | ★★☆ | `slice`, `toString` and `Math.max` borrowed with `call`/`apply` |
| 32 | `32-partial-right.js` | ★★☆ | fix the tail instead of the head — and why `map` breaks it |
| 33 | `33-combinators.js` | ★☆☆ | `unary`, `flip`, `negate` (a.k.a. `complement`) |
| 34 | `34-comparator-factories.js` | ★★☆ | `by(key)` and `descending(cmp)` — comparators as values |
| 35 | `35-composing-comparators.js` | ★★☆ | `thenBy(...cmps)` and `sortWith`: multi-level sorting by short-circuit |
| 36 | `36-predicate-builders.js` | ★★☆ | `allOf`, `anyOf`, `noneOf` — boolean algebra over predicates |
| 37 | `37-pipeline-early-exit.js` | ★★☆ | a pipe that stops on null, while `0` and `''` flow through |
| 38 | `38-default-evaluation-order.js` | ★★☆ | prove defaults run left to right, per call — and hit the TDZ |
| 39 | `39-tap-and-trace.js` | ★☆☆ | `trace(label, log)` and `tracePipe` for debugging a pipeline |
| 40 | `40-tiny-store.js` | ★★☆ | `get`/`set`/`subscribe` in a closure — the store every framework rebuilds |
| 41 | `41-trampoline.js` | ★★★ | bounce thunks in a loop: 100 000 levels deep, one stack frame |
| 42 | `42-mutual-recursion.js` | ★★★ | `isEven`/`isOdd`, then a tokenizer that ping-pongs between two readers |
| 43 | `43-curry-with-placeholders.js` | ★★★ | currying that can skip a slot and fill it later |
| 44 | `44-overload-by-arguments.js` | ★★☆ | one entry point, four call shapes — dispatch by count and by type |

---

**Stuck?** `cheatsheets/js-gotchas.md` (`this` in callbacks, closures in loops, TDZ) · **Deep dive:** `guides/02-this-prototypes-and-what-new-does.md` · **Self-check:** `quizzes/02-functions-this-closures.md` · **Next:** `bootcamp/03-arrays-and-objects`
