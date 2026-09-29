// ─────────────────────────────────────────────────────────────────────────
//  34 · heapify an array in place — SOLUTION                ★★☆ core
//  run: node 34-heapify.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: everything from index (n >> 1) onwards is a leaf, and a
//  leaf is already a legal heap of one. So start at the last parent and
//  sift down, walking backwards to the root — each node only ever has to
//  fix subtrees that are already heaps.
//  That is O(n), not O(n log n): half the nodes are leaves and move zero
//  steps, a quarter move at most one, and the series n/2·0 + n/4·1 +
//  n/8·2 + … converges to n. Building the same heap with n inserts is
//  O(n log n) and needs somewhere to insert INTO.
//  heapSort then repeats "swap the root to the end, shrink, sift down":
//  n extractions at O(log n) each → O(n log n) time with O(1) extra space,
//  which is what you reach for when there is no room for a second array
//  (Array.prototype.sort makes no such promise, and V8's implementation
//  allocates).
//  The `end` parameter on siftDown is the whole trick — it is the boundary
//  between the shrinking heap and the finished, sorted tail.
//  Classic wrong turn: forgetting to shrink, which stirs the sorted tail
//  back into the heap and loops forever producing the same maximum.

import { test, eq, ok } from '../../_lib/check.js';

const heapProperty = (items) =>
  items.every((v, i) => i === 0 || items[(i - 1) >> 1] >= v);

const siftDown = (items, start, end) => {
  let i = start;
  for (;;) {
    const left = 2 * i + 1;
    const right = left + 1;
    let largest = i;
    if (left < end && items[left] > items[largest]) largest = left;
    if (right < end && items[right] > items[largest]) largest = right;
    if (largest === i) return;
    [items[i], items[largest]] = [items[largest], items[i]];
    i = largest;
  }
};

export function heapify(items) {
  for (let i = (items.length >> 1) - 1; i >= 0; i -= 1) {
    siftDown(items, i, items.length);
  }
  return items;
}

export function heapSort(items) {
  heapify(items);
  for (let end = items.length - 1; end > 0; end -= 1) {
    [items[0], items[end]] = [items[end], items[0]];
    siftDown(items, 0, end); // `end` now excludes the sorted tail
  }
  return items;
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
