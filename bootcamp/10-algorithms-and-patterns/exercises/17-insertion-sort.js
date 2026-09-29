// ─────────────────────────────────────────────────────────────────────────
//  17 · insertionSort                                       ★★☆ core
//  concepts: pattern: sorting from scratch · shift-and-insert · stability
//  run: node 17-insertion-sort.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Sort the array IN PLACE and return it — the way you sort a hand of
//  cards: take the next card and slide it left past everything bigger.
//
//      insertionSort([5, 2, 4])              → [2, 4, 5]
//      insertionSort([3, 1, 2], (a, b) => b - a)  → [3, 2, 1]
//
//  `compare(a, b)` returns a negative number when a comes first, 0 when
//  they tie, positive when b comes first — the same contract as
//  Array.prototype.sort. It defaults to ascending numbers.
//
//  Your sort must be STABLE: two items that tie must keep their original
//  relative order. That falls out naturally if you only shift an item
//  when the comparison is strictly positive.
//
//  hint: for each index i, hold nums[i] in a variable, shift bigger
//  neighbours one slot right, then drop the held value into the hole

import { test, eq, ok } from '../../_lib/check.js';

export function insertionSort(items, compare = (a, b) => a - b) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sorts numbers ascending by default', () => {
  eq(insertionSort([5, 2, 4, 6, 1, 3]), [1, 2, 3, 4, 5, 6]);
});

test('handles empty and single-element arrays', () => {
  eq(insertionSort([]), []);
  eq(insertionSort([7]), [7]);
});

test('leaves an already sorted array alone', () => {
  eq(insertionSort([1, 2, 3]), [1, 2, 3]);
});

test('handles a reversed array and duplicates', () => {
  eq(insertionSort([3, 2, 1]), [1, 2, 3]);
  eq(insertionSort([2, 1, 2, 1]), [1, 1, 2, 2]);
});

test('honours a custom comparator', () => {
  eq(insertionSort([1, 3, 2], (a, b) => b - a), [3, 2, 1]);
});

test('is stable: ties keep their original order', () => {
  const rows = [
    { name: 'a', rank: 2 },
    { name: 'b', rank: 1 },
    { name: 'c', rank: 2 },
    { name: 'd', rank: 1 },
  ];
  const sorted = insertionSort(rows, (x, y) => x.rank - y.rank);
  eq(sorted.map((r) => r.name), ['b', 'd', 'a', 'c']);
});

test('sorts in place and returns the same array', () => {
  const nums = [3, 1, 2];
  ok(insertionSort(nums) === nums, 'should return the same array reference');
  eq(nums, [1, 2, 3]);
});
