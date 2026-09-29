// ─────────────────────────────────────────────────────────────────────────
//  27 · threeSum — SOLUTION                                 ★★★ stretch
//  concepts: pattern: sort + fix one + two pointers · duplicate skipping
//  run: node 27-three-sum.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: sort, then "fix one, two-pointer the rest".
//  Smell: "find k numbers that hit a target" in an unsorted array — sort
//  it and the k-sum collapses to (k-2) nested loops around exercise 01.
//  Sorting buys two things: the pair scan from 01 (steer the sum with two
//  cursors) and cheap de-duplication, because equal values are adjacent.
//  Fix nums[i], then look for a pair summing to -nums[i] in the slice to
//  its right. Skip i when it repeats the previous i, and after recording
//  a hit skip past runs of equal values at BOTH cursors.
//  Time O(n²) — O(n log n) to sort plus n pair scans of O(n). Space O(n)
//  for the copy. Beats the naive triple loop O(n³), and beats the
//  "hash set of seen values + a Set of stringified triples" approach,
//  which is O(n²) too but pays for string keys and hides the dedupe bug.
//  Bites: sort a COPY (`[...nums]`) or you mutate the caller's array, and
//  `.sort()` with no comparator sorts as strings — [10, 9] stays [10, 9].

import { test, eq, ok } from '../../_lib/check.js';

export function threeSum(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length - 2; i += 1) {
    if (i > 0 && sorted[i] === sorted[i - 1]) continue; // same anchor again
    let left = i + 1;
    let right = sorted.length - 1;
    while (left < right) {
      const sum = sorted[i] + sorted[left] + sorted[right];
      if (sum === 0) {
        out.push([sorted[i], sorted[left], sorted[right]]);
        while (left < right && sorted[left] === sorted[left + 1]) left += 1;
        while (left < right && sorted[right] === sorted[right - 1]) {
          right -= 1;
        }
        left += 1;
        right -= 1;
      } else if (sum < 0) {
        left += 1;
      } else {
        right -= 1;
      }
    }
  }
  return out;
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
