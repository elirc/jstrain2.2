// ─────────────────────────────────────────────────────────────────────────
//  04 · removeDuplicates — SOLUTION                         ★★☆ core
//  concepts: pattern: two pointers (fast / slow) · in-place compaction
//  run: node 04-remove-duplicates.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: two pointers moving the SAME direction at
//  different speeds (also called the read/write or fast/slow pointer).
//  `write` is where the next unique value belongs; `read` scans forward.
//  Because the array is sorted, a value is new exactly when it differs
//  from the last one written — copy it to `write` and bump `write`.
//  Time O(n), space O(1). Beats `[...new Set(nums)]` (O(n) extra space,
//  and it does not compact in place) and the truly naive
//  `splice()`-while-looping approach, which is O(n²) because every splice
//  shifts the tail — and skips elements as the indices shift under you.
//  Bite: the empty array. Starting `write` at 1 assumes slot 0 exists.

import { test, eq } from '../../_lib/check.js';

export function removeDuplicates(sorted) {
  if (sorted.length === 0) return 0;
  let write = 1;
  for (let read = 1; read < sorted.length; read += 1) {
    if (sorted[read] !== sorted[write - 1]) {
      sorted[write] = sorted[read];
      write += 1;
    }
  }
  return write;
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
