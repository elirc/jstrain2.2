// ─────────────────────────────────────────────────────────────────────────
//  06 · isEmpty                                                 ★★☆ core
//  concepts: truthiness · emptiness · collections
//  run: node 06-is-empty.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `if (!value)` is the wrong emptiness check the moment 0 or false is a
//  legitimate value. Write the honest one.
//
//      isEmpty(null)        → true      isEmpty(0)      → false
//      isEmpty(undefined)   → true      isEmpty(false)  → false
//      isEmpty('')          → true      isEmpty('   ')  → true
//      isEmpty([])          → true      isEmpty([null]) → false
//      isEmpty({})          → true      isEmpty({a: 1}) → false
//      isEmpty(new Map())   → true
//
//  A number or a boolean is never "empty" — it is a value.
//
//  hint: order matters. Check null/undefined first, then strings, then
//  arrays, then Map/Set (they have .size, not .length), then objects.

import { test, eq } from '../../_lib/check.js';

export function isEmpty(value) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('null and undefined are empty', () => {
  eq(isEmpty(null), true);
  eq(isEmpty(undefined), true);
});

test('whitespace-only strings count as empty', () => {
  eq(isEmpty(''), true);
  eq(isEmpty('   '), true);
  eq(isEmpty('\n\t'), true);
  eq(isEmpty('a'), false);
  eq(isEmpty('0'), false);
});

test('arrays go by length, not by content', () => {
  eq(isEmpty([]), true);
  eq(isEmpty([undefined]), false);
  eq(isEmpty([0]), false);
});

test('objects go by their own enumerable keys', () => {
  eq(isEmpty({}), true);
  eq(isEmpty({ a: undefined }), false);
  eq(isEmpty({ a: 1 }), false);
});

test('Map and Set go by size', () => {
  eq(isEmpty(new Map()), true);
  eq(isEmpty(new Set()), true);
  eq(isEmpty(new Map([['k', 'v']])), false);
  eq(isEmpty(new Set([0])), false);
});

test('numbers and booleans are never empty', () => {
  eq(isEmpty(0), false);
  eq(isEmpty(-0), false);
  eq(isEmpty(NaN), false);
  eq(isEmpty(false), false);
  eq(isEmpty(0n), false);
});
