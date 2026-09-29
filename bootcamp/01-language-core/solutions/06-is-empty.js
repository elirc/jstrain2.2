// ─────────────────────────────────────────────────────────────────────────
//  06 · isEmpty — SOLUTION                                      ★★☆ core
//  run: node 06-is-empty.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a chain of narrowing checks, each one cheap and total.
//  `value == null` covers both nullish values in one comparison. Strings
//  are checked before the object branch because typeof '' is 'string'.
//  Arrays must be checked before the generic object branch too, because
//  Object.keys([]) is [] — that would have worked by accident, but
//  Object.keys([1]) is ['0'], which would not.
//
//  The classic wrong turn is `return !value` — that calls 0, false and
//  NaN "empty" and calls [] and {} "not empty", which is backwards on
//  all five counts.

import { test, eq } from '../../_lib/check.js';

export function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Map || value instanceof Set) return value.size === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
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
