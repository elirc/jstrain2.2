// ─────────────────────────────────────────────────────────────────────────
//  06 · maxWindowSum — SOLUTION                             ★★☆ core
//  concepts: pattern: sliding window (fixed size) · running total
//  run: node 06-max-window-sum.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: fixed-size sliding window.
//  Sum the first k numbers once. After that, every new window differs
//  from the previous one by exactly two numbers: one enters on the right,
//  one leaves on the left. Add and subtract instead of re-summing, and
//  keep the best total seen.
//  Time O(n), space O(1). The naive nested loop re-adds all k numbers at
//  every position: O(n·k) — for k = n/2 that is quadratic.
//  Bites: seed `best` with the first window's sum, NOT 0, or an
//  all-negative array wrongly answers 0. And guard the "window does not
//  fit" cases before touching any index.

import { test, eq } from '../../_lib/check.js';

export function maxWindowSum(nums, k) {
  if (k <= 0 || k > nums.length) return 0;
  let sum = 0;
  for (let i = 0; i < k; i += 1) sum += nums[i];
  let best = sum;
  for (let right = k; right < nums.length; right += 1) {
    sum += nums[right] - nums[right - k];
    if (sum > best) best = sum;
  }
  return best;
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
