# 04 · Coercion Without Tears

Most people learn JavaScript coercion as a list of surprises: `[] == false`
is true, `null >= 0` is true but `null > 0` is false, `'10' < '9'`. Then
they memorise a table, forget it, and adopt the folk rule "always use
`===`". The folk rule is right and the memorising is wasted, because
underneath the surprises is a small, boring algorithm with about five
steps.

This guide teaches the algorithm. Once you have it, the famous table stops
being trivia you recall and becomes something you **derive** at the
whiteboard in ten seconds — which is what an interviewer is actually
testing, and what lets you spot the coercion bug in a PR diff.

Every output below was executed on **Node v22.16.0** (Windows). Error
messages are verbatim.

---

## 1 · The engine only knows three conversions

JavaScript is dynamically typed, so every operator that wants a specific
kind of value has to convert what you gave it. There are only three
destinations, and one dispatcher:

```
                     you hand an operator a value
                                  │
                    ┌─────────────┴──────────────┐
                    │  is it an OBJECT?          │
                    └─────┬───────────────┬──────┘
                       yes│               │no
                          ▼               │
                 ┌──────────────────┐     │
                 │   ToPrimitive    │     │   (already primitive)
                 │  (with a HINT)   │     │
                 └────────┬─────────┘     │
                          └───────┬───────┘
                                  ▼
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
        ┌───────────┐      ┌────────────┐      ┌─────────────┐
        │ ToNumber  │      │  ToString  │      │  ToBoolean  │
        │ - * / % ** │      │ template   │      │ if / ! / && │
        │ < > <= >=  │      │ String()   │      │ ?: / while  │
        │ Number() + │      │ key access │      │ Boolean()   │
        └───────────┘      └────────────┘      └─────────────┘
```

Four rules total. `ToBoolean` never throws and never calls your code.
`ToNumber` and `ToString` throw only on symbols (and on mixed BigInt
arithmetic). `ToPrimitive` is the only one that can run *your* code — which
is why it is where the weirdness lives, and why it goes first.

---

## 2 · ToPrimitive: an object gets asked, with a hint

When an operator needs a primitive out of an object, it calls
`ToPrimitive(input, hint)`. The hint is one of `"number"`, `"string"`, or
`"default"`, and it decides which method is tried first:

| hint | who sends it | tries, in order |
| --- | --- | --- |
| `"number"` | `-` `*` `/` `%` `<` `>` `Number()` `+x` | `Symbol.toPrimitive` → `valueOf` → `toString` |
| `"string"` | template literals, `String()`, property keys | `Symbol.toPrimitive` → `toString` → `valueOf` |
| `"default"` | `+` and `==` | same as `"number"`, **except `Date`** |

Whichever it tries first, if that method returns a *primitive*, that value
wins. If it returns an object, the engine falls through to the next one. If
both fail, you get `TypeError: Cannot convert object to primitive value`.

Verified — an object that logs which hint it received:

```js
const p = { [Symbol.toPrimitive](hint) { console.log('hint =', hint); return 1; } };
`${p}`;      // logs: hint = string
String(p);   // logs: hint = string
Number(p);   // logs: hint = number
+p;          // logs: hint = number
p + 1;       // logs: hint = default
p * 2;       // logs: hint = number
```

Without a `Symbol.toPrimitive`, you can watch the `valueOf`/`toString`
ordering directly:

```js
const o = {
  valueOf()  { console.log('valueOf');  return 42; },
  toString() { console.log('toString'); return 'forty-two'; },
};

o + 1;        // logs: valueOf     => 43
o * 2;        // logs: valueOf     => 84
o == 42;      // logs: valueOf     => true
`${o}`;       // logs: toString    => 'forty-two'
String(o);    // logs: toString    => 'forty-two'
String([o]);  // logs: toString    => 'forty-two'   ← Array#join stringifies
```

**`Date` is the one built-in that flips the default.** Its
`Symbol.toPrimitive` treats `"default"` as `"string"`, which is why:

```js
const d = new Date('2020-01-01T00:00:00Z');
typeof (d + '');   // => 'string'   ← concatenation, not arithmetic
typeof (+d);       // => 'number'
+d;                // => 1577836800000
```

That single exception is why `+new Date()` is the idiomatic
"milliseconds now" trick and why `date1 + date2` gives you a nonsense
string instead of a sum. Both fall straight out of the hint rules —
nothing to memorise.

---

## 3 · ToNumber, exactly

Strings first. The grammar is: trim whitespace, then parse the **whole
remaining string** as a numeric literal. Anything left over is `NaN`. It is
all-or-nothing — there is no "parse as far as you can".

```js
Number('')            // => 0          ← empty (and whitespace-only) is ZERO
Number('   ')         // => 0
Number('\n\t 12 \n')  // => 12         ← all whitespace trimmed, both ends
Number('12px')        // => NaN        ← trailing junk poisons the whole thing
Number('0x1f')        // => 31         ← hex literal
Number('0b101')       // => 5          ← binary
Number('0o17')        // => 15         ← octal
Number('1e3')         // => 1000
Number('.5')          // => 0.5
Number('5.')          // => 5
Number('Infinity')    // => Infinity   ← the word works
Number('1_000')       // => NaN        ← separators are SOURCE syntax, not string syntax
```

That last one catches people who assume `1_000` (valid in code) survives a
round trip through a string. It doesn't.

Non-strings:

| value | `Number(v)` | why |
| --- | --- | --- |
| `null` | `0` | spec says so; it's the historical wart |
| `undefined` | `NaN` | "no value" can't be a number |
| `true` / `false` | `1` / `0` | |
| `[]` | `0` | ToPrimitive → `''` → 0 |
| `[7]` | `7` | ToPrimitive → `'7'` → 7 |
| `[1,2]` | `NaN` | ToPrimitive → `'1,2'` → NaN |
| `{}` | `NaN` | ToPrimitive → `'[object Object]'` |
| `new Date(0)` | `0` | `Date`'s `valueOf` is epoch ms |

**`null` → 0 but `undefined` → NaN** is the asymmetry that produces half
the paradoxes in §7. Burn it in.

Two things throw rather than convert:

```js
Number(Symbol('s'));
// TypeError: Cannot convert a Symbol value to a number
1 + 1n;
// TypeError: Cannot mix BigInt and other types, use explicit conversions
Number(10n);   // => 10   ← explicit conversion is fine
```

BigInt is the language's one modern, opinionated stand against implicit
coercion: mixing throws instead of guessing. That's what the designers
would do everywhere if they could start over.

---

## 4 · ToString, exactly

| value | `String(v)` |
| --- | --- |
| `null` / `undefined` | `'null'` / `'undefined'` |
| `-0` | `'0'` ← the sign is lost |
| `1e21` | `'1e+21'` ← exponent form at 1e21 and above |
| `1e-7` | `'1e-7'` ← and at 1e-7 and below |
| `0.1 + 0.2` | `'0.30000000000000004'` |
| `[1,2]` | `'1,2'` ← join with `,` |
| `[null]`, `[undefined]` | `''` ← holes/null/undefined become empty |
| `[[1],[2]]` | `'1,2'` ← recursive join, structure gone |
| `{}` | `'[object Object]'` |

Arrays stringify by `join(',')`, which is why `[[1],[2]]` and `[1,2]`
produce the same string and why `'' + [null]` is `''`. Any code doing
`'id-' + someArray` is one nested array away from silent nonsense.

Symbols throw *implicitly* but convert *explicitly* — the language forcing
you to be deliberate:

```js
`${Symbol('s')}`;      // TypeError: Cannot convert a Symbol value to a string
String(Symbol('s'));   // => 'Symbol(s)'   ← the one blessed exception
```

---

## 5 · ToBoolean: memorise eight values, and only these

There is no algorithm here — it's a lookup. **Eight falsy values:**

```
   false     0     -0     0n     ''     null     undefined     NaN
```

Everything else is truthy. Everything. The traps, verified:

```js
Boolean('0')                 // => true   ← non-empty string
Boolean('false')             // => true   ← ...even this one
Boolean([])                  // => true   ← empty array is an OBJECT
Boolean({})                  // => true
Boolean(new Boolean(false))  // => true   ← boxed object, always truthy
Boolean(-1)                  // => true   ← "negative means false" is C, not JS
```

`[]` being truthy while `[] == false` is *also* true is the single most
cited JavaScript absurdity. §7 shows why both are correct and consistent.

(There is one historical wart — `document.all` is falsy despite being an
object, kept alive so ancient browser sniffing still works. Browser-only;
not executed here.)

---

## 6 · `+` is the odd operator out

Every other arithmetic operator is **numeric only**. `+` is not: it
ToPrimitive's both sides with the `"default"` hint, and then —

> **if either side came back a string, it concatenates. Otherwise it adds.**

```js
1 + '2'      // => '12'    ← one string wins
1 - '2'      // => -1      ← minus has no string mode
'3' * '4'    // => 12
'6' / '2'    // => 3
1 + null     // => 1       ← null → 0
1 + undefined// => NaN     ← undefined → NaN
[] + []      // => ''      ← '' + ''
[] + {}      // => '[object Object]'
```

Left-to-right associativity does the rest, and explains the classic pair:

```js
'a' + 1 + 2   // => 'a12'   ← ('a'+1) is 'a1', then 'a1'+2
1 + 2 + 'a'   // => '3a'    ← (1+2) is 3, then 3+'a'
```

### Relational operators have their own string rule

`<` `>` `<=` `>=` ToPrimitive with the **number** hint, then: if *both*
results are strings, compare **lexicographically by UTF-16 code unit**;
otherwise ToNumber both.

```js
'10' < '9'    // => true    ← string compare: '1' < '9'
10 < 9        // => false   ← numeric
'10' < 9      // => false   ← mixed → numeric
'B' < 'a'     // => true    ← 'B' is 66, 'a' is 97
['b','a','B','á','10','9'].sort()   // => [ '10', '9', 'B', 'a', 'b', 'á' ]
```

Code-unit order is not alphabetical order in any human language. For
user-visible sorting you want `localeCompare` or `Intl.Collator`, always.

### The intransitivity that proves `==` is not equality

```js
const a = [], b = 0, c = '0';
a == b   // => true
b == c   // => true
a == c   // => false     ← so much for transitivity
```

`[] == 0` (array → `''` → 0), `0 == '0'` (string → 0), but `[] == '0'`
compares `''` with `'0'`. An operator that isn't transitive is not an
equivalence relation, which is the formal version of "don't use `==`".

---

## 7 · The `==` table, decoded into five rules

Stop memorising the 8×8 grid. The spec's algorithm collapses to five rules
applied in order. Take `x == y`:

```
  ┌─────────────────────────────────────────────────────────────┐
  │ R1  same type?                    ──▶ use === and stop      │
  ├─────────────────────────────────────────────────────────────┤
  │ R2  one null, other undefined?    ──▶ TRUE and stop         │
  │     null/undefined vs anything else? ──▶ FALSE and stop     │
  ├─────────────────────────────────────────────────────────────┤
  │ R3  boolean on EITHER side?       ──▶ ToNumber it, restart  │
  ├─────────────────────────────────────────────────────────────┤
  │ R4  number vs string?             ──▶ ToNumber the string,  │
  │                                       restart               │
  ├─────────────────────────────────────────────────────────────┤
  │ R5  object vs primitive?          ──▶ ToPrimitive(object),  │
  │                                       restart               │
  └─────────────────────────────────────────────────────────────┘
```

Two properties of this machine matter more than the rules themselves:

- **`null` and `undefined` never coerce.** R2 exits early. They equal each
  other and nothing else — not `0`, not `''`, not `false`.
- **Booleans are converted first, and they lose.** R3 turns `true` into `1`
  *before* anything else happens. `true` is not "the truthy one"; it is the
  number 1 in disguise.

### Every famous case, derived

| expression | rules fired | result |
| --- | --- | --- |
| `1 == '1'` | R4: `'1'`→1, then `1===1` | `true` |
| `0 == ''` | R4: `''`→0 | `true` |
| `0 == '0'` | R4: `'0'`→0 | `true` |
| `'' == '0'` | R1: both strings, `===` | **`false`** |
| `null == undefined` | R2 | `true` |
| `null == 0` | R2 (null vs non-nullish) | **`false`** |
| `undefined == 0` | R2 | `false` |
| `NaN == NaN` | R1 → `===` → false | `false` |
| `'0' == false` | R3: `false`→0; R4: `'0'`→0 | `true` |
| `'' == false` | R3 → 0; R4: `''`→0 | `true` |
| `true == 1` | R3: `true`→1 | `true` |
| `true == 2` | R3: `true`→1, `1 === 2` | **`false`** |
| `true == '1'` | R3 → 1; R4: `'1'`→1 | `true` |
| `2 == true` | R3: `true`→1, `2 === 1` | **`false`** |
| `[] == false` | R3 → 0; R5: `[]`→`''`; R4: `''`→0 | `true` |
| `[] == ''` | R5: `[]`→`''`; R1 | `true` |
| `[] == 0` | R5 → `''`; R4 → 0 | `true` |
| `[null] == 0` | R5: `[null]`→`''`; R4 → 0 | `true` |
| `[[]] == 0` | R5: `[[]]`→`''`; R4 → 0 | `true` |
| `[1] == 1` | R5: `[1]`→`'1'`; R4 → 1 | `true` |
| `[1] == true` | R3: `true`→1; R5 → `'1'`; R4 → 1 | `true` |
| `{} == '[object Object]'` | R5 → `'[object Object]'`; R1 | `true` |
| `'abc' == new String('abc')` | R5 → `'abc'`; R1 | `true` |

All 23 verified by execution. Now the party trick:

```js
[] == ![]     // => true
```

Walk it. `![]` evaluates **first** — it's a unary operator on a truthy
object, so it's `false`. Now you have `[] == false`. R3 makes it `[] == 0`.
R5 makes it `'' == 0`. R4 makes it `0 == 0`. True.

Nothing mysterious happened: an array is truthy (§5, ToBoolean) *and*
loosely equal to `false` (R3+R5+R4), because those two questions run
completely different algorithms. "Truthiness" and "`== false`" were never
the same test.

### The `null >= 0` puzzle

```js
null == 0    // => false
null >= 0    // => true
null > 0     // => false
null <= 0    // => true
```

Not a contradiction — **different algorithms**. `==` uses R2, which
short-circuits `null` before any conversion. Relational operators have no
null rule at all: they ToNumber, and `Number(null)` is `0`. So `null >= 0`
is `0 >= 0`. Meanwhile `null > 0` is `0 > 0`, which is false.

This is worth knowing because `if (x >= 0)` silently accepts `null`, and
that's a real bug in validation code.

---

## 8 · Template literals are not `+`

A template literal always does **ToString** — never ToPrimitive with a
number hint. With an object that has both methods, they disagree:

```js
const o = { valueOf: () => 42, toString: () => 'forty-two' };
o + '';    // => '42'          ← default hint → valueOf first
`${o}`;    // => 'forty-two'   ← string hint → toString first
String(o); // => 'forty-two'
```

So `` `${x}` `` and `'' + x` are **not** interchangeable. They differ for
`Date`s, for `Symbol`s (template throws, `String()` doesn't), and for any
object with a `valueOf`. If you mean "give me the display string", write
`String(x)`. It says what you mean and matches template-literal behaviour.

---

## 9 · Where this actually bites

Five places, all verified, all things you will hit this year.

### Query params are always strings

```js
const q = new URL('http://x/list?page=2&flag=false&empty=&bare').searchParams;

q.get('page')          // => '2'        (a string, always)
q.get('page') + 1      // => '21'       ← the classic pagination bug
+q.get('page') + 1     // => 3
Boolean(q.get('flag')) // => true       ← the string 'false' is truthy!
q.get('empty')         // => ''         ← present but empty
q.get('bare')          // => ''         ← `?bare` with no `=` is also ''
q.get('nope')          // => null       ← absent is null, NOT undefined
```

Three separate traps: string arithmetic, `'false'` being truthy, and
absent-vs-empty being `null` vs `''`. The `null` matters because
`??` treats it as missing but `||` also swallows the legitimate `''`.

### JSON is lossier than it looks

```js
JSON.stringify({ d: new Date(0), n: NaN, i: Infinity, u: undefined, f() {}, s: new Set() });
// => '{"d":"1970-01-01T00:00:00.000Z","n":null,"i":null,"s":{}}'
JSON.stringify({ b: 1n });
// TypeError: Do not know how to serialize a BigInt
```

`Date` → string (via `toJSON`), `NaN`/`Infinity` → `null`, `undefined` and
functions **dropped entirely**, `Set` → `{}`, BigInt throws. And on the way
back in, types are whatever the JSON says:

```js
JSON.parse('1') + 1      // => 2
JSON.parse('"1"') + 1    // => '11'    ← same-looking payload, different type
```

That's the whole argument for validating at the boundary rather than
trusting `res.json()`. See guide 03 for what it costs you structurally.

### Form inputs are strings too

In a browser, `input.value` is a string even for `<input type="number">` —
an empty box gives `''`, which `Number('')` turns into a very convincing
`0`. Use `input.valueAsNumber` (which gives `NaN` for empty) or guard
explicitly. *(Browser API — stated from the spec, not executed here.)*

### `sort()` without a comparator sorts strings

```js
[10, 9, 1, 100, 2].sort()                // => [ 1, 10, 100, 2, 9 ]
[10, 9, 1, 100, 2].sort((a, b) => a - b) // => [ 1, 2, 9, 10, 100 ]
[3, 1, 2].sort((a, b) => a > b)          // => [ 3, 1, 2 ]   ← boolean comparator: broken
```

Default `sort` ToStrings every element. And a comparator must return a
**number** — a boolean coerces to 0/1, so the "less than" case never
reports `-1` and the sort quietly does nothing.

### `parseInt` vs `parseFloat` vs `Number` vs `+`

| input | `parseInt` | `parseFloat` | `Number` / `+` |
| --- | --- | --- | --- |
| `'08'` | `8` | `8` | `8` |
| `'1e3'` | **`1`** | `1000` | `1000` |
| `'12px'` | `12` | `12` | `NaN` |
| `''` | `NaN` | `NaN` | **`0`** |
| `'0x1f'` | `31` | **`0`** | `31` |
| `'Infinity'` | **`NaN`** | `Infinity` | `Infinity` |
| `'.5'` | **`NaN`** | `0.5` | `0.5` |
| `'1_000'` | `1` | `1` | `NaN` |
| `null` | `NaN` | `NaN` | **`0`** |
| `true` | `NaN` | `NaN` | `1` |

The two families think differently. `parseInt`/`parseFloat` are **prefix
parsers**: read as far as it makes sense, ignore the rest. `Number`/`+` are
**whole-string validators**: all of it or `NaN`. So `parseInt` is right for
`'12px'` and dangerous everywhere else — `parseInt('1e3')` is `1` because
it stops at `e`.

And the one that looks like a joke but is a real production bug:

```js
parseInt(0.0000005)   // => 5
```

`parseInt` takes a *string*. `String(5e-7)` is `'5e-7'`, so it parses the
leading `5`. Passing numbers to `parseInt` is always a mistake.

Finally, the global vs `Number` predicates:

```js
isNaN('abc')            // => true    ← coerces first: Number('abc') is NaN
Number.isNaN('abc')     // => false   ← is this value THE NaN? no, it's a string
isNaN('')               // => false   ← Number('') is 0
isFinite('42')          // => true    ← coerces
Number.isFinite('42')   // => false   ← no coercion
```

The globals answer "would this be NaN if I converted it?" The `Number.*`
versions answer "is this actually that value?" You almost always want the
second.

---

## 10 · Defensive habits

Opinionated, in priority order.

**1. `===` always. One exception: `x == null`.** That single idiom means
"null or undefined" and is the one place `==` is clearer than the
alternative (`x === null || x === undefined`). Everyone reading your code
knows it. Nothing else earns the ambiguity.

**2. Parse at the boundary, once.** Every value that enters your program
from outside — query string, env var, JSON body, file, CLI arg — is a
string or `unknown` until you convert it, deliberately, at the edge:

```js
function intParam(raw, { min = 1, max = 100, fallback = 1 } = {}) {
  const n = Number(raw);                        // whole-string, not parseInt
  if (!Number.isInteger(n)) return fallback;    // catches NaN, 1.5, Infinity
  return Math.min(max, Math.max(min, n));
}
intParam('2')     // => 2
intParam('2px')   // => 1   (fallback — Number is all-or-nothing)
intParam('')      // => 1   (Number('') is 0 — an integer, so the clamp catches it)
```

`Number.isInteger` is the cheapest single guard in the language: one call
rejects `NaN`, `Infinity`, fractions, and (because it doesn't coerce)
strings and `null`. This is "parse, don't validate" in four lines —
`bootcamp/06-errors-and-robustness/exercises/08-parse-dont-validate.js`
builds the full version.

**3. Prefer `Number(x)` / `String(x)` / `Boolean(x)` to `+x` / `''+x` /
`!!x`.** Same semantics for `Number`/`Boolean`, more searchable, and no
"is that a unary plus or a typo" moment in review. `''+x` is genuinely
*different* from `String(x)` (§8), so that one isn't just style. The terse
forms are fine in a tight local expression where the type is obvious; they
are not fine at a boundary.

**4. Never call `sort()` bare on numbers, and never return a boolean from
a comparator.** `(a, b) => a - b` for numbers,
`(a, b) => a.localeCompare(b)` for user-visible strings.

**5. Use `Number.isNaN` / `Number.isFinite`, never the globals.** The
globals coerce, which makes them answer a different question than the one
you asked.

**6. Distinguish "absent" from "empty" on purpose.** `??` and `??=` cover
null/undefined; `||` swallows `0`, `''`, and `false` too. Options merging
that uses `||` will silently discard `{ retries: 0 }`, which is exactly
what `bootcamp/01-language-core/exercises/07-defaults.js` drills.

**7. When arithmetic must not guess, use BigInt.** It's the only numeric
type in the language that throws instead of coercing — useful for money and
IDs, where a silent `NaN` is a disaster.

---

## Now go do

| file | what it drills |
| --- | --- |
| [`bootcamp/01-language-core/exercises/03-loose-vs-strict.js`](../bootcamp/01-language-core/exercises/03-loose-vs-strict.js) | The five rules, as executable code — build `equalityReport` and `isNullish`. Do this immediately after reading §7. |
| [`bootcamp/01-language-core/exercises/05-falsy-values.js`](../bootcamp/01-language-core/exercises/05-falsy-values.js) | The eight falsy values by hand, so `'0'` and `[]` stop surprising you. |
| [`bootcamp/01-language-core/exercises/11-number-parsing.js`](../bootcamp/01-language-core/exercises/11-number-parsing.js) | `parseInt` vs `Number` vs `+`, the §9 table from the inside. |
| [`bootcamp/01-language-core/exercises/07-defaults.js`](../bootcamp/01-language-core/exercises/07-defaults.js) | Options merging that keeps `0` and `''` — habit 6, in anger. |
| [`bootcamp/06-errors-and-robustness/exercises/08-parse-dont-validate.js`](../bootcamp/06-errors-and-robustness/exercises/08-parse-dont-validate.js) | Habit 2 at full size: strings in, typed values out, one boundary. |
| [`bootcamp/03-arrays-and-objects/exercises/12-sort-numbers.js`](../bootcamp/03-arrays-and-objects/exercises/12-sort-numbers.js) | The comparator contract, before it bites you in a code review. |

## Self-test

**1.** Without running it, evaluate `[] == ![]` and `[] == []`, and explain
why they differ.

<details>
<summary>Answer</summary>

`[] == ![]` is **`true`**; `[] == []` is **`false`**.

For the first: `![]` is evaluated before the comparison. `[]` is an object,
so ToBoolean says truthy, so `![]` is `false`. Now it's `[] == false`.
R3 (boolean on either side) converts `false` to `0`: `[] == 0`. R5 (object
vs primitive) ToPrimitive's the array with the default hint — `valueOf`
returns the array itself (not a primitive), so it falls through to
`toString`, which joins to `''`. Now `'' == 0`. R4 converts `''` to `0`.
`0 === 0` → true.

For the second: both sides are objects, so **R1 fires immediately** — same
type means `===`, and `===` on objects compares addresses. Two separate
array literals are two allocations. False.

The lesson: `==` only starts coercing when the types *differ*. Same-type
comparison never coerces at all, which is why `'' == '0'` is also false.
</details>

**2.** This handler works in testing and fails in production for one
customer:

```js
function applyDiscount(order, pct) {
  if (!pct) return order.total;
  return order.total - order.total * (pct / 100);
}
```

Two separate coercion bugs. Name both, and rewrite it.

<details>
<summary>Answer</summary>

**Bug 1 — `!pct` rejects a legitimate `0`.** It also rejects `''`, `null`,
`undefined`, `NaN` and `-0`, which is *mostly* what you wanted, but `0` is a
real discount percentage and returning early for it is only accidentally
correct. The moment the requirement becomes "log every discount
application", the `0` case silently vanishes from your logs.

**Bug 2 — `pct` may be a string, and `/` coerces while `-` and `*` do
too.** If `pct` arrives from a query param or JSON as `'10'`, then
`pct / 100` is `0.1` and everything *works* — which is exactly why it
passes testing. But if it arrives as `'10%'` or `''`, you get `NaN` or `0`
and the customer is charged the wrong amount with no error thrown anywhere.
`'' / 100` is `0` (a free no-op) and `'10%' / 100` is `NaN`, which makes
`total - NaN` → `NaN`, and `NaN` written to a database is a support ticket.

Rewrite — validate the type, don't lean on the operators:

```js
function applyDiscount(order, pct) {
  const p = Number(pct);
  if (!Number.isFinite(p) || p < 0 || p > 100) {
    throw new TypeError(`invalid discount: ${JSON.stringify(pct)}`);
  }
  return order.total * (1 - p / 100);   // p === 0 → unchanged, no special case
}
```

`Number.isFinite` rejects `NaN`, `Infinity`, and (no coercion) any leftover
string. The `0` case now needs no branch at all — the arithmetic handles
it, which is the general lesson: a guard that exists only to dodge a
coercion is usually a guard you can delete once the value is typed.
</details>

**3.** `x == null` is the one `==` this guide endorses. Explain precisely
what it tests, and what `if (x >= 0)` accepts that you might not expect.

<details>
<summary>Answer</summary>

`x == null` is true for exactly two values: `null` and `undefined`. That
falls out of R2 — one nullish vs the other is `true`, nullish vs anything
else is `false`, and no conversion ever happens. It cannot be fooled by
`0`, `''`, `false`, or `NaN`. It is a two-value type check written in five
characters, which is why it survives the "always `===`" rule.

`if (x >= 0)` is the opposite story. Relational operators have **no**
nullish rule, so they ToNumber both sides — and `Number(null)` is `0`. So
`null >= 0` is `0 >= 0` → **true**. So are `'' >= 0`, `[] >= 0`,
`false >= 0`, and `'0' >= 0`, all via ToNumber. The only common value that
correctly fails is `undefined` (→ `NaN`, and every comparison with `NaN` is
false).

So a "is this a non-negative number?" check written as `x >= 0` admits
`null`, `''`, `[]`, and `false`. The honest version is
`typeof x === 'number' && Number.isFinite(x) && x >= 0`, or
`Number.isFinite(x) && x >= 0` if you've already parsed at the boundary —
which, per habit 2, you should have.
</details>

---
**Pairs with:** [`bootcamp/01-language-core`](../bootcamp/01-language-core/) · **Cheatsheet:** [`js-gotchas.md`](../cheatsheets/js-gotchas.md) · **Next guide:** [`05-http-from-first-principles.md`](05-http-from-first-principles.md)
