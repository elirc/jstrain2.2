// ─────────────────────────────────────────────────────────────────────────
//  04 · compactParams                                        ★☆☆ warm-up
//  concepts: == vs === · coercion · falsy is not empty
//  run: node 04-loose-equality-filter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  compactParams(params) strips the keys a query string has no use for:
//  `undefined`, `null`, and the empty string ''. Nothing else. A 0, a
//  false and a '0' are real values a user asked for — they stay.
//
//      compactParams({ q: 'ada', tag: '', page: 0, cursor: null })
//        → { q: 'ada', page: 0 }
//      toQuery({ q: 'a b', page: 0 })  → '?q=a%20b&page=0'
//
//  The code below is fully written — and wrong: 3 tests fail. Find the
//  planted bug and fix it with the smallest change that turns everything
//  green. It is one of the classic bug families; WHERE is the exercise.

import { test, eq } from '../../_lib/check.js';

export function compactParams(params) {
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value == '') continue;
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
