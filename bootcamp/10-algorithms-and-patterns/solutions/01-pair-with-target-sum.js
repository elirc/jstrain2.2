// ─────────────────────────────────────────────────────────────────────────
//  01 · pairWithTargetSum — SOLUTION                        ★★☆ core
//  concepts: pattern: two pointers · sorted input · O(1) space
//  run: node 01-pair-with-target-sum.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: two pointers (converging).
//  Sorted input turns "search for a partner" into "steer a sum". Park
//  `left` at the start and `right` at the end. The sum can only be too
//  small (move `left` up, the only way to get bigger) or too big (move
//  `right` down). Each step throws away one candidate for good, so the
//  loop runs at most n times.
//  Time O(n), space O(1). The naive version is two nested loops over
//  every pair: O(n²). A Map of value → index is also O(n) time but
//  costs O(n) space — use that when the input is NOT sorted.
//  Classic wrong turn: `while (left <= right)` lets the pointers land on
//  the same slot and "find" a pair by doubling one element.

import { test, eq } from '../../_lib/check.js';

export function pairWithTargetSum(sorted, target) {
  let left = 0;
  let right = sorted.length - 1;
  while (left < right) {
    const sum = sorted[left] + sorted[right];
    if (sum === target) return [left, right];
    if (sum < target) left += 1;
    else right -= 1;
  }
  return null;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds a pair sitting in the middle of the array', () => {
  eq(pairWithTargetSum([1, 2, 4, 6, 8, 9], 14), [3, 4]);
});

test('finds a pair made of the two ends', () => {
  eq(pairWithTargetSum([2, 3], 5), [0, 1]);
});

test('works with negative numbers', () => {
  eq(pairWithTargetSum([-5, -2, 0, 3, 7], 1), [1, 3]);
});

test('returns null when no pair reaches the target', () => {
  eq(pairWithTargetSum([1, 2, 3, 4], 100), null);
});

test('never uses the same element twice', () => {
  eq(pairWithTargetSum([1, 2, 3], 6), null);
});

test('handles duplicate values', () => {
  eq(pairWithTargetSum([3, 3], 6), [0, 1]);
});

test('handles empty and single-element arrays', () => {
  eq(pairWithTargetSum([], 7), null);
  eq(pairWithTargetSum([4], 8), null);
});
