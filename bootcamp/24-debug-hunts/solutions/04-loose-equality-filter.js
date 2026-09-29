// ─────────────────────────────────────────────────────────────────────────
//  04 · compactParams — SOLUTION                             ★☆☆ warm-up
//  run: node 04-loose-equality-filter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: coercion. One `==` too many.
//
//  The tell: two loose comparisons on one line, and only one of them is
//  deliberate. `value == null` is the single idiomatic use of `==` — it
//  means "null or undefined" and nothing else. `value == ''` is not that
//  at all: `==` converts both sides to numbers when the types differ, so
//  0 == '' and false == '' are both TRUE, and the filter eats them.
//
//  The fix: `value === ''`. Same type on both sides, no conversion, only
//  the actual empty string matches.
//
//  In the wild this ships as the even shorter `if (!value) continue;` —
//  which additionally drops NaN and, on a checkbox form, every unchecked
//  box. Falsy is not the same question as empty. When you mean "has the
//  user given me nothing", say so: `value === undefined || value === null
//  || value === ''`.

import { test, eq } from '../../_lib/check.js';

export function compactParams(params) {
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    out[key] = value;
  }
  return out;
}

export function toQuery(params) {
  const encode = encodeURIComponent;
  const pairs = Object.entries(compactParams(params)).map(
    ([key, value]) => `${encode(key)}=${encode(value)}`
  );
  return pairs.length === 0 ? '' : `?${pairs.join('&')}`;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('drops undefined, null and the empty string', () => {
  eq(compactParams({ a: 1, b: undefined, c: null, d: '' }), { a: 1 });
});

test('keeps a zero, because 0 is a page number', () => {
  eq(compactParams({ page: 0, q: 'x' }), { page: 0, q: 'x' });
});

test('keeps false, because false is an answer', () => {
  eq(compactParams({ archived: false, sort: 'name' }), {
    archived: false,
    sort: 'name',
  });
});

test('keeps strings that only look empty', () => {
  eq(compactParams({ id: '0', note: ' ', flag: 'false' }), {
    id: '0',
    note: ' ',
    flag: 'false',
  });
});

test('leaves the object it was given untouched', () => {
  const input = { a: 1, b: null };
  compactParams(input);
  eq(input, { a: 1, b: null });
});

test('toQuery encodes and joins the surviving params', () => {
  eq(toQuery({ q: 'a b', page: 0 }), '?q=a%20b&page=0');
  eq(toQuery({ q: 'ada', tag: '', cursor: null }), '?q=ada');
});

test('nothing worth sending gives an empty query string', () => {
  eq(compactParams({}), {});
  eq(toQuery({ a: '', b: null, c: undefined }), '');
});
