// ─────────────────────────────────────────────────────────────────────────
//  29 · sortedSquares / moveZeroes — SOLUTION               ★★☆ core
//  concepts: pattern: two pointers · fill from the back · read+write
//  run: node 29-sorted-squares-and-move-zeroes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — two two-pointer rearrangements.
//  sortedSquares — PATTERN: converge from the ends, FILL FROM THE BACK.
//  Smell: "the input is already sorted but the transform breaks the
//  order". Squaring folds the array around 0, so the largest square is at
//  one end or the other — never in the middle. Compare the two ends, take
//  the bigger square, and write it into the last free slot. Time O(n),
//  space O(n) for the output. The naive `map(x => x * x).sort()` is
//  O(n log n) and throws away the sortedness you were handed.
//  moveZeroes — PATTERN: fast/slow (read/write) pointers, same shape as
//  exercise 04. `write` marks where the next non-zero belongs; `read`
//  scans. Copy each non-zero to `write++`, then fill the tail with zeros.
//  Time O(n), space O(1) — beats building a filtered array and padding it,
//  and beats the O(n²) splice-and-push loop.
//  Bites: writing FORWARD in sortedSquares needs somewhere to put the
//  small values you have not produced yet — back-to-front avoids that.

import { test, eq, ok } from '../../_lib/check.js';

export function sortedSquares(sorted) {
  const out = new Array(sorted.length);
  let left = 0;
  let right = sorted.length - 1;
  for (let slot = sorted.length - 1; slot >= 0; slot -= 1) {
    const lo = sorted[left] * sorted[left];
    const hi = sorted[right] * sorted[right];
    if (lo > hi) {
      out[slot] = lo;
      left += 1;
    } else {
      out[slot] = hi;
      right -= 1;
    }
  }
  return out;
}

export function moveZeroes(nums) {
  let write = 0;
  for (let read = 0; read < nums.length; read += 1) {
    if (nums[read] !== 0) {
      nums[write] = nums[read];
      write += 1;
    }
  }
  while (write < nums.length) {
    nums[write] = 0;
    write += 1;
  }
  return nums;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sortedSquares keeps the result sorted across the sign flip', () => {
  eq(sortedSquares([-4, -1, 0, 3, 10]), [0, 1, 9, 16, 100]);
});

test('sortedSquares handles an all-negative input', () => {
  eq(sortedSquares([-3, -2, -1]), [1, 4, 9]);
});

test('sortedSquares handles empty and single-element inputs', () => {
  eq(sortedSquares([]), []);
  eq(sortedSquares([-2]), [4]);
});

test('sortedSquares does not modify the input', () => {
  const sorted = [-4, -1, 0, 3, 10];
  sortedSquares(sorted);
  eq(sorted, [-4, -1, 0, 3, 10]);
});

test('moveZeroes pushes zeros to the end', () => {
  eq(moveZeroes([0, 1, 0, 3, 12]), [1, 3, 12, 0, 0]);
});

test('moveZeroes keeps the order of the non-zero values', () => {
  eq(moveZeroes([4, 0, 5, 0, 0, 6]), [4, 5, 6, 0, 0, 0]);
});

test('moveZeroes works in place on the same array', () => {
  const nums = [0, 7];
  const result = moveZeroes(nums);
  ok(result === nums, 'moveZeroes must return the array it was given');
  eq(nums, [7, 0]);
});

test('moveZeroes handles all-zero, no-zero and empty inputs', () => {
  eq(moveZeroes([0, 0, 0]), [0, 0, 0]);
  eq(moveZeroes([1, 2, 3]), [1, 2, 3]);
  eq(moveZeroes([]), []);
});
