// ─────────────────────────────────────────────────────────────────────────
//  06 · maxWindowSum                                        ★★☆ core
//  concepts: pattern: sliding window (fixed size) · running total
//  run: node 06-max-window-sum.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Find the largest sum of any k CONSECUTIVE numbers in the array.
//  Return 0 when no window of that size fits (k bigger than the array,
//  k <= 0, or an empty array).
//
//      maxWindowSum([2, 1, 5, 1, 3, 2], 3)  → 9    (5 + 1 + 3)
//      maxWindowSum([2, 3, 4, 1, 5], 2)     → 7    (3 + 4)
//      maxWindowSum([1, 2], 5)              → 0
//
//  The trap is recomputing the whole window each step — that is O(n·k).
//  Aim for one pass.
//
//  hint: when the window slides one slot right, add the entering number
//  and subtract the leaving one

import { test, eq } from '../../_lib/check.js';

export function maxWindowSum(nums, k) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the best window in the middle', () => {
  eq(maxWindowSum([2, 1, 5, 1, 3, 2], 3), 9);
});

test('finds the best window at the front', () => {
  eq(maxWindowSum([2, 3, 4, 1, 5], 2), 7);
});

test('k equal to the length sums the whole array', () => {
  eq(maxWindowSum([1, 2, 3], 3), 6);
});

test('k of 1 returns the largest single number', () => {
  eq(maxWindowSum([4, 9, 2], 1), 9);
});

test('works when every number is negative', () => {
  eq(maxWindowSum([-1, -2, -3, -4], 2), -3);
});

test('returns 0 when the window does not fit', () => {
  eq(maxWindowSum([1, 2], 5), 0);
  eq(maxWindowSum([], 1), 0);
});

test('returns 0 for a non-positive k', () => {
  eq(maxWindowSum([1, 2, 3], 0), 0);
});
