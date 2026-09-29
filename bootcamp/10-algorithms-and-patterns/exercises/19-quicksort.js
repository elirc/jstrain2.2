// ─────────────────────────────────────────────────────────────────────────
//  19 · quickSort                                           ★★★ stretch
//  concepts: pattern: divide and conquer · partition around a pivot
//  run: node 19-quicksort.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Sort IN PLACE and return the same array. No new arrays per level —
//  that is the whole point of quicksort versus merge sort.
//
//      quickSort([5, 2, 9, 1])                  → [1, 2, 5, 9]
//      quickSort([3, 1, 2], (a, b) => b - a)    → [3, 2, 1]
//
//  Pick a pivot, PARTITION the range so everything ordered before the
//  pivot sits left of it and everything else sits right, then recurse on
//  the two sides. After a partition the pivot is already in its final
//  position — it never moves again.
//
//  Warning: an all-same array must not loop forever. Test it early.
//
//  hint: Lomuto partition — walk the range with a `boundary` index,
//  swapping anything that belongs before the pivot into the front, then
//  swap the pivot into `boundary` at the end

import { test, eq, ok } from '../../_lib/check.js';

export function quickSort(items, compare = (a, b) => a - b) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sorts numbers ascending by default', () => {
  eq(quickSort([5, 2, 9, 1, 5, 6]), [1, 2, 5, 5, 6, 9]);
});

test('handles empty and single-element arrays', () => {
  eq(quickSort([]), []);
  eq(quickSort([7]), [7]);
});

test('survives an array where every value is the same', () => {
  eq(quickSort([7, 7, 7, 7, 7]), [7, 7, 7, 7, 7]);
});

test('handles already sorted and reversed input', () => {
  eq(quickSort([1, 2, 3, 4]), [1, 2, 3, 4]);
  eq(quickSort([4, 3, 2, 1]), [1, 2, 3, 4]);
});

test('handles duplicates mixed through the array', () => {
  eq(quickSort([3, 1, 3, 1, 2]), [1, 1, 2, 3, 3]);
});

test('honours a custom comparator', () => {
  eq(quickSort([1, 3, 2], (a, b) => b - a), [3, 2, 1]);
});

test('sorts in place and returns the same array', () => {
  const nums = [3, 1, 2];
  ok(quickSort(nums) === nums, 'should return the same array reference');
  eq(nums, [1, 2, 3]);
});

test('sorts two hundred values, worst-case ordering included', () => {
  const descending = Array.from({ length: 200 }, (_, i) => 199 - i);
  const expected = Array.from({ length: 200 }, (_, i) => i);
  eq(quickSort(descending), expected);
});
