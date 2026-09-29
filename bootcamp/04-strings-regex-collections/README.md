# 04 · Strings, Regex & Collections

Most of the code you write day to day is moving text around: parsing what
someone else sent you, formatting something for a human to read, and
keeping track of what you have already seen. This module is the toolbox
for exactly that — the string methods worth memorizing, enough regex to
be dangerous (and enough to know when to stop), Map/Set/WeakMap for when
objects and arrays are the wrong shape, and the two places JavaScript
will quietly lie to you: dates and number formatting.

## The mental model

### 1. Strings are immutable — every method returns a new one

There is no such thing as editing a string in place. `toUpperCase()`,
`slice()`, `replace()` all hand you a fresh string and leave the original
alone. That is why a "modification" you forget to assign does nothing.

```js
const name = 'ada';
name.toUpperCase();          // → 'ADA', thrown away
console.log(name);           // 'ada'  ← unchanged, and this is the bug
const shouty = name.toUpperCase();   // ✔ keep the result
```

The upside: strings are safe to pass around. Nobody can mutate the one
you handed them. The cost: building a string in a big loop with `+=`
allocates every time — push into an array and `join('')` instead.

### 2. Regex is a tiny language — learn six tokens, then stop

You do not need to memorize the whole grammar. Six tokens carry ~90% of
real regexes:

```js
/\d/     // one digit          /\w/  letter, digit or _     /\s/  whitespace
/a+/     // one or more 'a'    /a*/  zero or more           /a?/  optional
/[aeiou]/  // any one of these   /[^aeiou]/  any one EXCEPT these
/^abc$/  // anchored: the WHOLE string is 'abc'
/(\d+)-(\d+)/          // capture groups → m[1], m[2]
/(?<year>\d{4})/       // named group   → m.groups.year
```

Then three verbs: `re.test(s)` for yes/no, `s.match(re)` for the first
match (or all of them with `/g`), `s.replace(re, fn)` when the
replacement depends on what matched.

```js
'order 66'.match(/\d+/)[0];                  // '66'
'a1b22'.match(/\d+/g);                       // ['1', '22']
'cat CAT'.replace(/cat/gi, (m) => `[${m}]`); // '[cat] [CAT]'
```

If a pattern grows past a line and a half, stop. A `split()` and a loop
that you can read in six months beats a regex that you cannot.

### 3. Map/Set vs object/array — a decision table

An object is a *record* (fixed, known, string-named fields). A Map is a
*dictionary* (arbitrary, dynamic keys). Reaching for `{}` when you mean a
dictionary is the most common shape mistake in JS.

| you need | use | why not the other |
|---|---|---|
| fixed named fields, JSON in/out | object | Map does not JSON.stringify |
| keys added and removed at runtime | **Map** | object keys collide with `toString`, `constructor` |
| non-string keys (objects, numbers) | **Map** | object keys are stringified: `o[1]` and `o['1']` are one slot |
| "how many entries?" | **Map** (`.size`) | `Object.keys(o).length` allocates an array |
| guaranteed insertion order | **Map** | objects put integer-like keys first |
| ordered list, duplicates fine | array | — |
| membership test, no duplicates | **Set** | `array.includes` is O(n) per call |
| metadata about an object, no leaks | **WeakMap** | a Map pins the object in memory forever |

```js
const o = {}; o[1] = 'a'; o['1'] = 'b';
Object.keys(o);                       // ['1']  ← one slot, coerced

const m = new Map(); m.set(1, 'a').set('1', 'b');
m.size;                               // 2      ← two keys, kept as-is
```

### 4. A Date is a number wearing a costume

A `Date` is milliseconds since 1970-01-01 UTC. Every "date math" question
is arithmetic on that number. The trap is that `Date` has two parallel
APIs — local (`getMonth`, `getDate`) and UTC (`getUTCMonth`,
`getUTCDate`) — and the local one answers differently on every machine.

```js
const d = new Date('2026-03-01T23:30:00Z');
d.getUTCDate();   // 1  — the same everywhere on earth
d.getDate();      // 1 or 2, depending on where the laptop is
```

Rule for library code: build with `Date.UTC(...)`, read with `getUTC*`,
never with the local getters. Every date test in this module holds in
Tokyo and in Los Angeles because of that rule.

## The details that bite

1. **A `/g` regex is stateful.** `test()` parks a cursor at
   `re.lastIndex` and the next call resumes from there.
   ```js
   const RE = /\d+/g;
   RE.test('a1');  // true    RE.test('a1');  // false ← same input!
   ```
2. **`match` with `/g` returns `null`, not `[]`,** when nothing matches.
   ```js
   'abc'.match(/\d+/g);        // null → `?? []` or the next .map() throws
   ```
3. **`matchAll` throws without `/g`.** It also needs the spread to become
   an array: `[...s.matchAll(re)]`.
4. **`match.groups` is a null-prototype object.** It works fine for
   property access, but deep-equals against `{}` fail — `{ ...m.groups }`.
5. **`Date` months are 0-indexed.** `Date.UTC(2026, 0, 5)` is January 5th,
   and `getUTCMonth()` returns `0` for January — `+1` when formatting.
   ```js
   new Date(Date.UTC(2026, 11, 25)).toISOString();  // '2026-12-25T...'
   ```
6. **`new Date('2026-08-20')` is UTC, `new Date('2026-08-20T00:00')` is
   local.** A date-only string parses as UTC; add a time without a zone
   and the rules flip. Always write the `Z`.
7. **`toFixed` returns a string and rounds the binary double.**
   ```js
   (1.005).toFixed(2);   // '1.00' — 1.005 is really 1.00499999999999989
   (0.1 + 0.2).toFixed(2); // '0.30' — right answer, wrong type
   ```
8. **`Intl` with no locale reads the machine's.** `new
   Intl.NumberFormat().format(1234.5)` is `'1,234.5'` here and
   `'1.234,5'` in Berlin. Always pass `'en-US'` explicitly.
9. **`replace()` with a string pattern swaps only the first hit.** Use
   `replaceAll()` (or a `/g` regex) when you mean all of them.
10. **`substring()` is not `slice()`.** It clamps negatives to 0 and
    swaps its arguments: `'abc'.substring(2, 0)` is `'ab'`, while
    `'abc'.slice(2, 0)` is `''`. Use `slice`.
11. **`Object.keys` sorts integer-like keys first.** `{ b: 1, 2: 2, a: 3 }`
    enumerates as `['2', 'b', 'a']`. Maps never reorder.
12. **`key in obj` is true for `'constructor'` and `'toString'`.** Use
    `Object.hasOwn(obj, key)` when the key came from user input.

## Cheat table

| want | string method |
|---|---|
| last character | `s.at(-1)` |
| a piece, negatives OK | `s.slice(start, end)` |
| does it contain / start / end | `includes` · `startsWith` · `endsWith` |
| pad to a column | `s.padStart(n, ' ')` · `s.padEnd(n, ' ')` |
| repeat | `s.repeat(n)` |
| strip whitespace | `trim` · `trimStart` · `trimEnd` |
| swap every occurrence | `s.replaceAll(from, to)` |
| text → array → text | `s.split(sep)` · `arr.join(sep)` |

| want | collection call |
|---|---|
| dedupe an array | `[...new Set(arr)]` |
| count things | `m.set(k, (m.get(k) ?? 0) + 1)` |
| object ↔ Map | `Object.fromEntries(m)` · `new Map(Object.entries(o))` |
| set algebra (Node 22) | `a.union(b)` · `a.intersection(b)` · `a.difference(b)` · `a.isSubsetOf(b)` |
| private metadata | `new WeakMap()` keyed by the object |

## Exercises

| # | file | ★ | what you build |
|---|---|---|---|
| 01 | `01-string-pieces.js` | ★☆☆ | `at`/`slice` with negative indexes, extension + type checks |
| 02 | `02-split-join-replace.js` | ★☆☆ | CSV fields, path join, `replaceAll`, whitespace squish |
| 03 | `03-receipt-table.js` | ★★☆ | fixed-width receipt with `padEnd`/`repeat`, cents-only math |
| 04 | `04-name-formatting.js` | ★☆☆ | `capitalize`, `titleCase`, initials from a full name |
| 05 | `05-case-converters.js` | ★★★ | camelCase ↔ snake_case ↔ kebab-case, all six directions |
| 06 | `06-truncate-and-mask.js` | ★★☆ | truncate to a real budget, mask a card to `****1234` |
| 07 | `07-slugify.js` | ★★☆ | title → URL slug in three regex passes |
| 08 | `08-word-wrap.js` | ★★★ | greedy word wrap at N columns |
| 09 | `09-regex-basics.js` | ★☆☆ | `test`/`match`, `\d+`, and the `null`-instead-of-`[]` trap |
| 10 | `10-anchors-and-validators.js` | ★★☆ | `^…$` anchors: hex colour and identifier validators |
| 11 | `11-regex-groups.js` | ★★☆ | capture groups, named groups, `matchAll` |
| 12 | `12-lastindex-trap.js` | ★★☆ | make a shared `/g` regex give the same answer twice |
| 13 | `13-parse-pairs.js` | ★★★ | `a=1;b=2` and a full query string → object |
| 14 | `14-replace-with-function.js` | ★★☆ | censor, highlight, and fill a template with a replacer |
| 15 | `15-map-basics.js` | ★☆☆ | object keys vs Map keys, size, order, both conversions |
| 16 | `16-frequency-and-lookup.js` | ★★☆ | frequency map, most common item, invert for two-way lookup |
| 17 | `17-set-dedupe.js` | ★☆☆ | dedupe, detect duplicates, find the first repeat |
| 18 | `18-set-algebra.js` | ★★☆ | union, intersection, difference, subset |
| 19 | `19-weakmap-metadata.js` | ★★★ | private metadata + memoize by object identity |
| 20 | `20-utc-dates.js` | ★★☆ | format/parse `YYYY-MM-DD` and `isWeekend`, all in UTC |
| 21 | `21-date-math.js` | ★★☆ | add days, diff in whole days, humanize `2h 5m 3s` |
| 22 | `22-number-formatting.js` | ★★☆ | round without `toFixed`, group thousands, format USD |

Do the warm-ups and core in order. Stretch if time allows.

Run one file at a time:

```
node exercises/01-string-pieces.js
```

Every test starts as `☐ todo`. Make them green, then compare with
`solutions/` — the walkthrough at the top of each solution names the
concept and the classic wrong turn.

### Extra reps

Same module, more mileage. Take these once 01–22 are green — they push
the same four tools (regex, parsing, collections, UTC dates) into the
shapes you actually meet in a codebase.

| # | file | ★ | what you build |
|---|---|---|---|
| 23 | `23-lookahead-rules.js` | ★★☆ | password rules as stacked lookaheads, plus a "which rule broke" report |
| 24 | `24-thousands-separators.js` | ★★★ | insert `1,234,567` with lookahead + lookbehind, fraction and minus intact |
| 25 | `25-sticky-tokenizer.js` | ★★☆ | tokenize an expression with sticky `/y` regexes and `lastIndex` |
| 26 | `26-named-group-rewrite.js` | ★☆☆ | `$<name>` backreferences: ISO → US dates, `Last, First` → `First Last` |
| 27 | `27-split-keep-delimiters.js` | ★☆☆ | lossless `split` — a capturing group keeps the separators |
| 28 | `28-log-line-parser.js` | ★★☆ | timestamp/level/message parser + a per-level tally Map |
| 29 | `29-semver-compare.js` | ★★★ | parse, compare and sort semver, prerelease rules included |
| 30 | `30-duration-strings.js` | ★★☆ | `'1h30m'` ↔ milliseconds, validate before you parse |
| 31 | `31-color-formats.js` | ★☆☆ | `#ff8800` ↔ `rgb(255, 136, 0)`, shorthand and padding |
| 32 | `32-codepoints-and-emoji.js` | ★★☆ | emoji-safe length and reverse — code points, not code units |
| 33 | `33-accent-folding.js` | ★★★ | `normalize()`: accent-insensitive search and NFC comparison |
| 34 | `34-text-layout.js` | ★★☆ | two-column blocks and a markdown table built from objects |
| 35 | `35-multimap.js` | ★☆☆ | key → array multimap and `groupBy` on a Map |
| 36 | `36-counted-bag-topk.js` | ★★☆ | word counts + top-k, ties broken by insertion order (stable sort) |
| 37 | `37-date-range-overlap.js` | ★★★ | half-open range overlap, intersection and merge |
| 38 | `38-business-days-and-months.js` | ★★☆ | working days between two UTC dates, `addMonths` with clamping |
| 39 | `39-iso-week-and-calendar.js` | ★★★ | ISO 8601 week numbers and a Monday-first calendar grid |
| 40 | `40-intl-formatting.js` | ★★☆ | `DateTimeFormat` pinned to UTC, `RelativeTimeFormat`, `Collator` |

Every date exercise here is UTC-only and every `Intl` call names `'en-US'`
explicitly, so the answers are the same on every machine — set `TZ` to
anything you like and re-run them.

---

**Stuck?** `cheatsheets/string-methods.md` · `cheatsheets/regex.md` (flags, the `lastIndex` bug) · `cheatsheets/object-map-set.md` (Map/Set/WeakMap) · **Self-check:** `quizzes/05-strings-regex-collections.md` · **Next:** `bootcamp/05-prototypes-and-classes`
