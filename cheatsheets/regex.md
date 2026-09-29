# Regex

Token reference, the method matrix, and 12 patterns broken down piece by piece.

## Top of mind

| Need | Use | Note |
| --- | --- | --- |
| Just a yes/no | `re.test(s)` | **Never** reuse a `/g/` regex with `.test` — `lastIndex` makes it alternate |
| All matches with groups | `[...s.matchAll(/re/g)]` | `g` flag is **required**, else `TypeError` |
| First match with groups | `s.match(/re/)` | With `g` you get strings only, no groups |
| Replace everything | `s.replace(/re/g, x)` or `s.replaceAll('lit', x)` | `replaceAll` with a regex needs `g` too |
| Escape user input | `s.replace(/[.*+?^${}()\|[\]\\]/g, '\\$&')` | `RegExp.escape` is ES2025, **not in Node 22.16** |

---

## Token reference

### Character classes

| Token | Matches | Example |
| --- | --- | --- |
| `.` | Any char except line terminators (all chars with `s` flag) | `/a.b/.test('a\nb')` → `false`; `/a.b/s` → `true` |
| `\d` `\D` | Digit `[0-9]` / non-digit | `/\d+/.exec('ab12')[0]` → `'12'` |
| `\w` `\W` | Word char `[A-Za-z0-9_]` / non-word | `\w` does **not** include `é` |
| `\s` `\S` | Whitespace (space, tab, newline, ` `…) / non-whitespace | `'  a '.replace(/\s+/g, '')` → `'a'` |
| `[abc]` | Any one of `a`, `b`, `c` | Inside a class only `^ ] \ -` need escaping |
| `[^abc]` | Any char **not** `a`, `b`, `c` | `^` only negates as the **first** char |
| `[a-z]` | Range | `[a-zA-Z0-9_-]` — put `-` last to keep it literal |
| `\b` `\B` | Word boundary / non-boundary (zero-width) | `'cat cats'.match(/\bcat\b/g)` → `['cat']` |
| `\p{L}` `\p{N}` `\p{Script=Greek}` | Unicode property — **requires `u` or `v` flag** | `'héllo wörld 123'.match(/\p{L}+/gu)` → `['héllo','wörld']` |
| `￿` `\u{1F600}` | Code unit / code point (the second needs `u`) | `/\u{1F600}/u.test('😀')` → `true` |

### Quantifiers

| Token | Means | Lazy form |
| --- | --- | --- |
| `*` | 0 or more | `*?` |
| `+` | 1 or more | `+?` |
| `?` | 0 or 1 (optional) | `??` |
| `{n}` | Exactly n | — |
| `{n,}` | n or more | `{n,}?` |
| `{n,m}` | Between n and m | `{n,m}?` |

Greedy takes as much as it can and backtracks; lazy takes as little as it can and grows.

```js
'<a><b>'.match(/<.+>/)[0];      // => '<a><b>'   greedy: runs to the last '>'
'<a><b>'.match(/<.+?>/)[0];     // => '<a>'      lazy: stops at the first '>'
```

### Anchors

| Token | Means | With `m` flag |
| --- | --- | --- |
| `^` | Start of **string** | Start of any **line** |
| `$` | End of **string** | End of any **line** |
| `\b` | Word boundary | unchanged |

```js
'a\nb'.match(/^./gm);           // => ['a', 'b']   (without m: ['a'])
```

### Groups & alternation

| Token | Means | Example |
| --- | --- | --- |
| `(...)` | Capturing group — numbered from 1, left to right by `(` | `'2024-05'.replace(/(\d+)-(\d+)/, '$2/$1')` → `'05/2024'` |
| `(?:...)` | Non-capturing — grouping only, no capture slot | Use this by default; captures cost you |
| `(?<name>...)` | Named capture — lands in `m.groups.name` | `.groups` is a **null-prototype object** |
| `\1`, `\k<name>` | Backreference: match what group 1 already matched | `/\b(\w+)\s+\1\b/.test('the the cat')` → `true` |
| `\|` | Alternation — **lowest precedence of all** | see the trap below |

**The alternation trap.** `|` splits the *entire* pattern unless you group it.

```js
/^a|b$/.test('axb');            // => true   — reads as (^a) OR (b$)
/^(a|b)$/.test('axb');          // => false  — this is what you meant
```

An unmatched optional group is `undefined`, not `''`:

```js
'abc'.match(/(x)?b/);           // => ['b', undefined, index: 1, ...]
```

### Lookaround (zero-width — matches a position, consumes nothing)

| Token | Name | Example |
| --- | --- | --- |
| `(?=...)` | Positive lookahead | `'30 USD, 40 EUR'.match(/\d+(?= USD)/g)` → `['30']` |
| `(?!...)` | Negative lookahead | `'a1 b2 c3'.match(/[a-z](?!1)/g)` → `['b','c']` |
| `(?<=...)` | Positive lookbehind | `'$30 £40'.match(/(?<=\$)\d+/g)` → `['30']` |
| `(?<!...)` | Negative lookbehind | `'a1 b2'.match(/(?<![a])\d/g)` → `['2']` |

JS supports **variable-length lookbehind** — most other engines don't:

```js
'aaa$30'.match(/(?<=a+\$)\d+/g);   // => ['30']
```

### Escaping

Outside a character class these need a backslash: `. * + ? ^ $ { } ( ) | [ ] \ /`.
Inside a class only `^ ] \ -` matter (and `^` only in first position).

```js
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
new RegExp(esc('a.b*c')).test('a.b*c');   // => true   ('axbbc' => false)
```

`new RegExp` takes a **string**, so every backslash doubles — unless you use `String.raw`:

```js
new RegExp('\\d+');             // ugly but correct
new RegExp(String.raw`\d+`);    // same regex, readable
```

---

## Flags

| Flag | Name | Effect | Gotcha |
| --- | --- | --- | --- |
| `g` | global | Find all matches, not just the first | Makes the regex **stateful** via `lastIndex` — see below |
| `i` | ignoreCase | Case-insensitive | Locale-naive; `İ` will surprise you |
| `m` | multiline | `^`/`$` match at line breaks | Does **not** affect `.` |
| `s` | dotAll | `.` also matches `\n` | Added ES2018 |
| `u` | unicode | Enables `\u{...}` and `\p{...}`, treats surrogate pairs as one | Makes some previously-legal escapes an error |
| `y` | sticky | Match must start exactly at `lastIndex` | Ignores the rest of the string entirely |
| `d` | hasIndices | Adds `.indices` to results | `/(\d+)/d.exec('ab12').indices` → `[[2,4],[2,4]]` |
| `v` | unicodeSets | `u` plus set operations in classes (`[\p{L}--[a-z]]`) | ES2024, superset of `u` |

**The `lastIndex` bug.** A `/g/` (or `/y/`) regex remembers where it stopped:

```js
const re = /a/g;
re.test('ab');                  // => true   (lastIndex is now 1)
re.test('ab');                  // => false  (searched from index 1!)
```

Fix: don't store `/g/` regexes you call `.test()` on, or reset `re.lastIndex = 0` first.

---

## Methods matrix

| Call | Returns | With `/g` | Without `/g` | Notes |
| --- | --- | --- | --- | --- |
| `re.test(s)` | `boolean` | Advances `lastIndex` | Stateless | Fastest yes/no check |
| `re.exec(s)` | Match array or `null` | Iterates by `lastIndex`, `null` at the end (then resets to 0) | Always the first match | The only method that gives you a `while` loop |
| `s.match(re)` | Array or `null` | `['a1','b2']` — **strings only, no groups/index** | `['a1','1', index:0, input:'a1b2', groups:undefined]` | `null`, not `[]`, when nothing matches |
| `s.matchAll(re)` | Iterator of full match arrays | Required | **`TypeError`** | `[...s.matchAll(re)]` — the modern default |
| `s.search(re)` | Index or `-1` | `g` ignored | Index of first match | `'a1b2'.search(/\d/)` → `1` |
| `s.replace(re, x)` | New string | Replaces all | Replaces **first only** | `x` may be a string or a function |
| `s.replaceAll(re, x)` | New string | Replaces all | **`TypeError`** | With a *string* pattern it needs no flag |
| `s.split(re)` | Array of strings | same | same | **Capturing groups are included in the output** |

```js
'a1b2'.split(/\d/);             // => ['a', 'b', '']
'a1b2'.split(/(\d)/);           // => ['a', '1', 'b', '2', '']
```

### Iterating matches

```js
const rx = /(\w)(\d)/g; let m;
while ((m = rx.exec('a1b2'))) console.log(m[0], m[1], m.index);  // 'a1' 'a' 0 / 'b2' 'b' 2
```

Prefer `matchAll` — same data, no mutable `lastIndex`, no infinite loop if you forget `g`.

---

## Replacement patterns

| Token | Inserts | Example on `'abc'.replace(/b/, ...)` |
| --- | --- | --- |
| `$&` | The whole match | `'[$&]'` → `'a[b]c'` |
| `` $` `` | Everything **before** the match | `` '<$`>' `` → `'a<a>c'` |
| `$'` | Everything **after** the match | `"<$'>"` → `'a<c>c'` |
| `$1` … `$99` | Capture group n | `'2024-05'.replace(/(\d+)-(\d+)/,'$2/$1')` → `'05/2024'` |
| `$<name>` | Named group | `'$<m>/$<y>'` → `'05/2024'` |
| `$$` | A literal `$` | `'a'.replace(/a/,'$$')` → `'$'` |

### The replacer function

Signature: `(match, p1, …, pn, offset, string, groups)` — the `groups` object is appended **only when the pattern has named groups**.

```js
'x2024-05y'.replace(/(?<y>\d{4})-(?<m>\d{2})/, (...a) => a.length);   // => 'x6y'
// args: ['2024-05', '2024', '05', 1, 'x2024-05y', {y:'2024', m:'05'}]
```

Use it whenever the replacement needs logic — casing, arithmetic, lookups.

---

## 12 practical patterns

Every regex below was executed against the listed matches and non-matches.

### 1. Email-ish

```js
/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
```

| Piece | Means |
| --- | --- |
| `^` … `$` | Anchor the **whole** string — without these, `'a b@c.com'` passes |
| `[^\s@]+` | One or more chars that aren't whitespace or `@` (the local part) |
| `@` | Literal at-sign |
| `[^\s@]+` | The domain label |
| `\.` | Literal dot — escaped, or it'd match any char |
| `[^\s@]{2,}` | TLD, at least 2 chars |

Matches `a@b.co`, `first.last+tag@sub.example.com`. Rejects `a@b`, `@b.co`, `a@.co`, `a b@c.com`.
**Caveat.** The real RFC 5322 grammar is unmatchable in one readable regex. Use this as a typo filter and confirm by sending an email.

### 2. Hex colour

```js
/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
```

| Piece | Means |
| --- | --- |
| `#` | Literal hash |
| `(?:…\|…\|…)` | Non-capturing alternation of the three legal lengths |
| `{3,4}` | `#fff` and `#ffff` (the 4th nibble is alpha) |
| `{6}` / `{8}` | `#a1b2c3` and `#a1b2c3d4` |
| `/i` | Accept `A-F` too |

Rejects `fff` (no hash), `#12345` (5 digits), `#gg`.
Order matters: put the longer alternatives so they can't be shadowed — anchoring with `$` makes this safe either way.

### 3. URL-ish

```js
/^https?:\/\/[^\s/?#]+\.[^\s/?#]+(?:[/?#]\S*)?$/i
```

| Piece | Means |
| --- | --- |
| `https?` | `http` with an optional `s` |
| `:\/\/` | Escaped `://` (slashes need escaping inside a `/…/` literal) |
| `[^\s/?#]+\.[^\s/?#]+` | A host with at least one dot, stopping before path/query/fragment |
| `(?:[/?#]\S*)?` | Optional path, query, or fragment — everything to the end |

Matches `http://a.com`, `https://x.co/p?q=1#h`. Rejects `ftp://a.com`, `http://`, `notaurl`.
**Better.** In real code use `new URL(s)` in a `try/catch` — it's the actual parser.

### 4. ISO date `YYYY-MM-DD`

```js
/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/
```

| Piece | Means |
| --- | --- |
| `\d{4}` | Four-digit year |
| `0[1-9]\|1[0-2]` | Months 01–09 or 10–12 — blocks `00` and `13` |
| `0[1-9]\|[12]\d\|3[01]` | Days 01–09, 10–29, 30–31 — blocks `00` and `32` |

Rejects `2024-13-01`, `2024-00-10`, `2024-01-32`, `24-01-01`.
Still accepts `2024-02-31`; a regex can't know month lengths. Validate with `Date` afterwards.

### 5. Time `HH:MM` (24-hour)

```js
/^(?:[01]\d|2[0-3]):[0-5]\d$/
```

`[01]\d` covers 00–19, `2[0-3]` covers 20–23, `[0-5]\d` covers 00–59.
Matches `00:00`, `23:59`, `09:05`. Rejects `24:00`, `7:00` (needs the leading zero), `12:60`.

### 6. Query-string pairs

```js
[...'a=1&b=two&c='.matchAll(/(?<k>[^&=]+)=(?<v>[^&]*)/g)]
  .map(m => [m.groups.k, m.groups.v]);   // => [['a','1'], ['b','two'], ['c','']]
```

| Piece | Means |
| --- | --- |
| `(?<k>[^&=]+)` | Key: one or more chars that aren't `&` or `=` |
| `=` | The separator |
| `(?<v>[^&]*)` | Value: **zero** or more non-`&` chars, so `c=` yields `''` |
| `/g` | Required by `matchAll` |

**Better.** `new URLSearchParams(qs)` handles percent-decoding and `+`; use it unless you're parsing something URL-shaped that isn't a URL.

### 7. camelCase → words

```js
'parseHTTPResponse'
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')       // lower→Upper boundary
  .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');   // ACRONYMWord boundary
// => 'parse HTTP Response'
```

Pass 1 splits `parseHttp` → `parse Http`. Pass 2 splits the acronym run `HTTPResponse` → `HTTP Response` by finding "capitals followed by Capital+lowercase". Add `.toLowerCase()` for kebab/snake output.
Digits are ambiguous: `XML2Json` comes out as `XML2 Json`. Decide what you want and add a `(\d)([A-Z])` pass if needed.

### 8. Collapse and trim whitespace

```js
'  a \n\t b  '.replace(/\s+/g, ' ').trim();     // => 'a b'
'  hi  '.replace(/^\s+|\s+$/g, '');             // => 'hi'   (the manual trim)
```

`\s+` grabs runs of any whitespace including newlines and tabs. The second form shows alternation of two anchored patterns — `^\s+` OR `\s+$` — which is what `trim()` does natively.

### 9. Thousands separators

```js
'1234567.89'.replace(/\B(?=(\d{3})+(?!\d))/g, ',');   // => '1,234,567.89'
```

| Piece | Means |
| --- | --- |
| `\B` | A **non**-boundary — stops a comma landing before the first digit |
| `(?=…)` | Zero-width: we insert at a position, consuming nothing |
| `(\d{3})+` | One or more full groups of three digits ahead |
| `(?!\d)` | …and no digit after them, so the run ends cleanly |

**Better.** `n.toLocaleString('en-US')` or `Intl.NumberFormat`. Use the regex when you already have a string.

### 10. Capture between delimiters (non-greedy)

```js
[...'[a][bb]'.matchAll(/\[(.*?)\]/g)].map(m => m[1]);   // => ['a', 'bb']
'[a][bb][ccc]'.match(/\[(.*?)\]/g);                     // => ['[a]', '[bb]', '[ccc]']
```

`\[` and `\]` are literal brackets. `.*?` is the lazy engine: stop at the **first** `]`. With greedy `.*` the first match would swallow everything to the last `]`.

### 11. Duplicate word (backreference)

```js
/\b(\w+)\s+\1\b/.exec('the the cat');   // => ['the the', 'the', index: 0, ...]
/\b(\w+)\s+\1\b/.test('the cat');       // => false
```

`(\w+)` captures a word; `\1` demands the *same text* again. The `\b` at each end stops `the theme` matching. Add `/i` to catch `The the`.

### 12. Password policy (stacked lookaheads)

```js
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{12,}$/
```

| Piece | Means |
| --- | --- |
| `(?=.*[a-z])` | Somewhere ahead there's a lowercase — position unchanged |
| `(?=.*[A-Z])`, `(?=.*\d)` | Same test for uppercase and digit |
| `(?=.*[^\w\s])` | A symbol: not word-char, not whitespace |
| `.{12,}$` | Only *now* do we consume — 12+ chars total |

Matches `Abcdefghij1!`. Rejects `abcdefghij1!` (no capital), `Ab1!` (too short), `ABCDEFGHIJ1!` (no lowercase).
This is the canonical use of lookahead: **several independent conditions on the same string**.

---

## Debugging & performance

| Problem | Move |
| --- | --- |
| Regex "randomly" fails every other call | It has `g` and you're using `.test()` — reset `lastIndex` or drop `g` |
| Group numbering confusing | Switch every non-capturing group to `(?:…)`, name the rest `(?<x>…)` |
| Can't tell what matched | `re.exec(s)` and inspect `[0]`, `[1]`, `.index`, `.groups` |
| Backslash soup in `new RegExp` | `String.raw\`\d+\`` |
| Pattern hangs the process | Catastrophic backtracking |

**Catastrophic backtracking.** Nested quantifiers over overlapping alternatives — the shape `/(a+)+$/`, `/(\w+\s?)*$/`, `/(.*,)*x/` — force the engine to try exponentially many splits when the match ultimately fails. On a 30-character non-matching input that can be billions of attempts. Don't paste one into a REPL to "see"; recognise the shape instead.

Fixes: make the inner quantifier specific (`[^,]+` instead of `.*`), remove the redundant outer `+`/`*`, anchor earlier, or split the job into two simpler passes.

**Build patterns incrementally.** Write the anchors, run it; add one group, run it; add the next. A 60-character regex written in one go is a 60-character regex you can't debug.

---
*See also: [string-methods.md](string-methods.md) · [js-gotchas.md](js-gotchas.md)*
