# Array methods

Every array method you actually use, what it returns, whether it mutates, and 15 copy-paste recipes.

## Top of mind

| Question | Answer |
| --- | --- |
| Last element? | `[1,2,3].at(-1)` → `3`. On empty: `[].at(-1)` → `undefined` |
| Why is my number sort wrong? | Default `sort` is a **string** sort. `[10,9,1].sort()` → `[1,10,9]` |
| Sort without wrecking the original? | `toSorted` / `toReversed` / `toSpliced` / `with` — all copy (ES2023) |
| Which ones mutate? | `push pop shift unshift splice sort reverse fill copyWithin` — nothing else |
| Group rows by a field? | `Object.groupBy(rows, r => r.type)` → `{ a: [...], b: [...] }` (ES2024) |

## Master table

### Transform

| Method | Returns | Mutates? | Example |
| --- | --- | --- | --- |
| `map(fn, thisArg?)` | new array, same length | no | `[1,2,3].map(n => n * 2)` → `[2,4,6]` |
| `filter(fn, thisArg?)` | new array, kept elements | no | `[1,2,3].filter(n => n > 1)` → `[2,3]` |
| `flatMap(fn, thisArg?)` | new array, flattened 1 level | no | `[1,2,3].flatMap(n => n === 2 ? [] : n)` → `[1,3]` |
| `flat(depth = 1)` | new array | no | `[1,[2,[3]]].flat()` → `[1,2,[3]]` |
| `flat(Infinity)` | fully flattened copy | no | `[1,[2,[3,[4]]]].flat(Infinity)` → `[1,2,3,4]` |
| `fill(value, start?, end?)` | **the same array** | yes | `[1,2,3,4].fill(9, 1, 3)` → `[1,9,9,4]` |
| `copyWithin(target, start?, end?)` | **the same array** | yes | `[1,2,3,4,5].copyWithin(0, 3)` → `[4,5,3,4,5]` |
| `Array.from(iterable, mapFn?, thisArg?)` | new array | no | `Array.from('abc')` → `['a','b','c']` |
| `Array.from({ length: n }, fn)` | new array of `n` | no | `Array.from({length:3}, (_, i) => i * 2)` → `[0,2,4]` |
| `Array.of(...items)` | new array of the args | no | `Array.of(7)` → `[7]` |
| `Array(n)` | array of `n` **holes** | — | `Array(3).length` → `3`, but every slot is a hole |

**Gotcha.** `Array(7)` is 7 holes, `Array.of(7)` is `[7]`. `Array.from({length:3})` → `[undefined, undefined, undefined]`
(real slots, safe to `map`); `Array(3).map(fn)` never calls `fn`.

**Holes.** `map` preserves them (`[1,,3].map(x => x*2)` leaves index 1 a hole); `filter`, `flat` and
`flatMap` drop them. Avoid holes entirely — use `fill` or `Array.from` to build.

### Search / access

| Method | Returns | Mutates? | Example |
| --- | --- | --- | --- |
| `at(i)` | element or `undefined`; negative = from end | no | `[1,2,3].at(-1)` → `3` |
| `indexOf(v, from?)` | index or `-1`, uses `===` | no | `[1,2,3].indexOf(4)` → `-1` |
| `lastIndexOf(v, from?)` | last index or `-1` | no | `[1,2,1].lastIndexOf(1)` → `2` |
| `includes(v, from?)` | boolean, uses SameValueZero | no | `[1,2,3].includes(1, 1)` → `false` |
| `find(fn, thisArg?)` | first match or `undefined` | no | `[1,2,3].find(n => n > 1)` → `2` |
| `findIndex(fn, thisArg?)` | index or `-1` | no | `[1,2,3].findIndex(n => n > 1)` → `1` |
| `findLast(fn, thisArg?)` | last match or `undefined` | no | `[1,2,3].findLast(n => n < 3)` → `2` |
| `findLastIndex(fn, thisArg?)` | last index or `-1` | no | `[1,2,3].findLastIndex(n => n < 3)` → `1` |

**Gotcha.** `indexOf` cannot find `NaN` (`[NaN].indexOf(NaN)` → `-1`) but `includes` can
(`[NaN].includes(NaN)` → `true`). Use `includes` for membership, `indexOf` only when you need the position.

### Test

| Method | Returns | Mutates? | Example |
| --- | --- | --- | --- |
| `every(fn, thisArg?)` | `true` if all pass, short-circuits | no | `[1,2].every(n => n > 0)` → `true` |
| `some(fn, thisArg?)` | `true` if any passes, short-circuits | no | `[1,2].some(n => n > 1)` → `true` |
| `Array.isArray(v)` | boolean, works across realms | no | `Array.isArray('ab')` → `false` |

**Gotcha.** Vacuous truth: `[].every(x => false)` → `true`, `[].some(x => true)` → `false`.
Guard on `arr.length` first if empty must fail.

### Order

| Method | Returns | Mutates? | Example |
| --- | --- | --- | --- |
| `sort(cmp?)` | the **same** array, sorted | yes | `[10,9,1].sort((a,b) => a - b)` → `[1,9,10]` |
| `toSorted(cmp?)` | new sorted array (ES2023) | no | `[3,1].toSorted()` → `[1,3]`, original still `[3,1]` |
| `reverse()` | the **same** array, reversed | yes | `[1,2].reverse()` → `[2,1]` |
| `toReversed()` | new reversed array (ES2023) | no | `[1,2,3].toReversed()` → `[3,2,1]` |
| `splice(start, deleteCount?, ...items)` | array of **removed** items | yes | `a=[1,2,3,4]; a.splice(1,2,'x')` → `[2,3]`, and `a` → `[1,'x',4]` |
| `toSpliced(start, deleteCount?, ...items)` | new array (ES2023) | no | `[1,2,3,4].toSpliced(1,2,'a')` → `[1,'a',4]` |
| `with(index, value)` | copy with one slot replaced (ES2023) | no | `[1,2,3].with(-1, 9)` → `[1,2,9]` |
| `push(...items)` | **new length** | yes | `a=[1]; a.push(2,3)` → `3`, `a` → `[1,2,3]` |
| `pop()` | removed last, or `undefined` | yes | `[].pop()` → `undefined` |
| `shift()` | removed first, or `undefined` | yes | `a=[1,2]; a.shift()` → `1`, `a` → `[2]` |
| `unshift(...items)` | **new length** | yes | `a=[1]; a.unshift(0)` → `2`, `a` → `[0,1]` |

**Gotcha.** `push`/`unshift` return the new *length*, not the array — `const b = a.push(x)` gives you a number.
`with(i, v)` throws `RangeError` if `i` is out of range: `[1].with(5, 0)` → `RangeError: Invalid index : 5`.
`splice` with a negative start counts from the end: `[1,2,3].splice(-1)` → removes `[3]`.

### Combine / reduce

| Method | Returns | Mutates? | Example |
| --- | --- | --- | --- |
| `concat(...items)` | new array; array args spread one level | no | `[1,[2,3]].concat(4,[5,[6]])` → `[1,[2,3],4,5,[6]]` |
| `join(sep = ',')` | string; `null`/`undefined` become `''` | no | `[1,null,undefined,2].join('-')` → `'1---2'` |
| `slice(start?, end?)` | shallow copy of a range | no | `[1,2,3,4,5].slice(-2)` → `[4,5]` |
| `reduce(fn, init?)` | accumulated value | no | `[1,2,3].reduce((a,b) => a + b, 0)` → `6` |
| `reduceRight(fn, init?)` | same, right to left | no | `['a','b','c'].reduceRight((a,x) => a + x)` → `'cba'` |
| `forEach(fn, thisArg?)` | `undefined` — always | no | `[1].forEach(x => x)` → `undefined` |
| `entries()` | iterator of `[index, value]` | no | `[...[10,20].entries()]` → `[[0,10],[1,20]]` |
| `keys()` | iterator of indices | no | `[...['a','b'].keys()]` → `[0,1]` |
| `values()` | iterator of values | no | `[...[1,2].values()]` → `[1,2]` |
| `Object.groupBy(items, fn)` | null-prototype object of arrays (ES2024) | no | `Object.groupBy([1,2,3,4], n => n%2 ? 'odd' : 'even')` → `{odd:[1,3], even:[2,4]}` |
| `Map.groupBy(items, fn)` | `Map`, any key type (ES2024) | no | `[...Map.groupBy([1,2,3], n => n % 2)]` → `[[1,[1,3]],[0,[2]]]` |

**Gotcha.** `[].reduce((a,b) => a+b)` throws `TypeError: Reduce of empty array with no initial value`.
Always pass the initial value. `Object.groupBy` keys are coerced to strings and its result has
**no prototype** — `result.hasOwnProperty` does not exist; use `Object.hasOwn(result, k)`.

## Semantics you must not guess

### Mutating vs copying

| Mutates | Copy equivalent |
| --- | --- |
| `arr.sort(cmp)` | `arr.toSorted(cmp)` |
| `arr.reverse()` | `arr.toReversed()` |
| `arr.splice(i, n, ...x)` | `arr.toSpliced(i, n, ...x)` — returns the **new array**, not the removed items |
| `arr[i] = v` | `arr.with(i, v)` |
| `arr.push(x)` | `[...arr, x]` or `arr.concat(x)` |
| `arr.unshift(x)` | `[x, ...arr]` |
| `arr.pop()` / `arr.shift()` | `arr.slice(0, -1)` / `arr.slice(1)` |
| `arr.fill(v)` | `arr.map(() => v)` |
| — (extract a range) | `arr.slice(start, end)` — `splice`'s non-destructive cousin |

**Gotcha.** `slice` and the `to*` copies are **shallow**. `[obj].slice()[0] === obj`, so mutating the
element still hits the original. Use `structuredClone(arr)` for a deep copy.

### The `sort` comparator

| Question | Answer |
| --- | --- |
| Default order? | Elements are converted with `String()` and compared by UTF-16 code units |
| Proof | `[10,9,1].sort()` → `[1,10,9]`. Always pass a comparator for numbers |
| Numbers | `(a, b) => a - b` ascending, `(a, b) => b - a` descending |
| Strings | `(a, b) => a.localeCompare(b)` — beats `<` for accents and case |
| Comparator contract | return `< 0` → `a` first; `0` → keep order; `> 0` → `b` first. Must return a **number** |
| Bad comparator | `[1,2].sort('x')` → `TypeError: The comparison function must be either a function or undefined` |
| Stable? | Yes, guaranteed since ES2019 — equal elements keep their input order |
| `undefined` elements | Sorted to the end; the comparator is **never called** for them |
| Holes | Pushed after the `undefined`s and stay holes: `[,3,undefined,1].sort()` → `[1, 3, undefined, <hole>]` |
| `toSorted` + holes | Holes become real `undefined` in the copy: `[3,,1].toSorted()` → `[1, 3, undefined]` |
| Return value | `sort` returns the *same* array object (`a.sort() === a` → `true`); `toSorted` a new one |

**Gotcha.** A comparator returning a boolean (`(a,b) => a > b`) is a silent bug — `true`/`false` coerce
to `1`/`0`, so "less than" never happens and the result is arbitrary. Return a number.

### Callback signatures

| Methods | Callback | `thisArg`? |
| --- | --- | --- |
| `map` `filter` `forEach` `flatMap` `find` `findIndex` `findLast` `findLastIndex` `every` `some` | `(element, index, array)` | yes — 2nd argument |
| `reduce` `reduceRight` | `(accumulator, element, index, array)` | no — pass the initial value instead |
| `sort` `toSorted` | `(a, b)` → number | no |
| `Array.from` | `(element, index)` | yes — 3rd argument |
| `Object.groupBy` `Map.groupBy` | `(element, index)` | no |

**Gotcha.** `thisArg` does nothing for arrow functions — they close over `this` lexically.
`[1,2].map(function (x) { return x * this.f; }, { f: 10 })` → `[10,20]`; the arrow version gives `NaN`.

## Recipes

### Group rows by a field

```js
Object.groupBy(people, p => p.team)   // => { a: [...], b: [...] }, null-prototype
```
Need non-string keys or a real `Map`? Use `Map.groupBy(people, p => p.teamObj)`.

### Dedupe primitives

```js
[...new Set([1, 2, 2, 3])]   // => [1, 2, 3]
```
`Set` uses SameValueZero, so `NaN` dedupes correctly; objects dedupe by reference only.

### Dedupe objects by key (keep first)

```js
const seen = new Set();
const unique = rows.filter(r => !seen.has(r.id) && seen.add(r.id));
```
`[...new Map(rows.map(r => [r.id, r])).values()]` is shorter but keeps the **last** of each key.

### Sort by multiple fields

```js
const by = (...fns) => (a, b) => { for (const f of fns) { const r = f(a, b); if (r) return r; } return 0; };
rows.toSorted(by((a, b) => a.dept.localeCompare(b.dept), (a, b) => a.age - b.age));
```

### Sort by score desc, then name asc

```js
rows.toSorted((a, b) => b.score - a.score || a.name.localeCompare(b.name));
// [{s:5,n:'bo'},{s:9,n:'al'},{s:5,n:'al'},{s:9,n:'zz'}] => al(9), zz(9), al(5), bo(5)
```
`||` chains comparators because a tie returns `0` (falsy). Sort is stable, so equal rows never shuffle.

### Sum and average

```js
const sum = ns => ns.reduce((a, b) => a + b, 0);          // sum([3,1,4]) => 8
const avg = ns => ns.length ? sum(ns) / ns.length : 0;    // avg([3,1,4]) => 2.666...
```
Floats accumulate error: `[0.1, 0.2].reduce((a,b) => a+b, 0)` → `0.30000000000000004`.

### Min / max by key

```js
const maxBy = (arr, f) => arr.reduce((m, x) => f(x) > f(m) ? x : m);   // throws on []
maxBy(rows, r => r.score);
```
For plain numbers use `Math.max(...ns)` — but that blows the stack past ~100k elements.

### Chunk into fixed-size groups

```js
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
chunk([1, 2, 3, 4, 5], 2);   // => [[1,2],[3,4],[5]]
```

### Zip arrays together

```js
const zip = (...as) => as[0].map((_, i) => as.map(a => a[i]));
zip([1, 2], ['a', 'b']);   // => [[1,'a'],[2,'b']]
```
Length is driven by the first array; extras are dropped, gaps become `undefined`.

### Top N

```js
rows.toSorted((a, b) => b.score - a.score).slice(0, 3);   // => 3 highest scores
```
For N much smaller than the array, a single `reduce` keeping a size-N list beats sorting — see `big-o.md`.

### Partition into pass / fail

```js
const partition = (a, f) => a.reduce(([y, n], v) => (f(v) ? y.push(v) : n.push(v), [y, n]), [[], []]);
partition([1, 2, 3, 4], n => n % 2);   // => [[1,3],[2,4]]
```

### Count occurrences (frequency map)

```js
const counts = ['a', 'b', 'a'].reduce((m, x) => (m[x] = (m[x] ?? 0) + 1, m), {});
// => { a: 2, b: 1 }
```
Group-then-count reads better on objects: `Object.entries(Object.groupBy(rows, f)).map(([k, v]) => [k, v.length])`.

### Range / sequence

```js
Array.from({ length: 5 }, (_, i) => i + 1);        // => [1,2,3,4,5]
Array.from({ length: 4 }, (_, i) => 2 + i * 3);   // => [2,5,8,11]  (start 2, step 3)
```

### Intersection and difference

```js
new Set([1, 2, 3]).intersection(new Set([2, 3, 4]));   // => Set { 2, 3 }  (ES2025)
new Set([1, 2, 3]).difference(new Set([2, 3, 4]));     // => Set { 1 }
```
Array-in, array-out: `const b = new Set(other); a.filter(x => b.has(x))` → `[2,3]`. See `object-map-set.md`.

### Index by key (array → lookup object)

```js
Object.fromEntries(people.map(p => [p.id, p]));   // => { a1: {...}, a2: {...} }
```
Turns repeated `arr.find(...)` inside a loop from O(n·m) into O(n + m).

## Where big-O bites

| Pattern | Cost | Fix |
| --- | --- | --- |
| `arr.find` / `includes` / `indexOf` inside a loop | O(n·m) | Build a `Set`/`Map` once, then O(1) lookups |
| `arr.shift()` / `unshift()` in a loop | O(n) each | Push and reverse, or use an index pointer |
| `[...acc, x]` inside `reduce` | O(n²) copies | `acc.push(x); return acc` on a single array |
| `sort` | O(n log n) | Sort once, not inside a loop |
| `Math.max(...huge)` | stack overflow ~100k args | `reduce((m, x) => x > m ? x : m, -Infinity)` |

---
*See also: [big-o.md](big-o.md) · [object-map-set.md](object-map-set.md) · [string-methods.md](string-methods.md) · [es2020-plus.md](es2020-plus.md)*
