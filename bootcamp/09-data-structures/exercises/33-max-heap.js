// ─────────────────────────────────────────────────────────────────────────
//  33 · max-heap: flip the comparison                       ★☆☆ warm-up
//  concepts: heaps · array-as-tree · sift up / sift down
//  run: node 33-max-heap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  This is exercise 18 with every comparison reversed: now every parent is
//  >= its children, and the root is the LARGEST value. Type it out — the
//  point of the rep is that "min-heap" and "max-heap" are one structure
//  with one flipped operator, not two things to memorise.
//
//  The tree still lives in a flat array. For the item at index i:
//      parent → (i - 1) >> 1        children → 2i + 1 and 2i + 2
//
//      const h = new MaxHeap();
//      for (const n of [5, 3, 8, 1]) h.insert(n);
//      h.peek()        → 8
//      h.extractMax()  → 8
//      h.extractMax()  → 5
//      h.size()        → 2
//      new MaxHeap().extractMax()  → undefined
//
//  insert: append, then sift UP while the value is bigger than its parent.
//  extractMax: take items[0], move the LAST item into the hole, sift DOWN
//  past the LARGER of the two children.

import { test, eq, ok } from '../../_lib/check.js';

export class MaxHeap {
  constructor() {
    this.items = [];
  }

  insert(value) {
    throw new Error('TODO');
  }

  extractMax() {
    throw new Error('TODO');
  }

  peek() {
    throw new Error('TODO');
  }

  size() {
    throw new Error('TODO');
  }
}

const heapProperty = (items) =>
  items.every((v, i) => i === 0 || items[(i - 1) >> 1] >= v);

// ──────────────────────────── tests ──────────────────────────────────────

test('an empty heap peeks and extracts undefined', () => {
  const h = new MaxHeap();
  eq(h.peek(), undefined);
  eq(h.extractMax(), undefined);
  eq(h.size(), 0);
});

test('one value goes in and comes straight back out', () => {
  const h = new MaxHeap();
  h.insert(7);
  eq(h.peek(), 7);
  eq(h.extractMax(), 7);
  eq(h.size(), 0);
});

test('extracts in descending order whatever the insert order', () => {
  const h = new MaxHeap();
  for (const n of [5, 3, 8, 1, 9, 2]) h.insert(n);
  const out = [];
  while (h.size() > 0) out.push(h.extractMax());
  eq(out, [9, 8, 5, 3, 2, 1]);
});

test('peek shows the maximum without removing it', () => {
  const h = new MaxHeap();
  for (const n of [4, 2, 6]) h.insert(n);
  eq(h.peek(), 6);
  eq(h.peek(), 6);
  eq(h.size(), 3);
});

test('duplicates come out as often as they went in', () => {
  const h = new MaxHeap();
  for (const n of [3, 9, 3, 9]) h.insert(n);
  eq([h.extractMax(), h.extractMax(), h.extractMax()], [9, 9, 3]);
});

test('every parent stays >= its children, inserting and extracting', () => {
  const h = new MaxHeap();
  for (const n of [9, 4, 7, 1, 8, 2, 6, 3]) h.insert(n);
  ok(heapProperty(h.items), `heap property broken: ${h.items}`);
  eq(h.items[0], 9, 'the root is always the maximum');
  h.extractMax();
  h.extractMax();
  ok(heapProperty(h.items), `heap property broken: ${h.items}`);
  eq(h.peek(), 7);
});

test('application: an auction always serves the highest bid first', () => {
  const bids = new MaxHeap();
  for (const amount of [120, 95, 140]) bids.insert(amount);
  eq(bids.extractMax(), 140);
  bids.insert(200);
  eq(bids.extractMax(), 200, 'a late higher bid jumps the queue');
  eq(bids.extractMax(), 120);
});
