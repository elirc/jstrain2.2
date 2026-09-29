// ─────────────────────────────────────────────────────────────────────────
//  04 · removeDuplicates                                    ★★☆ core
//  concepts: pattern: two pointers (fast / slow) · in-place compaction
//  run: node 04-remove-duplicates.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A sorted array may contain runs of repeats. Squash each run down to a
//  single value, IN PLACE, and return how many unique values there are.
//  Whatever sits past that count is ignored — do not bother cleaning it.
//
//      const nums = [0, 0, 1, 1, 1, 2];
//      removeDuplicates(nums)   → 3
//      nums.slice(0, 3)         → [0, 1, 2]
//
//      removeDuplicates([])     → 0
//      removeDuplicates([7, 7]) → 1
//
//  No Set, no filter, no new array — the array is sorted, so duplicates
//  are always neighbours.
//
//  hint: a slow pointer marks the last unique slot, a fast pointer scans

import { test, eq } from '../../_lib/check.js';

export function removeDuplicates(sorted) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the count of unique values', () => {
  eq(removeDuplicates([1, 1, 2]), 2);
});

test('packs the unique values into the front of the array', () => {
  const nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
  const count = removeDuplicates(nums);
  eq(count, 5);
  eq(nums.slice(0, count), [0, 1, 2, 3, 4]);
});

test('leaves an already-unique array alone', () => {
  const nums = [1, 2, 3];
  eq(removeDuplicates(nums), 3);
  eq(nums, [1, 2, 3]);
});

test('collapses an all-same array to one value', () => {
  const nums = [7, 7, 7, 7];
  eq(removeDuplicates(nums), 1);
  eq(nums[0], 7);
});

test('handles empty and single-element arrays', () => {
  eq(removeDuplicates([]), 0);
  eq(removeDuplicates([9]), 1);
});

test('keeps negatives and a duplicate run at the very end', () => {
  const nums = [-3, -3, -1, 0, 0, 0];
  const count = removeDuplicates(nums);
  eq(count, 3);
  eq(nums.slice(0, count), [-3, -1, 0]);
});
