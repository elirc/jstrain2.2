// ─────────────────────────────────────────────────────────────────────────
//  22 · entries · fromEntries round-trips — SOLUTION       ★★☆ core
//  run: node 22-mapvalues-and-invert.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: entries → array methods → fromEntries is the object
//  equivalent of the whole array toolkit, and it reads as one pipeline.
//  Two things to keep straight: `Object.entries` only sees the object's own
//  enumerable string keys (inherited and symbol keys stay behind), and
//  `invert` is lossy — values become keys, so duplicates collapse (last one
//  wins) and non-string values are stringified, which is why inverting
//  `{ a: 1 }` gives you the key '1'.

import { test, eq } from '../../_lib/check.js';

export function mapValues(obj, fn) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, fn(value, key)])
  );
}

export function filterObject(obj, predicate) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => predicate(value, key))
  );
}

export function invert(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [value, key])
  );
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
