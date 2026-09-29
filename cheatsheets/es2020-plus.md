# ES2020+ features

Everything added to JavaScript since ES2019, what it replaced, and whether Node 22.16 has it.

## Top of mind

| Question | Answer |
| --- | --- |
| `??` vs `\|\|` | `??` only falls through on `null`/`undefined`. `0 ?? 'd'` → `0`; `0 \|\| 'd'` → `'d'` |
| Can I use `RegExp.escape` / `Promise.try` offline? | **No** — both are `undefined` in Node 22.16. See Node 22 availability |
| Non-mutating array edits | `toSorted` `toReversed` `toSpliced` `with` (ES2023) |
| Deep copy in one call | `structuredClone(x)` — Node 17+, not an ECMAScript feature, a host API |
| Group an array | `Object.groupBy(arr, fn)` → null-proto object · `Map.groupBy(arr, fn)` → `Map` (ES2024) |

## By ES year

The whole release, in one line each — for when you know the year but not the name.

| Year | Shipped |
| --- | --- |
| ES2019 | `flat` `flatMap` `Object.fromEntries` `trimStart`/`trimEnd` `Array.sort` stability, optional `catch` binding |
| ES2020 | `?.` `??` `BigInt` `String.matchAll` `Promise.allSettled` `globalThis` dynamic `import()` `import.meta` `export * as ns` |
| ES2021 | `String.replaceAll` `Promise.any`/`AggregateError` `\|\|=` `&&=` `??=` numeric separators `WeakRef`/`FinalizationRegistry` |
| ES2022 | top-level `await` class fields `#private` `static {}` `#x in o` `.at()` `Object.hasOwn` `Error` `cause` RegExp `d` flag |
| ES2023 | `findLast`/`findLastIndex` `toSorted`/`toReversed`/`toSpliced`/`with` hashbang, symbols as `WeakMap` keys |
| ES2024 | `Object.groupBy`/`Map.groupBy` `Promise.withResolvers` `Array.fromAsync` RegExp `v` flag `isWellFormed` resizable `ArrayBuffer` |
| ES2025 | `Set` ops (7) iterator helpers, import attributes, `RegExp.escape`, duplicate named capture groups, `Float16Array` |

The three ES2025 items in **bold** in the availability table below are the ones Node 22.16
does *not* have yet — everything else here works today.

## Syntax & operators

| Feature | What it does | Example | Since |
| --- | --- | --- | --- |
| Optional chaining `?.` | Short-circuits to `undefined` on `null`/`undefined` instead of throwing | `o?.a?.b // => undefined` | ES2020 |
| Optional index `?.[]` | Same, for computed access | `o?.arr?.[1] // => 2` | ES2020 |
| Optional call `?.()` | Calls only if the callee exists | `o.fn?.() // => undefined if absent` | ES2020 |
| Nullish coalescing `??` | Right side only when left is `null`/`undefined` | `0 ?? 'd' // => 0` | ES2020 |
| `BigInt` / `1n` | Arbitrary-precision integers | `10n ** 20n // => 100000000000000000000n` | ES2020 |
| Nullish assign `??=` | Assign only if currently nullish | `let b=0; b ??= 9 // b stays 0` | ES2021 |
| Or-assign `\|\|=` | Assign if falsy | `let x=0; x \|\|= 'or' // => 'or'` | ES2021 |
| And-assign `&&=` | Assign only if truthy | `let y=''; y &&= 'a' // stays ''` | ES2021 |
| Numeric separators | `_` anywhere between digits, incl. hex and BigInt | `1_000_000 // => 1000000` · `0xFF_FF // => 65535` | ES2021 |
| Class fields | Declare instance/static fields in the class body | `class C { x = 1; static n = 0 }` | ES2022 |
| `#private` | Truly private fields and methods | `class C { #x = 1; get x(){ return this.#x } }` | ES2022 |
| `static {}` blocks | Run setup code once at class definition | `class C { static { C.reg = new Set() } }` | ES2022 |
| Brand check `#x in o` | Test private-field presence without throwing | `static isC(o){ return #x in o }` | ES2022 |
| Top-level `await` | `await` at module scope, no IIFE | `const os = await import('node:os')` | ES2022 |
| Hashbang `#!` | `#!/usr/bin/env node` legal as line 1 | `#!/usr/bin/env node` | ES2023 |
| Import attributes | Declare a non-JS module type | `import d from './d.json' with { type: 'json' }` | ES2025 |

**Gotcha.** `??` cannot be mixed with `\|\|`/`&&` unparenthesised —
`null \|\| 1 ?? 2` is a `SyntaxError: Unexpected token '??'`. Write `(null \|\| 1) ?? 2`.

**Gotcha.** `?.` guards *nullish*, not *wrong type*. `({x:1}).x?.()` still throws
`TypeError: ...x is not a function`. And BigInt refuses to mix: `1n + 1` throws
`TypeError: Cannot mix BigInt and other types`, though `1n == 1` is `true` (`1n === 1` is `false`).

## String methods

| Feature | What it does | Example | Since |
| --- | --- | --- | --- |
| `trimStart` / `trimEnd` | Trim one side | `'  x  '.trimStart() // => 'x  '` | ES2019 |
| `matchAll(re)` | Iterator of **full match objects** (groups + `index`) | `[...'a1b2'.matchAll(/(\w)(\d)/g)].length // => 2` | ES2020 |
| `replaceAll(a, b)` | Replace every occurrence, no regex needed | `'a.b.c'.replaceAll('.', '-') // => 'a-b-c'` | ES2021 |
| `at(i)` | Negative indexing | `'abc'.at(-1) // => 'c'` | ES2022 |
| `isWellFormed()` | `false` if the string holds a lone surrogate | `'\uD800'.isWellFormed() // => false` | ES2024 |
| `toWellFormed()` | Replaces lone surrogates with `U+FFFD` | `'\uD800'.toWellFormed() // => '\uFFFD'` | ES2024 |

**Gotcha.** Both `matchAll` and `replaceAll` **throw** if given a non-global regex:
`TypeError: String.prototype.replaceAll called with a non-global RegExp argument`.

## Array methods

| Feature | What it does | Mutates? | Example | Since |
| --- | --- | --- | --- | --- |
| `includes(x)` | Membership using SameValueZero | no | `[NaN].includes(NaN) // => true` (`indexOf` → `-1`) | ES2016 |
| `flat(d?)` | Flatten `d` levels (default `1`), drops holes | no | `[1,[2,[3]]].flat(Infinity) // => [1,2,3]` | ES2019 |
| `flatMap(fn)` | `map` then `flat(1)`; return `[]` to drop an item | no | `[1,2,3].flatMap(n => n%2 ? [n] : []) // => [1,3]` | ES2019 |
| `at(i)` | Negative indexing (also on TypedArrays) | no | `[1,2,3].at(-1) // => 3`; `[1].at(5) // => undefined` | ES2022 |
| `findLast(fn)` | Search from the right | no | `[1,2,3,4].findLast(n => n%2===0) // => 4` | ES2023 |
| `findLastIndex(fn)` | Index from the right, `-1` if none | no | `[1,2,3,4].findLastIndex(n => n%2===0) // => 3` | ES2023 |
| `toSorted(cmp?)` | Copy, then sort | **no** | `[3,1,2].toSorted() // => [1,2,3], original untouched` | ES2023 |
| `toReversed()` | Copy, then reverse | **no** | `[3,1,2].toReversed() // => [2,1,3]` | ES2023 |
| `toSpliced(i,d,...v)` | Copy with a splice applied; returns the **new array** | **no** | `[3,1,2].toSpliced(1,1,'X') // => [3,'X',2]` | ES2023 |
| `with(i, v)` | Copy with one index replaced | **no** | `[3,1,2].with(0,9) // => [9,1,2]` | ES2023 |
| `Array.fromAsync(src)` | `Array.from` for async iterables / arrays of promises | n/a | `await Array.fromAsync([Promise.resolve('a')]) // => ['a']` | ES2024 |

**Gotcha.** `toSorted` inherits `sort`'s default string comparison:
`[10,9,1].toSorted() // => [1,10,9]`. Pass `(a,b)=>a-b` for numbers.
`toSpliced` returns the *new array*, unlike `splice`, which returns the *removed* elements.

## Object, Set & grouping

| Feature | What it does | Example | Since |
| --- | --- | --- | --- |
| `Object.fromEntries(it)` | Pairs → object; inverse of `Object.entries` | `Object.fromEntries([['a',1]]) // => {a:1}` | ES2019 |
| `Object.hasOwn(o,k)` | Safe own-key test | `Object.hasOwn({a:undefined},'a') // => true` | ES2022 |
| Symbols as `WeakMap` keys | Unregistered symbols allowed as weak keys | `new WeakMap().set(Symbol('s'), 1)` | ES2023 |
| `Object.groupBy(items,fn)` | Group into a **null-prototype** object, keys stringified | `Object.groupBy([1,2], n => n%2?'odd':'even')` | ES2024 |
| `Map.groupBy(items,fn)` | Group into a `Map`; keys keep their identity | `Map.groupBy([1,2], f) instanceof Map // => true` | ES2024 |
| `Set` ops (7 methods) | `union` `intersection` `difference` `symmetricDifference` → new `Set`; `isSubsetOf` `isSupersetOf` `isDisjointFrom` → `boolean` | `new Set([1,2]).union(new Set([3])) // => Set(3){1,2,3}` | ES2025 |

**Gotcha.** Set-op arguments must be *set-like* (`size` + `has` + `keys`). An array throws
`TypeError: The .size property is NaN` — wrap it in `new Set(...)` first.

## Promises & async

| Feature | What it does | Example | Since |
| --- | --- | --- | --- |
| `Promise.allSettled(ps)` | Never rejects; array of `{status,value}` / `{status,reason}` | `(await Promise.allSettled([p]))[0].status // => 'fulfilled'` | ES2020 |
| `Promise.any(ps)` | First **fulfilled**; rejects `AggregateError` if all reject | `await Promise.any([Promise.reject(1), Promise.resolve(2)]) // => 2` | ES2021 |
| `AggregateError` | Holds `.errors` array | `e.errors.map(x => x.message) // => ['a','b']` | ES2021 |
| `Promise.withResolvers()` | `{ promise, resolve, reject }` — no executor closure | `const {promise, resolve} = Promise.withResolvers()` | ES2024 |
| `Error` `cause` | Chain the original error | `new Error('outer', { cause: err }).cause` | ES2022 |
| `for await...of` | Iterate async iterables, awaiting each value | `for await (const x of asyncGen()) {}` | ES2018 |
| `WeakRef` / `FinalizationRegistry` | Non-owning reference / GC callback | `new WeakRef(o).deref()?.a` | ES2021 |

`Promise.any([])` rejects immediately with an `AggregateError`; `Promise.all([])` resolves
to `[]`; `Promise.race([])` never settles. `cause` is only an own property when you pass it.

## Globals, modules & regex

| Feature | What it does | Example | Since |
| --- | --- | --- | --- |
| `globalThis` | The global object, everywhere | `globalThis === global // => true in Node` | ES2020 |
| dynamic `import()` | Async, conditional, expression-position module load | `const os = await import('node:os')` | ES2020 |
| `import.meta` | Per-module metadata object | `import.meta.url // => 'file:///...'` | ES2020 |
| `export * as ns from 'm'` | Re-export a whole namespace under a name | `export * as utils from './utils.js'` | ES2020 |
| RegExp `d` flag | Adds `.indices` (start/end per group) to matches | `/(?<y>\d{4})/d.exec('2026').indices.groups.y // => [0,4]` | ES2022 |
| RegExp `v` flag | Set notation + string properties in classes | `/[\p{ASCII}--[a-z]]/v.test('a') // => false` | ES2024 |
| Duplicate named groups | Same group name in different alternatives | `/(?<x>a)\|(?<x>b)/` | ES2025 |
| `RegExp.escape(s)` | Escape a literal for use in a regex | `RegExp.escape('a.b')` | ES2025 |
| `structuredClone(x)` | Deep clone incl. cycles/Date/Map/Set | `structuredClone({a:{b:1}})` | HTML spec, Node 17+ |
| `Intl.ListFormat` | Locale-aware list joining | `new Intl.ListFormat('en').format(['a','b','c']) // => 'a, b, and c'` | ECMA-402 |
| `Intl.RelativeTimeFormat` | "yesterday", "in 3 hours" | `new Intl.RelativeTimeFormat('en',{numeric:'auto'}).format(-1,'day') // => 'yesterday'` | ECMA-402 |

`Intl.ListFormat` takes `{ type: 'conjunction' }` (and, default) or `'disjunction'`
(`'a or b'`). `Intl.RelativeTimeFormat` without `numeric:'auto'` gives `'1 day ago'`.

### Async iteration

An async iterable implements `Symbol.asyncIterator`; `for await...of` awaits each `next()`
result before running the body. It also works over a plain array of promises.

```js
async function* pages() { yield 1; yield 2; }
for await (const p of pages()) console.log(p);          // logs: 1 then 2
for await (const v of [Promise.resolve('p'), 'plain']) {}  // 'p', then 'plain'
```

Sequential by design — each iteration waits. For concurrency use `Promise.all`/`allSettled`.
Node streams (`fs.createReadStream`, `readline`) are async iterables, so this is the idiomatic
way to read them. `Array.fromAsync(asyncIterable)` drains one into an array. ES2018.

### Class fields, `#private`, static blocks, brand checks

```js
class Session {
  #token; static #count = 0;              // private instance + private static field
  static { Session.registry = new Set(); }   // runs once, at class definition
  static isSession(o) { return #token in o; }  // brand check, never throws
}
```

| Rule | Detail |
| --- | --- |
| Hard privacy | `#x` is not a property at all — invisible to `Object.keys`, `JSON.stringify`, spread and `Reflect.ownKeys`. `class C { #x=1; y=2 }` → `JSON.stringify(new C())` is `'{"y":2}'` |
| Access outside | `new C().#x` is a **`SyntaxError` at parse time**, not a runtime error |
| Brand check | `#x in o` is the only safe "is this really one of mine?" test — subclass-proof and Proxy-proof |
| `static {}` | Multiple blocks allowed, run top-to-bottom, `this` is the class |
| Field order | Instance fields initialise before the constructor body, after `super()` |

All ES2022. Before this, per-instance privacy meant a module-scoped `WeakMap`.

### Top-level `await`

Legal only in ES modules (`.mjs`, or `"type": "module"`). Never in CommonJS, never in scripts.

```js
const config = await fetch(url).then(r => r.json());   // module scope, no IIFE
const { platform } = await import('node:os');          // conditional/lazy load
```

The module's importers wait for it, so a slow top-level `await` blocks the whole graph —
and two modules top-level-awaiting each other deadlock. ES2022.

### `import.meta`

```js
import.meta.url        // 'file:///C:/…/probe.mjs'  — always present, ESM only
import.meta.dirname    // string  (Node 20.11+, not standard ECMAScript)
import.meta.resolve(s) // resolve a specifier against this module
```

`import.meta` is the ESM replacement for `__dirname`/`__filename`. In Node 22 the own keys
are `['dirname', 'filename', 'resolve', 'url']`. ES2020 (the object); Node adds the extras.

### Iterator helpers

Lazy `map`/`filter`/etc. directly on any iterator — including infinite generators. ES2025.

```js
[1,2,3,4,5].values().map(x => x*2).filter(x => x>4).take(2).toArray()   // => [6,8]
function* inf(){ let i=0; while(true) yield i++; }
inf().take(3).toArray()   // => [0,1,2]   — impossible with array methods
```

| Method | Returns | Note |
| --- | --- | --- |
| `.map` `.filter` `.take(n)` `.drop(n)` `.flatMap` | a new **Iterator Helper** (lazy) | Nothing runs until you consume it |
| `.toArray()` | `Array` | The terminal call you almost always need |
| `.reduce` `.forEach` `.some` `.every` `.find` | value / `undefined` | Terminal, eager |
| `Iterator.from(x)` | Iterator | Wrap a bare `{next(){}}` object to get the helpers |

`Object.prototype.toString.call([1].values().map(f))` → `'[object Iterator Helper]'`.
Available on Map/Set iterators too: `map.keys().filter(...)`.

## Node 22 availability

Verified with `node -e 'console.log(typeof X)'` on **Node v22.16.0**.

| Feature | In Node 22.16? |
| --- | --- |
| `Object.groupBy` / `Map.groupBy` | yes |
| `Array.fromAsync` | yes |
| `Promise.withResolvers` | yes |
| `Set.prototype.union` (all 7 set ops) | yes |
| `Iterator.prototype.map` (iterator helpers) | yes |
| `structuredClone` | yes |
| `Object.hasOwn` | yes |
| `String.prototype.isWellFormed` / `toWellFormed` | yes |
| `ArrayBuffer.prototype.transfer` | yes |
| `Atomics.waitAsync` | yes |
| `Intl.Segmenter` / `Intl.ListFormat` | yes |
| Import attributes (`with { type: 'json' }`) | yes |
| `WeakRef` / `FinalizationRegistry` | yes |
| **`RegExp.escape`** | **NO** — `typeof RegExp.escape === 'undefined'` |
| **`Promise.try`** | **NO** — `undefined`. Post-ES2025; use `new Promise(r => r(fn()))` |
| **Duplicate named capture groups** | **NO** — `new RegExp('(?<a>x)\|(?<a>y)')` throws `SyntaxError: Duplicate capture group name` |
| **`Float16Array` / `Math.f16round`** | **NO** — `undefined` |
| **`Error.isError`** | **NO** — `undefined` (post-ES2025) |
| **`Array.prototype.group`** | **NO** — renamed to `Object.groupBy` before shipping |

Don't reach for the bottom five on the plane. Hand-rolled `RegExp.escape`:
`s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.

## Still worth knowing the old way

| Modern | Pre-ES2020 equivalent | Difference that bites |
| --- | --- | --- |
| `a?.b` | `a && a.b` | `&&` also short-circuits on `0`/`''`/`false`; `?.` does not |
| `a?.b?.c` | `a && a.b && a.b.c` | Evaluates `a.b` once |
| `fn?.()` | `typeof fn === 'function' && fn()` | Old form returns `false`, not `undefined`, when absent |
| `a ?? b` | `a != null ? a : b` | `!=` (loose) is the trick — it catches both `null` and `undefined` |
| `a ??= b` | `if (a == null) a = b` | `\|\|=` maps to `a = a \|\| b` |
| `'x'.replaceAll('.','-')` | `'x'.split('.').join('-')` or `/\./g` | Old regex form needed escaping |
| `[...s.matchAll(re)]` | `while ((m = re.exec(s)) !== null)` | `exec` needs the `g` flag and mutates `re.lastIndex` |
| `Promise.allSettled(ps)` | `Promise.all(ps.map(p => p.then(v=>({status:'fulfilled',value:v}), r=>({status:'rejected',reason:r}))))` | |
| `Promise.any(ps)` | no clean equivalent — `race` rejects on the first *rejection* | `any` ignores rejections until all fail |
| `Promise.withResolvers()` | `let res, rej; const p = new Promise((a,b)=>{res=a;rej=b})` | |
| `arr.at(-1)` | `arr[arr.length - 1]` | Old form on `''`/`[]` gives `undefined` too, fine |
| `arr.toSorted()` | `[...arr].sort()` / `arr.slice().sort()` | Forgetting the copy is the classic mutation bug |
| `arr.with(i,v)` | `arr.map((x,j) => j===i ? v : x)` | |
| `arr.findLast(fn)` | `[...arr].reverse().find(fn)` | Old form allocates and reverses |
| `arr.flat(Infinity)` | recursive `concat` | |
| `Object.hasOwn(o,k)` | `Object.prototype.hasOwnProperty.call(o,k)` | The bare `o.hasOwnProperty(k)` throws on `Object.create(null)` |
| `Object.fromEntries(pairs)` | `pairs.reduce((o,[k,v]) => (o[k]=v, o), {})` | |
| `Object.groupBy(a,fn)` | `a.reduce((acc,x) => ((acc[fn(x)] ??= []).push(x), acc), {})` | Modern one is null-prototype |
| `structuredClone(o)` | `JSON.parse(JSON.stringify(o))` | Old form kills `Date`/`Map`/`Set`/`undefined`/`NaN` and throws on cycles |
| `new Error(m,{cause:e})` | `const err = new Error(m); err.original = e` | |
| `globalThis` | `typeof window !== 'undefined' ? window : global` | |
| `await import('m')` | `require('m')` (CJS only) | Dynamic `import()` returns a Promise of the namespace |
| `1_000_000` | `1000000` | Cosmetic only |
| `#priv` | `_priv` convention, or a module-scoped `WeakMap` | `_priv` is only a promise; `#priv` is enforced |

---
*See also: [object-map-set.md](object-map-set.md) · [array-methods.md](array-methods.md) · [promises-async.md](promises-async.md) · [js-gotchas.md](js-gotchas.md)*
