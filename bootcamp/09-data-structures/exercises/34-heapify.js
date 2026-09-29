// ─────────────────────────────────────────────────────────────────────────
//  34 · heapify an array in place                           ★★☆ core
//  concepts: bottom-up heapify · in-place algorithms · heapsort
//  run: node 34-heapify.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 33 built a heap one insert at a time. If you already HAVE the
//  array, there is a better way: start at the last parent and sift down
//  toward index 0. No second array, no inserts, and it is O(n).
//
//      const a = [5, 1, 9, 3];
//      heapify(a)      → the same array, rearranged so parents >= children
//      a[0]            → 9
//
//      heapSort([10, 9, 1])   → [1, 9, 10]   (same array object, sorted)
//
//  heapify(items) rearranges `items` IN PLACE into a max-heap and returns
//  that same array. heapSort(items) then sorts it ascending in place:
//  swap the root to the end, shrink the heap by one, sift the new root
//  down, repeat. Both return the array you passed in — no copies.
//
//  hint: the last parent is at index (n >> 1) - 1, and your sift-down
//  needs to know where the heap ENDS so heapSort can shrink it

import { test, eq, ok } from '../../_lib/check.js';

const heapProperty = (items) =>
  items.every((v, i) => i === 0 || items[(i - 1) >> 1] >= v);

export function heapify(items) {
  throw new Error('TODO');
}

export function heapSort(items) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('heapify leaves the largest value on top', () => {
  const scores = [5, 1, 9, 3, 7, 2];
  heapify(scores);
  ok(heapProperty(scores), `heap property broken: ${scores}`);
  eq(scores[0], 9);
});

test('heapify rearranges the very array you handed it', () => {
  const values = [4, 10, 3, 5, 1];
  const sortedBefore = [...values].sort((a, b) => a - b);
  ok(heapify(values) === values, 'the same array object comes back');
  eq([...values].sort((a, b) => a - b), sortedBefore, 'nothing lost or added');
});

test('empty and single-element arrays survive heapify', () => {
  eq(heapify([]), []);
  eq(heapify([7]), [7]);
});

test('heapSort puts everything in ascending order', () => {
  eq(heapSort([5, 1, 9, 3, 7, 2]), [1, 2, 3, 5, 7, 9]);
  eq(heapSort([2, 1]), [1, 2]);
});

test('heapSort sorts in place and returns the same array', () => {
  const values = [8, 3, 6];
  ok(heapSort(values) === values);
  eq(values, [3, 6, 8], 'the caller sees the sorted array too');
});

test('heapSort copes with duplicates and already-sorted input', () => {
  eq(heapSort([4, 4, 1, 4]), [1, 4, 4, 4]);
  eq(heapSort([1, 2, 3]), [1, 2, 3]);
  eq(heapSort([3, 2, 1]), [1, 2, 3]);
});

test('heapSort compares numbers, not strings', () => {
  eq(heapSort([10, 9, 1]), [1, 9, 10], 'sort() with no comparator says 1,10,9');
});

test('application: a memory-tight device sorts a batch of scores', () => {
  const batch = [55, 12, 99, 40, 71];
  const sorted = heapSort(batch);
  ok(sorted === batch, 'no second array was ever allocated');
  eq(sorted, [12, 40, 55, 71, 99]);
  eq(sorted[sorted.length - 1], 99, 'top score');
});
