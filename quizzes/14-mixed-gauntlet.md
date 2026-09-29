# 14 · Mixed Gauntlet — 45 rapid questions, shuffled, no warm-up

The interleaved drill. There are no topic headings and no difficulty ramp on purpose: every
question could be from any module, so you have to *recognize* what is being tested before you can
answer it — which is the actual skill, and the one that a single-topic file cannot train.

Thirty seconds each, out loud, no hedging. Answers are one line plus one sentence. Every runnable
snippet here was executed in its own Node v22.16.0 process before its answer was written.

Save this file for the flight home, after you have been through 01–13 at least once.

---

### Q1 — sort

What does this print?

```js
console.log([10, 9, 1].sort());
```

<details><summary>Answer</summary>

**`[ 1, 10, 9 ]`** — with no comparator, `sort` compares elements as strings.
</details>

---

### Q2 — plus and minus

What does this print?

```js
console.log('5' + 3, '5' - 3, '5' * '2');
```

<details><summary>Answer</summary>

**`53 2 10`** — `+` concatenates when either side is a string; every other arithmetic operator converts to number.
</details>

---

### Q3 — order

What does this print, in what order?

```js
Promise.resolve('a').then(console.log);
console.log('b');
```

<details><summary>Answer</summary>

**`b`, then `a`** — a `.then` callback is always deferred to the microtask queue, even on an already-resolved promise.
</details>

---

### Q4 — name the method

Which array method returns the **first element** matching a predicate, and which returns its **index**? What does each return when nothing matches?

<details><summary>Answer</summary>

**`find` returns the element or `undefined`; `findIndex` returns the index or `-1`.**

Prefer `findIndex` when `undefined` could be a legitimate element, because then `-1` is the only unambiguous "not found".
</details>

---

### Q5 — the empty array

What does this print?

```js
console.log([] == false, [] ? 'truthy' : 'falsy');
```

<details><summary>Answer</summary>

**`true truthy`** — `==` sends both sides through numeric conversion (`0 == 0`), while `if` uses `ToBoolean`, which is `true` for every object.
</details>

---

### Q6 — no arguments

What does this print?

```js
console.log(Math.max(), Math.min());
```

<details><summary>Answer</summary>

**`-Infinity Infinity`** — the identity values, so that `Math.max(...anything)` is never wrongly beaten by the seed; note `Math.max(...[])` is a real source of bad chart axes.
</details>

---

### Q7 — three lanes

What does this print, in what order?

```js
queueMicrotask(() => console.log('m'));
setTimeout(() => console.log('t'), 0);
console.log('s');
```

<details><summary>Answer</summary>

**`s`, `m`, `t`** — synchronous code, then the entire microtask queue, then one macrotask.
</details>

---

### Q8 — key order

What does this print?

```js
console.log(Object.keys({ b: 1, 2: 2, a: 3 }));
```

<details><summary>Answer</summary>

**`[ '2', 'b', 'a' ]`** — integer-like keys come first in ascending numeric order, then string keys in insertion order.
</details>

---

### Q9 — defaults

What does this print?

```js
const { a = 1 } = { a: null };
const [b = 1] = [undefined];
console.log(a, b);
```

<details><summary>Answer</summary>

**`null 1`** — a destructuring default fires only for `undefined`, never for `null`.
</details>

---

### Q10 — cost

Give the average-case big-O of `push`, `pop`, `shift`, `unshift`, and `arr[i]` on an array.

<details><summary>Answer</summary>

**`push`/`pop`/`arr[i]` are O(1) (push amortized); `shift`/`unshift` are O(n).**

Anything that touches the front has to reindex every remaining element, which is why a queue built on `shift` degrades to O(n squared).
</details>

---

### Q11 — finding NaN

What does this print?

```js
console.log([1, NaN].indexOf(NaN), [1, NaN].includes(NaN));
```

<details><summary>Answer</summary>

**`-1 true`** — `indexOf` uses strict equality and `NaN !== NaN`, while `includes` uses SameValueZero, which matches it.
</details>

---

### Q12 — typeof

What does this print?

```js
console.log(typeof class {}, typeof (() => {}), typeof typeof 1);
```

<details><summary>Answer</summary>

**`function function string`** — a class is a function with guardrails, and `typeof` always returns a string, so `typeof typeof x` is always `'string'`.
</details>

---

### Q13 — the loop

What does this print?

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);
```

<details><summary>Answer</summary>

**`3`, `3`, `3`** — `var` has one binding for the whole loop, and all three callbacks read it after the loop has finished; `let` would give `0 1 2`.
</details>

---

### Q14 — serialization holes

What does this print?

```js
console.log(JSON.stringify({ a: undefined, b: [undefined] }));
```

<details><summary>Answer</summary>

**`{"b":[null]}`** — an `undefined` property is omitted entirely, but inside an array it becomes `null`, because an array must keep its indices.
</details>

---

### Q15 — filling an array

What does this print?

```js
console.log(Array.from({ length: 3 }, (_, i) => i * 2), new Array(3).map(() => 0));
```

<details><summary>Answer</summary>

**`[ 0, 2, 4 ] [ <3 empty items> ]`** — `map` skips holes, so it cannot initialize an empty array; `Array.from` and `fill` write real values.
</details>

---

### Q16 — spot the bug

What is wrong with this line?

```js
if (list.indexOf(target)) doSomething();
```

<details><summary>Answer</summary>

**It is wrong in both directions: `-1` (not found) is truthy, and `0` (found at the front) is falsy.**

Write `if (list.includes(target))`, which exists precisely so nobody has to remember `!== -1`.
</details>

---

### Q17 — negative zero

What does this print?

```js
console.log(Object.is(-0, 0), -0 === 0, [-0].includes(0));
```

<details><summary>Answer</summary>

**`false true true`** — `Object.is` uses SameValue, which distinguishes the two zeros; `===` and SameValueZero do not.
</details>

---

### Q18 — string or number

What does this print?

```js
console.log('10' > '9', '10' > 9);
```

<details><summary>Answer</summary>

**`false true`** — two strings compare code unit by code unit, but a string against a number converts both to numbers.
</details>

---

### Q19 — point-free

What does this print?

```js
console.log([1, 2, 3].map(String), ['1', '2', '3'].map(parseInt));
```

<details><summary>Answer</summary>

**`[ '1', '2', '3' ] [ 1, NaN, NaN ]`** — `map` passes `(value, index, array)`, and `parseInt`'s second parameter is the radix; `String` ignores the extras.
</details>

---

### Q20 — Set identity

What does this print?

```js
console.log(new Set([1, '1', 1]).size, new Set([NaN, NaN]).size);
```

<details><summary>Answer</summary>

**`2 1`** — `Set` uses SameValueZero: no type coercion, so `1` and `'1'` both survive, but `NaN` deduplicates against itself.
</details>

---

### Q21 — finally

What does this print?

```js
function f() {
  try {
    return 1;
  } finally {
    return 2;
  }
}
console.log(f());
```

<details><summary>Answer</summary>

**`2`** — a `return` in `finally` overrides the one in `try` and swallows any in-flight exception, which is why linters ban it.
</details>

---

### Q22 — deep copy

What does this print?

```js
const c = structuredClone(new Map([['k', 1]]));
console.log(c.get('k'), c instanceof Map);
```

<details><summary>Answer</summary>

**`1 true`** — `structuredClone` preserves `Map`, `Set`, `Date`, and cycles, all of which the `JSON.parse(JSON.stringify(x))` trick destroys.
</details>

---

### Q23 — replacement

What does this print?

```js
console.log('abc'.replace(/b/, '$&$&'), 'a-b-c'.replace('-', '+'));
```

<details><summary>Answer</summary>

**`abbc a+b-c`** — `$&` inserts the whole match, and `replace` with a *string* pattern replaces only the first occurrence.
</details>

---

### Q24 — null comparisons

What does this print?

```js
console.log(null == undefined, null === undefined, null == 0, null >= 0);
```

<details><summary>Answer</summary>

**`true false false true`** — `==` has a hardcoded rule making `null` equal only to `undefined`, while relational operators convert, and `Number(null)` is `0`.
</details>

---

### Q25 — name the pattern

"Find the maximum sum of any contiguous subarray of length k." Name the technique and its complexity.

<details><summary>Answer</summary>

**Sliding window — O(n) time, O(1) space.**

Keep a running total, then on each step add the element entering the window and subtract the one leaving, instead of recomputing each window from scratch.
</details>

---

### Q26 — counting characters

What does this print?

```js
console.log('\u{1F44D}'.length, [...'\u{1F44D}'].length);
```

<details><summary>Answer</summary>

**`2 1`** — `.length` counts UTF-16 code units and an emoji is a surrogate pair; spread uses the string iterator, which walks code points.
</details>

---

### Q27 — delete

What does this print?

```js
const arr = [1, 2, 3];
delete arr[1];
console.log(arr.length, arr, arr.filter(() => true));
```

<details><summary>Answer</summary>

**`3 [ 1, <1 empty item>, 3 ] [ 1, 3 ]`** — `delete` removes the property without reindexing, leaving a hole that `filter` skips; use `splice(1, 1)` to actually remove an element.
</details>

---

### Q28 — converting to number

What does this print?

```js
console.log(Number(''), Number(' '), Number('a'), Number(null), Number(undefined));
```

<details><summary>Answer</summary>

**`0 0 NaN 0 NaN`** — empty and whitespace-only strings convert to `0`, and `null` converts to `0` while `undefined` gives `NaN`.
</details>

---

### Q29 — arrows

What does this print?

```js
console.log((() => {}).prototype, typeof function () {}.prototype);
```

<details><summary>Answer</summary>

**`undefined object`** — an arrow has no `prototype` property, which is one of the reasons it can never be used with `new`.
</details>

---

### Q30 — losing the receiver

What does this print?

```js
const o = { n: 1, get() { return this && this.n; } };
console.log(o.get(), (0, o.get)());
```

<details><summary>Answer</summary>

**`1 undefined`** — the comma operator yields the bare function value, so the second call is a plain call and `this` is no longer `o`.
</details>

---

### Q31 — Promise.all

What does this print, in what order?

```js
Promise.all([]).then((v) => console.log('empty', v));
Promise.all([1, Promise.resolve(2)]).then((v) => console.log(v));
```

<details><summary>Answer</summary>

**`empty []`, then `[ 1, 2 ]`** — non-promise values are wrapped and passed straight through, and an empty input fulfils immediately with an empty array.
</details>

---

### Q32 — indexing from the end

What does this print?

```js
console.log([1, 2, 3].at(-1), 'abc'.at(-1), [1, 2, 3][-1]);
```

<details><summary>Answer</summary>

**`3 c undefined`** — `at` understands negative indices; bracket notation turns `-1` into the string key `'-1'`, which is just a property that does not exist.
</details>

---

### Q33 — sorting letters

What does this print?

```js
console.log(['b', 'a', 'C'].sort().join(''));
```

<details><summary>Answer</summary>

**`Cab`** — default sort is code-unit order, and every uppercase letter comes before every lowercase one; use `Intl.Collator('en').compare` for human ordering.
</details>

---

### Q34 — one level deep

What does this print?

```js
const a = { t: [1] };
const b = { ...a };
b.t.push(2);
console.log(a.t.length, a.t === b.t);
```

<details><summary>Answer</summary>

**`2 true`** — spread copies property *values*, and the value of `t` is a reference to the same array.
</details>

---

### Q35 — the empty array again

What does this print?

```js
console.log([1, 2, 3].some((n) => n > 2), [].every(() => false), [].some(() => true));
```

<details><summary>Answer</summary>

**`true true false`** — `every` on an empty array is vacuously `true` and `some` is `false`, no matter what the callback says.
</details>

---

### Q36 — splitting

What does this print?

```js
console.log('a,b,,c'.split(',').length, 'a,b,,c'.split(',').filter(Boolean).length);
```

<details><summary>Answer</summary>

**`4 3`** — consecutive separators produce empty strings rather than being collapsed, which is why `filter(Boolean)` so often follows a `split`.
</details>

---

### Q37 — async start

What does this print, in what order?

```js
(async () => {
  console.log(1);
  await null;
  console.log(3);
})();
console.log(2);
```

<details><summary>Answer</summary>

**`1`, `2`, `3`** — an async function body runs synchronously up to its first `await`, then suspends and queues the rest as a microtask.
</details>

---

### Q38 — returning from a constructor

What does this print?

```js
class P {
  constructor() {
    return { x: 1 };
  }
}
console.log(new P().x, new P() instanceof P);
```

<details><summary>Answer</summary>

**`1 false`** — returning an object from a constructor replaces the newly built `this` entirely, prototype and all; returning a primitive would be ignored.
</details>

---

### Q39 — chaining comparisons

What does this print?

```js
console.log(1 < 2 < 3, 3 > 2 > 1);
```

<details><summary>Answer</summary>

**`true false`** — relational operators are left-associative and yield a boolean, so the second comparison is really `true < 3` and `true > 1`.
</details>

---

### Q40 — object keys

What does this print?

```js
const m = new Map();
m.set({}, 1);
console.log(m.get({}), m.size);
```

<details><summary>Answer</summary>

**`undefined 1`** — `Map` keys compare by identity, and the second `{}` is a different allocation; you must keep the original reference.
</details>

---

### Q41 — promise identity

What does this print?

```js
const p = Promise.resolve();
console.log(Promise.resolve(p) === p, new Promise((r) => r(p)) === p);
```

<details><summary>Answer</summary>

**`true false`** — `Promise.resolve` returns a native promise unchanged, while `new Promise` always builds a new one that then *adopts* `p`, costing extra ticks.
</details>

---

### Q42 — reduce

What does this print?

```js
console.log(
  [1, 2, 3].reduce((a, b) => a + b),
  (() => {
    try {
      return [].reduce((a, b) => a + b);
    } catch (e) {
      return e.constructor.name;
    }
  })()
);
```

<details><summary>Answer</summary>

**`6 TypeError`** — with no initial value `reduce` seeds from element 0, so an empty array has nothing to seed with; always pass the seed.
</details>

---

### Q43 — getters

What does this print?

```js
let n = 0;
const obj = { get v() { n++; return 1; } };
const { v } = obj;
console.log(v, n);
```

<details><summary>Answer</summary>

**`1 1`** — destructuring *reads* the property, so the getter runs once and you get a dead snapshot of its value, not the accessor.
</details>

---

### Q44 — parsing numbers

What does this print?

```js
console.log(parseInt('08'), parseInt('0x10'), Number('0x10'), parseFloat('1.5e2px'));
```

<details><summary>Answer</summary>

**`8 16 16 150`** — `parseInt` still auto-detects the `0x` prefix but nothing else, and the `parse*` family scans as far as it can and ignores the rest.
</details>

---

### Q45 — spot the bug

What is wrong with this comparator, and what is the rule it breaks?

```js
items.sort((a, b) => a.score > b.score);
```

<details><summary>Answer</summary>

**It returns a boolean, which converts to `1` or `0` — so it never says "a comes first", and the result is implementation-defined.**

A comparator must return a *number*: negative to put `a` first, positive to put `b` first, zero for equal — here, `(a, b) => a.score - b.score`.
</details>
