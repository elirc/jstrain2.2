// ─────────────────────────────────────────────────────────────────────────
//  12 · sorting numbers — SOLUTION                         ★☆☆ warm-up
//  run: node 12-sort-numbers.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `a - b` is the whole comparator for ascending numbers, and
//  `b - a` reverses it — no if/else, no booleans. Returning a boolean is the
//  other classic mistake: `(a, b) => a > b` gives true/false, which coerce
//  to 1/0, so "b comes first" can never be expressed and the result is
//  subtly wrong. Copy with a spread (or `toSorted`) before sorting so a
//  frozen or shared array survives the call.

import { test, eq } from '../../_lib/check.js';

export function ascending(numbers) {
  return [...numbers].sort((a, b) => a - b);
}

export function descending(numbers) {
  return [...numbers].sort((a, b) => b - a);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('ascending sorts numerically, not alphabetically', () => {
  eq(ascending([10, 9, 1, 100]), [1, 9, 10, 100]);
});

test('ascending handles negative numbers', () => {
  eq(ascending([-5, 3, -10, 0]), [-10, -5, 0, 3]);
});

test('ascending handles floats', () => {
  eq(ascending([0.3, 0.1, 0.25]), [0.1, 0.25, 0.3]);
});

test('descending is the mirror image', () => {
  eq(descending([10, 9, 1, 100]), [100, 10, 9, 1]);
});

test('sorting does not mutate the input', () => {
  const nums = Object.freeze([3, 1, 2]);
  eq(ascending(nums), [1, 2, 3]);
  eq(nums, [3, 1, 2]);
});

test('empty and single-element lists come back unchanged', () => {
  eq(ascending([]), []);
  eq(ascending([7]), [7]);
});
