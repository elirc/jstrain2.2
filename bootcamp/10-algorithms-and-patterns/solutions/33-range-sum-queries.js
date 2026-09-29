// ─────────────────────────────────────────────────────────────────────────
//  33 · buildPrefixSums / rangeSum — SOLUTION               ★☆☆ warm-up
//  concepts: pattern: prefix sums · precompute once, answer in O(1)
//  run: node 33-range-sum-queries.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: prefix sums (a "running total" index).
//  Smell: "many range queries over data that does not change" — or any
//  time you catch yourself re-summing overlapping slices.
//  prefix[i] = sum of the first i values, so the sum of nums[from..to] is
//  prefix[to + 1] - prefix[from]: everything up to `to`, minus everything
//  before `from`. The leading 0 is what makes from = 0 work without a
//  special case — that is the entire reason the array is n + 1 long.
//  Build O(n) once, then every query is O(1). The naive loop re-adds the
//  slice per query: O(n) each, O(q · n) overall.
//  Bites: the off-by-one is `to + 1`, not `to`, and prefix sums only work
//  for INVERTIBLE operations — sums yes, min/max no (that wants a
//  sparse table or a segment tree).

import { test, eq } from '../../_lib/check.js';

export function buildPrefixSums(nums) {
  const prefix = new Array(nums.length + 1);
  prefix[0] = 0;
  for (let i = 0; i < nums.length; i += 1) {
    prefix[i + 1] = prefix[i] + nums[i];
  }
  return prefix;
}

export function rangeSum(prefix, from, to) {
  return prefix[to + 1] - prefix[from];
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
