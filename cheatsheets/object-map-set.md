# Objects, Map & Set

Every way to read, copy, key and iterate JS keyed collections — and which one to pick.

## Top of mind

| Question | Answer |
| --- | --- |
| Does the key exist, even if its value is `undefined`? | `Object.hasOwn(o, k)` — `o.k !== undefined` lies, `in` walks the prototype |
| Deep copy? | `structuredClone(o)` — handles cycles/Date/Map/Set, dies on functions |
| Key order? | Integer-like keys ascending first, then string keys in insertion order, then symbols |
| Object or Map? | Non-string keys, frequent add/delete, or user-supplied keys → `Map` |
| Is `freeze` deep? | No. `Object.freeze(o)` freezes one level; `o.nested.x = 9` still works |

## Object statics

| Static | Returns | Example | Notes |
| --- | --- | --- | --- |
| `Object.keys(o)` | `string[]` | `Object.keys({a:1}) // => ['a']` | Own **enumerable** string keys only. Skips symbols and non-enumerables. |
| `Object.values(o)` | `any[]` | `Object.values({a:1}) // => [1]` | Same filter as `keys`. |
| `Object.entries(o)` | `[k,v][]` | `Object.entries({a:1}) // => [['a',1]]` | Feed straight into `new Map(...)`. |
| `Object.fromEntries(it)` | `object` | `Object.fromEntries([['a',1]]) // => {a:1}` | Takes any iterable of pairs, incl. a `Map`. ES2019. |
| `Object.assign(t, ...s)` | the **mutated** `t` | `Object.assign({a:1}, {b:2}) // => {a:1,b:2}` | Shallow. **Triggers setters on the target** and getters on sources. |
| `Object.freeze(o)` | `o` | `const f=Object.freeze({a:1}); f.a=9; f.a // => 1` | Shallow. Silent in sloppy mode, `TypeError` in strict/modules. |
| `Object.isFrozen(o)` | `boolean` | `Object.isFrozen(Object.freeze({})) // => true` | `true` for any non-extensible object with no writable/configurable props. |
| `Object.seal(o)` | `o` | `const s=Object.seal({x:1}); s.y=2; s.x=2; s // => {x:2}` | Blocks add/delete, **allows** rewriting existing values. |
| `Object.create(p, d?)` | new object | `Object.create(null) // no prototype at all` | `Object.create(null)` = safest map-shaped object (no `toString`, no `__proto__`). |
| `Object.getPrototypeOf(o)` | proto or `null` | `Object.getPrototypeOf([]) === Array.prototype // => true` | Use instead of the legacy `o.__proto__`. |
| `Object.setPrototypeOf(o,p)` | `o` | `Object.setPrototypeOf({}, p)` | Works, but wrecks engine optimisation. Prefer `Object.create`. |
| `Object.defineProperty(o,k,d)` | `o` | `Object.defineProperty(o,'k',{value:1})` | Descriptor flags **default to `false`** — the prop is invisible to `keys`. |
| `Object.getOwnPropertyNames(o)` | `string[]` | `Object.getOwnPropertyNames([1]) // => ['0','length']` | Includes non-enumerables. Still no symbols. |
| `Object.getOwnPropertySymbols(o)` | `symbol[]` | `Object.getOwnPropertySymbols({[Symbol('s')]:1}) // => [Symbol(s)]` | The only built-in that returns symbol keys. |
| `Object.getOwnPropertyDescriptor(o,k)` | descriptor or `undefined` | `Object.getOwnPropertyDescriptor({a:1},'a') // => {value:1,writable:true,enumerable:true,configurable:true}` | Reveals getters as `{get,set,enumerable,configurable}`. |
| `Object.getOwnPropertyDescriptors(o)` | `{k: descriptor}` | `Object.defineProperties({}, Object.getOwnPropertyDescriptors(src))` | The only clone that preserves getters/setters. |
| `Object.hasOwn(o,k)` | `boolean` | `Object.hasOwn({a:undefined},'a') // => true` | ES2022. Replaces `o.hasOwnProperty(k)`, which **throws** on `Object.create(null)`. |
| `Object.groupBy(items,fn)` | **null-prototype** object | `Object.groupBy([1,2],n=>n%2?'odd':'even')` | ES2024. `// => [Object: null prototype] {odd:[1],even:[2]}`. Keys are stringified. |
| `Object.is(a,b)` | `boolean` | `Object.is(NaN,NaN) // => true`; `Object.is(0,-0) // => false` | The only equality that separates `0` from `-0` and unifies `NaN`. |
| `Reflect.ownKeys(o)` | `(string\|symbol)[]` | `Reflect.ownKeys({b:1,[Symbol('s')]:2,a:3}) // => ['b','a',Symbol(s)]` | Everything own: enumerable + not, strings + symbols. |

**Gotcha.** `Object.groupBy` returns a prototype-less object, so `g.toString` is `undefined`
and `g.hasOwnProperty` throws. `JSON.stringify(g)` works fine. Want a real `Map`? `Map.groupBy`.

## Property access patterns

| Pattern | Example | Notes |
| --- | --- | --- |
| Dot | `o.a` | Identifier-shaped keys only. |
| Bracket | `o['with space']`, `o[2]` | Key is coerced to string: `o[2] === o['2']`. |
| Computed key | `{ [k + 'b']: 1 } // => {ab:1}` | Any expression. Works in classes and destructuring too. |
| Optional chain | `o?.a?.b // => undefined, no throw` | Short-circuits on `null`/`undefined` **only** — `0` and `''` pass through. |
| Optional index | `o?.arr?.[1]` | The whole rest of the chain is skipped: `null?.a.b.c // => undefined`. |
| Optional call | `o.fn?.() // => 'called'`; `o.nofn?.() // => undefined` | Guards *missing*, not *wrong type*: a non-function still throws `TypeError`. |
| Shorthand | `const f = (x,y) => ({x,y}) // => {x:1,y:2}` | Arrow returning an object literal needs the parens. |
| Getter / setter | `{ get g(){return 1}, set g(v){} }` | `Object.assign`/spread **call** the getter and copy the resulting value. |
| Delete | `delete o.a // => true` | Returns `true` even for a missing key. `false` only for non-configurable props. |
| Spread merge | `{...a, ...b} // b wins` | Shallow, own+enumerable, includes symbols, skips the prototype chain. |

```js
const { a = 10, b: renamed = 2, c: { d } = {}, ...rest } =
  { a: undefined, b: 5, c: { d: 7 }, x: 1, y: 2 };
// a=10 (default fires on undefined), renamed=5, d=7, rest={x:1,y:2}
```

**Gotcha.** Destructuring defaults fire on `undefined` only: `const {n=9} = {n:null} // => null`.
Destructuring `null`/`undefined` throws `TypeError: Cannot destructure property 'q' of 'null'`.

### `in` vs `hasOwn` vs `!== undefined`

```js
const o = Object.create({ inherited: 1 }); o.own = 2; o.undef = undefined;
// 'inherited' in o => true ; Object.hasOwn(o,'inherited') => false
// 'undef' in o => true ; Object.hasOwn(o,'undef') => true ; o.undef !== undefined => false
```

| Test | Sees inherited? | Sees `undefined`-valued own key? | Use when |
| --- | --- | --- | --- |
| `k in o` | yes (`'toString' in {}` → `true`) | yes | Duck-typing a class/DOM interface |
| `Object.hasOwn(o,k)` | no | yes | "Did *this* object set this key?" — the default choice |
| `o[k] !== undefined` | yes | **no** | Only when `undefined` and "absent" mean the same to you |

### Property order (verified)

```js
Object.keys({ b:1, 2:2, a:3, 1:4, '01':6, '-1':7, '1.5':8 })
// => ['1','2','b','a','01','-1','1.5']
```

1. Integer-like keys (`'0'`..`2^32-2`, canonical form) ascending — **not** insertion order.
2. All other string keys in insertion order. `'01'`, `'-1'`, `'1.5'` are *not* integer-like.
3. Symbols last (`Reflect.ownKeys` only). `Map` has none of this: pure insertion order.

## Map

| Member | Returns | Example | Notes |
| --- | --- | --- | --- |
| `new Map(iterable?)` | `Map` | `new Map([['a',1],['b',2]])` | Any iterable of `[k,v]` pairs. `new Map(otherMap)` shallow-copies. |
| `.set(k,v)` | **the map** | `m.set('c',3).set('d',4)` | Chainable. Overwrites in place, keeps original position. |
| `.get(k)` | value or `undefined` | `m.get('z') // => undefined` | No way to distinguish "missing" from "set to `undefined`" — use `.has`. |
| `.has(k)` | `boolean` | `m.has('a') // => true` | SameValueZero: `NaN` matches `NaN`, `0` matches `-0`. |
| `.delete(k)` | `boolean` | `m.delete('c') // => true`; `m.delete('zz') // => false` | Unlike `delete o.k`, tells you if it was there. |
| `.clear()` | `undefined` | `m.clear()` | |
| `.size` | `number` | `m.size // => 2` | A property, not a method. Objects have no equivalent. |
| `.keys()` / `.values()` / `.entries()` | Map Iterator | `[...m.keys()] // => ['a','b']` | Lazy iterators, insertion order. `m` itself iterates as `entries`. |
| `.forEach(fn)` | `undefined` | `m.forEach((v,k,map)=>{})` | Callback order is `(value, key, map)` — value first, like `Set`. |
| `Map.groupBy(items,fn)` | `Map` | `Map.groupBy([1,2],n=>n%2?'odd':'even')` | ES2024. Keys stay as returned — objects stay objects, no stringifying. |

```js
new Map([[NaN,'n']]).get(NaN)   // => 'n'   (object keys: identity, not deep equality)
new Map([[{}, 'o']]).get({})    // => undefined
JSON.stringify(new Map([['a',1]]))  // => '{}'   Maps do NOT serialise
```

## Set

| Member | Returns | Example | Notes |
| --- | --- | --- | --- |
| `new Set(iterable?)` | `Set` | `new Set([1,2,2,NaN,NaN,0,-0]) // => Set(4) {1,2,NaN,0}` | Dedupes by SameValueZero, so `NaN` dedupes and `-0` folds into `0`. |
| `.add(v)` | **the set** | `s.add(1).add(2)` | Chainable. Re-adding an existing value is a no-op, position kept. |
| `.has(v)` | `boolean` | `s.has(NaN) // => true` | O(1)-ish vs `array.includes` O(n). |
| `.delete(v)` | `boolean` | `s.delete(9) // => true / false` | |
| `.clear()` / `.size` | `undefined` / `number` | `s.size` | |
| `.values()` / `.keys()` | Set Iterator | `[...s.keys()]` | `keys` is an alias for `values` (Map-shaped API). |
| `.entries()` | Set Iterator | `[...new Set(['a']).entries()] // => [['a','a']]` | Key and value are the same. |
| `.forEach(fn)` | `undefined` | `s.forEach((v,k,set)=>{}) // v === k` | |

```js
[...new Set([1,2,2,3,NaN,NaN,0,-0])]   // => [1, 2, 3, NaN, 0]
```

### ES2025 set operations (all present in Node 22.16)

All seven are non-mutating: the four combiners return a **new `Set`**, the three predicates
return a **`boolean`**.

| Method | Example | Result |
| --- | --- | --- |
| `a.union(b)` | `new Set([1,2,3]).union(new Set([3,4]))` | `Set(4) {1,2,3,4}` |
| `a.intersection(b)` | `new Set([1,2,3]).intersection(new Set([3,4]))` | `Set(1) {3}` |
| `a.difference(b)` | `new Set([1,2,3]).difference(new Set([3,4]))` | `Set(2) {1,2}` |
| `a.symmetricDifference(b)` | `new Set([1,2,3]).symmetricDifference(new Set([3,4]))` | `Set(3) {1,2,4}` |
| `a.isSubsetOf(b)` | `new Set([1]).isSubsetOf(new Set([1,2]))` | `true` |
| `a.isSupersetOf(b)` | `new Set([1,2]).isSupersetOf(new Set([1]))` | `true` |
| `a.isDisjointFrom(b)` | `new Set([1]).isDisjointFrom(new Set([9]))` | `true` |

**Gotcha.** The argument must be *set-like* — `size` + `has()` + `keys()`. A `Map` qualifies
(it unions by key). A **plain array throws**: `new Set([1]).union([7])` →
`TypeError: The .size property is NaN`. Wrap it: `s.union(new Set(arr))`.

## WeakMap / WeakSet

| Aspect | `WeakMap` | `WeakSet` |
| --- | --- | --- |
| Methods | `get` `set` `has` `delete` | `add` `has` `delete` |
| Allowed keys/values held | objects, and **unregistered** symbols | same |
| Rejected | primitives, `Symbol.for('g')` → `TypeError: Invalid value used as weak map key` | same |
| `size` | `undefined` — no such property | `undefined` |
| Iterable? | No. No `keys`/`values`/`entries`/`forEach`/spread | No |
| `clear()` | Removed from the language — build a new one | Removed |
| GC | Entry vanishes when the key object is otherwise unreachable | Same |

Not iterable and no `size` **by design**: exposing them would let you observe GC timing.

**Use case 1 — private per-instance data** (pre-`#private`, still used for cross-file privacy):

```js
const secrets = new WeakMap();
class Session { constructor(t){ secrets.set(this, { token: t }); }
  get token(){ return secrets.get(this).token; } }
```

**Use case 2 — cache/metadata keyed by object without leaking**: `new WeakMap()` mapping a
DOM node or request object to computed data. A plain `Map` would pin it in memory forever.

## Decision table

### Object vs Map

| Need | Use | Why |
| --- | --- | --- |
| Non-string keys (objects, numbers, `NaN`, functions) | `Map` | Object keys are coerced to strings: `o[2] === o['2']`, `o[{}] === o['[object Object]']` |
| Guaranteed insertion order | `Map` | Objects float integer-like keys to the front (see Property order) |
| A count / `.size` | `Map` | `m.size` is O(1); objects need `Object.keys(o).length` (allocates an array) |
| Iterate the contents | `Map` | Directly iterable, `for...of` gives `[k,v]`. Objects need `Object.entries` |
| `JSON.stringify` round-trip | **object** | `JSON.stringify(new Map([['a',1]])) // => '{}'` — Maps serialise to nothing |
| Keys come from user input / JSON | `Map` | `({})['__proto__']` is `Object.prototype`; assigning it **changes the prototype**, adds no own key. `new Map().set('__proto__',1)` is just an ordinary entry |
| Frequent add + delete (queues, caches, indexes) | `Map` | Built for it. `delete o.k` forces objects out of their fast hidden-class shape |
| Fixed known shape, methods, `class` instance | **object** | Field access is optimised into a fixed slot; `Map` can't do prototypes or methods |
| Spread / destructure / rest | **object** | `{...o}`, `const {a} = o` don't work on `Map` |

```js
const o = {}; o['__proto__'] = { evil: 1 };
Object.keys(o)            // => []        no own key was created
o.evil                    // => 1         you just replaced the prototype
new Map().set('__proto__', 1).get('__proto__')   // => 1, ordinary entry, size 1
```

**Escape hatch.** If you must key by user strings on an object, use `Object.create(null)` —
then `'__proto__'` is a plain own key (`Object.keys` → `['__proto__']`). `JSON.parse` is
already safe: it creates `__proto__` as an own data property, not a prototype swap.

### Array vs Set

| Need | Use | Why |
| --- | --- | --- |
| Membership tests in a loop | `Set` | `s.has(x)` hash lookup vs `arr.includes(x)` linear scan |
| Dedupe | `Set` | `[...new Set(arr)]` — one pass, insertion order kept |
| Index access, `sort`, `map`, `slice` | **array** | `Set` has none of these; convert with `[...s]` |
| Duplicates are meaningful | **array** | `Set` silently collapses them |
| `JSON.stringify` | **array** | `JSON.stringify(new Set([1,2])) // => '{}'`; spread first |
| Frequent remove-by-value | `Set` | `s.delete(v)` O(1) vs `splice(indexOf(v),1)` O(n) + reindex |
| Set algebra (union/intersection/diff) | `Set` | ES2025 methods, above |

## Cloning & merging

| Technique | Depth | Keeps | Loses / breaks |
| --- | --- | --- | --- |
| `const b = a` | none | it *is* `a` | Not a copy at all. `b.x = 1` mutates `a` |
| `{...a}` | shallow | own enumerable string **and symbol** keys; **reads** getters | prototype, getter-ness (becomes a plain value), non-enumerables, inherited props |
| `Object.assign(t, a)` | shallow | same set as spread | same, **plus** it fires setters already on `t` and mutates `t` |
| `structuredClone(a)` | deep | `Date` `Map` `Set` `RegExp` `Error` `ArrayBuffer` TypedArray `BigInt`, **cycles** | functions, symbols, DOM nodes, class prototypes, getters, property descriptors |
| `JSON.parse(JSON.stringify(a))` | deep-ish | plain JSON only | see below — silently |
| `Object.defineProperties({}, Object.getOwnPropertyDescriptors(a))` | shallow | getters/setters, non-enumerables, flags | still shallow; set the prototype yourself |
| Manual recursive clone | whatever you write | whatever you write | your own bugs on cycles — track visited nodes |

```js
structuredClone({ f(){} })      // throws DOMException DataCloneError: f(){} could not be cloned
structuredClone(Symbol('s'))    // throws DOMException DataCloneError
const o = { n: 1 }; o.self = o; const c = structuredClone(o);
c.self === c                    // => true   cycle rebuilt inside the copy, and c !== o
JSON.stringify(o)               // throws TypeError: Converting circular structure to JSON
```

**Gotcha.** `structuredClone` is all-or-nothing: one function anywhere in the tree kills the
whole clone. It also drops the prototype — `structuredClone(new Point()).constructor === Object`.

```js
JSON.stringify({ u: undefined, d: new Date(0), m: new Map([['a',1]]), n: NaN, i: Infinity,
                 f(){}, r: /a/g })
// => '{"d":"1970-01-01T00:00:00.000Z","m":{},"n":null,"i":null,"r":{}}'
JSON.stringify([undefined, function(){}, NaN])   // => '[null,null,null]'
```

| JSON round-trip does this | Result |
| --- | --- |
| `undefined` value in an object | key dropped entirely |
| `undefined` / function in an **array** | becomes `null` (holds the index) |
| `Date` | ISO **string** — not a `Date` on the way back |
| `Map` / `Set` / `RegExp` / class instance | `{}` — all contents gone, no error |
| `NaN` / `Infinity` / `-Infinity` | `null` |
| `BigInt` | throws `TypeError: Do not know how to serialize a BigInt` |
| cycle | throws `TypeError: Converting circular structure to JSON` |
| `Symbol` key or value | dropped |

### Shallow merge precedence

```js
({ ...{a:1,b:1}, ...{b:2} })   // => {a:1, b:2}   later spread wins
({ ...null, ...undefined, a:1 })   // => {a:1}    nullish sources are ignored, no throw
```

Order is left-to-right, last writer wins. A later `undefined` **does** overwrite:
`{...{a:1}, ...{a:undefined}}` → `{a: undefined}`. To keep defaults, filter first.

### Deep merge recipe

```js
const deepMerge = (a, b) => {
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  return Object.entries(b).reduce((out, [k, v]) =>
    ({ ...out, [k]: isObj(v) && isObj(a[k]) ? deepMerge(a[k], v) : v }), { ...a });
};
deepMerge({a:{x:1,y:2}, k:[1]}, {a:{y:9,z:3}, k:[2]})  // => {a:{x:1,y:9,z:3}, k:[2]}
```

Arrays are replaced, not concatenated — decide that policy explicitly. Skip keys named
`__proto__`/`constructor` if `b` came from user input.

## Iterating

| Construct | Iterates | Prototype chain? | Notes |
| --- | --- | --- | --- |
| `for (const k in o)` | own + **inherited** enumerable string keys | **yes** | Sees anything anyone added to `Object.prototype`. Guard with `Object.hasOwn` or don't use it |
| `for (const v of it)` | values of an **iterable** | no | Objects are not iterable: `for (const x of {a:1})` → `TypeError: ... is not iterable` |
| `Object.keys/values/entries(o)` | own enumerable string keys | no | The safe default for plain objects |
| `Reflect.ownKeys(o)` | own strings + symbols, enumerable or not | no | For metaprogramming |
| `m.forEach((v,k)=>{})` | Map/Set entries | n/a | Value first, key second |

```js
const arr = ['a','b']; arr.extra = 'x';
for (const k in arr) {}   // '0', '1', 'extra'  — string indices plus stray props
for (const v of arr) {}   // 'a', 'b'
```

Never use `for...in` on arrays: string keys, arbitrary extras, and prototype pollution.

## Recipes

### Pick keys

```js
const pick = (o, ks) => Object.fromEntries(ks.filter(k => k in o).map(k => [k, o[k]]));
pick({a:1,b:2,c:3}, ['a','c','zz'])   // => {a:1, c:3}
```

Swap `k in o` for `Object.hasOwn(o,k)` if inherited keys must not leak through.

### Omit keys

```js
const omit = (o, ks) => Object.fromEntries(Object.entries(o).filter(([k]) => !ks.includes(k)));
omit({a:1,b:2,c:3}, ['b'])   // => {a:1, c:3}
```

### Invert an object

```js
const invert = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
invert({a:'x', b:'y'})   // => {x:'a', y:'b'}
```

Duplicate values collide — last one wins. Non-string values are stringified.

### Map over values

```js
const mapValues = (o, f) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v)]));
mapValues({a:1, b:2}, n => n * 10)   // => {a:10, b:20}
```

### Deep get with default

```js
const getIn = (o, path, dflt) => path.split('.').reduce((acc, k) => acc?.[k], o) ?? dflt;
getIn({a:{b:{c:1}}}, 'a.b.c', 0)   // => 1
getIn({}, 'a.b.c', 'dflt')         // => 'dflt'
```

`??` means a stored `null` also yields the default. Use `=== undefined` if that matters.

### Count occurrences with a Map

```js
const counts = new Map();
for (const w of ['a','b','a']) counts.set(w, (counts.get(w) ?? 0) + 1);
[...counts]   // => [['a',2], ['b',1]]
```

### Dedupe objects by key

```js
const rows = [{id:1,n:'a'}, {id:1,n:'b'}, {id:2,n:'c'}];
[...new Map(rows.map(r => [r.id, r])).values()]   // => [{id:1,n:'b'}, {id:2,n:'c'}]
```

Last duplicate wins. For first-wins, `rows.toReversed()` before building the map.

### Map ⇄ object

```js
new Map(Object.entries({a:1}))          // => Map(1) {'a' => 1}
Object.fromEntries(new Map([['a',1]]))  // => {a:1}
```

Object→Map→object loses nothing for string keys; Map→object loses non-string keys.

### Sort an object's entries

```js
Object.fromEntries(Object.entries({b:2, a:1, c:3}).sort(([, x], [, y]) => y - x))
// => {c:3, b:2, a:1}
```

Only holds if no key is integer-like — those get re-sorted to the front regardless.

### Safe key access on user input

```js
const safeGet = (o, k) => (Object.hasOwn(o, k) ? o[k] : undefined);
safeGet({}, 'constructor')   // => undefined   (plain o['constructor'] => Object)
```

For a whole user-keyed store, build it with `Object.create(null)` — or just use a `Map`.

---
*See also: [array-methods.md](array-methods.md) · [es2020-plus.md](es2020-plus.md) · [js-gotchas.md](js-gotchas.md) · [big-o.md](big-o.md)*
