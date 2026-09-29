// ─────────────────────────────────────────────────────────────────────────
//  12 · sorting numbers                                    ★☆☆ warm-up
//  concepts: sort · comparators
//  run: node 12-sort-numbers.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `sort` with no comparator converts everything to a string and compares
//  those, so '10' lands before '9':
//
//      [10, 9, 1, 100].sort()   → [1, 10, 100, 9]     the classic trap
//
//  Fix it with a comparator. A comparator returns a negative number if `a`
//  comes first, positive if `b` does, 0 if it does not matter.
//
//      ascending([10, 9, 1, 100])   → [1, 9, 10, 100]
//      descending([10, 9, 1, 100])  → [100, 10, 9, 1]
//
//  Both must leave the input array alone — `sort` mutates in place, so
//  copy first.

import { test, eq } from '../../_lib/check.js';

export function ascending(numbers) {
  throw new Error('TODO');
}

export function descending(numbers) {
  throw new Error('TODO');
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
