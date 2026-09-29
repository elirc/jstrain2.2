# JS Gotchas

The 30 traps that produce real production bugs, each with the output that surprised someone.

## Top of mind

| Symptom | Cause | Fix |
| --- | --- | --- |
| Numbers sort wrong | `.sort()` compares as **strings** | `.sort((a, b) => a - b)` |
| `0.1 + 0.2 !== 0.3` | Binary floats can't hold decimal tenths | Compare with `Number.EPSILON`, or use integer cents |
| Async errors vanish | Promise not `await`ed — `try/catch` never sees it | `await` it, or attach `.catch()` |
| Array looks full but `.map` does nothing | `Array(3)` makes **holes**, not `undefined`s | `Array.from({ length: 3 }, ...)` |
| `this` is `undefined` in a callback | Method got detached from its object | Arrow function, or `.bind(this)` |

Every output below was executed on Node 22.16. If your output differs, trust yours and re-check the version.

---

### 1. `.sort()` is lexicographic by default

```js
[10, 9, 1].sort();              // => [1, 10, 9]
[1, 2, 3, 10].sort();           // => [1, 10, 2, 3]
```

**Why.** With no comparator, `sort` converts every element to a string and compares UTF-16 code units — `'10' < '9'`.
**Fix.** `arr.sort((a, b) => a - b)` for numbers; `arr.toSorted(...)` if you don't want to mutate.

### 2. `0.1 + 0.2 !== 0.3`

```js
0.1 + 0.2;                      // => 0.30000000000000004
(0.1).toFixed(20);              // => '0.10000000000000000555'
```

**Why.** IEEE-754 doubles store binary fractions; `0.1` is not representable, so the error surfaces on addition.
**Fix.** `Math.abs(a - b) < Number.EPSILON` for comparison; store money as integer cents.

### 3. `typeof null === 'object'`

```js
typeof null;                    // => 'object'
typeof undefined;               // => 'undefined'
```

**Why.** A bug in the first JS implementation (null's type tag was `0`, same as objects), never fixed because the web depends on it.
**Fix.** Test with `x === null`, or `x == null` to catch `null` and `undefined` together.

### 4. `NaN !== NaN`

```js
NaN === NaN;                    // => false
Object.is(NaN, NaN);            // => true
```

**Why.** IEEE-754 defines NaN as unequal to everything, itself included.
**Fix.** `Number.isNaN(x)` — the **global** `isNaN('foo')` returns `true` because it coerces first.

### 5. Floating promises escape `try/catch`

```js
async function boom() { throw new Error('nope'); }
try { boom(); } catch { /* never runs */ }   // => rejection escapes
```

**Why.** `boom()` returns a rejected promise; the `try` block completed successfully. Node crashes the process on an unhandled rejection (default since Node 15).
**Fix.** `await boom()` inside the `try`, or `boom().catch(handle)`.

### 6. `await` inside `forEach` does nothing

```js
const out = [];
[1, 2].forEach(async n => { await sleep(10); out.push(n); });
console.log(out);               // => []  (fills in ~10ms later)
```

**Why.** `forEach` ignores the promise each callback returns, so it never waits.
**Fix.** `for (const n of arr) { await ... }` for serial, `await Promise.all(arr.map(async n => ...))` for parallel.

### 7. `Array(3)` creates holes, not `undefined`s

```js
Array(3);                       // => [ <3 empty items> ]
Array(3).map(() => 1);          // => [ <3 empty items> ]
Array(3).fill(1);               // => [1, 1, 1]
```

**Why.** `map`, `forEach`, `filter`, `reduce`, `some`, `every` **skip holes**; `fill`, `join`, and spread do not.
**Fix.** `Array.from({ length: 3 }, (_, i) => i)` — the canonical "n items" builder.

### 8. `var` in a loop captures one binding

```js
const fs = []; for (var i = 0; i < 3; i++) fs.push(() => i);
fs.map(f => f());               // => [3, 3, 3]   (with let: [0, 1, 2])
```

**Why.** `var` is function-scoped: all three closures share the same `i`, which is `3` when they finally run. `let` creates a fresh binding per iteration.
**Fix.** Use `let`. Always.

### 9. `this` is lost when a method is detached

```js
const t = { v: 1, get() { return this.v; } };
const g = t.get;  g();          // => undefined  (t.get() => 1)
```

**Why.** `this` is set by the **call site**, not where the function was defined. A bare call gets `undefined` (strict/module) or `globalThis` (sloppy).
**Caveat.** That `=> undefined` above is the *sloppy* result (`globalThis.v` is missing). In strict mode or an ES module — which is every file in `bootcamp/` — `this` really is `undefined`, so the read throws: `TypeError: Cannot read properties of undefined (reading 'v')`.
**Fix.** `t.get.bind(t)`, `() => t.get()`, or define the method as a class field arrow.

### 10. TDZ: `let` throws, `var` is `undefined`

```js
function f() { console.log(x); var x = 1; }   // => undefined
function g() { console.log(y); let y = 1; }   // => ReferenceError: Cannot access 'y' before initialization
```

**Why.** `var` declarations hoist **and** initialise to `undefined`; `let`/`const` hoist but stay in the Temporal Dead Zone until the declaration executes.
**Fix.** Declare before use — the TDZ is the language telling you your code is out of order.

### 11. The `==` coercion table

```js
'' == 0;      // => true      null == undefined;  // => true
'0' == 0;     // => true      null == 0;          // => false
'' == '0';    // => false     null >= 0;          // => true
[] == false;  // => true      [null] == '';       // => true
```

**Why.** `==` runs a multi-step coercion algorithm; `null` is special-cased for `==` (only equal to `undefined`) but **not** for `<`/`>=`, which coerce it to `0`.
**Fix.** Use `===` everywhere except the idiomatic `x == null` null-ish check.

### 12. `splice` mutates, `slice` copies

```js
const a = [1,2,3,4,5]; a.splice(1, 2);   // => returns [2,3], a is now [1,4,5]
const b = [1,2,3,4,5]; b.slice(1, 3);    // => returns [2,3], b unchanged
```

**Why.** `splice(start, deleteCount)` removes in place and returns what it removed; `slice(start, end)` returns a shallow copy of a range.
**Fix.** `toSpliced` (ES2023) is the non-mutating splice.

### 13. `[] + []` and friends

```js
[] + [];                        // => ''
[] + {};                        // => '[object Object]'
'5' + 3;   '5' - 3;             // => '53'   and   2
```

**Why.** `+` prefers string concatenation if either side becomes a string; arrays stringify via `join(',')`, plain objects via `'[object Object]'`. `-` has no string meaning, so both sides go numeric.
**Fix.** Convert explicitly: `Number(x)` / `String(x)`.

### 14. A boolean comparator breaks `sort`

```js
[3,1,4,1,5,9,2,6].sort((x, y) => x > y);   // => [3,1,4,1,5,9,2,6]  (unchanged)
```

**Why.** `sort` needs a **number**: negative, zero, or positive. `true`/`false` coerce to `1`/`0` — the engine never learns "a comes before b", so it does nothing useful.
**Fix.** Return `a - b`, or `a < b ? -1 : a > b ? 1 : 0` for non-numbers.

### 15. `parseInt` stops at the first non-digit

```js
parseInt('1e3');                // => 1        (Number('1e3') => 1000)
parseInt('');                   // => NaN      (Number('')    => 0)
```

**Why.** `parseInt` scans a prefix and gives up at the first invalid character. `Number()` parses the whole string or fails. Legacy octal (`parseInt('08')` → `0`) is gone in modern engines — `parseInt('08')` is `8` — but pass the radix anyway.
**Fix.** `parseInt(s, 10)` when you mean base 10; `Number(s)` when the whole string must be numeric.

### 16. `JSON.stringify` silently drops things

```js
JSON.stringify({ a: undefined, b: () => 1, c: NaN, d: new Date(0) });
// => '{"c":null,"d":"1970-01-01T00:00:00.000Z"}'
JSON.stringify([undefined, () => 1]);        // => '[null,null]'
```

**Why.** `undefined`, functions, and symbols are omitted from objects and become `null` in arrays; `NaN`/`Infinity` become `null`; `Date` becomes an ISO string; `Map`/`Set` become `{}`.
**Fix.** `structuredClone` for a real deep copy; a custom `replacer`/`reviver` for `Map`/`Set`/`BigInt`.

### 17. Object keys are always strings (or symbols)

```js
const o = {}; o[1] = 'a';  o['1'];           // => 'a'
const m = {}; m[{}] = 1; m[{ x: 2 }] = 2;  m;  // => { '[object Object]': 2 }
```

**Why.** Non-symbol keys are coerced with `String()`, so every plain object collapses to `'[object Object]'` and overwrites the previous entry.
**Fix.** Use a `Map` — it keys on identity and accepts any value.

### 18. `Object.freeze` is shallow and silent

```js
const f = Object.freeze({ a: { b: 1 } });
f.a.b = 2;  f.c = 3;  f;        // => { a: { b: 2 } }   — nested write won, top-level write ignored
```

**Why.** Freeze only locks own properties one level deep, and in non-strict code a rejected write throws nothing at all.
**Fix.** Recursive freeze helper, or don't rely on freeze for real immutability.

### 19. `structuredClone` can't clone functions

```js
structuredClone({ f: () => 1 });      // => DOMException: ()=>1 could not be cloned.
const c = {}; c.self = c; structuredClone(c);   // => works, cycle preserved
```

**Why.** It uses the structured-clone algorithm: no functions, no DOM nodes, no symbols, no prototypes, no property descriptors — but cycles, `Map`, `Set`, `Date`, `RegExp`, and typed arrays all survive (where `JSON` round-tripping throws on cycles).
**Fix.** Strip functions first, or hand-write the clone.

### 20. Objects compare by identity

```js
({ a: 1 }) === { a: 1 };        // => false   (parens needed at statement start)
[1, 2] == '1,2';                // => true    (coerced!)
```

**Why.** `===` on objects compares references, not contents. `==` against a string stringifies the array — which is how `[] == false` sneaks through.
**Fix.** Deep-compare explicitly, or compare a canonical key (`JSON.stringify` of sorted entries) if the shape is simple.

### 21. `finally` swallows the return

```js
function f() { try { return 'try'; } finally { return 'finally'; } }
f();                            // => 'finally'
```

**Why.** A `return` (or `throw`) in `finally` overrides whatever the `try` block was about to return — including an in-flight exception.
**Fix.** Never `return` or `throw` from `finally`; use it only for cleanup.

### 22. Date strings: date-only is UTC, date-time is local

```js
new Date('2024-01-01').toISOString();        // => '2024-01-01T00:00:00.000Z'
new Date('2024-01-01T00:00').toISOString();  // => shifted by your UTC offset
```

**Why.** The spec parses the date-only ISO form as **UTC** and the date-time form without a `Z`/offset as **local time**. Same-looking strings, different instants.
**Fix.** Always include an explicit offset (`...T00:00:00Z` or `+05:30`) when the instant matters.

### 23. `Math.max()` with no arguments is `-Infinity`

```js
Math.max();                     // => -Infinity      Math.min() => Infinity
Math.max(...[]);                // => -Infinity
```

**Why.** They are defined as the identity element for their fold, so an empty spread silently produces the wrong extreme.
**Fix.** Guard the empty case: `arr.length ? Math.max(...arr) : null`. Also note `Math.max(...huge)` blows the call stack past ~100k args — use `reduce`.

### 24. `delete arr[0]` leaves a hole

```js
const a = [1, 2, 3]; delete a[0];
a;                              // => [ <1 empty item>, 2, 3 ]   length still 3
```

**Why.** `delete` removes the property, not the slot — arrays are objects with numeric-string keys.
**Fix.** `arr.splice(0, 1)` to remove and reindex, or `arr.filter(...)` for a copy.

### 25. `for...in` gives strings and walks the prototype

```js
const arr = ['a', 'b']; Array.prototype.junk = '!';
for (const k in arr) { /* k is '0', '1', 'junk' — all strings */ }
```

**Why.** `for...in` enumerates every enumerable **string** key up the prototype chain. Index keys arrive as `'0'`, so `k + 1` gives `'01'`.
**Fix.** `for...of` for values, `.entries()` for index+value, `Object.keys()` for own keys only.

### 26. Sharing one mutable object across calls

```js
function push(item, bag = []) { bag.push(item); return bag; }
push(1); push(2);               // => [1] then [2]   — default re-evaluated each call
// but a module-level `const shared = []` passed in accumulates: [1,2] then [1,2]
```

**Why.** Default parameter expressions run fresh on every call (unlike Python), but a hoisted object literal or a module-scope array is created once and shared by every caller.
**Fix.** Create mutable state inside the function; treat arguments as read-only unless mutation is the documented job.

### 27. `?.` guards the lookup, not the call target's type

```js
const o = { notFn: 1 };
o.fn?.();                       // => undefined   (fn is absent — fine)
o.notFn?.();                    // => TypeError: o.notFn is not a function
```

**Why.** `?.()` short-circuits only when the value is `null`/`undefined`. Any other non-callable still throws.
**Fix.** `typeof o.notFn === 'function' && o.notFn()` when the value might be a non-function.

### 28. `indexOf` can't find `NaN`, `includes` can

```js
[NaN].includes(NaN);            // => true
[NaN].indexOf(NaN);             // => -1
```

**Why.** `indexOf` uses strict equality (`NaN !== NaN`); `includes` uses SameValueZero, which treats NaN as equal to NaN (and `+0` as equal to `-0`).
**Fix.** Use `includes` for presence checks, `findIndex(Number.isNaN)` when you need the position.

### 29. `instanceof` lies across realms

```js
const foreign = require('node:vm').runInNewContext('[]');
foreign instanceof Array;       // => false
Array.isArray(foreign);         // => true
```

**Why.** `instanceof` walks the prototype chain looking for **this realm's** `Array.prototype`. An array from an iframe, worker, or vm context has a different one.
**Fix.** `Array.isArray`, `Object.prototype.toString.call(x)`, or duck-typing.

### 30. `replace` with a string replaces once

```js
'a-b-a'.replace('a', 'X');      // => 'X-b-a'
'a-b-a'.replaceAll('a', 'X');   // => 'X-b-X'
```

**Why.** `replace` with a string pattern replaces only the first match; you need `/a/g` or `replaceAll`. And `replaceAll` with a **regex** throws unless that regex has the `g` flag.
**Fix.** `replaceAll` for literal strings; `/pattern/g` when you need regex.

---

## Bonus round — the near-misses

| Trap | Reality |
| --- | --- |
| `typeof NaN` | `'number'` — NaN is a numeric value meaning "not a valid number" |
| `typeof []` | `'object'` — use `Array.isArray` |
| `arr.length = 0` | Truncates the array in place; every element is gone |
| `Object.is(0, -0)` | `false`, while `0 === -0` is `true` |
| `9007199254740992 === 9007199254740993` | `true` — past `Number.MAX_SAFE_INTEGER`, use `BigInt` |
| `typeof undeclaredVar` | `'undefined'`, no throw — the only safe way to probe an undeclared name |
| Strings are immutable | `s[0] = 'z'` silently does nothing (throws in strict mode for frozen targets) |
| `{ ...obj }` runs getters | The copy holds the **computed value**, not the getter |
| `setTimeout(fn, 0)` | Runs after **all** pending microtasks — see [promises-async.md](promises-async.md) |
| `String(1e21)` | `'1e+21'` — large numbers stringify in exponential form |

---
*See also: [array-methods.md](array-methods.md) · [promises-async.md](promises-async.md) · [es2020-plus.md](es2020-plus.md)*
