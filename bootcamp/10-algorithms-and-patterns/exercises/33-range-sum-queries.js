// ─────────────────────────────────────────────────────────────────────────
//  33 · buildPrefixSums / rangeSum                          ★☆☆ warm-up
//  concepts: pattern: prefix sums · precompute once, answer in O(1)
//  run: node 33-range-sum-queries.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A dashboard asks "total sales from day 3 to day 8" thousands of times
//  over the same array. Pay for one pass up front, then answer each query
//  with a single subtraction.
//
//  buildPrefixSums(nums) returns an array of length nums.length + 1 whose
//  slot i holds the sum of the first i values (slot 0 is always 0):
//
//      buildPrefixSums([1, 2, 3])  → [0, 1, 3, 6]
//
//  rangeSum(prefix, from, to) returns the INCLUSIVE sum of nums[from..to]:
//
//      rangeSum([0, 1, 3, 6], 1, 2)  → 5     (2 + 3)
//      rangeSum([0, 1, 3, 6], 0, 2)  → 6     (1 + 2 + 3)

import { test, eq } from '../../_lib/check.js';

export function buildPrefixSums(nums) {
  throw new Error('TODO');
}

export function rangeSum(prefix, from, to) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('buildPrefixSums starts with a 0 and grows by each value', () => {
  eq(buildPrefixSums([1, 2, 3]), [0, 1, 3, 6]);
});

test('buildPrefixSums handles negatives', () => {
  eq(buildPrefixSums([5, -2, 4]), [0, 5, 3, 7]);
});

test('buildPrefixSums of an empty array is just the zero', () => {
  eq(buildPrefixSums([]), [0]);
});

test('buildPrefixSums does not modify the input', () => {
  const nums = [1, 2, 3];
  buildPrefixSums(nums);
  eq(nums, [1, 2, 3]);
});

test('rangeSum totals an inclusive slice', () => {
  const prefix = buildPrefixSums([1, 2, 3, 4, 5]);
  eq(rangeSum(prefix, 1, 3), 9);
  eq(rangeSum(prefix, 0, 4), 15);
});

test('rangeSum of a single index is that value', () => {
  const prefix = buildPrefixSums([7, 8, 9]);
  eq(rangeSum(prefix, 2, 2), 9);
  eq(rangeSum(prefix, 0, 0), 7);
});

test('rangeSum works across negative values', () => {
  const prefix = buildPrefixSums([-1, -2, 10]);
  eq(rangeSum(prefix, 0, 1), -3);
  eq(rangeSum(prefix, 1, 2), 8);
});
