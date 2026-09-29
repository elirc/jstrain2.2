# 01 · Language Core — types, coercion, equality, scope, destructuring

Cover the answer, commit out loud, then reveal. If you hedge, you got it wrong.

---

### Q1 — typeof zoo

What does this print?

```js
console.log(typeof null);
console.log(typeof undefined);
console.log(typeof NaN);
console.log(typeof function () {});
console.log(typeof []);
```

<details><summary>Answer</summary>

**`object`, `undefined`, `number`, `function`, `object`** — `typeof` reports the internal type tag, not the thing you mean.

`typeof null === 'object'` is a bug frozen into the language since 1995: the original tagging scheme stored the type in the low bits of a pointer and the null pointer was all zeros — the same tag as objects. `NaN` is a number because it lives in the IEEE-754 double space; it just isn't a *usable* one. `typeof []` is `object` because arrays are objects — use `Array.isArray(x)` when you need to know. `function` is the one special case `typeof` gets right that `Array.isArray`-style checks would need for objects.
</details>

---

### Q2 — truthiness table

What does this print?

```js
console.log(Boolean(''), Boolean('0'), Boolean('false'));
console.log(Boolean([]), Boolean({}), Boolean(0), Boolean(-0));
```

<details><summary>Answer</summary>

**`false true true`** then **`true true false false`** — memorize the falsy list, everything else is truthy.

The complete falsy set is exactly eight values: `false`, `0`, `-0`, `0n`, `''`, `null`, `undefined`, `NaN`. Nothing else. Every object is truthy — including `[]`, `{}`, `new Boolean(false)`, and `function(){}` — because `ToBoolean` on an object returns `true` without ever looking inside. That's why `if (results)` does not tell you whether `results` has items; you need `results.length`.
</details>

---

### Q3 — plus versus minus

What does this print?

```js
console.log('5' + 3);
console.log('5' - 3);
console.log('5' * '2');
console.log(1 + 2 + '3' + 4 + 5);
```

<details><summary>Answer</summary>

**`53`, `2`, `10`, `3345`** — `+` is the only arithmetic operator that also means "concatenate".

If either operand of `+` is a string after `ToPrimitive`, the whole thing becomes string concatenation. Every other arithmetic operator (`-`, `*`, `/`, `%`, `**`) has no string meaning, so it forces both sides through `ToNumber`. The last line shows `+` is left-associative: `1 + 2` is `3` (numbers), then `3 + '3'` flips to strings and gives `'33'`, and from there it's concatenation all the way down.
</details>

---

### Q4 — float arithmetic

What does this print?

```js
console.log(0.1 + 0.2);
console.log(0.1 + 0.2 === 0.3);
console.log((0.1 + 0.2).toFixed(2));
```

<details><summary>Answer</summary>

**`0.30000000000000004`, `false`, `0.30`** — every JS number is an IEEE-754 binary double, and 0.1 has no exact binary representation.

0.1 in binary is a repeating fraction, exactly like 1/3 in decimal. It gets rounded to the nearest double, and the rounding error survives the addition. Never compare floats with `===`; compare `Math.abs(a - b) < Number.EPSILON * someScale`, or do money in integer cents. `toFixed` rounds for display and returns a **string**, not a number — that trips people up in the next line of code.
</details>

---

### Q5 — nullish versus or

What does this print?

```js
const port = 0;
const name = '';
console.log(port || 3000);
console.log(port ?? 3000);
console.log(name || 'anon');
console.log(name ?? 'anon');
```

<details><summary>Answer</summary>

**`3000`, `0`, `anon`, and an empty line** (the empty string) — `||` tests falsiness, `??` tests only `null`/`undefined`.

`0` and `''` are falsy but perfectly valid values, so `||` silently throws them away and substitutes the default. `??` only kicks in for the two "absent" values, which is almost always what you actually mean for config defaults, counts, and user input. This exact bug is why "port 0" and "empty display name" tickets exist. Note `??` cannot be mixed with `&&`/`||` without parentheses — that's a syntax error on purpose.
</details>

---

### Q6 — const is not frozen

What does this print?

```js
const cfg = { retries: 3 };
cfg.retries = 5;
console.log(cfg.retries);
cfg = { retries: 9 };
```

<details><summary>Answer</summary>

**`5`, then a `TypeError: Assignment to constant variable.`** — `const` freezes the binding, not the value.

`const` says "this name will never be rebound to a different value." It says nothing about the object that value points at, so mutating properties is legal. Reassigning the variable itself throws at runtime. If you want the object immutable too, `Object.freeze(cfg)` — but that's shallow, so nested objects stay mutable.
</details>

---

### Q7 — var hoisting

What does this print?

```js
function f() {
  console.log(v);
  var v = 1;
  console.log(v);
}
f();
```

<details><summary>Answer</summary>

**`undefined`, then `1`** — `var` declarations hoist to the top of the function and are initialized to `undefined`.

The engine splits `var v = 1` into two parts: the declaration moves to the top of the enclosing *function* scope, and the assignment stays where you wrote it. So at the first log the binding exists but holds `undefined`. Note `var` is function-scoped, not block-scoped — a `var` inside an `if` or `for` block is visible to the whole function. This is the entire reason `let` exists.
</details>

---

### Q8 — temporal dead zone

What does this print?

```js
console.log(typeof x);
let x = 5;
```

<details><summary>Answer</summary>

**`ReferenceError: Cannot access 'x' before initialization`** — `let` and `const` hoist too, but into the temporal dead zone.

The binding for `x` is created when the block is entered, but it stays uninitialized until execution reaches the `let` line. Touching it in that window throws — and note that even `typeof`, which is normally the one safe way to poke at an unknown name, throws here. That's deliberate: TDZ turns "used before defined" from a silent `undefined` into a loud crash.
</details>

---

### Q9 — loose null equality

What does this print?

```js
console.log(null == undefined);
console.log(null === undefined);
console.log(null == 0);
console.log(null >= 0);
```

<details><summary>Answer</summary>

**`true`, `false`, `false`, `true`** — the last two together are the famous inconsistency.

`==` has a hardcoded rule: `null` and `undefined` are loosely equal to each other and to *nothing else*. So `null == 0` is `false` — no numeric conversion happens at all. But relational operators (`<`, `>`, `<=`, `>=`) use a different algorithm that does convert, and `Number(null)` is `0`, so `null >= 0` is `0 >= 0` which is `true`. This is why `x == null` is the one idiomatic use of `==`: it's a clean "is this null or undefined" check.
</details>

---

### Q10 — NaN identity

What does this print?

```js
console.log(NaN === NaN);
console.log([NaN].includes(NaN));
console.log([NaN].indexOf(NaN));
console.log(Object.is(NaN, NaN));
```

<details><summary>Answer</summary>

**`false`, `true`, `-1`, `true`** — `NaN` is the only value not equal to itself, and array methods disagree about it.

IEEE-754 mandates that `NaN` compares unequal to everything, itself included. `indexOf` uses strict equality, so it can never find a `NaN` and returns `-1`. `includes` deliberately uses SameValueZero, which treats `NaN` as matching `NaN` (but still treats `+0` and `-0` as equal). `Object.is` uses SameValue: like SameValueZero but it also distinguishes `+0` from `-0`. Use `Number.isNaN(x)` to test, never `x === NaN`.
</details>

---

### Q11 — parseInt versus Number

What does this print?

```js
console.log(parseInt('42px'), Number('42px'));
console.log(parseInt(''), Number(''));
console.log(parseInt('08'), Number('08'));
console.log(Number(null), Number(undefined), Number([]), Number([7]));
```

<details><summary>Answer</summary>

**`42 NaN`**, **`NaN 0`**, **`8 8`**, **`0 NaN 0 7`** — `parseInt` scans and gives up; `Number` demands the whole string.

`parseInt` reads leading digits and stops at the first character it can't use, so `'42px'` yields `42` and `''` yields `NaN` (no digits at all). `Number` converts the entire trimmed string or returns `NaN`, but `Number('')` is `0` because the empty string converts to zero. The array cases come from `ToPrimitive`: `[]` stringifies to `''` → `0`, `[7]` stringifies to `'7'` → `7`. Always pass the radix: `parseInt(s, 10)`.
</details>

---

### Q12 — spread is shallow

What does this print?

```js
const a = { id: 1, tags: ['x'] };
const b = { ...a };
b.id = 2;
b.tags.push('y');
console.log(a.id, a.tags);
```

<details><summary>Answer</summary>

**`1 [ 'x', 'y' ]`** — spread copies one level; nested objects are still shared references.

`{ ...a }` builds a new object and copies each own enumerable property *value*. For `id` that value is the primitive `1`, so `b.id = 2` is isolated. For `tags` the value is a reference to the same array, so `b.tags` and `a.tags` are literally the same array object. This is the single most common "my state mutated and React didn't re-render / did re-render everything" bug. Deep copy with `structuredClone(a)` when you need real isolation.
</details>

---

### Q13 — destructuring defaults

What does this print?

```js
function greet({ name = 'friend' } = {}) {
  return 'hi ' + name;
}
console.log(greet());
console.log(greet({}));
console.log(greet({ name: undefined }));
console.log(greet({ name: null }));
```

<details><summary>Answer</summary>

**`hi friend`, `hi friend`, `hi friend`, `hi null`** — default values fire on `undefined` only.

A destructuring default is a strict `=== undefined` check, exactly like a parameter default. `null` is a real value, so it passes straight through and gets string-concatenated as `'null'`. The `= {}` on the parameter itself is what makes the no-argument call work — without it, destructuring `undefined` throws "Cannot destructure property". Two defaults, two different jobs.
</details>

---

### Q14 — string immutability

What does this print?

```js
const s = 'hello';
s[0] = 'H';
console.log(s);
console.log(s.toUpperCase(), s);
```

<details><summary>Answer</summary>

**`hello`**, then **`HELLO hello`** — strings are primitives and cannot be mutated in place.

The index assignment fails silently in sloppy mode (it throws in strict mode / ESM modules — worth knowing which one you're in). Every string method returns a *new* string and leaves the original untouched: `toUpperCase`, `trim`, `replace`, `slice`, all of them. If a string method's return value isn't captured, it did nothing. Same lesson as `arr.map()` — the difference is that arrays also have genuinely mutating methods, and strings have none.
</details>

---

### Q15 — optional chaining

What does this print?

```js
const user = { profile: null };
console.log(user.profile?.city);
console.log(user.profile?.city ?? 'unknown');
console.log(user.missing?.deep?.value);
```

<details><summary>Answer</summary>

**`undefined`, `unknown`, `undefined`** — `?.` short-circuits the whole rest of the chain to `undefined`.

When the left side is `null` or `undefined`, evaluation of everything after it is abandoned and the expression result is `undefined` — note it's `undefined` even when the left side was `null`. That's precisely why `?.` pairs so naturally with `??`. The third line shows the short-circuit is not one link but the entire chain: once `user.missing` is `undefined`, `?.deep?.value` is never evaluated, so there's no crash.
</details>

---

### Q16 — spread identity and merge order

What does this print?

```js
const arr = [1, 2, 3];
const copy = [...arr];
console.log(copy === arr, copy[0] === arr[0]);
const merged = { ...{ a: 1, b: 2 }, ...{ b: 3 } };
console.log(merged);
```

<details><summary>Answer</summary>

**`false true`**, then **`{ a: 1, b: 3 }`** — spread makes a new container with the same contents, and last write wins.

`copy === arr` is `false` because `===` on objects compares identity, and spread built a brand new array. The elements are primitives copied by value, so `copy[0] === arr[0]` is `true`. In object spread, properties are assigned left to right, so a later source overwrites an earlier key — this is exactly how `{ ...defaults, ...overrides }` works, and reversing the order silently breaks it.
</details>

---

### Q17 — typeof on an undeclared name

What does this print?

```js
console.log(typeof nothingHere);
console.log(nothingHere);
```

<details><summary>Answer</summary>

**`undefined`, then `ReferenceError: nothingHere is not defined`** — `typeof` is the one operator allowed to reference a name that doesn't exist.

For a never-declared identifier, `typeof` returns the string `'undefined'` instead of throwing; every other use of that name is a `ReferenceError`. That safety valve was designed for feature detection in the browser (`typeof fetch !== 'undefined'`). Compare to Q8: for a `let` in its temporal dead zone the name *does* exist, so even `typeof` throws. Same-looking code, opposite outcomes.
</details>

---

### Q18 — switch equality

What does this print?

```js
switch ('1') {
  case 1:
    console.log('number one');
    break;
  case '1':
    console.log('string one');
    break;
  default:
    console.log('neither');
}
```

<details><summary>Answer</summary>

**`string one`** — `switch` matches with strict equality, never loose.

The spec says case comparison uses the Strict Equality Comparison algorithm, so `'1'` never matches `case 1`. This bites hardest with values off the wire — a route param, a form field, a `data-` attribute — which are strings even when they look like numbers. Convert explicitly at the boundary (`Number(id)`) rather than hoping the comparison is forgiving.
</details>

---

### Q19 — array loose-equals false

What does this print?

```js
console.log([] == false);
console.log([] == '');
console.log(!![]);
```

<details><summary>Answer</summary>

**`true`, `true`, `true`** — `==` converts both sides to primitives; `!!` does not.

`==` with a boolean first converts the boolean to a number, so it becomes `[] == 0`. Then object vs number sends the array through `ToPrimitive`, which calls `toString()` and yields `''`, and `Number('')` is `0`. So `0 == 0` → `true`. Meanwhile `!![]` uses `ToBoolean`, which returns `true` for *any* object without inspecting it. Hence the punchline: an empty array is truthy AND loosely equal to `false`. Use `===`.
</details>

---

### Q20 — keys are strings

What does this print?

```js
const key = 1;
const obj = {};
obj[key] = 'a';
obj['1'] = 'b';
console.log(obj);
console.log(Object.keys(obj));
```

<details><summary>Answer</summary>

**`{ '1': 'b' }`** and **`[ '1' ]`** — every plain-object key is coerced to a string (or a Symbol).

`obj[1]` and `obj['1']` address the identical property slot, so the second write overwrites the first and there is only ever one key. The same coercion means `obj[{}]` becomes the key `'[object Object]'` — so two different objects used as keys collide. When you need real object or number keys with identity, use a `Map`.
</details>

---

### Q21 — comparison chaining

What does this print?

```js
console.log(1 < 2 < 3);
console.log(3 > 2 > 1);
```

<details><summary>Answer</summary>

**`true`, then `false`** — and the `true` is an accident.

Relational operators are left-associative and produce a boolean, so `1 < 2 < 3` evaluates to `true < 3`, then `ToNumber(true)` is `1`, and `1 < 3` is `true`. The second line does the same dance: `3 > 2` is `true`, `true > 1` is `1 > 1`, which is `false`. JavaScript has no chained comparison — write `2 > 1 && 3 > 2` and mean it.
</details>

---

### Q22 — array plus object

What does this print?

```js
console.log(typeof typeof 1);
console.log([] + {});
console.log(typeof ([] + {}));
```

<details><summary>Answer</summary>

**`string`, `[object Object]`, `string`** — `typeof` always returns a string, and `+` on two objects concatenates their string forms.

`typeof 1` is the string `'number'`, so `typeof` of that is `'string'` — `typeof typeof x` is always `'string'`. For `[] + {}`: neither side is a number-preferring primitive, so both go through `ToPrimitive` with the default hint. `[].toString()` is `''` and `({}).toString()` is `'[object Object]'`, so you get `'' + '[object Object]'`. (In a browser console, `{} + []` typed at the prompt prints `0` instead — the leading `{}` parses as an empty *block*, not an object.)
</details>

---

### Q23 — default versus null in arrays

What does this print?

```js
const [first = 10, second = 20] = [undefined, null];
console.log(first, second);
```

<details><summary>Answer</summary>

**`10 null`** — array destructuring defaults follow the same `undefined`-only rule as object ones.

The hole filled with `undefined` triggers the default and gives `10`. `null` is a present value, so `second` stays `null` and the `= 20` never runs. Same trap as Q13, and it's especially nasty with JSON payloads, where an API distinguishing "field absent" from "field explicitly null" will slip past your defaults. If `null` should also fall back, write `second ?? 20` after destructuring.
</details>

---

### Q24 — accidental global

What does this print?

```js
let counter = 0;
function bump() {
  counter = counter + 1;
  total = 10;
}
bump();
console.log(counter, total, typeof globalThis.total);
```

<details><summary>Answer</summary>

**`1 10 number`** — `total` was never declared, so sloppy mode silently created a global.

Assigning to an undeclared identifier in non-strict code walks the scope chain, finds nothing, and creates a property on the global object instead of throwing. That's how a typo inside one function quietly becomes shared mutable state across your whole program. In strict mode — which every ES module and every `class` body is, automatically — the same line throws `ReferenceError: total is not defined`. Add `'use strict'` or use modules, and this whole class of bug disappears.
</details>

---

### Q25 — the three logical assignments

What does this print?

```js
const cfg = { retries: 0, name: '', tags: null };
cfg.retries ||= 3;
cfg.name ??= 'anon';
cfg.tags &&= cfg.tags.length;
console.log(cfg);
```

<details><summary>Answer</summary>

**`{ retries: 3, name: '', tags: null }`** — each operator inherits the short-circuit rule of the operator it's named after.

`||=` assigns when the left side is *falsy*, so `0` gets replaced — the same Q5 bug, now hiding inside an assignment. `??=` assigns only for `null`/`undefined`, so the empty string survives. `&&=` assigns only when the left side is *truthy*, so a `null` stays `null` and `cfg.tags.length` is never evaluated — which is exactly what makes `&&=` safe for "update it if it exists". Pick by the question you're really asking: "is it missing" is `??=`, "is it empty-ish" is `||=`.
</details>

---

### Q26 — the assignment that doesn't happen

What does this print?

```js
let writes = 0;
const obj = {
  _v: 1,
  get v() { return this._v; },
  set v(n) { writes += 1; this._v = n; },
};
obj.v ||= 5;
console.log(obj.v, writes);
obj.v &&= 9;
console.log(obj.v, writes);
```

<details><summary>Answer</summary>

**`1 0`**, then **`9 1`** — the logical assignment operators short-circuit the *write*, not just the right-hand expression.

`x ||= y` is defined as `x || (x = y)`, not as `x = x || y`. Since `obj.v` is already truthy, the assignment never executes, so the setter never runs and `writes` stays `0`. That matters whenever the target has a setter, a `Proxy` trap, or a reactive framework's dependency tracking behind it — the naive `x = x || y` rewrite triggers a write (and a re-render) every single time. `&&=` finds a truthy value, so it does assign and the counter moves.
</details>

---

### Q27 — symbols are unique

What does this print?

```js
const a = Symbol('id');
const b = Symbol('id');
console.log(typeof a, a === b, a.description);
console.log(Symbol.for('app') === Symbol.for('app'));
console.log(String(a));
try {
  console.log('x' + a);
} catch (e) {
  console.log(e.constructor.name + ':', e.message);
}
```

<details><summary>Answer</summary>

**`symbol false id`**, **`true`**, **`Symbol(id)`**, then **`TypeError: Cannot convert a Symbol value to a string`** — the description is a label, not an identity.

Every `Symbol()` call mints a value equal only to itself, which is the whole point: a symbol key can never collide with anyone else's key. `Symbol.for(k)` is the deliberate exception — it looks the symbol up in a cross-realm global registry, so the same string gives the same symbol. `String(sym)` works, but implicit string coercion throws, on purpose, so you can't accidentally stringify a symbol key into a log line and lose its identity.
</details>

---

### Q28 — symbol keys are invisible

What does this print?

```js
const KEY = Symbol('meta');
const obj = { visible: 1, [KEY]: 2 };
console.log(Object.keys(obj), JSON.stringify(obj));
console.log(Object.getOwnPropertySymbols(obj).length, obj[KEY]);
console.log({ ...obj }[KEY]);
```

<details><summary>Answer</summary>

**`[ 'visible' ] {"visible":1}`**, **`1 2`**, **`2`** — symbol-keyed properties are skipped by every string-key enumeration, but they are still copied by spread.

`Object.keys`, `entries`, `values`, `for...in`, and `JSON.stringify` all walk *string* keys only, so a symbol key is genuinely hidden from serialization and from generic "copy the fields" code. It is not private, though: `Object.getOwnPropertySymbols` and `Reflect.ownKeys` find it, and spread and `Object.assign` copy own *enumerable* properties including symbol-keyed ones. That combination — invisible to JSON, preserved across a copy — is why libraries use symbols for internal metadata.
</details>

---

### Q29 — Symbol.toPrimitive wins

What does this print?

```js
const money = {
  amount: 5,
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.amount : 'USD ' + this.amount;
  },
};
console.log(+money, `${money}`, money + '', money * 2);
```

<details><summary>Answer</summary>

**`5 USD 5 USD 5 10`** — every coercion site passes a hint, and `Symbol.toPrimitive` sees it.

Unary `+` and `*` ask for `'number'`. A template literal and `String()` ask for `'string'`. Binary `+` asks for `'default'`, which is why `money + ''` takes the same branch as the template literal here — `'default'` is not `'number'`, and any code that assumes it is will be wrong for exactly this case. When present, `Symbol.toPrimitive` replaces the whole `valueOf`/`toString` dance; `Date` is the built-in that uses it to make `+date` a timestamp and `${date}` a sentence.
</details>

---

### Q30 — valueOf goes first

What does this print?

```js
const obj = {
  valueOf() { return 10; },
  toString() { return 'ten'; },
};
console.log(obj + 1, `${obj}`, String(obj), obj * 2, [obj].join(''));
```

<details><summary>Answer</summary>

**`11 ten ten 20 ten`** — for the default and number hints, `valueOf` is tried first; for the string hint, `toString` is.

`ToPrimitive` with hint `'default'` or `'number'` calls `valueOf`, and only falls through to `toString` if `valueOf` returned an object. With hint `'string'` the order flips. So `obj + 1` uses the number `10` and adds, while `${obj}` and `String(obj)` use `'ten'`. `Array.prototype.join` stringifies each element, which is why the array case also reads `toString`. Defining both and forgetting which one a given operator reaches is how "5" and 5 end up in the same column of a report.
</details>

---

### Q31 — BigInt does not mix

What does this print?

```js
console.log(typeof 10n, 10n === 10, 10n == 10);
console.log(7n / 2n, 2n ** 64n > Number.MAX_SAFE_INTEGER);
try {
  console.log(1n + 1);
} catch (e) {
  console.log(e.constructor.name + ':', e.message);
}
```

<details><summary>Answer</summary>

**`bigint false true`**, **`3n true`**, then **`TypeError: Cannot mix BigInt and other types, use explicit conversions`** — BigInt is a separate primitive type with integer-only arithmetic.

`===` compares type first, so `10n === 10` is `false`, while `==` is allowed to compare across the numeric types and says `true`. Division truncates toward zero — `7n / 2n` is `3n`, not `3.5` — because there are no fractions in BigInt. Arithmetic refuses to mix the two types at all, since silently converting either way would either lose precision or invent it. Comparison operators *are* allowed to mix, which is the inconsistency to remember. Convert explicitly with `BigInt(x)` or `Number(x)`.
</details>

---

### Q32 — the precision BigInt exists for

What does this print?

```js
const big = 9007199254740993n;
console.log(Number(big) === 9007199254740992);
console.log(big.toString(), String(big));
try {
  JSON.stringify({ big });
} catch (e) {
  console.log(e.constructor.name + ':', e.message);
}
```

<details><summary>Answer</summary>

**`true`**, **`9007199254740993 9007199254740993`**, then **`TypeError: Do not know how to serialize a BigInt`** — converting to `Number` above 2^53 silently rounds.

`Number.MAX_SAFE_INTEGER` is 9007199254740991; past it, doubles can no longer represent every integer, so 9007199254740993 rounds to its even neighbour with no error. That's the real-world bug behind mangled Twitter/Discord snowflake IDs and 64-bit database keys — always transport them as strings. `JSON.stringify` refuses BigInt outright rather than guess; give the value a `toJSON`, or convert to a string yourself at the boundary.
</details>

---

### Q33 — structuredClone goes deep

What does this print?

```js
const src = { id: 1, tags: ['x'], when: new Date(0), m: new Map([['k', 1]]) };
const copy = structuredClone(src);
copy.tags.push('y');
console.log(src.tags, copy.when instanceof Date, copy.m.get('k'));
const cyc = { n: 1 };
cyc.self = cyc;
console.log(structuredClone(cyc).self.self.n);
```

<details><summary>Answer</summary>

**`[ 'x' ] true 1`**, then **`1`** — a real deep copy: nested arrays are independent, and `Date`, `Map`, and `Set` survive as themselves.

This is the fix for every shallow-copy question in this file. `structuredClone` (built into Node 17+ and every modern browser) implements the structured clone algorithm, which walks the graph, keeps a map of already-visited objects, and therefore handles cycles instead of throwing the way `JSON.stringify` does. It also preserves `RegExp`, `ArrayBuffer`, `Error`, and typed arrays — everything the JSON round trip destroys.
</details>

---

### Q34 — what structuredClone refuses

What does this print?

```js
class Point {
  constructor(x) { this.x = x; }
  scaled() { return this.x * 2; }
}
const p = structuredClone(new Point(3));
console.log(p.x, p instanceof Point, typeof p.scaled);
try {
  structuredClone({ run() {} });
} catch (e) {
  console.log(e.name + ':', e.message);
}
```

<details><summary>Answer</summary>

**`3 false undefined`**, then **`DataCloneError: run() {} could not be cloned.`** — the algorithm copies data, and a function is not data.

Class instances come back as plain objects: own properties intact, prototype gone, so `instanceof` fails and every method is missing. Anything holding a function — a callback, a class with methods stored on the instance, a DOM node, a `WeakMap`, a `Proxy` — throws a `DataCloneError` rather than silently dropping it. The mental model is "whatever `postMessage` could send to a worker", because that is literally the same algorithm.
</details>

---

### Q35 — literals versus strings of literals

What does this print?

```js
console.log(Number('0x1f'), Number('0b101'), Number('0o17'), Number('1e3'));
console.log(parseInt('0x1f'), parseInt('0b101'), parseInt('1e3'));
console.log(Number('12_000'), 12_000);
```

<details><summary>Answer</summary>

**`31 5 15 1000`**, **`31 0 1`**, **`NaN 12000`** — `Number` understands the full numeric-literal grammar; `parseInt` understands hex and nothing else.

`Number` accepts every prefix the language accepts, including binary and octal. `parseInt` special-cases `0x` (that's the last survivor of its old auto-radix behaviour), but `'0b101'` stops at the `b` and gives `0`, and `'1e3'` stops at the `e` and gives `1` — a quietly catastrophic answer for a scientific-notation value coming out of a CSV. Numeric separators are a *source-code* feature only: `12_000` is a valid literal, `Number('12_000')` is `NaN`.
</details>

---

### Q36 — the corners of Number()

What does this print?

```js
console.log(Number(' \n 12 \t '), Number('12a'), Number([]), Number(['7']), Number([1, 2]));
console.log(Number(false), Number(null), Number(undefined));
console.log(+'' === 0, Number('Infinity'), Number('infinity'));
```

<details><summary>Answer</summary>

**`12 NaN 0 7 NaN`**, **`0 0 NaN`**, **`true Infinity NaN`** — whitespace is trimmed, everything else must be the whole number.

Leading and trailing whitespace (including newlines and tabs) is stripped before conversion, which is why a value pasted with a stray newline still converts. The array cases run through `ToPrimitive`, so `[]` becomes `''` becomes `0` and `['7']` becomes `'7'` becomes `7`. `null` converts to `0` but `undefined` converts to `NaN` — the one place those two behave differently, and the reason a missing field can turn a total into `NaN` while an explicitly null one turns it into a silently wrong `0`. `'Infinity'` is recognized; it is case-sensitive.
</details>

---

### Q37 — loose equality calls your code

What does this print?

```js
const box = { valueOf() { return 2; } };
console.log(box == 2, box === 2, box > 1);
let calls = 0;
const once = { valueOf() { calls += 1; return 1; } };
console.log(once == 1, once == 1, calls);
```

<details><summary>Answer</summary>

**`true false true`**, then **`true true 2`** — `==` and the relational operators invoke `valueOf` on every comparison.

`==` between an object and a number converts the object with `ToPrimitive` first, so your method runs and the comparison succeeds; `===` compares types, sees object versus number, and returns `false` without calling anything. The counter proves the conversion is not cached — two comparisons, two calls. That's the deeper reason to avoid `==` on objects: it hands control of the comparison to arbitrary user code, which can be slow, side-effecting, or (with a mutable `valueOf`) inconsistent between two evaluations of the same expression.
</details>

---

### Q38 — concatenation puzzles

What does this print?

```js
console.log([] + []);
console.log([1] + [2]);
console.log([] == ![]);
console.log('b' + 'a' + +'a' + 'a');
```

<details><summary>Answer</summary>

**an empty line**, **`12`**, **`true`**, **`baNaNa`** — every one of these is `ToPrimitive` on an array producing a comma-joined string.

`[] + []` is `'' + ''`. `[1] + [2]` is `'1' + '2'`, which is why array concatenation with `+` gives you nonsense instead of `[1, 2]`. `![]` is `false` (arrays are truthy), so the third line is `[] == false`, which is Q19's chain all over again: boolean to `0`, array to `''` to `0`. The last one is the internet's favourite: `+'a'` is `NaN`, and `'ba' + NaN + 'a'` stringifies it. If you can narrate these, coercion holds no more surprises for you.
</details>

---

### Q39 — the operator you may not mix

What does this print?

```js
try {
  eval('null || undefined ?? "fallback"');
} catch (e) {
  console.log(e.constructor.name);
}
console.log((null || undefined) ?? 'fallback');
console.log(null ?? undefined ?? 'third');
```

<details><summary>Answer</summary>

**`SyntaxError`**, **`fallback`**, **`third`** — `??` cannot sit next to `&&` or `||` without parentheses, and it's a parse error, not a runtime one.

The spec forbids the unparenthesized combination precisely because there is no intuitive precedence between "falsy fallback" and "nullish fallback" — rather than pick one and let half the readers be wrong, the grammar makes you say which you meant. It's caught at parse time, so `eval` is the only way to observe it at runtime; written directly in a file, it stops the whole module from loading. Chaining `??` with itself is fine and short-circuits left to right.
</details>
