// ─────────────────────────────────────────────────────────────────────────
//  28 · deepEqual lite                                     ★★★ stretch
//  concepts: recursion · Object.is · structural comparison
//  run: node 28-deep-equal.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `{ a: 1 } === { a: 1 }` is false: === compares identity for objects.
//  Write the structural comparison every test runner ships with. Handle
//  primitives, arrays and plain objects — no Map, Set or Date needed.
//
//      deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })  → true
//      deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })              → true
//      deepEqual([1, 2], { 0: 1, 1: 2 })                      → false
//      deepEqual(NaN, NaN)                                    → true
//      deepEqual(0, -0)                                       → false
//
//  Key order does not matter; key COUNT does.
//
//  hint: `Object.is` is `===` with the two IEEE-754 quirks fixed — the
//  right primitive comparison and the right early exit in one.

import { test, eq } from '../../_lib/check.js';

export function deepEqual(a, b) {
  throw new Error('TODO');
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
