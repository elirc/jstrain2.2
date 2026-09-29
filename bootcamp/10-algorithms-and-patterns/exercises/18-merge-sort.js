// ─────────────────────────────────────────────────────────────────────────
//  18 · mergeSort                                           ★★★ stretch
//  concepts: pattern: divide and conquer · the merge step · stability
//  run: node 18-merge-sort.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Return a NEW sorted array; the input must come back untouched.
//
//      mergeSort([5, 2, 9, 1])   → [1, 2, 5, 9]
//      mergeSort(['bb', 'a'], (x, y) => x.length - y.length)
//                                → ['a', 'bb']
//
//  Split the array in half, sort each half by calling yourself, then
//  merge the two sorted halves (exercise 05, now with a comparator).
//  An array of 0 or 1 items is already sorted — that is your base case.
//
//  Your sort must be STABLE: on a tie, the item from the LEFT half wins.
//
//  hint: three moving parts — base case, split, merge. Write merge as its
//  own helper and test it in your head first.

import { test, eq, ok } from '../../_lib/check.js';

export function mergeSort(items, compare = (a, b) => a - b) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sorts numbers ascending by default', () => {
  eq(mergeSort([5, 2, 9, 1, 5, 6]), [1, 2, 5, 5, 6, 9]);
});

test('handles empty, single-element and all-same arrays', () => {
  eq(mergeSort([]), []);
  eq(mergeSort([7]), [7]);
  eq(mergeSort([4, 4, 4]), [4, 4, 4]);
});

test('returns a new array and leaves the input untouched', () => {
  const nums = [3, 1, 2];
  const sorted = mergeSort(nums);
  ok(sorted !== nums, 'should not return the same array reference');
  eq(nums, [3, 1, 2]);
  eq(sorted, [1, 2, 3]);
});

test('handles odd lengths and reversed input', () => {
  eq(mergeSort([5, 4, 3, 2, 1]), [1, 2, 3, 4, 5]);
});

test('honours a custom comparator', () => {
  const words = ['ccc', 'a', 'bb'];
  eq(mergeSort(words, (x, y) => x.length - y.length), ['a', 'bb', 'ccc']);
});

test('is stable: ties keep their original order', () => {
  const rows = [
    { name: 'a', rank: 2 },
    { name: 'b', rank: 1 },
    { name: 'c', rank: 2 },
    { name: 'd', rank: 1 },
  ];
  const sorted = mergeSort(rows, (x, y) => x.rank - y.rank);
  eq(sorted.map((r) => r.name), ['b', 'd', 'a', 'c']);
});

test('sorts a hundred values without breaking a sweat', () => {
  const descending = Array.from({ length: 100 }, (_, i) => 99 - i);
  const expected = Array.from({ length: 100 }, (_, i) => i);
  eq(mergeSort(descending), expected);
});
