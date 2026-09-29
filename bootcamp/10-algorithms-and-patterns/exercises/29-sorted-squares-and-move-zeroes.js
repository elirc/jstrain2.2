// ─────────────────────────────────────────────────────────────────────────
//  29 · sortedSquares / moveZeroes                          ★★☆ core
//  concepts: pattern: two pointers · fill from the back · read+write
//  run: node 29-sorted-squares-and-move-zeroes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two rearrangements that a sort would solve — and shouldn't.
//
//  sortedSquares(sorted) — the input is sorted ascending and may contain
//  negatives. Return a NEW array of their squares, still sorted:
//
//      sortedSquares([-4, -1, 0, 3, 10])  → [0, 1, 9, 16, 100]
//
//  moveZeroes(nums) — push every 0 to the end IN PLACE, keeping the order
//  of the non-zero values. Return the same array you were handed:
//
//      moveZeroes([0, 1, 0, 3, 12])  → [1, 3, 12, 0, 0]
//
//  hint: the biggest square is at one END or the other, so fill the
//        result back-to-front; for moveZeroes keep a slow "write" index

import { test, eq, ok } from '../../_lib/check.js';

export function sortedSquares(sorted) {
  throw new Error('TODO');
}

export function moveZeroes(nums) {
  throw new Error('TODO');
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
