// ─────────────────────────────────────────────────────────────────────────
//  22 · entries · fromEntries round-trips                  ★★☆ core
//  concepts: Object.entries · Object.fromEntries · object transforms
//  run: node 22-mapvalues-and-invert.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Objects have no `map` or `filter`. The move is: `Object.entries` down to
//  an array of [key, value] pairs, use the array methods you already know,
//  `Object.fromEntries` back up.
//
//      mapValues({ a: 1, b: 2 }, (n) => n * 2)       → { a: 2, b: 4 }
//      mapValues({ a: 1 }, (v, k) => `${k}${v}`)     → { a: 'a1' }
//      filterObject({ a: 1, b: 2, c: 3 }, (v) => v > 1) → { b: 2, c: 3 }
//      invert({ a: 'x', b: 'y' })                    → { x: 'a', y: 'b' }
//
//  Callbacks get (value, key) — value first, matching lodash and the way
//  you usually think about it.
//
//  hint: `Object.entries(obj).map(([k, v]) => [k, fn(v, k)])` then
//  `Object.fromEntries(...)`.

import { test, eq } from '../../_lib/check.js';

export function mapValues(obj, fn) {
  throw new Error('TODO');
}

export function filterObject(obj, predicate) {
  throw new Error('TODO');
}

export function invert(obj) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('mapValues transforms every value and keeps the keys', () => {
  eq(mapValues({ a: 1, b: 2 }, (n) => n * 2), { a: 2, b: 4 });
});

test('mapValues passes the key as the second argument', () => {
  eq(mapValues({ a: 1, b: 2 }, (v, k) => `${k}${v}`), { a: 'a1', b: 'b2' });
});

test('mapValues of an empty object is an empty object', () => {
  eq(mapValues({}, (v) => v), {});
});

test('mapValues leaves the frozen source alone', () => {
  const source = Object.freeze({ a: 1 });
  eq(mapValues(source, (n) => n + 1), { a: 2 });
  eq(source, { a: 1 });
});

test('filterObject keeps entries whose value passes', () => {
  eq(filterObject({ a: 1, b: 2, c: 3 }, (v) => v > 1), { b: 2, c: 3 });
});

test('filterObject can decide on the key instead', () => {
  eq(filterObject({ aa: 1, b: 2 }, (v, k) => k.length === 1), { b: 2 });
});

test('invert swaps keys and values', () => {
  eq(invert({ a: 'x', b: 'y' }), { x: 'a', y: 'b' });
});

test('invert is lossy: duplicates collapse and keys stringify', () => {
  eq(invert({ a: 'x', b: 'x' }), { x: 'b' });
  eq(invert({ a: 1 }), { 1: 'a' });
});
