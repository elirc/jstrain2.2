# 02 · Functions, `this`, and Closures — binding, capture, currying

Cover the answer, commit out loud, then reveal. If you hedge, you got it wrong.

---

### Q1 — closure counter

What does this print?

```js
function makeCounter() {
  let count = 0;
  return function () {
    count += 1;
    return count;
  };
}
const a = makeCounter();
const b = makeCounter();
console.log(a(), a(), b());
```

<details><summary>Answer</summary>

**`1 2 1`** — each call to `makeCounter` creates a fresh scope, so `a` and `b` close over different `count` variables.

A closure is a function plus the variable environment it was created in. Calling `makeCounter()` runs the body, creates a new binding for `count`, and returns an inner function that keeps that environment alive. Two calls, two environments, two independent counters. This is the entire mechanism behind private state, module patterns, and hooks.
</details>

---

### Q2 — declaration versus expression

What does this print?

```js
function hoisted() {
  return 'declaration';
}
console.log(typeof hoisted, typeof notYet);
var notYet = function () {
  return 'expression';
};
console.log(typeof notYet);
```

<details><summary>Answer</summary>

**`function undefined`**, then **`function`** — function *declarations* hoist whole; function *expressions* only hoist their variable.

A declaration is fully created before any code in the scope runs, so you can call it above where you wrote it. An expression assigned to `var` hoists only the `var` binding (initialized to `undefined`); the function object doesn't exist until the assignment line executes. Assign a function expression to `const` instead and the same early access throws a TDZ `ReferenceError` — louder, and better.
</details>

---

### Q3 — the detached method

What does this print?

```js
const obj = {
  name: 'widget',
  getName() {
    return this.name;
  },
};
console.log(obj.getName());
const detached = obj.getName;
console.log(detached());
```

<details><summary>Answer</summary>

**`widget`, then `undefined`** — `this` is decided by *how a function is called*, not where it was defined.

`obj.getName()` is a method call, so `this` is `obj`. `detached()` is a plain call, so `this` falls back to the global object in sloppy mode (or `undefined` in strict mode / ES modules, where the same line throws `TypeError: Cannot read properties of undefined`). This is exactly what happens when you pass a method as a callback: `arr.forEach(obj.getName)` or `setTimeout(obj.render, 0)`. Fix it with `obj.getName.bind(obj)` or `() => obj.getName()`.
</details>

---

### Q4 — call, apply, bind

What does this print?

```js
function describe(greeting, punct) {
  return greeting + ', ' + this.name + punct;
}
const user = { name: 'Ada' };
console.log(describe.call(user, 'Hi', '!'));
console.log(describe.apply(user, ['Yo', '?']));
const bound = describe.bind(user, 'Hey');
console.log(bound('.'));
```

<details><summary>Answer</summary>

**`Hi, Ada!`**, **`Yo, Ada?`**, **`Hey, Ada.`** — `call` and `apply` invoke now; `bind` returns a new function for later.

`call` takes arguments spread out, `apply` takes them as one array ("**a**pply → **a**rray" is the mnemonic). `bind` doesn't call anything: it returns a new function with `this` locked and any extra arguments pre-filled, which is partial application. Since spread exists, `apply` is mostly legacy — `fn(...args)` does the same job.
</details>

---

### Q5 — rest parameters and arity

What does this print?

```js
function tag(prefix, ...rest) {
  return prefix + ':' + rest.length + ':' + rest.join(',');
}
console.log(tag('a'));
console.log(tag('a', 'b', 'c'));
console.log(tag.length);
```

<details><summary>Answer</summary>

**`a:0:`**, **`a:2:b,c`**, **`1`** — rest collects the leftovers into a real array and does not count toward arity.

`fn.length` is the number of parameters *before* the first default or rest parameter, so `tag.length` is `1`. `rest` is a genuine `Array` — it has `map`, `filter`, `join`, everything — unlike the old `arguments` object. Rest must be last, and there can only be one.
</details>

---

### Q6 — closure privacy

What does this print?

```js
function outerFn() {
  const secret = 'hidden';
  function inner() {
    return secret;
  }
  return inner;
}
const got = outerFn();
console.log(got());
console.log(typeof secret);
```

<details><summary>Answer</summary>

**`hidden`, then `undefined`** — the variable stays alive for the closure but is unreachable from outside.

`outerFn` has returned, but its scope isn't garbage collected because `inner` still references `secret`. Nothing else holds a reference to that scope, so there is no syntax anywhere that can reach `secret` except by calling `got()`. `typeof secret` in the outer scope is looking at a completely different (nonexistent) binding, and `typeof` on an undeclared name returns `'undefined'` rather than throwing. This is real encapsulation — it predates `#private` fields by two decades.
</details>

---

### Q7 — var versus let in a loop

What does this print, in what order?

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log('var', i), 0);
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log('let', j), 0);
}
```

<details><summary>Answer</summary>

**`var 3` three times, then `let 0`, `let 1`, `let 2`** — `var` has one binding for the whole loop; `let` gets a fresh binding per iteration.

All three `var` callbacks close over the *same* `i`. By the time the timers fire (after the synchronous loops finish), `i` is `3`. With `let`, the spec creates a new binding each iteration and copies the current value into it, so each callback sees its own snapshot. The `var` version is the single most-asked closure question in interviews. Order is by scheduling: all six timers have 0ms delay, so they run in the order they were queued.
</details>

---

### Q8 — this inside forEach

What does this print?

```js
const counter = {
  count: 0,
  incAll(items) {
    items.forEach(function () {
      this.count += 1;
    });
    return this.count;
  },
};
console.log(counter.incAll([1, 2, 3]));
```

<details><summary>Answer</summary>

**`0`** — the plain `function` callback gets its own `this`, so it never touched `counter.count`.

`forEach` calls the callback with no receiver, so in sloppy mode `this` is the global object. `globalThis.count` starts undefined, `undefined + 1` is `NaN`, and the increment writes `NaN` to a global three times. Meanwhile `counter.count` is untouched and the method returns `0`. In strict mode `this` would be `undefined` and you'd get a `TypeError` instead — a crash is the better outcome here, because a silent `0` is worse than a stack trace.
</details>

---

### Q9 — the arrow fix

What does this print?

```js
const counter = {
  count: 0,
  incAll(items) {
    items.forEach(() => {
      this.count += 1;
    });
    return this.count;
  },
};
console.log(counter.incAll([1, 2, 3]));
```

<details><summary>Answer</summary>

**`3`** — an arrow function has no `this` of its own, so it uses `incAll`'s.

Arrows don't get a `this` binding at all; `this` inside one resolves lexically, exactly like any other variable, walking up to the nearest enclosing non-arrow function. Here that's `incAll`, whose `this` is `counter`. `forEach` also accepts a second `thisArg` argument (`items.forEach(fn, this)`) which solves the same problem the old way — but the arrow is why nobody uses it anymore.
</details>

---

### Q10 — this in a timer

What does this print, in what order?

```js
const timer = {
  label: 'job',
  startArrow() {
    setTimeout(() => console.log('arrow:', this.label), 0);
  },
  startPlain() {
    setTimeout(function () {
      console.log('plain:', this && this.label);
    }, 0);
  },
};
timer.startArrow();
timer.startPlain();
```

<details><summary>Answer</summary>

**`arrow: job`, then `plain: undefined`** — the arrow inherits `this` from `startArrow`; the plain callback is invoked by the timer subsystem with something else entirely.

The arrow captures `this` at definition time from `startArrow`, which was called as `timer.startArrow()` — so `this` is `timer`. The plain function is called by the host, not by you: in Node `this` is the `Timeout` object, in a browser it's `window`. Neither has a `label`. This is why every `setTimeout` inside a class or object method should be an arrow.
</details>

---

### Q11 — currying

What does this print?

```js
const add = (a) => (b) => (c) => a + b + c;
console.log(add(1)(2)(3));
const add5 = add(5);
console.log(add5(0)(0), add5(1)(1));
```

<details><summary>Answer</summary>

**`6`**, then **`5 7`** — each call returns a function that has closed over the arguments so far.

`add(1)` returns a function remembering `a = 1`; calling that returns another remembering `b = 2`; the third call finally has all three and computes. `add5` is a reusable partial application — and crucially it's reusable *without contamination*, because calling `add5(0)` creates a new inner closure each time rather than mutating shared state. Currying is closures with a rigid shape: one argument at a time, one function back each time.
</details>

---

### Q12 — run once

What does this print?

```js
function once(fn) {
  let done = false;
  let result;
  return (...args) => {
    if (!done) {
      done = true;
      result = fn(...args);
    }
    return result;
  };
}
const init = once((n) => 'init-' + n);
console.log(init(1), init(2), init(3));
```

<details><summary>Answer</summary>

**`init-1 init-1 init-1`** — the closed-over `done` flag survives between calls, so the wrapped function runs exactly once.

`done` and `result` live in the scope created by the `once` call, and the returned arrow keeps that scope alive. After the first invocation the guard is permanently `true`, so later arguments are ignored and the cached `result` is returned. This is the pattern behind lazy initialization and idempotent setup handlers; note it caches the result too, which is what makes calls 2 and 3 return something useful instead of `undefined`.
</details>

---

### Q13 — memoization

What does this print?

```js
function memoize(fn) {
  const cache = new Map();
  return function (n) {
    if (cache.has(n)) return 'cached:' + cache.get(n);
    const val = fn(n);
    cache.set(n, val);
    return 'fresh:' + val;
  };
}
let work = 0;
const square = memoize((n) => {
  work += 1;
  return n * n;
});
console.log(square(4), square(4), square(5), work);
```

<details><summary>Answer</summary>

**`fresh:16 cached:16 fresh:25 2`** — the `Map` in the closure persists across calls, so only two real computations happen.

Arguments are evaluated left to right before `console.log` runs, so the calls happen in written order and `work` is read last, after both cache misses. Note the load-bearing detail: this memoizer only works for a single primitive argument, because `Map` keys use SameValueZero identity. Pass an object and every call is a miss; pass two arguments and the second is ignored. Real memoizers serialize the argument list into a key.
</details>

---

### Q14 — arguments versus rest

What does this print?

```js
function collect() {
  return arguments.length + ' ' + Array.from(arguments).join('-');
}
console.log(collect(1, 2, 3));

function wrapper() {
  const arrow = (...args) => args.length + '/' + arguments.length;
  return arrow(7, 8, 9);
}
console.log(wrapper('a', 'b'));
```

<details><summary>Answer</summary>

**`3 1-2-3`**, then **`3/2`** — arrows have no `arguments` of their own, so the name resolves lexically to the enclosing function's.

`args` is the arrow's own rest parameter and holds `[7, 8, 9]` — length 3. `arguments` inside the arrow is `wrapper`'s, which received `('a', 'b')` — length 2. The `arguments` object is array-*like*: it has `length` and indices but no array methods, which is why `Array.from` (or `[...arguments]`) is needed. In new code, always use rest instead; `arguments` also deoptimizes and is banned in arrow functions for exactly this confusion.
</details>

---

### Q15 — default parameter timing

What does this print?

```js
let calls = 0;
function next() {
  calls += 1;
  return calls;
}
function withDefault(x = next()) {
  return x;
}
console.log(withDefault(), withDefault(), withDefault(99), withDefault());
```

<details><summary>Answer</summary>

**`1 2 99 3`** — default expressions are evaluated at call time, and only when the argument is `undefined`.

Unlike Python, JavaScript does not evaluate defaults once at definition time, so there's no shared-mutable-default trap. Each call where `x` is missing re-runs `next()`. The third call supplies `99`, so `next()` never fires and the counter doesn't advance — which is why the fourth call yields `3`, not `4`. Passing `undefined` explicitly would still trigger the default; passing `null` would not.
</details>

---

### Q16 — map with parseInt

What does this print?

```js
const nums = [1, 2, 3];
console.log(nums.map(parseInt));
console.log(['10', '10', '10'].map(Number));
```

<details><summary>Answer</summary>

**`[ 1, NaN, NaN ]`**, then **`[ 10, 10, 10 ]`** — `map` passes three arguments, and `parseInt`'s second parameter is the radix.

The calls are `parseInt(1, 0)`, `parseInt(2, 1)`, `parseInt(3, 2)`. Radix `0` means "use the default", so the first works. Radix `1` doesn't exist → `NaN`. Radix `2` is binary, and `'3'` is not a binary digit → `NaN`. `Number` takes exactly one argument and ignores the extras, so it's safe. The general lesson: never point-free a callback into a function that takes optional extra parameters — write `nums.map((n) => parseInt(n, 10))`.
</details>

---

### Q17 — forgetting new

What does this print?

```js
function Person(name) {
  this.name = name;
}
const p1 = new Person('Ada');
const p2 = Person('Grace');
console.log(p1.name);
console.log(p2);
console.log(globalThis.name);
```

<details><summary>Answer</summary>

**`Ada`, `undefined`, `Grace`** — without `new`, the constructor is just a function that writes to the global object and returns nothing.

`new` does four things: creates an empty object, sets its prototype to `Person.prototype`, calls the function with `this` bound to that object, and returns it (unless you explicitly return another object). Call it plainly and none of that happens: `this` is the global object, `this.name = name` becomes a global assignment, and the implicit return is `undefined`. `class` exists partly to make this impossible — calling a class without `new` is a hard `TypeError`.
</details>

---

### Q18 — bind is permanent

What does this print?

```js
function f() {
  return this;
}
const o = { name: 'o' };
const once = f.bind(o);
const twice = once.bind({ name: 'other' });
console.log(twice().name);
```

<details><summary>Answer</summary>

**`o`** — a bound function's `this` cannot be rebound.

`bind` returns an *exotic* bound-function object that permanently records its target and its `this`. Binding it again wraps it, but the outer wrapper's `this` is discarded when it calls the inner bound function, which supplies its own. `call` and `apply` on a bound function are ignored the same way. The one exception is `new`: `new twice()` ignores the bound `this` entirely and builds a fresh object.
</details>

---

### Q19 — where the arrow looked

What does this print?

```js
const widget = {
  size: 10,
  makeGetters() {
    return {
      arrow: () => this.size,
      plain: function () {
        return this.size;
      },
    };
  },
};
const g = widget.makeGetters();
console.log(g.arrow());
console.log(g.plain());
```

<details><summary>Answer</summary>

**`10`, then `undefined`** — the arrow captured `makeGetters`'s `this`; the plain function got the object it was called on.

`makeGetters` was invoked as `widget.makeGetters()`, so its `this` is `widget`, and the arrow closes over that permanently — even though the arrow is defined inside a *different* object literal. The plain function is called as `g.plain()`, so its `this` is `g`, and `g` has no `size`. Object literals do not create a `this` scope; only function calls do. This is why "arrows in object literals" is a rule of thumb, not a law — it depends entirely on what encloses them.
</details>

---

### Q20 — the IIFE workaround

What does this print?

```js
const fns = [];
for (var i = 0; i < 3; i++) {
  (function (captured) {
    fns.push(() => captured);
  })(i);
}
console.log(fns.map((f) => f()));
```

<details><summary>Answer</summary>

**`[ 0, 1, 2 ]`** — the IIFE creates a new function scope per iteration and copies `i` into a parameter.

This is the pre-ES6 fix for Q7. Arguments are passed by value for primitives, so `captured` is a snapshot frozen at the moment the IIFE ran. Each iteration produces a distinct scope holding a distinct `captured`. `let` in the loop head now does this for you at the language level — but recognizing the IIFE pattern matters, because you will read it in older code and in bundled output.
</details>

---

### Q21 — shadowed by hoisting

What does this print?

```js
var x = 'outer';
function outer() {
  console.log(x);
  var x = 'inner';
}
outer();
```

<details><summary>Answer</summary>

**`undefined`** — the inner `var x` hoists to the top of `outer` and shadows the outer `x` for the entire function body.

Scope resolution is lexical and happens before execution: the compiler sees `var x` anywhere in `outer` and creates a function-scoped binding initialized to `undefined`. The log therefore reads the *local* `x`, not the global one, and reads it before the assignment. Even the line above the declaration is inside the shadow — `var` has no partial visibility, only "declared for the whole function or not at all."
</details>

---

### Q22 — named function expression

What does this print?

```js
const banner = function selfRef(n) {
  return n <= 0 ? 'done' : selfRef(n - 1);
};
console.log(banner(2));
console.log(typeof selfRef);
```

<details><summary>Answer</summary>

**`done`, then `undefined`** — the name of a function expression is visible inside its own body and nowhere else.

The engine creates a tiny extra scope around the function containing just that binding, so `selfRef` can recurse even if the outer variable is reassigned or the function is passed around anonymously. That name never leaks into the enclosing scope, so `typeof selfRef` outside is `'undefined'`. Naming your function expressions costs nothing and gives you readable stack traces — do it.
</details>

---

### Q23 — closing over a binding, not a value

What does this print?

```js
function greetLater(name) {
  return function () {
    return 'hello ' + name;
  };
}
let who = 'first';
const g = greetLater(who);
who = 'second';
console.log(g());

let box = { who: 'first' };
const h = (() => () => 'hello ' + box.who)();
box.who = 'second';
console.log(h());
```

<details><summary>Answer</summary>

**`hello first`, then `hello second`** — closures capture *bindings*, and passing an argument creates a new binding.

In the first case, `greetLater(who)` copied the string value into the parameter `name`, a separate binding; reassigning `who` afterwards can't reach it. In the second, the closure captured the `box` binding itself and reads `box.who` at call time, so it sees the mutation. The rule: closures are live references to variables, not snapshots of values — you only get a snapshot when a *new* binding is created (a parameter, a `let` per loop iteration, a fresh scope).
</details>

---

### Q24 — arrows ignore call and apply

What does this print?

```js
const obj = { v: 1 };
function show() {
  return this.v;
}
console.log(show.call(obj), show.apply(obj), show.bind(obj)());
const arrowShow = () => this;
console.log(arrowShow.call(obj) === arrowShow.call(null));
```

<details><summary>Answer</summary>

**`1 1 1`**, then **`true`** — all three binding mechanisms work on a normal function, and none of them work on an arrow.

`call`, `apply`, and `bind` all set the `this` of a regular function; they differ only in argument shape and in whether they invoke immediately. An arrow has no `this` slot to set, so the `thisArg` is silently ignored and both calls return the same lexically captured value — hence `true`. Corollary: an arrow can never be a method that needs `this`, can never be a constructor, and can never be `bind`-fixed after the fact.
</details>

---

### Q25 — comparators are values

What does this print?

```js
const by = (fn) => (a, b) => (fn(a) < fn(b) ? -1 : fn(a) > fn(b) ? 1 : 0);
const desc = (cmp) => (a, b) => -cmp(a, b);
const rows = [
  { n: 'ada', t: 2 },
  { n: 'bob', t: 1 },
  { n: 'cal', t: 2 },
];
console.log(rows.toSorted(by((r) => r.t)).map((r) => r.n).join(','));
console.log(rows.toSorted(desc(by((r) => r.t))).map((r) => r.n).join(','));
```

<details><summary>Answer</summary>

**`bob,ada,cal`**, then **`ada,cal,bob`** — `by` is a comparator *factory* and `desc` is a comparator *decorator*; both are just closures.

`by(fn)` closes over the key extractor and returns the two-argument function `sort` wants, which is why you never have to write another `(a, b) => a.x - b.x` by hand. `desc` takes a comparator and returns its negation, so ordering direction becomes composable instead of copy-pasted. Note that negating a comparator does **not** reverse ties: `ada` and `cal` both compare `0`, so stability keeps them in input order in both directions. That's a feature — it means `desc(by(...))` is not the same as `.toSorted(...).toReversed()`.
</details>

---

### Q26 — chaining comparators with `||`

What does this print?

```js
const rows = [
  { dept: 2, seat: 1, id: 'a' },
  { dept: 1, seat: 9, id: 'b' },
  { dept: 2, seat: 0, id: 'c' },
];
console.log(rows.toSorted((x, y) => x.dept - y.dept || x.seat - y.seat).map((r) => r.id).join(''));
const files = ['img12.png', 'img2.png', 'img1.png'];
console.log(files.toSorted());
console.log(files.toSorted(new Intl.Collator('en', { numeric: true }).compare));
```

<details><summary>Answer</summary>

**`bca`**, **`[ 'img1.png', 'img12.png', 'img2.png' ]`**, **`[ 'img1.png', 'img2.png', 'img12.png' ]`** — `||` works as a tiebreaker precisely because a comparator returns `0` for "equal", and `0` is falsy.

`x.dept - y.dept || x.seat - y.seat` reads as "sort by dept; if that ties, sort by seat", and it chains to any depth. The file names show the other half: default `sort` compares code units, so `'img12'` sorts before `'img2'` — the comparison is decided at the first digit, where `'1'` is below `'2'`, and the length of the number never gets a say. `Intl.Collator` with `numeric: true` compares embedded digit runs as numbers — and because `collator.compare` is already a bound two-argument function, you pass it directly instead of calling `localeCompare` (which rebuilds a collator) once per comparison.
</details>

---

### Q27 — compose versus pipe

What does this print?

```js
const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x);
const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const double = (n) => n * 2;
const inc = (n) => n + 1;
console.log(compose(double, inc)(5), pipe(double, inc)(5));
console.log(compose(inc)(5) === pipe(inc)(5));
```

<details><summary>Answer</summary>

**`12 11`**, then **`true`** — same functions, opposite reading order: `compose` is right-to-left, `pipe` is left-to-right.

`compose(double, inc)(5)` means `double(inc(5))`, matching the mathematical notation f∘g. `pipe` uses `reduce` instead of `reduceRight`, so it reads like a Unix pipeline: value in at the left, each transform applied in the order written. They agree on a single function, which is exactly why the bug hides — a one-function test passes and the two-function case is silently backwards. Modern code overwhelmingly prefers `pipe`, and the same argument-order question is why `.then()` chains read the way they do.
</details>

---

### Q28 — curry reads `fn.length`

What does this print?

```js
const curry = (fn) => {
  const step = (...args) =>
    args.length >= fn.length ? fn(...args) : (...more) => step(...args, ...more);
  return step;
};
const vol = curry((l, w, h) => l * w * h);
console.log(vol(2)(3)(4), vol(2, 3)(4), vol(2, 3, 4));
const bad = curry((a, b = 2) => a + b);
console.log(bad(1));
```

<details><summary>Answer</summary>

**`24 24 24`**, then **`3`** — a general curry decides "am I done yet?" by comparing collected arguments against declared arity.

That's what lets all three call shapes work: each partial application closes over the arguments so far and returns a new collector. The second half is the trap this design carries — `fn.length` stops counting at the first default or rest parameter, so `(a, b = 2) => a + b` reports arity `1` and `bad(1)` fires immediately with `b` defaulted instead of waiting for a second argument. Curry and default parameters do not mix; pass the arity explicitly (`curry(fn, 2)`) when you need both.
</details>

---

### Q29 — `arguments` is a live alias

What does this print?

```js
function sloppy(a) {
  arguments[0] = 'changed';
  return a;
}
function withDefault(a, b = 1) {
  arguments[0] = 'changed';
  return a;
}
console.log(sloppy('original'), withDefault('original'));
```

<details><summary>Answer</summary>

**`changed original`** — in a plain sloppy-mode function the `arguments` object is *mapped* onto the parameters, and any default, rest, or destructured parameter turns that off.

In `sloppy`, `arguments[0]` and `a` are two names for one storage slot, so writing through one changes the other — and it works in both directions. The moment a function has a non-simple parameter list (a default, a `...rest`, or destructuring), the spec creates an *unmapped* `arguments` that is a plain snapshot, so the write goes nowhere. Strict mode also always unmaps it. Two nearly identical functions, opposite behaviour, driven by a parameter you didn't even touch — which is the whole argument for never reading `arguments` in new code.
</details>

---

### Q30 — arity versus argument count

What does this print?

```js
function greet(a, b, c = 1, ...rest) {}
console.log(greet.length);
function count() { return arguments.length; }
console.log(count(1, undefined, 3), count(...[1, 2], ...[3]));
console.log(count.length, ((a, b) => a).length);
```

<details><summary>Answer</summary>

**`2`**, **`3 3`**, **`0 2`** — `fn.length` is a *declaration*-time count, `arguments.length` is a call-time one.

`greet.length` is `2` because counting stops at the first default parameter; `c` and `rest` are invisible to it. `arguments.length` counts what actually arrived, including an explicit `undefined` and everything a spread expanded into — that's the only way to distinguish `f(undefined)` from `f()`, which parameter defaults deliberately cannot. `count` declares no parameters at all so its `length` is `0` even though it happily receives three. Libraries use `fn.length` for currying and for "does this callback want a `done` argument"; both break on defaults.
</details>

---

### Q31 — where a function's name comes from

What does this print?

```js
const f = () => {};
const obj = { m() {}, g: function () {}, h: () => {} };
console.log(f.name, obj.m.name, obj.g.name, obj.h.name);
const { m } = obj;
console.log(m.name, function named() {}.name);
console.log(f.bind(null).name);
```

<details><summary>Answer</summary>

**`f m g h`**, **`m named`**, **`bound f`** — anonymous functions get a name *inferred* from what they're assigned to.

The spec calls this NamedEvaluation: an anonymous function expression or arrow on the right of a `const`/`let`/`var` assignment, a property definition, or a default value picks up that identifier as its `name`. The name is baked in at creation, so destructuring `m` out of the object keeps `'m'`. `bind` produces `'bound ' + original`, which is why bound handlers are still identifiable in a stack trace. Inference fails for `arr.map(x => x)` and for functions passed straight as arguments — those show as anonymous in profiles, which is the practical reason to name them.
</details>

---

### Q32 — the name binding is read-only

What does this print?

```js
const fact = function self(n) {
  self = null;
  return n <= 1 ? 1 : n * self(n - 1);
};
console.log(fact(4));
console.log(typeof self);
```

<details><summary>Answer</summary>

**`24`**, then **`undefined`** — the self-reference of a named function expression is an immutable binding, and the assignment is silently discarded in sloppy mode.

The engine wraps the function in a tiny scope holding just `self`, bound to the function and marked non-writable. `self = null` therefore does nothing at all here; in strict mode (any ES module, any class body) the identical line throws `TypeError: Assignment to constant variable`. That immutability is what makes the recursion trustworthy: no caller and no line of the body can sabotage it, unlike recursing through the outer `fact` name, which anyone can reassign. And the binding never escapes, so `typeof self` outside is `'undefined'`.
</details>

---

### Q33 — the trampoline

What does this print?

```js
function trampoline(fn) {
  return (...args) => {
    let r = fn(...args);
    while (typeof r === 'function') r = r();
    return r;
  };
}
const sumTo = (n, acc = 0) => (n === 0 ? acc : () => sumTo(n - 1, acc + n));
console.log(trampoline(sumTo)(100000));
const plain = (n, acc = 0) => (n === 0 ? acc : plain(n - 1, acc + n));
try {
  plain(100000);
} catch (e) {
  console.log(e.constructor.name);
}
```

<details><summary>Answer</summary>

**`5000050000`**, then **`RangeError`** — the trampoline turns recursion into iteration by returning a *thunk* instead of calling itself.

`sumTo` never recurses directly; it returns a zero-argument closure describing the next step, and the `while` loop in `trampoline` keeps calling those until one returns a real value. The stack therefore never grows past one frame, so a depth that blows the plain version out at roughly 10^4 frames finishes fine. This is how you get the benefits of tail recursion in an engine that does not implement tail-call optimization. The costs are real: one closure allocation per step, and a function body that no longer reads like the recursion it is.
</details>

---

### Q34 — what a debounce keeps

What does this print?

```js
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
const calls = [];
const save = debounce((v) => calls.push(v), 20);
save('a');
save('b');
save('c');
setTimeout(() => console.log(calls), 60);
```

<details><summary>Answer</summary>

**`[ 'c' ]`** — a debounce keeps only the *last* call in a burst, because every new call cancels the pending timer.

The timer handle lives in the closure, so `clearTimeout(t)` on each invocation discards the previous scheduled run and restarts the clock. That is the right shape for "wait until the user stops typing" and for resize handlers. A **throttle** is the other primitive: it lets the *first* call through and ignores the rest until a cooling period expires, which is what you want for scroll position and analytics pings. Say the difference out loud — "debounce waits for quiet, throttle enforces a rate" — because the two names get swapped constantly.
</details>

---

### Q35 — destructuring calls the getter

What does this print?

```js
const account = {
  _n: 5,
  get n() { return this._n; },
};
const { n } = account;
console.log(n);
const desc = Object.getOwnPropertyDescriptor(account, 'n');
console.log(typeof desc.get, desc.value);
console.log(desc.get.call({ _n: 99 }));
```

<details><summary>Answer</summary>

**`5`**, **`function undefined`**, **`99`** — destructuring reads the property, which invokes the getter once and copies the resulting *value*.

So `n` is a dead snapshot: later changes to `account._n` will never be reflected, and any laziness the getter was providing has already been paid for. The descriptor shows why — an accessor property has `get`/`set` and no `value` at all, which is also why `{ ...account }` flattens getters into plain data. The last line is the `this` lesson: pulled off the descriptor, the getter is an ordinary function whose receiver is whatever you `call` it with.
</details>

---

### Q36 — `new` on a bound function

What does this print?

```js
function Point(x, y) {
  this.x = x;
  this.y = y;
}
const Bound = Point.bind({ ignored: true }, 1);
const p = new Bound(2);
console.log(p.x, p.y, p instanceof Point);
console.log(typeof Bound.prototype, Bound.name);
```

<details><summary>Answer</summary>

**`1 2 true`**, then **`undefined bound Point`** — `new` ignores a bound function's `this` but keeps its pre-filled arguments.

This is the single exception to Q18's "bind is permanent": construction supplies its own fresh object, so `{ ignored: true }` is discarded, while the partially applied `1` still lands in `x`. The new object's prototype comes from the *target* function, which is why `instanceof Point` holds even though `Point` was never named at the call site. Bound functions have no own `prototype` property at all — they borrow the target's when constructed — so `Bound.prototype` is `undefined`.
</details>

---

### Q37 — `new.target`

What does this print?

```js
function Guard() {
  if (!new.target) return new Guard();
  this.safe = true;
}
console.log(Guard().safe, new Guard().safe);
class Base {
  constructor() { this.made = new.target.name; }
}
class Sub extends Base {}
console.log(new Base().made, new Sub().made);
```

<details><summary>Answer</summary>

**`true true`**, then **`Base Sub`** — `new.target` is the constructor that `new` was actually written against, or `undefined` for a plain call.

The first pattern is the pre-`class` fix for the forgotten-`new` bug from Q17: detect the plain call and redirect it, so both call styles work. The second shows the more useful property — through `super()`, `new.target` stays pointed at the *most derived* class, not the one whose constructor is currently running. That's how you write an abstract base that refuses direct construction (`if (new.target === Shape) throw ...`) and how a framework knows which subclass it is instantiating.
</details>

---

### Q38 — uncurrying `this`

What does this print?

```js
const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
const bare = Object.create(null);
bare.x = 1;
console.log(hasOwn(bare, 'x'), hasOwn({}, 'x'));
const slice = Function.prototype.call.bind(Array.prototype.slice);
console.log(slice({ 0: 'a', 1: 'b', length: 2 }, 0));
```

<details><summary>Answer</summary>

**`true false`**, then **`[ 'a', 'b' ]`** — binding `call` to a method turns that method's receiver into its first ordinary argument.

Read it inside out: `call` is itself a function whose `this` is the function to invoke, so `call.bind(hasOwnProperty)` produces `(receiver, ...args) => hasOwnProperty.call(receiver, ...args)`. That makes the method safe against objects that don't inherit it — a null-prototype dictionary has no `hasOwnProperty` of its own — and against objects that maliciously *override* it. The second line is the classic array-like conversion. Modern code writes `Object.hasOwn(obj, k)` and `Array.from(arrayLike)`, but this idiom is everywhere in library source, so you need to be able to read it.
</details>

---

### Q39 — three receivers in one method

What does this print?

```js
const app = {
  id: 'app',
  boot() {
    const outer = () => this.id;
    function inner() {
      return this && this.id;
    }
    const nested = () => inner();
    return [outer(), nested(), inner.call(this)];
  },
};
console.log(app.boot());
```

<details><summary>Answer</summary>

**`[ 'app', undefined, 'app' ]`** — the arrow inherits `boot`'s `this`, but calling a plain function *from inside* an arrow does not pass anything along.

`outer` has no `this` of its own so it reads `boot`'s, which is `app`. `nested` is also an arrow — but all it does is invoke `inner()` as a plain call, and a plain call always sets `this` to the global object in sloppy mode (or `undefined` in strict mode, where `this && this.id` is the guard that stops it throwing). Lexical `this` is a property of where a function is *defined*, not something that propagates down through calls. The third element proves the value was reachable all along; you just have to pass it explicitly.
</details>
