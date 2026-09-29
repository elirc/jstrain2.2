// ─────────────────────────────────────────────────────────────────────────
//  08 · smallestSubarrayWithSum                             ★★★ stretch
//  concepts: pattern: sliding window (shrink while valid) · positive nums
//  run: node 08-smallest-subarray-sum.js
// ─────────────────────────────────────────────────────────────────────────
//
//  All numbers are positive. Return the LENGTH of the shortest contiguous
//  run whose sum is >= target, or 0 if no run gets there.
//
//      smallestSubarrayWithSum([2, 1, 5, 2, 3, 2], 7)  → 2   ([5, 2])
//      smallestSubarrayWithSum([2, 1, 5, 2, 8], 7)     → 1   ([8])
//      smallestSubarrayWithSum([1, 1, 1], 10)          → 0
//
//  Grow the window on the right until the sum is big enough, then shrink
//  from the left for as long as it STAYS big enough, recording the size
//  each time it is valid.
//
//  hint: the shrink step is a `while`, not an `if`

import { test, eq } from '../../_lib/check.js';

export function smallestSubarrayWithSum(nums, target) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds a two-element window', () => {
  eq(smallestSubarrayWithSum([2, 1, 5, 2, 3, 2], 7), 2);
});

test('prefers a single element that already clears the target', () => {
  eq(smallestSubarrayWithSum([2, 1, 5, 2, 8], 7), 1);
});

test('shrinks as far as it can, not just one step', () => {
  eq(smallestSubarrayWithSum([3, 4, 1, 1, 6], 8), 3);
});

test('returns 0 when the whole array is too small', () => {
  eq(smallestSubarrayWithSum([1, 1, 1], 10), 0);
});

test('the whole array can be the answer', () => {
  eq(smallestSubarrayWithSum([1, 2, 3], 6), 3);
});

test('a sum exactly equal to the target counts', () => {
  eq(smallestSubarrayWithSum([4, 3], 3), 1);
});

test('handles empty and single-element arrays', () => {
  eq(smallestSubarrayWithSum([], 5), 0);
  eq(smallestSubarrayWithSum([10], 5), 1);
});
