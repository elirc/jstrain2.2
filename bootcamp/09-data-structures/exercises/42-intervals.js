// ─────────────────────────────────────────────────────────────────────────
//  42 · merge and insert intervals                          ★★☆ core
//  concepts: sorting · sweeping · keeping an invariant
//  run: node 42-intervals.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Ranges that overlap should be one range: busy blocks in a calendar, IP
//  ranges in a firewall, ad slots on a timeline. Ends are inclusive, so
//  [1, 3] and [3, 5] touch and merge into [1, 5].
//
//  mergeIntervals(intervals) — any order in, merged and sorted by start
//  out. Does not modify the array it was given.
//      mergeIntervals([[1,3], [2,6], [8,10]])   → [[1,6], [8,10]]
//      mergeIntervals([[1,10], [2,3]])          → [[1,10]]
//
//  insertInterval(sorted, interval) — `sorted` is ALREADY sorted and
//  merged; slot the new one in and merge whatever it touches, in one pass
//  with no re-sorting.
//      insertInterval([[1,2], [3,5], [8,10]], [4,9])
//        → [[1,2], [3,10]]
//
//  hint: once sorted, only the LAST kept interval can possibly overlap the
//  next one — and for the insert, think in three phases: before, overlapping,
//  after

import { test, eq } from '../../_lib/check.js';

export function mergeIntervals(intervals) {
  throw new Error('TODO');
}

export function insertInterval(sorted, interval) {
  throw new Error('TODO');
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
