# 05 · Strings, Regex, and Collections — methods, patterns, Map/Set/WeakMap

Cover the answer, commit out loud, then reveal. If you hedge, you got it wrong.

---

### Q1 — slice versus substring

What does this print?

```js
const s = 'JavaScript';
console.log(s.slice(4), s.slice(-6), s.slice(4, 6));
console.log(s.substring(4, 6), s.substring(6, 4));
console.log(s.slice(6, 4));
```

<details><summary>Answer</summary>

**`Script Script Sc`**, **`Sc Sc`**, then an **empty line** — `substring` silently swaps reversed arguments; `slice` returns `''`.

Both take `[start, end)` and both leave the original untouched. The differences: `slice` understands negative indices (counting from the end), `substring` clamps negatives to `0`. And `substring(6, 4)` quietly reorders to `substring(4, 6)`, which turns an off-by-one bug into wrong data instead of an obvious empty string. Use `slice` for everything; ignore `substr`, which is deprecated and takes a *length* as its second argument.
</details>

---

### Q2 — trimming and padding

What does this print?

```js
const s = '  hi there  ';
console.log('[' + s.trim() + ']');
console.log('[' + s.trimStart() + ']');
console.log('5'.padStart(3, '0'), 'ab'.padEnd(5, '.'));
console.log('abc'.at(-1), 'abc'.charAt(1));
```

<details><summary>Answer</summary>

**`[hi there]`**, **`[hi there  ]`**, **`005 ab...`**, **`c b`** — all of these return new strings; none mutate.

`trim` removes whitespace from both ends only, never the middle. `padStart(targetLength, padString)` pads until the *total* length hits the target, repeating and truncating the pad string as needed — it's the idiomatic zero-fill for time and ID formatting. `at(-1)` gives you the last character without the `s[s.length - 1]` dance; `charAt` and bracket indexing don't accept negatives.
</details>

---

### Q3 — split behavior

What does this print?

```js
const csv = 'a,b,,c';
console.log(csv.split(','));
console.log(csv.split(',').length);
console.log('abc'.split(''));
console.log('a-b_c'.split(/[-_]/));
console.log('one two'.split(' ', 1));
```

<details><summary>Answer</summary>

**`[ 'a', 'b', '', 'c' ]`**, **`4`**, **`[ 'a', 'b', 'c' ]`**, **`[ 'a', 'b', 'c' ]`**, **`[ 'one' ]`** — consecutive separators produce empty strings, they aren't collapsed.

That's why `split(',').length` is a bad row-length check on real CSV, and why `filter(Boolean)` so often follows a `split`. The separator can be a regex, which is how you split on any of several characters. The optional second argument is a **limit** on the output length — it truncates, it doesn't merge the rest. Note `split('')` splits into UTF-16 code units, not characters — see Q17.
</details>

---

### Q4 — replace versus replaceAll

What does this print?

```js
const s = 'a-b-c';
console.log(s.replace('-', '+'));
console.log(s.replaceAll('-', '+'));
console.log(s.replace(/-/g, '+'));
console.log('price: $5'.replace(/(\$)(\d)/, '$2$1'));
```

<details><summary>Answer</summary>

**`a+b-c`**, **`a+b+c`**, **`a+b+c`**, **`price: 5$`** — `replace` with a *string* pattern replaces only the first match.

This is a top-five silent bug: it works on your one-separator test case and fails on real input. `replaceAll` (ES2021) fixes it for string patterns; the older fix is a regex with the `g` flag. In the replacement string, `$1`, `$2` refer to capture groups (`$&` is the whole match, `$$` is a literal dollar sign) — so you can reorder matched pieces without a callback. Pass a function as the replacement when you need real logic per match.
</details>

---

### Q5 — searching and comparing

What does this print?

```js
console.log('Hello'.includes('ell'), 'Hello'.startsWith('he'));
console.log('Hello'.toLowerCase().startsWith('he'));
console.log('Hello'.indexOf('z'));
console.log('b'.localeCompare('a'), ['b', 'a', 'C'].sort((x, y) => x.localeCompare(y)));
```

<details><summary>Answer</summary>

**`true false`**, **`true`**, **`-1`**, **`1 [ 'a', 'b', 'C' ]`** — every string search is case-sensitive, and `indexOf` returns `-1` for "not found".

Because `-1` is truthy, `if (s.indexOf(x))` is wrong in two directions: it's true when not found and false when found at index 0. `includes` exists so you can stop writing `!== -1`. `localeCompare` returns a negative number, zero, or a positive number and — unlike raw `<` — sorts case- and accent-insensitively by default, which is why `C` lands after `b` here instead of before `a` (see Q18).
</details>

---

### Q6 — test, match, and the g flag

What does this print?

```js
const re = /\d+/;
console.log(re.test('abc123'));
console.log('abc123def456'.match(/\d+/));
console.log('abc123def456'.match(/\d+/g));
console.log('nope'.match(/\d+/));
```

<details><summary>Answer</summary>

**`true`**, **`[ '123', index: 3, input: 'abc123def456', groups: undefined ]`**, **`[ '123', '456' ]`**, **`null`** — the `g` flag completely changes what `match` returns.

Without `g`, `match` returns a rich match object: index 0 is the full match, indices 1..n are capture groups, plus `index`, `input`, and `groups` properties. With `g`, it returns a plain array of all full matches and **throws away the groups and positions**. No match returns `null`, not an empty array — so `str.match(re).length` crashes on no match. Guard it, or use `match(re) ?? []`.
</details>

---

### Q7 — capture groups

What does this print?

```js
const re = /(\w+)@(\w+)\.com/;
const m = 'mail ada@example.com now'.match(re);
console.log(m[0], m[1], m[2], m.index);
const named = 'ada@example.com'.match(/(?<user>\w+)@(?<host>\w+)/);
console.log(named.groups.user, named.groups.host);
```

<details><summary>Answer</summary>

**`ada@example.com ada example 5`**, then **`ada example`** — index 0 is always the whole match, and capture groups start at 1.

`(...)` captures; `(?:...)` groups without capturing, which keeps your indices stable when you add grouping for precedence. Named groups `(?<name>...)` land on the `groups` object and are far more readable than positional indices — and they let you destructure: `const { user, host } = m.groups`. Note `\.` is an escaped literal dot; an unescaped `.` would match any character including the `@`.
</details>

---

### Q8 — greedy versus lazy

What does this print?

```js
console.log('<a><b>'.match(/<.+>/)[0]);
console.log('<a><b>'.match(/<.+?>/)[0]);
console.log('aaa'.replace(/a*/g, 'X'));
```

<details><summary>Answer</summary>

**`<a><b>`**, **`<a>`**, **`XX`** — quantifiers are greedy by default; `?` after one makes it lazy.

`.+` takes as much as it can, then backtracks only enough to let the rest of the pattern match — so it swallows both tags. `.+?` takes as little as possible and stops at the first `>`. The third line is the classic zero-width trap: `a*` matches `'aaa'` at position 0 giving one `X`, then matches the *empty string* at the end of the input giving a second `X`. Quantifiers that can match nothing produce phantom matches — use `+` when you mean "at least one".
</details>

---

### Q9 — anchors, boundaries, and escaping

What does this print?

```js
console.log(/^abc$/.test('abc'), /^abc$/.test('xabc'));
console.log(/\bcat\b/.test('a cat here'), /\bcat\b/.test('concatenate'));
console.log('a.b'.split('.').length, 'a.b'.split(/\./).length);
console.log(/a.c/.test('abc'), /a\.c/.test('abc'));
```

<details><summary>Answer</summary>

**`true false`**, **`true false`**, **`2 2`**, **`true false`** — `.` means "any character" in a regex and a literal dot in a string.

`^` and `$` anchor to string start/end (or line start/end with the `m` flag), which is what turns "contains" into "equals". `\b` is a zero-width word boundary, the difference between matching the word *cat* and matching it inside *concatenate*. `split('.')` takes a literal string so no escaping is needed, but `split(/\./)` does. Forgetting to escape `.`, `+`, `*`, `?`, `(`, `[`, `$`, `^`, `|`, `\`, `{` when building a regex from user input is both a bug and an injection risk.
</details>

---

### Q10 — matchAll

What does this print?

```js
const text = 'a1b22c333';
console.log([...text.matchAll(/\d+/g)].map((m) => m[0] + '@' + m.index));
```

<details><summary>Answer</summary>

**`[ '1@1', '22@3', '333@6' ]`** — `matchAll` gives you every match *with* its groups and index, which `match(/re/g)` throws away.

It returns a lazy iterator, so you spread it or `for...of` it; it can only be consumed once. The regex **must** have the `g` flag or `matchAll` throws a `TypeError` — a deliberate guard against the infinite-loop bug that `exec` in a `while` loop causes without `g`. This is the modern replacement for the old `while ((m = re.exec(s)) !== null)` pattern.
</details>

---

### Q11 — lastIndex is stateful

What does this print?

```js
const g = /a/g;
console.log(g.test('aa'), g.lastIndex);
console.log(g.test('aa'), g.lastIndex);
console.log(g.test('aa'), g.lastIndex);
```

<details><summary>Answer</summary>

**`true 1`**, **`true 2`**, **`false 0`** — a regex with the `g` flag carries mutable `lastIndex` state between calls.

`test` and `exec` on a global regex resume from `lastIndex` and update it; when the search fails they reset it to `0`. So the *same input* gives alternating results, and a module-level `const RE = /x/g` shared across function calls produces bugs that depend on call order and are nearly impossible to reproduce in a unit test. Fixes: drop the `g` flag when you only need a boolean, create the regex inside the function, or reset `re.lastIndex = 0` before each use.
</details>

---

### Q12 — Set basics

What does this print?

```js
const set = new Set([1, 2, 2, 3, '3']);
console.log(set.size, [...set]);
console.log(set.has(3), set.has('3'), set.has(4));
set.add(1);
console.log(set.size);
console.log([...new Set([{ a: 1 }, { a: 1 }])].length);
```

<details><summary>Answer</summary>

**`4 [ 1, 2, 3, '3' ]`**, **`true true false`**, **`4`**, **`2`** — `Set` dedupes by SameValueZero, which is identity for objects and does not coerce types.

`3` and `'3'` are different values, so both survive; the two identical-looking object literals are two different allocations, so both survive too. Adding an existing member is a silent no-op. `[...new Set(arr)]` is the standard one-line dedupe for primitives, and iteration order is insertion order. `NaN` deduplicates correctly here even though `NaN !== NaN`, because SameValueZero treats it as equal to itself.
</details>

---

### Q13 — Map keys

What does this print?

```js
const m = new Map();
const key = { id: 1 };
m.set(key, 'obj').set('key', 'str').set(1, 'num').set('1', 'strnum');
console.log(m.size);
console.log(m.get(key), m.get({ id: 1 }));
console.log(m.get(1), m.get('1'));
console.log([...m.keys()]);
```

<details><summary>Answer</summary>

**`4`**, **`obj undefined`**, **`num strnum`**, **`[ { id: 1 }, 'key', 1, '1' ]`** — `Map` keys keep their type and their identity.

An equal-looking object literal is a different key, so the lookup misses — you must hold the original reference. Unlike a plain object, `1` and `'1'` are distinct keys because no string coercion happens. `set` returns the map, so calls chain. Keys iterate in insertion order, with no special treatment for integer-like keys.
</details>

---

### Q14 — Map ordering and conversion

What does this print?

```js
const m = new Map([['b', 2], ['a', 1]]);
console.log([...m]);
console.log([...m.entries()].map(([k, v]) => k + v));
console.log(Object.fromEntries(m));
console.log(new Map(Object.entries({ x: 1 })).get('x'));
```

<details><summary>Answer</summary>

**`[ [ 'b', 2 ], [ 'a', 1 ] ]`**, **`[ 'b2', 'a1' ]`**, **`{ b: 2, a: 1 }`**, **`1`** — a `Map` is insertion-ordered and iterates as `[key, value]` pairs.

Spreading a `Map` gives entry pairs directly — `[...m]` and `[...m.entries()]` are identical, because `entries` is the default iterator. `Object.fromEntries` and `Object.entries` are the round trip between the two shapes. Insertion order is preserved exactly as given (`b` before `a`); plain objects would too here, but they reorder integer-like keys numerically, which a `Map` never does.
</details>

---

### Q15 — when an object is the wrong tool

What does this print?

```js
const obj = {};
obj[{ id: 1 }] = 'first';
obj[{ id: 2 }] = 'second';
console.log(Object.keys(obj), obj[{ id: 9 }]);
const map = new Map();
map.set({ id: 1 }, 'first').set({ id: 2 }, 'second');
console.log(map.size);
```

<details><summary>Answer</summary>

**`[ '[object Object]' ] second`**, then **`2`** — every object used as a plain-object key stringifies to `'[object Object]'`, so they all collide.

Two writes, one key, second value wins — and looking up a *third*, unrelated object finds it, because it stringifies identically. Silent data loss with no error anywhere. `Map` compares keys by reference and keeps them distinct. Reach for `Map` whenever keys are non-strings, whenever key order or `size` matters, or whenever keys are user-supplied (a plain object inherits `toString`, `constructor`, and `__proto__` from its prototype, which is its own class of bug).
</details>

---

### Q16 — WeakMap

What does this print?

```js
const wm = new WeakMap();
let k = { name: 'k' };
wm.set(k, 'meta');
console.log(wm.get(k), wm.has(k));
console.log(typeof wm.size, typeof wm.forEach);
try {
  wm.set('str', 1);
} catch (e) {
  console.log(e.constructor.name);
}
```

<details><summary>Answer</summary>

**`meta true`**, **`undefined undefined`**, **`TypeError`** — a `WeakMap` holds keys weakly, so it can't be sized, iterated, or keyed by a primitive.

Its entries don't stop the garbage collector from reclaiming a key object; when the key is collected, the entry vanishes. That's only sound if you can't observe the collection, which is why there is no `size`, no `keys()`, and no `forEach` — exposing them would make GC timing visible to your program. Keys must be objects (or Symbols) because primitives have no identity to collect. Use it to attach metadata to objects you don't own — DOM node state, per-instance caches — without leaking memory.
</details>

---

### Q17 — length is not characters

What does this print?

```js
const emoji = 'naïve 🚀';
console.log(emoji.length);
console.log([...emoji].length);
console.log(emoji.split('').length);
console.log(emoji.toUpperCase());
```

<details><summary>Answer</summary>

**`8`**, **`7`**, **`8`**, **`NAÏVE 🚀`** — `.length` counts UTF-16 code units, and the rocket takes two of them.

Any character outside the Basic Multilingual Plane (emoji, many CJK extensions, mathematical symbols) is stored as a surrogate pair. `.length`, `split('')`, `charAt`, and index access all operate on code units, so they can slice a character in half and produce garbage. Spread and `for...of` use the string's iterator, which walks *code points* and gives 7. Even that isn't the full story — grapheme clusters like 👩\u200D💻 or e+combining-accent count as multiple code points; `Intl.Segmenter` is the correct tool for user-perceived characters.
</details>

---

### Q18 — comparing strings

What does this print?

```js
console.log('10' > '9');
console.log('10' > 9);
console.log(['b', 'a', 'C', 'A'].sort());
console.log('ß'.toUpperCase(), 'I'.toLowerCase());
```

<details><summary>Answer</summary>

**`false`**, **`true`**, **`[ 'A', 'C', 'a', 'b' ]`**, **`SS i`** — string comparison is code-unit-by-code-unit, so all uppercase letters sort before all lowercase.

`'10' > '9'` compares `'1'` (code unit 49) against `'9'` (57) and stops there. Mixing a string and a number makes `>` convert to numbers instead, flipping the result — a real hazard with values from query strings and form inputs. Default `sort` uses this raw ordering, which is why `localeCompare` (or `Intl.Collator` for bulk sorting) is required for anything a human will read. And case conversion is not length-preserving or reversible: `ß` uppercases to two characters, and in Turkish locales `'I'.toLocaleLowerCase('tr')` is a dotless `ı` — never case-fold as a security check.
</details>

---

### Q19 — lookahead, and the backtracking trap

What does this print?

```js
console.log('price 30 usd 40 eur'.match(/\d+(?= usd)/g));
console.log('price 30 usd 40 eur'.match(/\d+(?! usd)/g));
console.log('foo1 bar2'.replace(/\w+(?=\d)/g, 'X'));
```

<details><summary>Answer</summary>

**`[ '30' ]`**, **`[ '3', '40' ]`**, **`X1 X2`** — a lookaround is zero-width: it asserts what follows without consuming it, so it never appears in the match.

The first line is the useful case — match the number, not the unit. The second is the classic trap: `\d+` grabs `30`, the negative lookahead fails, so the engine *backtracks* to `3` and re-checks — and `'0 usd'` is not `' usd'`, so it succeeds with a partial match. A negative lookahead after a greedy quantifier almost never means what you intended; anchor it (`/\d+\b(?! usd)/`) or match the whole unit and reject afterwards. The third line shows the same backtracking working *for* you: `\w+` gives back the digit so the lookahead can see it, which is why `foo` is replaced and `1` survives.
</details>

---

### Q20 — lookbehind

What does this print?

```js
console.log('a1 b2 c3'.match(/(?<=b)\d/)[0]);
console.log('$30 and 40'.replace(/(?<=\$)\d+/, 'X'));
console.log('cat concat'.match(/(?<!con)cat/g));
```

<details><summary>Answer</summary>

**`2`**, **`$X and 40`**, **`[ 'cat' ]`** — lookbehind asserts what came *before* the current position, and like lookahead it consumes nothing.

`(?<=$)` is how you replace the digits of a price while keeping the currency symbol, without a capture group and a `$1` in the replacement. `(?<!con)` excludes matches preceded by that text, which is a cleaner "whole word" rule than `\b` when the boundary you care about is a specific prefix. Lookbehind is ES2018 and works in every current engine including Node and Safari 16.4+; it can be variable-length in JavaScript, unlike in many other regex flavours. Both forms are the tool of choice when you want a *context* condition without capturing the context.
</details>

---

### Q21 — sticky versus global

What does this print?

```js
const g = /\d+/g;
const y = /\d+/y;
const s = 'ab12cd34';
console.log(g.exec(s)[0], g.lastIndex);
console.log(y.exec(s));
y.lastIndex = 2;
console.log(y.exec(s)[0], y.lastIndex);
console.log(y.sticky, y.exec(s), y.lastIndex);
```

<details><summary>Answer</summary>

**`12 4`**, **`null`**, **`12 4`**, **`true null 0`** — `g` searches forward from `lastIndex`, `y` must match *exactly at* `lastIndex` or fail.

Both flags use the same mutable `lastIndex` (Q11), but they read it differently: the global regex scans ahead and finds `12` at index 2, while the sticky one starts at 0, sees `a`, and gives up immediately. Set `lastIndex` yourself and it matches. On failure both reset `lastIndex` to `0`, which is why the last call returns `null` and leaves the regex rearmed at the start. Sticky is what tokenizers are built on — it guarantees no silent skipping over characters you didn't recognize, so a lexer either consumes the next token or reports an error at exactly that offset.
</details>

---

### Q22 — the `u` flag

What does this print?

```js
console.log(/^.$/.test('\u{1F680}'), /^.$/u.test('\u{1F680}'));
console.log('\u{1F680}'.length, [...'\u{1F680}'].length);
console.log('Ünïcödé wörds'.match(/\p{Letter}+/gu));
```

<details><summary>Answer</summary>

**`false true`**, **`2 1`**, **`[ 'Ünïcödé', 'wörds' ]`** — without `u` a regex works on UTF-16 code units, so `.` matches half of an astral character.

`\u{1F680}` is a surrogate pair: two code units, one code point. A non-unicode regex sees two "characters", so `^.$` fails, and worse, a character class or a quantifier can split the pair and emit a lone surrogate — a string that is no longer valid text. The `u` flag makes the pattern code-point aware, enables `\u{...}` escapes and `\p{...}` property classes, and turns some previously-tolerated escapes into syntax errors. `\p{Letter}` is the correct way to say "a letter in any language"; `[a-zA-Z]` is not. Use `u` (or its stricter successor `v`) on every regex that touches user text.
</details>

---

### Q23 — the same letter, two encodings

What does this print?

```js
const composed = '\u00e9';
const decomposed = 'e\u0301';
console.log(composed === decomposed, composed.length, decomposed.length);
console.log(composed.normalize('NFC') === decomposed.normalize('NFC'));
console.log(decomposed.normalize('NFC').length, composed.normalize('NFD').length);
```

<details><summary>Answer</summary>

**`false 1 2`**, **`true`**, **`1 2`** — two strings that render identically as "e-acute" but hold different code points are not `===`.

Unicode allows the same visible character to be written as one precomposed code point or as a base letter plus a combining mark, and macOS filenames, iOS keyboards, and copy-paste from PDFs all produce the decomposed form. `normalize()` converts between the canonical forms: **NFC** composes (the web standard, and what you should store), **NFD** decomposes. Normalize at the boundary — on input, before comparing, before hashing, before using a string as a database key — or you will ship a login that rejects a correct password and a search that can't find its own data.
</details>

---

### Q24 — what a user calls one character

What does this print?

```js
const dev = '\u{1F469}\u200D\u{1F4BB}';
console.log(dev.length, [...dev].length);
const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
console.log([...seg.segment(dev)].length);
console.log([...new Intl.Segmenter('en', { granularity: 'word' }).segment('hi there')].length);
```

<details><summary>Answer</summary>

**`5 3`**, **`1`**, **`3`** — three different counts for one visible glyph, and only the third is what a human means by "one character".

That string is woman + zero-width joiner + laptop: five UTF-16 code units, three code points, one **grapheme cluster**. `.length` and `[...str]` both stop short, which is why a naive `slice(0, 10)` on a comment can cut a family emoji into body parts and why a "20 characters left" counter lies. `Intl.Segmenter` (ES2022, Node 16+) is the only correct tool, and it also segments words and sentences — the word pass counts `hi`, the space, and `there`, because segments include the separators; filter on `isWordLike` when you want only real words.
</details>

---

### Q25 — sorting for humans

What does this print?

```js
const c = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
console.log(['item10', 'item9', 'ITEM2'].toSorted(c.compare));
console.log(c.compare('a', 'A'), new Intl.Collator('en').compare('a', 'A'));
console.log(['item10', 'item9', 'ITEM2'].toSorted());
```

<details><summary>Answer</summary>

**`[ 'ITEM2', 'item9', 'item10' ]`**, **`0 -1`**, **`[ 'ITEM2', 'item10', 'item9' ]`** — `numeric: true` compares embedded digit runs as numbers, and `sensitivity: 'base'` makes case and accents invisible.

The default `sort` is code-unit order, so every uppercase letter sorts before every lowercase one and `item10` sorts before `item9` — the comparison is decided at the first digit, where `'1'` is below `'9'`, and never gets as far as the length of the number. A collator fixes both, and `sensitivity: 'base'` even reports `'a'` and `'A'` as *equal*, which is what you want for search and grouping (and never for `Set` membership). Build the collator once and pass `collator.compare` — it's already bound, and it avoids re-creating the locale data that `localeCompare` builds on every single comparison. Always pass an explicit locale so your output doesn't depend on the machine.
</details>

---

### Q26 — the ISO week rule

Without writing code: in ISO-8601, which week is week 1, when does a week start, and can a date in January belong to the previous year's week 52?

<details><summary>Answer</summary>

**Weeks start on Monday. Week 1 is the week containing the first Thursday of January — equivalently, the week containing January 4th. And yes: January 1st, 2nd, and 3rd can belong to week 52 or 53 of the *previous* ISO year.**

The rule exists so that every ISO week has all seven days in the year that owns it — the "majority of days" test, which the Thursday shorthand encodes. A consequence is that the ISO **week-year** is a different number from the calendar year for up to three days at each end, so `week` alone is not a key: you need the pair, formatted `2026-W34`. ISO years have 52 or 53 weeks. The implementation is short — shift the date to the Thursday of its week, take that Thursday's calendar year, then count weeks from that year's January 1st — and getting it wrong shows up as a report with a week 53 that has three days in it, or a "this week versus last week" comparison that silently spans a year boundary.
</details>

---

### Q27 — building a regex from a string

What does this print?

```js
console.log(String.raw`a\nb`.length, `a\nb`.length);
const user = 'a.b';
console.log(new RegExp(user).test('axb'), new RegExp(user).test('a.b'));
const escaped = user.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
console.log(escaped, new RegExp(escaped).test('axb'));
```

<details><summary>Answer</summary>

**`4 3`**, **`true true`**, **`a\.b false`** — user input dropped into a regex is *code*, and `.` is the mildest thing it can smuggle in.

`String.raw` keeps backslash sequences literal, which is why it's the right way to write a pattern in a template literal — the ordinary literal turned `\n` into a newline and lost a character. The middle line is the bug: a search box containing `a.b` happily matches `axb`, and a user who types `(`, `[`, or `\` gets a `SyntaxError` thrown from your search. Worse, a pattern like `(a+)+$` against a long input is catastrophic backtracking — a one-line denial of service. Escape every regex metacharacter with the replacement above (or `RegExp.escape` where your runtime has it), and prefer `includes`/`startsWith` when you don't actually need a pattern.
</details>

---

### Q28 — the replacement mini-language

What does this print?

```js
const s = '2024-05-06';
console.log(s.replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/, '$<d>/$<m>/$<y>'));
console.log(s.replace(/\d+/g, (m) => m.length));
console.log('a-b'.replace(/-/, '$&$&'), 'a-b'.replace('-', "$'"));
```

<details><summary>Answer</summary>

**`06/05/2024`**, **`4-2-2`**, **`a--b abb`** — the replacement *string* has its own syntax, and `$` is never just a dollar sign.

`$<name>` inserts a named group, `$1`–`$9` a numbered one, `$&` the whole match, `` $` `` everything before the match, and `$'` everything after — which is how `"$'"` turned `a-b` into `abb`. That mini-language runs even when the pattern was a plain string, so a replacement value taken from user input can rewrite your output in ways you never intended; pass a **function** instead and the string is used verbatim. The function form also gives you the match, the groups, the offset, and the whole input as arguments, which is how you do any real per-match logic.
</details>
