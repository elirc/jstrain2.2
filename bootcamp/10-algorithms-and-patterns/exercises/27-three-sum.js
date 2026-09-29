// ─────────────────────────────────────────────────────────────────────────
//  27 · threeSum                                            ★★★ stretch
//  concepts: pattern: sort + fix one + two pointers · duplicate skipping
//  run: node 27-three-sum.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Find every triple in `nums` that sums to zero. Each triple comes back
//  sorted ascending, and the same triple must never appear twice — even
//  when the input repeats values.
//
//      threeSum([-1, 0, 1, 2, -1, -4])  → [[-1, -1, 2], [-1, 0, 1]]
//      threeSum([0, 0, 0, 0])           → [[0, 0, 0]]
//      threeSum([1, 2, 3])              → []
//
//  The outer order of the triples does not matter; the tests compare
//  them order-insensitively. Do not modify the caller's array.
//
//  hint: sort a COPY first, then walk one index i and solve
//        "pair that sums to -nums[i]" in the slice to its right

import { test, eq, ok } from '../../_lib/check.js';

export function threeSum(nums) {
  throw new Error('TODO');
}

// helper for the tests: compare triples regardless of their order
const canon = (triples) => triples.map((t) => t.join(',')).sort();

// ──────────────────────────── tests ──────────────────────────────────────

test('finds both triples in the classic input', () => {
  const expected = [[-1, -1, 2], [-1, 0, 1]];
  eq(canon(threeSum([-1, 0, 1, 2, -1, -4])), canon(expected));
});

test('reports a repeated triple only once', () => {
  eq(threeSum([0, 0, 0, 0]), [[0, 0, 0]]);
});

test('skips duplicates on both sides of the pair scan', () => {
  eq(canon(threeSum([-2, 0, 0, 2, 2])), canon([[-2, 0, 2]]));
});

test('finds three separate triples', () => {
  eq(
    canon(threeSum([3, 0, -2, -1, 1, 2])),
    canon([[-2, -1, 3], [-2, 0, 2], [-1, 0, 1]])
  );
});

test('returns an empty list when nothing sums to zero', () => {
  eq(threeSum([1, 2, 3]), []);
  eq(threeSum([-1, -2, -3]), []);
});

test('handles inputs too short to hold a triple', () => {
  eq(threeSum([]), []);
  eq(threeSum([0, 0]), []);
});

test('every triple is sorted ascending', () => {
  for (const triple of threeSum([-1, 0, 1, 2, -1, -4])) {
    ok(triple[0] <= triple[1] && triple[1] <= triple[2], 'triple not sorted');
  }
});

test('does not modify the input array', () => {
  const nums = [-1, 0, 1, 2, -1, -4];
  threeSum(nums);
  eq(nums, [-1, 0, 1, 2, -1, -4]);
});
