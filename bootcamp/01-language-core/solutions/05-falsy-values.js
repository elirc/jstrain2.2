// ─────────────────────────────────────────────────────────────────────────
//  05 · countTruthy — SOLUTION                              ★☆☆ warm-up
//  run: node 05-falsy-values.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `if (value)` and `filter(Boolean)` both run the same
//  ToBoolean conversion, so there is nothing to hand-code — the skill is
//  knowing the eight falsy values by heart. Note what is NOT on that
//  list: '0', 'false', [], {} and function objects are all truthy, which
//  is why `if (list.length)` and not `if (list)` is how you test for an
//  empty array.
//
//  find() returns undefined when nothing matches, which is exactly the
//  contract firstTruthy needs.

import { test, eq } from '../../_lib/check.js';

export function countTruthy(values) {
  return values.filter(Boolean).length;
}

export function firstTruthy(values) {
  return values.find(Boolean);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('counts nothing in the eight falsy values', () => {
  eq(countTruthy([false, 0, -0, 0n, '', null, undefined, NaN]), 0);
});

test('counts the sneaky truthy ones', () => {
  eq(countTruthy(['0', 'false', [], {}, ' ', -1, Infinity]), 7);
});

test('counts a mixed list', () => {
  eq(countTruthy([1, null, 'x', 0, [], '']), 3);
});

test('an empty list has nothing truthy', () => {
  eq(countTruthy([]), 0);
  eq(firstTruthy([]), undefined);
});

test('firstTruthy skips the falsy prefix', () => {
  eq(firstTruthy([0, '', null, 'found', 'later']), 'found');
  eq(firstTruthy([NaN, 42]), 42);
});

test('firstTruthy can return an empty array, which is truthy', () => {
  eq(firstTruthy([0, [], 'x']), []);
});

test('firstTruthy returns undefined when everything is falsy', () => {
  eq(firstTruthy([0, '', null, undefined, NaN]), undefined);
});
