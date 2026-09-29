# 01 · Language Core

Most JavaScript bugs that survive code review are not algorithm bugs. They are
one of about a dozen small language facts that everyone half-knows: a `||` that
ate a legitimate `0`, a `typeof` that called `null` an object, a spread that
copied one level when you needed two, a loop that handed three closures the same
variable. This module drills those facts until they are reflexes. Everything
here shows up in interviews, and everything here shows up in production.

Read this page first (about 10 minutes), then work through the exercises in
order.

---

## The mental model

### 1. Two kinds of values: copied and shared

There are seven primitives — `string`, `number`, `boolean`, `undefined`,
`symbol`, `bigint`, `null` — and then there are objects (arrays, functions,
dates, Maps… all objects). Primitives are copied when you assign or pass them.
Objects are not: you get another handle on the same thing.

```js
let a = 1;      let b = a;      b += 1;        // a is still 1
const x = [1];  const y = x;    y.push(2);     // x is now [1, 2]
```

That one distinction explains "why did my state change?", why `===` on two
identical-looking objects is `false`, and why immutable updates spread every
level they touch.

### 2. Every operator has a conversion rule; `===` opts out

`==`, `+`, `<`, `if (…)` and template literals all convert their operands
first, each by its own rules. The three you actually need:

```js
0 == '';              // true  — both become numbers
null == undefined;    // true  — and equal to nothing else
if ('0') { }          // runs  — a non-empty string is truthy
```

`===` compares type first and never converts. `Object.is` is `===` with the two
historical warts fixed (NaN, -0). Use `===` everywhere except `value == null`,
which is the compact "is it null or undefined?" check.

### 3. Missing is not the same as falsy

`0`, `''` and `false` are legitimate values a user can choose. `null` and
`undefined` mean "nothing here". `||` cannot tell them apart; `??` can, and so
can a destructuring default (which fires on `undefined` only).

```js
0 || 50;        // 50   ← the bug
0 ?? 50;        // 0    ← what you meant
const { n = 50 } = { n: 0 };   // n is 0
const { m = 50 } = { m: null };// m is null — defaults ignore null
```

### 4. Bindings live in blocks, and closures capture bindings

`let` and `const` create a new binding per block — and, in a `for` header, per
iteration. A closure remembers the binding, not the value it had at capture
time. `var` has neither property: one function-scoped binding, shared by
everyone.

```js
const fns = [];
for (let i = 0; i < 3; i++) fns.push(() => i);
fns.map((f) => f());          // [0, 1, 2]   — with var: [3, 3, 3]
```

---

## The details that bite

1. **`typeof null === 'object'`** — a bug from 1995, kept for compatibility.
   Check `value === null` first, always.
   ```js
   typeof null;                      // 'object'
   ```
2. **`typeof []` is `'object'` too.** Use `Array.isArray(v)`.
   ```js
   Array.isArray([]);                // true
   ```
3. **`NaN !== NaN`.** It is the only value not equal to itself — which is how
   `Object.is` detects it. Use `Number.isNaN`, not the global `isNaN` (that one
   coerces: `isNaN('abc')` is `true`).
   ```js
   Number.isNaN(NaN);                // true
   ```
4. **`+0` and `-0` are `===` but not the same value.** `Object.is(0, -0)` is
   `false`, and so is `assert.deepStrictEqual`. Divide to tell them apart:
   `1 / -0` is `-Infinity`.
5. **Exactly eight falsy values:** `false`, `0`, `-0`, `0n`, `''`, `null`,
   `undefined`, `NaN`. Not on the list: `'0'`, `'false'`, `[]`, `{}`.
   ```js
   Boolean([]);                      // true
   ```
6. **`Number('')` is `0`,** and so are `Number(null)`, `Number([])` and `+' '`.
   An empty form field silently becomes zero.
7. **`parseInt` stops at the first character it dislikes.** `parseInt('42px')`
   is `42`; `parseInt('1e3')` is `1`. Use `Number` plus a validity check.
8. **`0.1 + 0.2 !== 0.3`.** Binary doubles cannot represent 0.1. Compare with a
   tolerance — and do **not** trust the naive multiply-round-divide shift:
   `Math.round(1.005 * 100) / 100` is `1`, not `1.01`, because `1.005 * 100`
   is really `100.49999999999999`. Exercise 10 builds the fix.
   ```js
   0.1 + 0.2;                        // 0.30000000000000004
   1.005 * 100;                      // 100.49999999999999 — rounds DOWN
   ```
9. **`Math.round(-2.5)` is `-2`.** Ties break toward `+Infinity`, not away from
   zero. Money code needs the sign handled explicitly.
10. **Integers stop being exact above `2 ** 53`.** `9007199254740992 + 1` is
    itself. Guard with `Number.isSafeInteger`; reach for `BigInt` past that.
11. **The TDZ is real.** `let`/`const` are hoisted but unreachable until their
    line runs — touching one throws `ReferenceError`. `var` hands you
    `undefined` instead, which is worse.
    ```js
    { x; let x = 1; }                // ReferenceError
    ```
12. **Destructuring defaults only replace `undefined`.** `{ a = 1 }` from
    `{ a: null }` gives you `null`. Same rule as `??`.
13. **Destructuring `undefined` throws.** `function f({ a }) {}` called as `f()`
    blows up; write `function f({ a } = {}) {}`.
14. **Spread is one level deep.** `{ ...post }` shares the nested `tags` array
    with the original — `push` mutates both.
15. **`structuredClone` is the built-in deep copy** (Dates, Maps, Sets, cycles),
    but it throws on functions and drops class prototypes. `JSON.parse(JSON.
    stringify(x))` destroys `undefined`, `Date` and `Map` silently.
16. **`table[key]` walks the prototype chain.** `({})['toString']` is a
    function, so `table[key] || fallback` leaks `Object.prototype`. Use
    `Object.hasOwn(table, key)` or a `Map`.
17. **`&&` and `||` return an operand, not a boolean,** and never evaluate the
    right side unless they must. `0 && f()` is `0` and `f` never runs.
18. **Every comparison with `NaN` is `false`** — including `>=` — so `NaN` falls
    through every range ladder to the final `else`.

---

## Cheat table

| you want | write | why |
|---|---|---|
| default for missing only | `v ?? d` | keeps `0`, `''`, `false` |
| default for any falsy | `v \|\| d` | rarely what you mean |
| guard a call | `v && f()` | returns `v` when falsy, never calls `f` |
| null-safe read | `a?.b?.[k]` | whole chain → `undefined` |
| null-safe call | `fn?.()` | no-op when `fn` is nullish |
| "is it nothing?" | `v == null` | the one good use of `==` |
| exact equality | `===` | no coercion |
| exact incl. NaN/-0 | `Object.is(a, b)` | SameValue |
| array check | `Array.isArray(v)` | `typeof` says `'object'` |
| NaN check | `Number.isNaN(v)` | global `isNaN` coerces |
| finite number check | `Number.isFinite(v)` | rejects `NaN`, `±Infinity` |
| own key check | `Object.hasOwn(o, k)` | skips the prototype |
| shallow copy | `{ ...o }` / `[...a]` | one level only |
| deep copy | `structuredClone(o)` | throws on functions |

---

## Exercises

| # | file | ★ | what you build |
|---|---|---|---|
| 01 | `01-type-of.js` | ★☆☆ | `typeOf` — a `typeof` that admits `null`, arrays and `NaN` |
| 02 | `02-type-tag.js` | ★★☆ | `typeTag` + `isPlainObject` via the internal class tag |
| 03 | `03-loose-vs-strict.js` | ★☆☆ | `equalityReport` + `isNullish` — the `==` rules, exactly |
| 04 | `04-same-value.js` | ★★☆ | `sameValue` — `Object.is` from scratch (`NaN`, `-0`) |
| 05 | `05-falsy-values.js` | ★☆☆ | `countTruthy` + `firstTruthy` over the eight falsy values |
| 06 | `06-is-empty.js` | ★★☆ | `isEmpty` for strings, arrays, objects, Maps and Sets |
| 07 | `07-defaults.js` | ★★☆ | `withDefaults` — options merging that keeps `0` and `''` |
| 08 | `08-short-circuit.js` | ★★☆ | `safeCall` + `lazyDefault` — `&&`/`??` and lazy evaluation |
| 09 | `09-float-compare.js` | ★★☆ | `nearlyEqual` — tolerance scaled by `Number.EPSILON` |
| 10 | `10-round-to.js` | ★★☆ | `roundTo` — beats `1.005` and rounds halves away from zero |
| 11 | `11-number-parsing.js` | ★★★ | `toNumber` + `toSafeInt` — strict parsing, safe-integer limits |
| 12 | `12-template-strings.js` | ★☆☆ | `badge` + `receipt` — interpolation and multi-line output |
| 13 | `13-tag-function.js` | ★★★ | the `html` tagged template — escape values, not markup |
| 14 | `14-var-let-scope.js` | ★★☆ | probes that prove hoisting, the TDZ and block scope |
| 15 | `15-loop-closures.js` | ★★★ | `captureIndexes` + `makeCounters` — per-iteration bindings |
| 16 | `16-destructuring-arrays.js` | ★☆☆ | `firstTwo`, `swap`, `thirdOr` — positions, holes, defaults |
| 17 | `17-destructuring-objects.js` | ★★☆ | `parseUser` — nested patterns, renaming, defaults |
| 18 | `18-param-destructuring.js` | ★★☆ | `createRequest` — options objects with rest and `= {}` |
| 19 | `19-spread-copy.js` | ★☆☆ | `copyList`, `withItem`, `merge` — shallow copies that bite |
| 20 | `20-rest-variadic.js` | ★★☆ | `sumAll`, `tagged`, `maxOf` — rest params and call-site spread |
| 21 | `21-deep-access.js` | ★★★ | `getIn` + `readPort` — `?.` and `??` on real config shapes |
| 22 | `22-value-vs-reference.js` | ★★☆ | `addTag` + `bump` — immutable updates against frozen input |
| 23 | `23-deep-copy.js` | ★★★ | `deepCopy` by hand + `safeCopy` with `structuredClone` |
| 24 | `24-lookup-table.js` | ★★☆ | `statusLabel` + `grade` — table dispatch without prototype leaks |

Six warm-ups (★☆☆), thirteen core (★★☆), five stretch (★★★) — 161 tests.

Do the warm-ups and core in order. Stretch if time allows.

```
node exercises/01-type-of.js      # run one file
node ../progress.js 01            # see how far you are
```

Stuck for more than ten minutes? Read the matching file in `solutions/` — every
one opens with a walkthrough explaining the approach and the classic wrong turn.

### Extra reps

Twenty more, same rules, fresh scenarios — for when a topic did not stick the
first time. They do not depend on each other, so pick by topic.

| # | file | ★ | what you build |
|---|---|---|---|
| 25 | `25-symbol-keys.js` | ★☆☆ | `newTag`, `sharedTag`, `stamp` — keys nothing else can collide with |
| 26 | `26-well-known-symbols.js` | ★★★ | a value that answers `Symbol.toStringTag` and every `Symbol.toPrimitive` hint |
| 27 | `27-bigint-basics.js` | ★★☆ | `toBigInt` + `sumBig` — exact integers, and why mixing throws |
| 28 | `28-bigint-units.js` | ★★★ | `toUnits`/`formatUnits` — cents, satoshis and wei from digit strings |
| 29 | `29-logical-assignment.js` | ★☆☆ | `normalizeConfig` + `memoize` — `??=`, `\|\|=` and `&&=` in config code |
| 30 | `30-optional-call.js` | ★★☆ | `fire` + `notify` — `fn?.()` over optional hooks and listeners |
| 31 | `31-to-boolean.js` | ★☆☆ | `toBoolean` by hand + `toFlag`, because `'false'` is truthy |
| 32 | `32-to-number-spec.js` | ★★★ | `specNumber` + `toPrimitiveNumber` — the ToNumber table, implemented |
| 33 | `33-money-cents.js` | ★★☆ | `parsePrice`, `formatCents`, `cartTotal` — money as whole cents |
| 34 | `34-split-cents.js` | ★★☆ | `splitCents` + `allocate` — remainders that still add back up |
| 35 | `35-safe-integers.js` | ★★☆ | `nextId`, `safeAdd`, `describeInteger` — living at the `2 ** 53` line |
| 36 | `36-parse-int-radix.js` | ★☆☆ | `parseIn`, `parseAll`, `hexToBytes` — radix drills, no partial parses |
| 37 | `37-raw-templates.js` | ★★☆ | `windowsPath`, `digitPattern`, `menu` — `String.raw` and nested templates |
| 38 | `38-deep-destructuring.js` | ★★☆ | `summarize` — arrays inside objects, with a default at every level |
| 39 | `39-param-combos.js` | ★★☆ | `makeLabel`, `arity`, `pushTo` — defaults, options, rest, `fn.length` |
| 40 | `40-clone-edges.js` | ★★★ | `cloneDeep`, `cloneInstance`, `cloneWithout` — cycles and DataCloneError |
| 41 | `41-labeled-loops.js` | ★★☆ | `findCell` + `sumCleanRows` — `break` and `continue` with a label |
| 42 | `42-switch-fallthrough.js` | ★☆☆ | `permissionFor`, `featuresFor`, `matchKind` — fallthrough on purpose |
| 43 | `43-global-scope.js` | ★★☆ | `hasGlobal`, `withGlobal`, `nextTicket` — `globalThis` vs module scope |
| 44 | `44-loose-equals.js` | ★★★ | `looseEquals` + `equalityTable` — the `==` algorithm, from scratch |

Five warm-ups (★☆☆), ten core (★★☆), five stretch (★★★) — 160 tests.

---

**Stuck?** `cheatsheets/js-gotchas.md` (coercion, TDZ, floating point) · `cheatsheets/es2020-plus.md` (`?.`, `??`, `at()`) · **Deep dive:** `guides/03-values-references-and-memory.md` + `guides/04-coercion-without-tears.md` · **Self-check:** `quizzes/01-language-core.md` · **Next:** `bootcamp/02-functions-and-closures`
