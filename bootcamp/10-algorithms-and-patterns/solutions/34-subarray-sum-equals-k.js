// ─────────────────────────────────────────────────────────────────────────
//  34 · countSubarraysWithSum — SOLUTION                    ★★★ stretch
//  concepts: pattern: prefix sums + hash map · negatives allowed
//  run: node 34-subarray-sum-equals-k.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: prefix sums plus a hash map of seen totals.
//  Smell: "how many contiguous subarrays sum to X" WITH negative numbers
//  in play. The window pattern needs the sum to grow monotonically as the
//  window grows; negatives break that, so reach for prefix sums instead.
//  sum(i..j) = running[j] - running[i - 1]. So while walking, the number
//  of subarrays ending here with sum k is the number of earlier running
//  totals equal to `running - k`. Keep those counts in a Map.
//  Seed the Map with 0 → 1: the "empty prefix" is what lets a subarray
//  that starts at index 0 be counted.
//  Time O(n), space O(n). The naive double loop over every (start, end)
//  is O(n²) — and O(n³) if you re-sum each candidate.
//  Bites: count the total BEFORE recording the current one, or with k = 0
//  every index matches itself; and use a Map, not `{}` — a running total
//  of `-0` and inherited keys like 'constructor' both bite.

import { test, eq } from '../../_lib/check.js';

export function countSubarraysWithSum(nums, k) {
  const seen = new Map([[0, 1]]); // the empty prefix sums to 0
  let running = 0;
  let count = 0;
  for (const value of nums) {
    running += value;
    count += seen.get(running - k) ?? 0;
    seen.set(running, (seen.get(running) ?? 0) + 1);
  }
  return count;
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
