// ─────────────────────────────────────────────────────────────────────────
//  28 · deepEqual lite — SOLUTION                          ★★★ stretch
//  run: node 28-deep-equal.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: four gates, in order. `Object.is` settles primitives and
//  identical references (and gives NaN === NaN, 0 !== -0 for free). Then
//  anything that is not an object — or is null — cannot match structurally,
//  so bail out false. Then reject array-vs-object mismatches, because
//  `Object.keys` on `[1, 2]` and on `{ 0: 1, 1: 2 }` look identical.
//  Finally compare key counts before recursing, otherwise `{ a: 1 }` and
//  `{ a: 1, b: 2 }` compare equal in the direction you happen to iterate.
//  Real implementations go on to handle Date, RegExp, Map, Set and cycles —
//  that is why `node:util`'s `isDeepStrictEqual` exists.

import { test, eq } from '../../_lib/check.js';

export function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every(
    (key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key])
  );
}

// ──────────────────────────── tests ──────────────────────────────────────

test('primitives compare by value, not by type coercion', () => {
  eq(deepEqual(1, 1), true);
  eq(deepEqual('x', 'x'), true);
  eq(deepEqual(1, '1'), false);
});

test('NaN equals NaN and 0 does not equal -0', () => {
  eq(deepEqual(NaN, NaN), true);
  eq(deepEqual(0, -0), false);
});

test('null only equals null', () => {
  eq(deepEqual(null, null), true);
  eq(deepEqual(null, {}), false);
  eq(deepEqual(null, undefined), false);
});

test('arrays compare element by element', () => {
  eq(deepEqual([1, 2, 3], [1, 2, 3]), true);
  eq(deepEqual([1, 2], [1, 2, 3]), false);
  eq(deepEqual([1, 2], [2, 1]), false);
});

test('nested structures recurse', () => {
  eq(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }), true);
  eq(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] }), false);
});

test('key order does not matter', () => {
  eq(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), true);
});

test('an extra key makes them different, even if it holds undefined', () => {
  eq(deepEqual({ a: 1 }, { a: 1, b: 2 }), false);
  eq(deepEqual({ a: 1 }, { a: 1, b: undefined }), false);
});

test('an array is never equal to an object with the same indexes', () => {
  eq(deepEqual([1, 2], { 0: 1, 1: 2 }), false);
});
