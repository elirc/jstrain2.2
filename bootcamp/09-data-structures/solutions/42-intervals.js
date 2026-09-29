// ─────────────────────────────────────────────────────────────────────────
//  42 · merge and insert intervals — SOLUTION               ★★☆ core
//  run: node 42-intervals.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: mergeIntervals sorts by start — O(n log n), and that sort
//  is the whole cost — then sweeps once. After sorting, only the LAST kept
//  interval can overlap the next one, because everything before it starts
//  even earlier and has already been absorbed. So: extend the last one, or
//  push a new one. Copying each pair with [start, end] keeps the caller's
//  array untouched.
//  insertInterval is O(n) with no sort at all, in three phases: copy
//  everything that ends strictly before the new start; absorb every
//  interval that starts at or before the (growing!) new end, widening both
//  edges as you go; then copy the rest. `end` has to keep growing during
//  phase two — that is how [4,9] reaches all the way to 10 through
//  [8,10].
//  This is why a calendar keeps its blocks sorted and merged as an
//  INVARIANT: each booking is then a linear splice instead of an
//  O(n log n) re-merge of the whole day.
//  Classic wrong turns: sort() with no comparator (string order, so
//  [10,12] sorts before [9,11]), and using `<` where `<=` belongs, which
//  leaves [1,3] and [3,5] as two blocks with an impossible zero-width gap.

import { test, eq } from '../../_lib/check.js';

export function mergeIntervals(intervals) {
  const ordered = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [];

  for (const [start, end] of ordered) {
    const last = merged[merged.length - 1];
    if (last !== undefined && start <= last[1]) {
      last[1] = Math.max(last[1], end); // extend, do not append
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

export function insertInterval(sorted, interval) {
  const out = [];
  let [start, end] = interval;
  let i = 0;

  while (i < sorted.length && sorted[i][1] < start) {
    out.push([...sorted[i]]);
    i += 1;
  }
  while (i < sorted.length && sorted[i][0] <= end) {
    start = Math.min(start, sorted[i][0]);
    end = Math.max(end, sorted[i][1]);
    i += 1;
  }
  out.push([start, end]);
  while (i < sorted.length) {
    out.push([...sorted[i]]);
    i += 1;
  }
  return out;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('overlapping ranges become one', () => {
  eq(mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]]), [
    [1, 6],
    [8, 10],
    [15, 18],
  ]);
  eq(mergeIntervals([[1, 10], [2, 3]]), [[1, 10]], 'a nested range is eaten');
});

test('touching ranges merge, a gap of one does not', () => {
  eq(mergeIntervals([[1, 3], [3, 5]]), [[1, 5]]);
  eq(mergeIntervals([[1, 3], [4, 5]]), [[1, 3], [4, 5]]);
});

test('unsorted input merges, and the input is left alone', () => {
  const input = [[8, 10], [1, 3], [2, 6]];
  eq(mergeIntervals(input), [[1, 6], [8, 10]]);
  eq(input, [[8, 10], [1, 3], [2, 6]], 'the input array is never sorted');
});

test('merging sorts by number, not by string', () => {
  eq(mergeIntervals([[10, 12], [9, 11]]), [[9, 12]], '"10" < "9" as strings');
});

test('empty and single ranges survive', () => {
  eq(mergeIntervals([]), []);
  eq(mergeIntervals([[5, 7]]), [[5, 7]]);
  eq(insertInterval([], [1, 2]), [[1, 2]]);
});

test('inserting swallows every block it reaches', () => {
  eq(insertInterval([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 9]), [
    [1, 2],
    [3, 10],
    [12, 16],
  ]);
  eq(insertInterval([[1, 3], [6, 9]], [3, 5]), [[1, 5], [6, 9]], 'touching');
});

test('a block before or after everything just slots in', () => {
  eq(insertInterval([[3, 5], [8, 10]], [1, 2]), [[1, 2], [3, 5], [8, 10]]);
  eq(insertInterval([[1, 2], [3, 5]], [8, 10]), [[1, 2], [3, 5], [8, 10]]);
});

test('application: a calendar merges busy blocks, then books a meeting', () => {
  const busy = [
    [9, 10],
    [9.5, 11],
    [13, 14],
  ];
  const blocks = mergeIntervals(busy);
  eq(blocks, [[9, 11], [13, 14]], 'free between 11 and 13');
  eq(insertInterval(blocks, [10.5, 13.5]), [[9, 14]], 'the gap is gone');
});
