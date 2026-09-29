// ─────────────────────────────────────────────────────────────────────────
//  13 · parsing key=value strings                            ★★★ stretch
//  concepts: split with limits · decodeURIComponent · Object.hasOwn
//  run: node 13-parse-pairs.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Cookies, config blobs and query strings are all the same shape: pairs
//  glued together. Parse both flavours.
//
//      parsePairs('a=1;b=2')     → { a: '1', b: '2' }
//      parsePairs('a=1;;b=2')    → { a: '1', b: '2' }   (skip blanks)
//      parsePairs('q=a=b')       → { q: 'a=b' }         (split ONCE)
//
//      parseQueryString('?a=1')            → { a: '1' }
//      parseQueryString('q=hello+world%21')→ { q: 'hello world!' }
//      parseQueryString('a=1&b=two&a=3')   → { a: ['1', '3'], b: 'two' }
//      parseQueryString('flag&a=1')        → { flag: '', a: '1' }
//
//  Values stay strings. In the query string, '+' means space and %XX is
//  percent-encoding; a key seen twice collects its values into an array
//  in the order they appeared.
//
//  hint: split(';') then indexOf('=') beats split('=') — and use
//  Object.hasOwn(out, key) to test "have I seen this key?", because
//  ('constructor' in {}) is true and will bite you.

import { test, eq } from '../../_lib/check.js';

export function parsePairs(text) {
  throw new Error('TODO');
}

export function parseQueryString(query) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('parsePairs builds an object of strings', () => {
  eq(parsePairs('a=1;b=2'), { a: '1', b: '2' });
  eq(parsePairs('n=42').n, '42');
});

test('parsePairs skips empty segments', () => {
  eq(parsePairs('a=1;;b=2;'), { a: '1', b: '2' });
});

test('parsePairs keeps an = that appears inside the value', () => {
  eq(parsePairs('q=a=b'), { q: 'a=b' });
});

test('parsePairs of an empty string is an empty object', () => {
  eq(parsePairs(''), {});
});

test('parseQueryString drops a leading question mark', () => {
  eq(parseQueryString('?a=1'), { a: '1' });
  eq(parseQueryString('a=1'), { a: '1' });
});

test('parseQueryString decodes + and percent escapes', () => {
  eq(parseQueryString('q=hello+world%21'), { q: 'hello world!' });
  eq(parseQueryString('name=Ada%20L'), { name: 'Ada L' });
});

test('parseQueryString collects a repeated key into an array', () => {
  eq(parseQueryString('a=1&b=two&a=3'), { a: ['1', '3'], b: 'two' });
  eq(parseQueryString('t=1&t=2&t=3'), { t: ['1', '2', '3'] });
});

test('parseQueryString gives a bare key an empty value', () => {
  eq(parseQueryString('flag&a=1'), { flag: '', a: '1' });
});
