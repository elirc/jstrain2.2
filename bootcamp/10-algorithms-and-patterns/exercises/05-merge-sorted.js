// ─────────────────────────────────────────────────────────────────────────
//  05 · mergeSorted                                         ★☆☆ warm-up
//  concepts: pattern: two pointers (parallel scan) · the merge step
//  run: node 05-merge-sorted.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two arrays, each already sorted ascending. Produce ONE new sorted
//  array holding everything from both. Duplicates are kept.
//
//      mergeSorted([1, 3, 5], [2, 4, 6])  → [1, 2, 3, 4, 5, 6]
//      mergeSorted([1, 2, 3], [10])       → [1, 2, 3, 10]
//      mergeSorted([], [1, 2])            → [1, 2]
//
//  Do not concatenate and sort — walk both arrays once. Neither input may
//  be modified. This is the same merge you will reuse in merge sort (18).

import { test, eq } from '../../_lib/check.js';

export function mergeSorted(a, b) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('interleaves two arrays of the same length', () => {
  eq(mergeSorted([1, 3, 5], [2, 4, 6]), [1, 2, 3, 4, 5, 6]);
});

test('drains whichever array still has values left', () => {
  eq(mergeSorted([1, 2, 3], [10]), [1, 2, 3, 10]);
  eq(mergeSorted([10], [1, 2, 3]), [1, 2, 3, 10]);
});

test('handles one empty array on either side', () => {
  eq(mergeSorted([], [1, 2]), [1, 2]);
  eq(mergeSorted([1, 2], []), [1, 2]);
});

test('handles two empty arrays', () => {
  eq(mergeSorted([], []), []);
});

test('keeps duplicates from both sides', () => {
  eq(mergeSorted([1, 1, 2], [1, 3]), [1, 1, 1, 2, 3]);
});

test('works with negative numbers', () => {
  eq(mergeSorted([-3, -1], [-2, 0]), [-3, -2, -1, 0]);
});

test('does not modify the inputs', () => {
  const a = [1, 2];
  const b = [3];
  mergeSorted(a, b);
  eq(a, [1, 2]);
  eq(b, [3]);
});
