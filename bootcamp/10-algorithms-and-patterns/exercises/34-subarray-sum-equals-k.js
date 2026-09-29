// ─────────────────────────────────────────────────────────────────────────
//  34 · countSubarraysWithSum                               ★★★ stretch
//  concepts: pattern: prefix sums + hash map · negatives allowed
//  run: node 34-subarray-sum-equals-k.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Count the contiguous subarrays whose values add up to exactly k. The
//  values may be negative, so a sliding window is off the table — a window
//  that overshoots cannot be fixed by shrinking.
//
//      countSubarraysWithSum([1, 1, 1], 2)     → 2   ([1,1] twice)
//      countSubarraysWithSum([1, 2, 3], 3)     → 2   ([1,2] and [3])
//      countSubarraysWithSum([1, -1, 0], 0)    → 3
//
//  A subarray sum is a difference of two running totals. So walk once,
//  keeping the running total, and ask: how many earlier totals were
//  exactly `running - k`?
//
//  hint: a Map from running total → how many times it has been seen,
//        seeded with 0 → 1 so subarrays starting at index 0 are counted

import { test, eq } from '../../_lib/check.js';

export function countSubarraysWithSum(nums, k) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('counts overlapping subarrays separately', () => {
  eq(countSubarraysWithSum([1, 1, 1], 2), 2);
});

test('counts a single element that already equals k', () => {
  eq(countSubarraysWithSum([1, 2, 3], 3), 2);
  eq(countSubarraysWithSum([5], 5), 1);
});

test('handles negative values', () => {
  eq(countSubarraysWithSum([3, 4, 7, 2, -3, 1, 4, 2], 7), 4);
});

test('counts subarrays that sum to zero', () => {
  eq(countSubarraysWithSum([1, -1, 0], 0), 3);
  eq(countSubarraysWithSum([0, 0], 0), 3);
});

test('counts the subarray that starts at index 0', () => {
  eq(countSubarraysWithSum([2, 3], 5), 1);
});

test('returns 0 when nothing adds up', () => {
  eq(countSubarraysWithSum([1, 2, 3], 100), 0);
  eq(countSubarraysWithSum([5], 3), 0);
});

test('handles the empty array', () => {
  eq(countSubarraysWithSum([], 0), 0);
});
