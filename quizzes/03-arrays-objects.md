# 03 · Arrays and Objects — mutation, references, reduce, sort, JSON

Cover the answer, commit out loud, then reveal. If you hedge, you got it wrong.

---

### Q1 — map versus forEach

What does this print?

```js
const nums = [1, 2, 3];
const doubled = nums.map((n) => n * 2);
console.log(doubled);
console.log(nums);
console.log(nums.forEach((n) => n * 2));
```

<details><summary>Answer</summary>

**`[ 2, 4, 6 ]`**, **`[ 1, 2, 3 ]`**, **`undefined`** — `map` builds and returns a new array; `forEach` returns nothing.

`map` allocates a result array the same length as the input and fills it with each callback's return value. `forEach` exists purely for side effects and always returns `undefined`, which is why you can never chain off it. Neither one mutates the source array. Rule of thumb: if you're not using the returned array, you wanted `forEach` (or better, `for...of`); if you're pushing into an outer array inside `forEach`, you wanted `map`.
</details>

---

### Q2 — the search family

What does this print?

```js
const nums = [1, 2, 3, 4];
console.log(nums.filter((n) => n % 2 === 0));
console.log(nums.find((n) => n % 2 === 0));
console.log(nums.findIndex((n) => n > 10));
console.log(nums.some((n) => n > 3), nums.every((n) => n > 0));
```

<details><summary>Answer</summary>

**`[ 2, 4 ]`**, **`2`**, **`-1`**, **`true true`** — `filter` returns all matches as an array, `find` returns the first matching *element*, `findIndex` returns its position or `-1`.

`find` returns `undefined` when nothing matches — which is ambiguous if `undefined` is a legitimate array value, so prefer `findIndex` when you need to distinguish "not found" from "found a falsy thing". `some` short-circuits on the first `true`, `every` short-circuits on the first `false`. Trivia worth knowing: `[].every(anything)` is `true` (vacuous truth) and `[].some(anything)` is `false`.
</details>

---

### Q3 — slice versus splice

What does this print?

```js
const arr = [1, 2, 3, 4, 5];
const sliced = arr.slice(1, 3);
console.log(sliced, arr);
const spliced = arr.splice(1, 2);
console.log(spliced, arr);
```

<details><summary>Answer</summary>

**`[ 2, 3 ] [ 1, 2, 3, 4, 5 ]`**, then **`[ 2, 3 ] [ 1, 4, 5 ]`** — `slice` copies, `splice` cuts.

`slice(start, end)` returns a new array from `start` up to but not including `end`, leaving the original alone. `splice(start, deleteCount, ...insert)` removes elements *in place*, returns the removed ones, and can insert at the same time. They return the same thing here, which is exactly why they're easy to confuse. Mnemonic: sp**l**ice has an extra letter because it does extra damage.
</details>

---

### Q4 — return values of mutators

What does this print?

```js
const a = [1, 2];
console.log(a.push(3));
console.log(a.concat([4]));
console.log(a);
console.log(a.pop(), a.shift(), a);
```

<details><summary>Answer</summary>

**`3`**, **`[ 1, 2, 3, 4 ]`**, **`[ 1, 2, 3 ]`**, **`3 1 [ 2 ]`** — `push` returns the new *length*, not the array or the item.

That's why `const b = a.push(x)` gives you a number and `arr = arr.push(x)` destroys your array — a classic beginner bug. `concat` is the non-mutating counterpart: it returns a new array and leaves `a` at length 3. `pop` returns the removed last element, `shift` the removed first; both mutate. Arguments evaluate left to right, so `pop()` runs before `shift()` and the final array is `[ 2 ]`.
</details>

---

### Q5 — indexing and joining

What does this print?

```js
const arr = ['a', 'b', 'c'];
console.log(arr.indexOf('b'), arr.lastIndexOf('c'), arr.at(-1));
console.log(arr.slice(-2));
console.log(arr.join('|'));
console.log(String(arr));
```

<details><summary>Answer</summary>

**`1 2 c`**, **`[ 'b', 'c' ]`**, **`a|b|c`**, **`a,b,c`** — negative indices work in `at` and `slice`, but never in bracket notation.

`arr[-1]` is `undefined` because `-1` becomes the string key `'-1'`, which is just a normal property that doesn't exist. `at(-1)` and `slice(-2)` count from the end properly. `String(arr)` calls `Array.prototype.toString`, which is `join(',')` — that's the mechanism behind `[] + {}` producing `'[object Object]'`, and why `[1,[2,3]].toString()` flattens to `'1,2,3'`.
</details>

---

### Q6 — reduce basics

What does this print?

```js
const nums = [1, 2, 3, 4];
console.log(nums.reduce((acc, n) => acc + n, 0));
console.log(nums.reduce((acc, n) => acc + n));
console.log([].reduce((acc, n) => acc + n, 0));
try {
  [].reduce((acc, n) => acc + n);
} catch (e) {
  console.log(e.constructor.name + ':', e.message);
}
```

<details><summary>Answer</summary>

**`10`, `10`, `0`**, then **`TypeError: Reduce of empty array with no initial value`** — omitting the seed is a bug waiting for an empty array.

With no initial value, `reduce` uses element 0 as the seed and starts iterating from index 1. That works for a non-empty numeric array, but on an empty array there's no seed and no element, so it throws. It also silently changes your accumulator's type when the array holds objects. Always pass the initial value — it documents the accumulator type and makes the empty case correct for free.
</details>

---

### Q7 — the default sort

What does this print?

```js
console.log([10, 9, 100, 1].sort());
console.log([10, 9, 100, 1].sort((x, y) => x - y));
```

<details><summary>Answer</summary>

**`[ 1, 10, 100, 9 ]`**, then **`[ 1, 9, 10, 100 ]`** — with no comparator, `sort` converts every element to a string and sorts lexicographically.

`'10' < '9'` because `'1'` comes before `'9'` in UTF-16 code-unit order. This is the single most common array bug in the language, and it looks correct on single-digit test data. The comparator contract: return a negative number to put `x` first, positive to put `y` first, `0` to treat them as equal — `x - y` for ascending numbers, `y - x` for descending. For strings, use `a.localeCompare(b)`.
</details>

---

### Q8 — sort mutates

What does this print?

```js
const arr = [3, 1, 2];
const sorted = arr.sort((x, y) => x - y);
console.log(sorted === arr);
console.log(arr);
const arr2 = [3, 1, 2];
console.log(arr2.toSorted((x, y) => x - y), arr2);
```

<details><summary>Answer</summary>

**`true`**, **`[ 1, 2, 3 ]`**, then **`[ 1, 2, 3 ] [ 3, 1, 2 ]`** — `sort` sorts in place and returns the *same* array reference.

So `const sorted = original.sort(...)` gives you two names for one array and you've silently reordered your caller's data — a real problem for props, cached results, and anything shared. The four mutators to watch are `sort`, `reverse`, `splice`, and `fill`. Modern JS added non-mutating twins: `toSorted`, `toReversed`, `toSpliced`, and `with` (ES2023, Node 20+). Before those, `[...arr].sort(...)` is the idiom.
</details>

---

### Q9 — object identity

What does this print?

```js
const a = { x: 1 };
const b = { x: 1 };
console.log(a === b);
console.log(a.x === b.x);
const c = a;
c.x = 99;
console.log(a.x);
console.log(JSON.stringify(a) === JSON.stringify(b));
```

<details><summary>Answer</summary>

**`false`, `true`, `99`, `false`** — objects compare by reference, primitives by value.

`a` and `b` are two separate allocations with identical contents, so `===` is `false` — there is no built-in structural equality in JavaScript. `c = a` copies the *reference*, so `c` and `a` are the same object and the mutation is visible through both names. The last line is `false` because `a.x` is now `99`; note also that `JSON.stringify` comparison is a fragile equality hack anyway, since key order matters and `undefined` values vanish.
</details>

---

### Q10 — Object.assign is shallow

What does this print?

```js
const target = { a: 1, nested: { deep: 1 } };
const copy = Object.assign({}, target);
copy.a = 2;
copy.nested.deep = 2;
console.log(target.a, target.nested.deep);
```

<details><summary>Answer</summary>

**`1 2`** — `Object.assign` copies property values one level deep, and the value of `nested` is a shared reference.

This is identical in behavior to `{ ...target }`; spread is just nicer syntax for the common case. Two differences worth knowing: `Object.assign` mutates its first argument (which is why you pass `{}`), and it triggers setters on the target while spread defines plain data properties. For a genuine deep copy use `structuredClone(target)` — it handles cycles, Dates, Maps, and Sets, unlike the `JSON.parse(JSON.stringify(x))` trick.
</details>

---

### Q11 — freeze is shallow too

What does this print?

```js
const frozen = Object.freeze({ a: 1, nested: { b: 1 } });
frozen.a = 2;
frozen.nested.b = 2;
console.log(frozen.a, frozen.nested.b);
console.log(Object.isFrozen(frozen), Object.isFrozen(frozen.nested));
```

<details><summary>Answer</summary>

**`1 2`**, then **`true false`** — freezing blocks writes to the object's own properties only; nested objects are untouched.

`frozen.a = 2` fails *silently* in sloppy mode and throws `TypeError` in strict mode — another reason to write modules. The nested object was never frozen, so `frozen.nested.b = 2` succeeds. A "deep freeze" requires walking the object graph and freezing recursively (watching out for cycles). Same shallow-versus-deep lesson as spread, `Object.assign`, and `structuredClone` — it's the theme of this whole module.
</details>

---

### Q12 — enumerating and omitting

What does this print?

```js
const user = { id: 1, name: 'Ada', pwd: 'secret' };
console.log(Object.keys(user));
console.log(Object.entries(user).map(([k]) => k));
console.log(Object.values(user).length);
const { pwd, ...safe } = user;
console.log(safe);
```

<details><summary>Answer</summary>

**`[ 'id', 'name', 'pwd' ]`**, the same array again, **`3`**, then **`{ id: 1, name: 'Ada' }`** — rest in destructuring is the clean way to omit a key.

`Object.keys/values/entries` all walk *own, enumerable, string-keyed* properties — inherited and Symbol-keyed ones are excluded. `entries` gives `[key, value]` pairs, which pairs perfectly with array destructuring in the callback. Object rest builds a new object containing every own enumerable property except the ones already named, so `{ pwd, ...safe }` is the idiomatic "everything but the password". Insertion order is preserved for string keys — except integer-like keys, which always sort numerically first.
</details>

---

### Q13 — what JSON drops

What does this print?

```js
const obj = { a: 1, b: undefined, c: function () {}, d: NaN, e: Infinity };
console.log(JSON.stringify(obj));
console.log(JSON.parse(JSON.stringify(obj)));
```

<details><summary>Answer</summary>

**`{"a":1,"d":null,"e":null}`**, then **`{ a: 1, d: null, e: null }`** — JSON has no representation for `undefined`, functions, `NaN`, or `Infinity`.

Object properties holding `undefined` or a function are omitted from the output entirely — the key disappears, it doesn't become `null`. `NaN` and `Infinity` aren't valid JSON numbers, so they're serialized as `null`, which means a round trip silently corrupts them into a value that looks intentional. Symbols are dropped too. This is why `JSON.parse(JSON.stringify(x))` is a bad deep-clone: it's lossy in five different ways.
</details>

---

### Q14 — JSON and array holes

What does this print?

```js
const arr = [1, undefined, function () {}, 3];
console.log(JSON.stringify(arr));
```

<details><summary>Answer</summary>

**`[1,null,null,3]`** — inside an array, the unserializable values become `null` instead of vanishing.

An array has to keep its length and indices meaningful, so dropping an element isn't an option; the spec substitutes `null`. Objects have no such constraint, so there the same values are omitted (Q13). Same input types, two different failure modes depending on the container — worth remembering when an API contract says "array of items" and you get nulls in production.
</details>

---

### Q15 — Dates through JSON

What does this print?

```js
const obj = { when: new Date('2020-01-02T03:04:05Z'), n: 1 };
const round = JSON.parse(JSON.stringify(obj));
console.log(typeof round.when, round.when);
```

<details><summary>Answer</summary>

**`string 2020-01-02T03:04:05.000Z`** — `Date` has a `toJSON` method, and `JSON.parse` has no idea how to reverse it.

`JSON.stringify` checks every value for a `toJSON()` method and uses its result; `Date.prototype.toJSON` returns the ISO-8601 string. Parsing back gives you a plain string, so `round.when.getTime()` throws `TypeError: not a function`. Any class instance suffers the same fate — a round trip returns plain objects with no prototype, no methods, no `instanceof`. Use a reviver function (`JSON.parse(s, reviver)`) or `structuredClone` to preserve Dates.
</details>

---

### Q16 — circular structures

What does this print?

```js
const o = { a: 1 };
o.self = o;
try {
  JSON.stringify(o);
} catch (e) {
  console.log(e.constructor.name);
}
```

<details><summary>Answer</summary>

**`TypeError`** — the full message is "Converting circular structure to JSON".

`JSON.stringify` walks the object graph depth-first with no cycle detection beyond throwing when it revisits an ancestor. Cycles show up constantly in real data: DOM nodes, parent/child trees, ORM entities with back-references, Node's `req`/`res` pair. `structuredClone` handles cycles correctly, and Node's `util.inspect` (what `console.log` uses) prints `[Circular *1]` instead of exploding.
</details>

---

### Q17 — includes with objects

What does this print?

```js
const list = [{ id: 1 }, { id: 2 }];
console.log(list.includes({ id: 1 }));
console.log(list.indexOf(list[0]));
console.log(list.some((o) => o.id === 1));
```

<details><summary>Answer</summary>

**`false`, `0`, `true`** — `includes` and `indexOf` compare by identity, not by content.

The object literal in the first line is a brand new allocation that happens to look the same, so no element matches. `indexOf(list[0])` passes the *same reference* and finds it at index 0. When you need content matching, you must supply the predicate yourself with `some`, `find`, or `findIndex`. The only difference between `includes` and `indexOf` here is `NaN` handling (SameValueZero vs strict equality) — neither does structural comparison.
</details>

---

### Q18 — flat and flatMap

What does this print?

```js
const nested = [1, [2, [3, [4]]]];
console.log(nested.flat());
console.log(nested.flat(2));
console.log(nested.flat(Infinity));
console.log([1, 2].flatMap((n) => [n, n * 10]));
```

<details><summary>Answer</summary>

**`[ 1, 2, [ 3, [ 4 ] ] ]`**, **`[ 1, 2, 3, [ 4 ] ]`**, **`[ 1, 2, 3, 4 ]`**, **`[ 1, 10, 2, 20 ]`** — `flat` defaults to depth 1.

Pass `Infinity` to flatten fully when depth is unknown. `flatMap` is `map` followed by a single-level `flat`, and it's the idiomatic way to do "map, but sometimes zero or many results": return `[]` from the callback to drop an item, return several to expand it. `flat` also removes holes from sparse arrays as a side effect.
</details>

---

### Q19 — length is writable

What does this print?

```js
const arr = [1, 2, 3];
arr.length = 1;
console.log(arr);
arr[5] = 'x';
console.log(arr, arr.length);
console.log(arr[2]);
```

<details><summary>Answer</summary>

**`[ 1 ]`**, then **`[ 1, <4 empty items>, 'x' ] 6`**, then **`undefined`** — `length` is a real, writable property, and writing past the end creates a sparse array.

Assigning a smaller `length` truncates destructively; assigning a larger one just pads with holes. Setting index 5 on a length-1 array sets `length` to 6 and leaves indices 1–4 as *holes* — not `undefined` values, actual missing properties. Reading a hole gives `undefined`, which makes them nearly invisible until an iteration method behaves oddly. `arr.length = 0` is an old idiom for emptying an array in place.
</details>

---

### Q20 — delete on an array

What does this print?

```js
const arr = [1, 2, 3];
delete arr[1];
console.log(arr, arr.length);
console.log(arr.filter(Boolean));
console.log(1 in arr);
```

<details><summary>Answer</summary>

**`[ 1, <1 empty item>, 3 ] 3`**, **`[ 1, 3 ]`**, **`false`** — `delete` removes the property but never reindexes or changes `length`.

Arrays are objects with numeric string keys, and `delete` does what it does on any object: removes the key. That leaves a hole and a length that no longer matches the element count. `filter`, `map`, and `forEach` *skip* holes (note `filter` returned two items, not three), while `for...of`, spread, and `Array.from` treat them as `undefined` — so different iteration styles disagree about your data. Use `splice(1, 1)` to actually remove an element.
</details>

---

### Q21 — building arrays of N

What does this print?

```js
console.log(new Array(3));
console.log(new Array(3).map(() => 0));
console.log(Array.from({ length: 3 }, () => 0));
console.log(new Array(3).fill(0));
console.log(Array.of(3));
```

<details><summary>Answer</summary>

**`[ <3 empty items> ]`**, **`[ <3 empty items> ]`**, **`[ 0, 0, 0 ]`**, **`[ 0, 0, 0 ]`**, **`[ 3 ]`** — `map` skips holes, so it can't initialize an empty array.

`new Array(3)` creates length 3 with no elements at all, and `map` visits only *present* indices — so it returns another array of three holes and your callback never runs. `fill` and `Array.from` both write real values. `Array.of(3)` exists precisely because `Array(3)` is ambiguous: one numeric argument means "length", any other argument list means "elements". The idiom for "N initialized slots" is `Array.from({ length: n }, (_, i) => i)`.
</details>

---

### Q22 — reduce as group-by

What does this print?

```js
const rows = [
  { team: 'a', pts: 1 },
  { team: 'b', pts: 2 },
  { team: 'a', pts: 3 },
];
const byTeam = rows.reduce((acc, r) => {
  (acc[r.team] ||= []).push(r.pts);
  return acc;
}, {});
console.log(byTeam);
```

<details><summary>Answer</summary>

**`{ a: [ 1, 3 ], b: [ 2 ] }`** — the accumulator is one object threaded through every iteration, mutated in place.

`||=` (logical OR assignment) assigns only when the left side is falsy, so the first time a team appears it gets a new array; after that the existing one is reused. The expression evaluates to the array either way, so `.push` chains off it. This is the canonical `reduce` shape: seed an accumulator, mutate it, **return it every time**. Modern alternative: `Object.groupBy(rows, (r) => r.team)` (ES2024) does exactly this.
</details>

---

### Q23 — the forgotten return

What does this print?

```js
const rows = [{ n: 1 }, { n: 2 }];
const bad = rows.reduce((acc, r) => {
  acc.total += r.n;
}, { total: 0 });
console.log(bad);
```

<details><summary>Answer</summary>

**`TypeError: Cannot read properties of undefined (reading 'total')`** — the callback has a block body with no `return`, so the accumulator becomes `undefined` after the first pass.

Iteration 1 gets the seed, adds `1`, and returns `undefined` implicitly. Iteration 2 receives that `undefined` as `acc` and crashes on `acc.total`. With a two-element array you get a crash; with a *one*-element array you'd get a silent `undefined` and no error at all, which is worse. The fix is `return acc;` — or use a concise arrow body: `(acc, r) => ({ ...acc, total: acc.total + r.n })`.
</details>

---

### Q24 — sort stability

What does this print?

```js
const people = [
  { name: 'B', age: 30 },
  { name: 'A', age: 30 },
  { name: 'C', age: 25 },
];
console.log(people.sort((x, y) => x.age - y.age).map((p) => p.name).join(''));
```

<details><summary>Answer</summary>

**`CBA`** — `sort` is guaranteed stable, so equal-age elements keep their original relative order.

`C` moves to the front because 25 < 30. `B` and `A` compare as equal (`0`), and stability means the engine must preserve the input order — `B` was before `A`, so it stays before `A`. Since ES2019 this is required by the spec, not just a V8 implementation detail. Stability is what makes multi-key sorting work by sorting on the least significant key first; if you want alphabetical tie-breaking here, put it in the comparator: `x.age - y.age || x.name.localeCompare(y.name)`.
</details>

---

### Q25 — destructuring odds and ends

What does this print?

```js
let a = 1;
let b = 2;
[a, b] = [b, a];
console.log(a, b);
const { length } = 'hello';
console.log(length);
const [, second] = [10, 20, 30];
console.log(second);
```

<details><summary>Answer</summary>

**`2 1`**, **`5`**, **`20`** — the right-hand side is fully evaluated before any assignment happens, which is what makes the swap work.

`[b, a]` builds a temporary array `[2, 1]` first, then destructures it into `a` and `b`, so no third variable is needed. Object destructuring works on primitives too: `'hello'` is boxed into a temporary `String` wrapper long enough to read `length`. The elision (the bare comma) skips index 0 — useful for things like `const [, ...rest] = args`. Note that a statement starting with `[` needs a semicolon on the previous line, or ASI will glue them together.
</details>

---

### Q26 — own versus inherited

What does this print?

```js
const base = { greet() { return 'hi'; } };
const child = Object.create(base);
child.own = 1;
console.log(Object.keys(child));
console.log(child.greet());
console.log('greet' in child, child.hasOwnProperty('greet'));
```

<details><summary>Answer</summary>

**`[ 'own' ]`**, **`hi`**, **`true false`** — `Object.keys` lists own properties; the `in` operator walks the whole prototype chain.

`Object.create(base)` makes `base` the prototype of `child`, so `greet` is reachable by lookup but is not an own property. That's the distinction the three lines are testing: `Object.keys`/`entries`/`values` and spread copy **own enumerable** properties only, `in` and normal property access follow the chain, and `hasOwnProperty` asks specifically about own. Prefer `Object.hasOwn(child, 'greet')` (ES2022) — it works even on objects created with `Object.create(null)`, which have no `hasOwnProperty` method at all.
</details>

---

### Q27 — the non-mutating quartet

What does this print?

```js
const arr = [3, 1, 2];
console.log(arr.toSorted(), arr.toReversed(), arr);
console.log(arr.with(0, 9), arr.toSpliced(1, 1, 'x'), arr);
```

<details><summary>Answer</summary>

**`[ 1, 2, 3 ] [ 2, 1, 3 ] [ 3, 1, 2 ]`**, then **`[ 9, 1, 2 ] [ 3, 'x', 2 ] [ 3, 1, 2 ]`** — four ES2023 methods that do exactly what their mutating twins do, on a copy.

`toSorted`, `toReversed`, and `toSpliced` mirror `sort`, `reverse`, and `splice`; `with(index, value)` is the copying form of `arr[i] = v`, which had no non-mutating twin at all before. The original is untouched every time, which is what makes them safe in a `reduce`, in React state, and on anything shared. They are Node 20+ and 2023-era browsers, so check your baseline — the fallback is still `[...arr].sort(...)`. Note `toSorted()` with no comparator has the same lexicographic bug as `sort()`; copying fixed the mutation, not the comparison.
</details>

---

### Q28 — `with` at the edges

What does this print?

```js
const arr = ['a', 'b', 'c'];
console.log(arr.with(-1, 'z'));
try {
  arr.with(3, 'z');
} catch (e) {
  console.log(e.constructor.name + ': ' + e.message);
}
const sparse = [1, , 3];
console.log(sparse.toSorted(), sparse.with(0, 0));
```

<details><summary>Answer</summary>

**`[ 'a', 'b', 'z' ]`**, **`RangeError: Invalid index : 3`**, **`[ 1, 3, undefined ] [ 0, undefined, 3 ]`** — `with` counts negatives from the end and *throws* on an out-of-range index.

That throw is the deliberate difference from `arr[3] = 'z'`, which silently grows the array; `with` refuses to invent a slot. The sparse cases show the other half of the design: all four copying methods materialize holes into real `undefined` elements, because the copy is built by reading every index from `0` to `length - 1`. So `toSorted` sorts `undefined` to the end as a value, and the result is a dense array — a quiet fix for the hole problems in Q19–Q21.
</details>

---

### Q29 — searching from the right

What does this print?

```js
const nums = [1, 4, 9, 4];
console.log(nums.findLast((n) => n === 4), nums.findLastIndex((n) => n === 4));
console.log(nums.findLast((n) => n > 100), nums.findLastIndex((n) => n > 100));
console.log(nums.at(-2), nums.at(9));
```

<details><summary>Answer</summary>

**`4 3`**, **`undefined -1`**, **`9 undefined`** — `findLast`/`findLastIndex` are `find`/`findIndex` walking backwards, with the same "not found" sentinels.

They exist because the reverse-then-find workaround (`[...arr].reverse().findIndex(...)`) allocates a copy *and* gives you an index measured from the wrong end, which is a reliable source of off-by-one bugs. Reach for them whenever "most recent" is the question: the last log line matching a pattern, the latest revision, the newest event before a cutoff. `at` rounds out the family — negative indices from the end, `undefined` past the end, never a wraparound.
</details>

---

### Q30 — who sees a hole

What does this print?

```js
const sparse = [1, , 3];
const seen = [];
sparse.forEach((v, i) => seen.push(i));
console.log(seen, sparse.map(() => 'x'), sparse.filter(() => true));
console.log([...sparse], Object.keys(sparse), sparse.join('-'));
console.log(sparse.length, 1 in sparse);
```

<details><summary>Answer</summary>

**`[ 0, 2 ] [ 'x', <1 empty item>, 'x' ] [ 1, 3 ]`**, **`[ 1, undefined, 3 ] [ '0', '2' ] 1--3`**, **`3 false`** — the old iteration methods skip holes; the iterator-based ones invent `undefined`.

`forEach`, `map`, `filter`, `some`, `every`, and `reduce` all check `HasProperty` first and skip missing indices — so `map` preserves the hole in its output without ever calling your callback for it, and `filter` returns two elements from a length-3 array. Spread, `for...of`, and `Array.from` go through the array *iterator*, which reads every index from `0` to `length - 1` and turns holes into `undefined`. `join` treats a hole like `null`/`undefined` and emits an empty string. Three different answers to "what is at index 1" in one snippet — which is the argument for never creating holes in the first place.
</details>

---

### Q31 — sort exiles the missing

What does this print?

```js
const arr = [3, undefined, 1, , 2];
console.log(arr.sort((a, b) => a - b));
console.log(arr.length, 4 in arr);
```

<details><summary>Answer</summary>

**`[ 1, 2, 3, undefined, <1 empty item> ]`**, then **`5 false`** — `sort` moves `undefined` values after everything else and holes after those, and your comparator is never consulted about either.

The spec makes this special case explicit precisely because `undefined - anything` is `NaN`, and a comparator returning `NaN` would produce garbage. So sorting quietly succeeds on data you'd rather it complained about. The consequence for real code: a missing field does not raise an error and does not sort to a predictable place *by your rules* — it just lands at the end. Filter or default the values before sorting if their position matters.
</details>

---

### Q32 — keyBy loses rows

What does this print?

```js
const rows = [{ id: 'a', n: 1 }, { id: 'b', n: 2 }, { id: 'a', n: 3 }];
const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
console.log(byId);
console.log(Object.keys(byId).length, rows.length);
```

<details><summary>Answer</summary>

**`{ a: { id: 'a', n: 3 }, b: { id: 'b', n: 2 } }`**, then **`2 3`** — `fromEntries` assigns left to right, so a duplicate key silently overwrites and one row vanishes.

This is the standard `keyBy` idiom and it is correct only when the key is genuinely unique. When it isn't — a "unique" email that isn't, a join key at the wrong grain — you lose rows with no error, and the loss is invisible until someone counts. Assert it (`if (Object.keys(byId).length !== rows.length) throw ...`) or group instead of keying. Note `new Map(rows.map(...))` behaves identically; the fix is the check, not the container.
</details>

---

### Q33 — groupBy

What does this print?

```js
const rows = [{ t: 'a', n: 1 }, { t: 'b', n: 2 }, { t: 'a', n: 3 }];
const g = Object.groupBy(rows, (r) => r.t);
console.log(Object.keys(g), g.a.length, Object.getPrototypeOf(g));
const m = Map.groupBy(rows, (r) => r.n > 1);
console.log(m.size, m.get(true).length, m.get(false).length);
```

<details><summary>Answer</summary>

**`[ 'a', 'b' ] 2 null`**, then **`2 2 1`** — `Object.groupBy` returns a **null-prototype** object, and `Map.groupBy` keys by value instead of by string.

This is Q22's `reduce` boilerplate as a built-in (ES2024, Node 21+). The null prototype is deliberate: grouping keys usually come from data, and a group called `__proto__` or `constructor` would otherwise collide with the prototype chain — so you can index it safely, but `g.hasOwnProperty` does not exist. Use `Map.groupBy` when the key is a boolean, a number, or an object, since a plain object would stringify all three. Both preserve input order inside each group.
</details>

---

### Q34 — the naive deep merge

What does this print?

```js
function merge(target, src) {
  for (const k in src) {
    if (src[k] && typeof src[k] === 'object') target[k] = merge(target[k] ?? {}, src[k]);
    else target[k] = src[k];
  }
  return target;
}
const payload = JSON.parse('{"__proto__": {"admin": true}}');
merge({}, payload);
console.log({}.admin, 'admin' in {});
```

<details><summary>Answer</summary>

**`true true`** — a brand new empty object now has an `admin` property, because the merge wrote straight into `Object.prototype`.

Follow the poisoned line: `k` is `'__proto__'`, so `target[k]` *reads* the target's prototype — `Object.prototype` — and `?? {}` doesn't fire because it isn't nullish. The recursive call then merges `{ admin: true }` into `Object.prototype` itself, and every object in the program inherits it. That's prototype pollution, and it has produced real CVEs in lodash, jQuery, and half the config libraries on npm. Three fixes, use all of them: skip `__proto__`, `constructor`, and `prototype` by name; guard with `Object.hasOwn(src, k)` instead of `for...in`; and build into `Object.create(null)`.
</details>

---

### Q35 — the parser's asymmetry

What does this print?

```js
const fromJson = JSON.parse('{"__proto__": {"x": 1}}');
const literal = { __proto__: { x: 1 } };
console.log(Object.hasOwn(fromJson, '__proto__'), Object.hasOwn(literal, '__proto__'));
console.log(fromJson.x, literal.x);
console.log(Object.getPrototypeOf(fromJson) === Object.prototype);
```

<details><summary>Answer</summary>

**`true false`**, **`undefined 1`**, **`true`** — in an object *literal* `__proto__:` sets the prototype, but `JSON.parse` creates an ordinary own property with that name.

The literal form is special syntax defined by the spec, so `literal` genuinely inherits from `{ x: 1 }` and has no own key. `JSON.parse` deliberately does not honour it — parsed data must never be able to change an object's prototype — so you get a normal data property that shadows nothing. That is why the dangerous value in Q34 sits there quietly until some *other* code copies it with `obj[k] = v`, which does trigger the setter. The safe read is `Object.hasOwn`; the safe write is `Object.defineProperty` or a null-prototype target.
</details>

---

### Q36 — copies run your accessors

What does this print?

```js
let reads = 0;
const src = { get expensive() { reads += 1; return 42; } };
const copy = { ...src };
console.log(reads, copy.expensive, reads);
let writes = 0;
const target = { set v(n) { writes += 1; } };
Object.assign(target, { v: 1 });
console.log(writes, target.v);
```

<details><summary>Answer</summary>

**`1 42 1`**, then **`1 undefined`** — spread *invokes* getters on the source and `Object.assign` *invokes* setters on the target.

Spreading calls `[[Get]]` once per property and stores the resulting value as a plain data property, so laziness is destroyed and any side effect fires at copy time — but only once, which is why the third number is still `1`. `Object.assign` uses `[[Set]]` on the target, so an existing setter runs and can transform, validate, or (as here) discard the value entirely; `target.v` is `undefined` because that property has no getter. If you need to copy *descriptors* rather than values, the tool is `Object.defineProperties(dst, Object.getOwnPropertyDescriptors(src))`.
</details>

---

### Q37 — an inner join, in JavaScript

What does this print?

```js
const users = [{ id: 1, name: 'ada' }, { id: 2, name: 'bob' }];
const orders = [{ uid: 1, total: 5 }, { uid: 3, total: 7 }, { uid: 1, total: 2 }];
const byId = new Map(users.map((u) => [u.id, u]));
const joined = orders.flatMap((o) =>
  byId.has(o.uid) ? [byId.get(o.uid).name + ':' + o.total] : []
);
console.log(joined);
console.log(orders.length, joined.length);
```

<details><summary>Answer</summary>

**`[ 'ada:5', 'ada:2' ]`**, then **`3 2`** — an inner join drops the rows whose key has no match, and the output count is not the input count.

This is `SELECT ... FROM orders JOIN users ON users.id = orders.uid` written by hand: index one side into a `Map`, then walk the other. The order for user 3 disappears because there is no such user — exactly what an inner join does, and exactly the "our revenue report is short" bug when the missing side was supposed to be optional. `flatMap` returning `[]` or `[row]` is the idiomatic filter-and-map in one pass. Building the `Map` first is what keeps this O(n + m) instead of the O(n·m) `find`-inside-a-loop version.
</details>

---

### Q38 — a left join and an anti-join

What does this print?

```js
const users = [{ id: 1, name: 'ada' }, { id: 2, name: 'bob' }];
const orders = [{ uid: 1, total: 5 }];
const byUser = new Map(users.map((u) => [u.id, []]));
for (const o of orders) byUser.get(o.uid)?.push(o);
const left = users.map((u) => ({ name: u.name, orders: byUser.get(u.id).length }));
console.log(left);
console.log(left.filter((r) => r.orders === 0).map((r) => r.name));
```

<details><summary>Answer</summary>

**`[ { name: 'ada', orders: 1 }, { name: 'bob', orders: 0 } ]`**, then **`[ 'bob' ]`** — seeding the index with an empty bucket per user is what makes it a *left* join.

Because every user gets a `[]` up front, a user with no orders survives the report with a count of `0` instead of vanishing. That seeding step is the whole difference from Q37, and it's the direct analogue of `LEFT JOIN` versus `JOIN`. Filtering the result for the empty buckets gives you an **anti-join** — "customers who never ordered", "products never sold" — which in SQL is `LEFT JOIN ... WHERE o.id IS NULL`. The `?.push` matters too: an order whose `uid` isn't in the index would otherwise crash.
</details>

---

### Q39 — the fan-out that doubles your money

What does this print?

```js
const orders = [{ id: 1, total: 100 }, { id: 2, total: 50 }];
const items = [{ oid: 1, sku: 'a' }, { oid: 1, sku: 'b' }, { oid: 2, sku: 'c' }];
const rows = items.map((it) => ({ ...it, total: orders.find((o) => o.id === it.oid).total }));
console.log(rows.length, rows.reduce((s, r) => s + r.total, 0));
const seen = new Set();
console.log(rows.reduce((s, r) => (seen.has(r.oid) ? s : (seen.add(r.oid), s + r.total)), 0));
```

<details><summary>Answer</summary>

**`3 250`**, then **`150`** — joining a parent to its children multiplies the parent row, so summing a parent's column counts it once per child.

Order 1 has two line items, so its 100 appears twice and the total reads 250 against a real revenue of 150. Nothing errors; the number is just wrong, and it's wrong in the direction that makes a dashboard look good. The rule is "know the grain of your result set": after the join, one row is one *line item*, not one order. Aggregate parent-level numbers before you join, or de-duplicate by the parent key as the second line does — the SQL spelling is `COUNT(DISTINCT o.id)` and summing at the grain the money actually lives at.
</details>

---

### Q40 — normalizing shares references

What does this print?

```js
const feed = [
  { id: 'p1', author: { id: 'u1', name: 'ada' } },
  { id: 'p2', author: { id: 'u1', name: 'ada' } },
];
const users = {};
const posts = feed.map((p) => {
  users[p.author.id] = p.author;
  return { id: p.id, author: p.author.id };
});
console.log(posts, Object.keys(users).length);
users.u1.name = 'ADA';
console.log(feed[0].author.name, feed[1].author.name);
```

<details><summary>Answer</summary>

**`[ { id: 'p1', author: 'u1' }, { id: 'p2', author: 'u1' } ] 1`**, then **`ada ADA`** — normalizing replaced two nested copies with one id, but the entity table still points at whichever object was stored *last*.

The two `author` objects in the payload look identical and are two separate allocations, so the second assignment to `users.u1` overwrites the first. Mutating the entity therefore changes `feed[1]` and leaves `feed[0]` on its now-orphaned copy — the two "same" users have silently drifted apart. That inconsistency is precisely what normalization is supposed to eliminate, and you only actually get it if you stop reading the nested copies afterwards. Clone on the way in (`{ ...p.author }`) if the source data must stay independent.
</details>

---

### Q41 — deep merge meets an array

What does this print?

```js
function merge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] = v && typeof v === 'object' ? merge(out[k] ?? {}, v) : v;
  }
  return out;
}
console.log(merge({ tags: ['a', 'b'] }, { tags: ['z'] }));
console.log(merge({ a: { b: 1 } }, { a: { c: 2 } }));
```

<details><summary>Answer</summary>

**`{ tags: { '0': 'z', '1': 'b' } }`**, then **`{ a: { b: 1, c: 2 } }`** — `typeof []` is `'object'`, so the array went down the recursive path and came back as a plain object with numeric keys.

Merging `['z']` into `['a','b']` index by index gives you index `0` overwritten, index `1` surviving from the old value, and — because `{ ...array }` produces an object literal — no array-ness at all. Now `.map` is not a function and `Array.isArray` is `false`, several layers away from the merge. Every real deep-merge implementation has to decide an array *policy* first: replace wholesale (usually right for config), concatenate, or merge by a key. Branch on `Array.isArray(v)` before the object branch, and document which you chose.
</details>
