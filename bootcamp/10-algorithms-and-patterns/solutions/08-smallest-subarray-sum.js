// ─────────────────────────────────────────────────────────────────────────
//  08 · smallestSubarrayWithSum — SOLUTION                  ★★★ stretch
//  concepts: pattern: sliding window (shrink while valid) · positive nums
//  run: node 08-smallest-subarray-sum.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: variable-size sliding window, "grow to become
//  valid, shrink while still valid".
//  Add nums[right] to a running sum. Whenever the sum reaches the target,
//  the window is valid: record its length, then drop nums[left] and step
//  left forward — repeat while it is still valid. Each index is added
//  once and removed at most once, so it is O(n) time, O(1) space.
//  The naive version tries every (start, end) pair: O(n²) — or O(n³) if
//  you re-sum each candidate.
//  Why "all positive" matters: shrinking only ever makes the sum smaller,
//  which is what lets the window move monotonically. With negatives in
//  the mix that invariant dies and you need prefix sums + a deque.
//  Bite: seed `best` with Infinity and convert to 0 at the end, otherwise
//  "no window found" and "window of length 0" get confused.

import { test, eq } from '../../_lib/check.js';

export function smallestSubarrayWithSum(nums, target) {
  let best = Infinity;
  let sum = 0;
  let left = 0;
  for (let right = 0; right < nums.length; right += 1) {
    sum += nums[right];
    while (sum >= target) {
      best = Math.min(best, right - left + 1);
      sum -= nums[left];
      left += 1;
    }
  }
  return best === Infinity ? 0 : best;
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
