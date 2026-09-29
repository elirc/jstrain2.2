# String methods

Every string method you actually use, the unicode traps, replacement patterns, and 17 recipes.

## Top of mind

| Question | Answer |
| --- | --- |
| Do any of these mutate? | **No.** Strings are immutable — every method returns a *new* string |
| `slice` or `substring`? | `slice`. `substring` silently swaps its args and treats negatives as `0` |
| Why is `'😀'.length` `2`? | `.length` counts UTF-16 code units, not characters. `[...'😀'].length` → `1` |
| Replace every match? | `str.replaceAll(a, b)` (ES2021), or `str.replace(/x/g, b)`. `replace` with a string does one |
| Pad a number? | `String(7).padStart(3, '0')` → `'007'` |

## Master table

**Immutable.** No method below changes the receiver; each returns a new string (or a number/boolean/array).
`s.toUpperCase()` does nothing unless you assign the result.

### Search

| Method | Returns | Example |
| --- | --- | --- |
| `indexOf(sub, from?)` | first index or `-1` | `'hello'.indexOf('l')` → `2` |
| `lastIndexOf(sub, from?)` | last index or `-1` | `'hello'.lastIndexOf('l')` → `3` |
| `includes(sub, from?)` | boolean | `'hello'.includes('ell')` → `true` |
| `startsWith(sub, pos?)` | boolean | `'hello'.startsWith('ll', 2)` → `true` |
| `endsWith(sub, endPos?)` | boolean | `'hello'.endsWith('ell', 4)` → `true` |
| `search(regex)` | index of first match or `-1` | `'hello'.search(/l+/)` → `2` |
| `match(regex)` | no `/g`: match array w/ groups; `/g`: all matches; else `null` | `'a1b2'.match(/\d/g)` → `['1','2']` |
| `match(regex)` without `/g` | `[full, ...groups]` + `.index`, `.groups` | `'a1b2'.match(/(\w)(\d)/)` → `['a1','a','1']`, `.index` `0` |
| `matchAll(regex)` | iterator of full match objects — regex **must** be `/g` | `[...'a1b2'.matchAll(/(\w)(\d)/g)].map(m => m[2])` → `['1','2']` |
| `at(i)` | char or `undefined`; negative from end | `'hello'.at(-1)` → `'o'`, `'abc'.at(9)` → `undefined` |
| `charAt(i)` | char or `''` when out of range | `'abc'.charAt(9)` → `''` |
| `charCodeAt(i)` | UTF-16 code unit (0–65535) or `NaN` | `'😀'.charCodeAt(0)` → `55357` (half a surrogate pair) |
| `codePointAt(i)` | full code point | `'😀'.codePointAt(0)` → `128512` |

**Gotcha.** `'abc'.includes(/a/)` throws `TypeError` — `includes`/`startsWith`/`endsWith` reject regexes.
`matchAll` with a non-global regex throws too. `match` without `/g` gives you capture groups; with `/g`
it gives you strings and **no** groups — use `matchAll` when you want both.

### Extract

| Method | Returns | Example |
| --- | --- | --- |
| `slice(start?, end?)` | substring; negatives count from the end | `'hello'.slice(-3)` → `'llo'` |
| `substring(start?, end?)` | substring; negatives → `0`, args swapped if reversed | `'hello'.substring(3, 1)` → `'el'` |
| `split(sep?, limit?)` | array of pieces | `'a,b,c'.split(',', 2)` → `['a','b']` |
| `split(regex)` | pieces; capture groups are **kept** | `'a1b'.split(/(\d)/)` → `['a','1','b']` |
| `split()` no arg | one-element array | `'abc'.split()` → `['abc']` |
| `at(i)` | single char, negative allowed | `'abc'.at(-2)` → `'b'` |
| `substr(start, len)` | legacy, avoid | use `slice(start, start + len)` |

**`slice` vs `substring`.** Same when both args are non-negative and in order. Different everywhere else:

```js
'hello'.slice(-3);        // => 'llo'   negative = from the end
'hello'.substring(-3);    // => 'hello' negative clamped to 0
'hello'.slice(3, 1);      // => ''      backwards range = empty
```
Both clamp past the end: `'hello'.slice(1, 99)` and `'hello'.substring(1, 99)` are both `'ello'`.

### Transform

| Method | Returns | Example |
| --- | --- | --- |
| `toUpperCase()` / `toLowerCase()` | new string | `'ß'.toUpperCase()` → `'SS'` (length grows) |
| `toLocaleUpperCase(locale)` | locale-aware new string | `'istanbul'.toLocaleUpperCase('tr')` → `'İSTANBUL'` |
| `trim()` | both ends stripped of whitespace + newlines | `'\n\t x  '.trim()` → `'x'` |
| `trimStart()` / `trimEnd()` | one end stripped | `'  x  '.trimStart()` → `'x  '` |
| `padStart(len, pad = ' ')` | left-padded to `len` | `'5'.padStart(3, '0')` → `'005'` |
| `padEnd(len, pad = ' ')` | right-padded; pad string is truncated to fit | `'ab'.padEnd(5, '123')` → `'ab123'` |
| `repeat(n)` | `n` copies; `RangeError` if `n < 0` | `'ab'.repeat(3)` → `'ababab'`, `'ab'.repeat(0)` → `''` |
| `replace(pat, rep)` | string pattern → **first** match only | `'a.b.c'.replace('.', '-')` → `'a-b.c'` |
| `replaceAll(pat, rep)` | every match; regex arg must be `/g` (ES2021) | `'a.b.c'.replaceAll('.', '-')` → `'a-b-c'` |
| `concat(...strs)` | joined string | `'a'.concat('b', 'c')` → `'abc'` — just use `+` |
| `normalize(form = 'NFC')` | canonical form: `NFC` `NFD` `NFKC` `NFKD` | `'\uFB01'.normalize('NFKD')` → `'fi'` (2 chars) |
| `localeCompare(other, locale?, opts?)` | `-1` / `0` / `1` — a sort comparator | `'a'.localeCompare('b')` → `-1` |

**Gotcha.** `padStart`/`padEnd` never truncate the original: `'abcdef'.padStart(3, '0')` → `'abcdef'`.
If `len` ≤ `str.length` you get the string back unchanged.

**`localeCompare` options.** `{ numeric: true }` gives natural number ordering, `{ sensitivity: 'base' }`
ignores case and accents.

```js
['file10', 'file9'].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
// => ['file9', 'file10']   plain sort gives ['file10','file9']
'a'.localeCompare('A', undefined, { sensitivity: 'base' });   // => 0
```

### Build / convert

| Method | Returns | Example |
| --- | --- | --- |
| `` String.raw`...` `` | the literal source, escapes untouched | ``String.raw`C:\Users\n`.length`` → `10` (no newline in there) |
| `` `a${x}b` `` | interpolated string | `` `sum ${1 + 2}` `` → `'sum 3'` |
| `String(v)` | safe on everything | `String(null)` → `'null'`, `String(Symbol('s'))` → `'Symbol(s)'` |
| `v.toString(radix?)` | throws on `null`/`undefined`; radix on numbers | `(255).toString(16)` → `'ff'`, `(123).toString(2)` → `'1111011'` |
| `v + ''` | fast coercion, **throws on Symbol** | `12 + ''` → `'12'`, `[1,2] + ''` → `'1,2'` |
| `String.fromCharCode(...codes)` | string from UTF-16 units | `String.fromCharCode(72, 105)` → `'Hi'` |
| `String.fromCodePoint(...cps)` | string from code points | `String.fromCodePoint(128512)` → `'😀'` |
| `Array.from(str)` | array of **code points** | `Array.from('😀').length` → `1` |
| `str.split('')` | array of **code units** — breaks emoji | `'😀'.split('').length` → `2` |

| Converting | `String(v)` | `v.toString()` | `v + ''` |
| --- | --- | --- | --- |
| `null` / `undefined` | `'null'` / `'undefined'` | `TypeError` | `'null'` / `'undefined'` |
| `Symbol('s')` | `'Symbol(s)'` | `'Symbol(s)'` | `TypeError` |
| `255` with radix | no | `(255).toString(16)` → `'ff'` | no |
| `{}` | `'[object Object]'` | `'[object Object]'` | `'[object Object]'` |

Default to `String(v)`. Use `.toString(radix)` only for number bases.

## Literals & unicode

### Template literals

```js
const name = 'Al';
`Hi ${name}, ${1 + 2} msgs`;   // => 'Hi Al, 3 msgs'  — any expression, nesting allowed
```

Multi-line: a raw newline inside backticks *is* a newline — no `\n` needed, but leading indentation
is kept verbatim.

Tagged template — the tag receives the literal chunks plus the interpolated values:

```js
const tag = (strings, ...values) => strings.raw.join('|') + '::' + values.join(',');
tag`a${1}b${2}c`;   // => 'a|b|c::1,2'
```

`` String.raw`...` `` is just the built-in tag that returns the raw chunks — the escape-proof path for
Windows paths and regex sources: ``String.raw`\d+\.\d+` `` → `'\d+\.\d+'`.

### Escape sequences & unicode

| Escape | Means | Example |
| --- | --- | --- |
| `\n` | newline | `'a\nb'.length` → `3` |
| `\t` | tab | `'col1\tcol2'.split('\t')` → `['col1','col2']` |
| `\r` | carriage return | Windows line endings are `\r\n` |
| `\\` | one backslash | `'a\\b'.length` → `3`, prints `a\b` |
| `\'` `\"` `` \` `` | quote matching the delimiter | `'it\'s'` → `it's` |
| `\0` | NUL character | `'\0'.charCodeAt(0)` → `0` |
| `\xNN` | code point 0–255 | `'\x41'` → `'A'` |
| `\uNNNN` | one UTF-16 code unit | `'\u0041'` → `'A'` |
| `\u{...}` | any code point (ES2015) | `'\u{1F600}'` → `'😀'` |
| `\${` | literal `${` inside a template | `` `\${x}` `` → `'${x}'` |

**Surrogate pairs.** Astral characters (emoji, rare CJK) are stored as *two* UTF-16 code units, so
index-based methods split them in half:

```js
'😀'.length;              // => 2   code units
[...'😀'].length;         // => 1   iteration is code-point aware
'😀'.split('').length;    // => 2   broken halves, renders as garbage
```

**Grapheme clusters.** Even code points aren't "characters" — `'👍🏽'` is an emoji plus a skin-tone
modifier, 2 code points, 1 visible glyph. Count what a human sees with `Intl.Segmenter`:

```js
[...new Intl.Segmenter().segment('a👍🏽b')].length;   // => 3
```

**Normalization.** `'e\u0301'` (e + combining accent) and `'\u00e9'` both render as `é` but are not
`===`. Compare with `a.normalize('NFC') === b.normalize('NFC')`; lengths are `2` and `1`.

## `replace` / `replaceAll` replacement patterns

Inside the *replacement string*, `$` is special. Verified in Node 22:

| Pattern | Inserts | Example |
| --- | --- | --- |
| `$&` | the whole match | `'a-b'.replace('-', '[$&]')` → `'a[-]b'` |
| `` $` `` | everything **before** the match | `'abc'.replace('b', '[$`]')` → `'a[a]c'` |
| `$'` | everything **after** the match | `'abc'.replace('b', "[$']")` → `'a[c]c'` |
| `$1` … `$99` | numbered capture group | `'2026-08-20'.replace(/(\d+)-(\d+)/, '$2/$1')` → `'08/2026-20'` |
| `$<name>` | named capture group | `'2026-08'.replace(/(?<y>\d{4})-(?<m>\d\d)/, '$<m>/$<y>')` → `'08/2026'` |
| `$$` | a literal `$` | `'cost'.replace('o', '$$')` → `'c$st'` |

**Gotcha.** Any user-supplied replacement string is a bug waiting to happen — a stray `$&` in it gets
expanded. Pass a **function** instead; `$` means nothing there.

```js
'a1'.replace(/(\d)/, (match, p1, offset, whole) => [match, p1, offset, whole].join('|'));
// => 'a1|1|1|a1'   fn args: (match, ...groups, offset, wholeString, groupsObject?)
```

## Recipes

### Capitalize the first letter

```js
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);   // cap('hello') => 'Hello'
```
`charAt` not `[0]` — it returns `''` on an empty string instead of `undefined`.

### Title case

```js
'the quick fox'.replace(/\b\w/g, c => c.toUpperCase());   // => 'The Quick Fox'
```
Naive: it also capitalizes "of", "the". Fine for headings, not for prose.

### camelCase → kebab-case

```js
'backgroundColorX'.replace(/[A-Z]/g, c => '-' + c.toLowerCase());   // => 'background-color-x'
```

### kebab-case → camelCase

```js
'background-color-x'.replace(/-(\w)/g, (_, c) => c.toUpperCase());   // => 'backgroundColorX'
```

### snake_case → camelCase

```js
'user_first_name'.replace(/_(\w)/g, (_, c) => c.toUpperCase());   // => 'userFirstName'
```

### Truncate with an ellipsis

```js
const trunc = (s, n) => s.length <= n ? s : s.slice(0, n - 1) + '\u2026';
trunc('abcdefgh', 5);   // => 'abcd…'   trunc('abc', 5) => 'abc'
```
Word-safe variant: `s.slice(0, s.lastIndexOf(' ', n - 1)) + '…'` — `trunc('the quick brown fox', 12)` → `'the quick…'`.

### Pad a number with zeros

```js
String(7).padStart(3, '0');   // => '007'
```
`padStart` no-ops if the string is already long enough — it never truncates.

### Reverse a string

```js
[...'ab😀'].reverse().join('');            // => '😀ba'   code-point safe
'ab😀'.split('').reverse().join('');       // => broken: surrogate halves swapped
```
Fully correct needs graphemes: `[...new Intl.Segmenter().segment(s)].map(x => x.segment).reverse().join('')`.

### Count occurrences of a substring

```js
'banana'.split('na').length - 1;              // => 2
[...'banana'.matchAll(/na/g)].length;         // => 2   (regex version, handles patterns)
```
Neither counts overlaps: `'aaa'.split('aa').length - 1` → `1`, not `2`.

### Template a string from an object

```js
const tpl = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
tpl('Hi {name}, {n} msgs', { name: 'Al', n: 3 });   // => 'Hi Al, 3 msgs'
```

### Strip HTML-ish tags

```js
'<b>hi</b> <i>x</i>'.replace(/<[^>]*>/g, '');   // => 'hi x'
```
Display-only sanitizing. It is **not** XSS-safe — never trust it for untrusted HTML.

### Escape text for HTML output

```js
const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => s.replace(/[&<>"']/g, c => MAP[c]);
esc('<a href="x">&</a>');   // => '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;'
```

### Slugify

```js
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
slug('  Café & Bar -- 2026! ');   // => 'cafe-bar-2026'
```
`NFD` splits accents into base + combining mark so the mark range can be dropped.

### Escape a string for use inside a regex

```js
const reEscape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
new RegExp(reEscape('a.b')).test('axb');   // => false   (unescaped, it would be true)
```
`RegExp.escape` does **not** exist in Node 22 — you need this helper.

### Split on multiple delimiters

```js
'a, b;c|d'.split(/[,;|]\s*/);   // => ['a','b','c','d']
```
Add `.filter(Boolean)` to drop empty pieces from leading/trailing/doubled separators.

### Join with an Oxford comma

```js
new Intl.ListFormat('en').format(['a', 'b', 'c']);                    // => 'a, b, and c'
new Intl.ListFormat('en', { type: 'disjunction' }).format(['a', 'b']); // => 'a or b'
```
Two items correctly gives `'a and b'` (no comma); one item gives `'a'`.

### Byte length vs character length

```js
'café'.length;                              // => 4   UTF-16 code units
Buffer.byteLength('café');                  // => 5   UTF-8 bytes (Node only)
new TextEncoder().encode('café').length;    // => 5   UTF-8 bytes (portable)
```
`'😀'` is `length` `2` but **4** UTF-8 bytes. Size limits on APIs are bytes, not `.length`.

---
*See also: [regex.md](regex.md) · [array-methods.md](array-methods.md) · [es2020-plus.md](es2020-plus.md) · [js-gotchas.md](js-gotchas.md)*
