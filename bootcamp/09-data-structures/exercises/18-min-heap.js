// ─────────────────────────────────────────────────────────────────────────
//  18 · binary min-heap (priority queue)                   ★★★ stretch
//  concepts: heaps · array-as-tree · sift up / sift down
//  run: node 18-min-heap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A priority queue answers one question fast: "what is the smallest thing
//  waiting?" A sorted array answers it in O(1) but pays O(n) per insert.
//  A heap does both in O(log n) by keeping the data only PARTLY ordered:
//  every parent is <= its children, and nothing more is promised.
//
//  The tree lives in a flat array. For the item at index i:
//      parent      → (i - 1) >> 1        children → 2i + 1 and 2i + 2
//
//      const h = new MinHeap();
//      for (const n of [5, 3, 8, 1]) h.insert(n);
//      h.peek()        → 1
//      h.extractMin()  → 1
//      h.extractMin()  → 3
//      h.size()        → 2
//      new MinHeap().extractMin()  → undefined
//
//  insert: put the value at the end, then sift it UP while it is smaller
//  than its parent. extractMin: take items[0], move the LAST item into
//  the hole, then sift it DOWN past its smaller child.
//
//  hint: sifting down must compare against the SMALLER of the two children
//  — swapping with the bigger one breaks the heap immediately

import { test, eq, ok } from '../../_lib/check.js';

export class MinHeap {
  constructor() {
    this.items = [];
  }

  insert(value) {
    throw new Error('TODO');
  }

  extractMin() {
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
  items.every((v, i) => i === 0 || items[(i - 1) >> 1] <= v);

// ──────────────────────────── tests ──────────────────────────────────────

test('an empty heap peeks and extracts undefined', () => {
  const h = new MinHeap();
  eq(h.peek(), undefined);
  eq(h.extractMin(), undefined);
  eq(h.size(), 0);
});

test('one value goes in and comes straight back out', () => {
  const h = new MinHeap();
  h.insert(7);
  eq(h.peek(), 7);
  eq(h.extractMin(), 7);
  eq(h.size(), 0);
});

test('extracts in ascending order whatever the insert order', () => {
  const h = new MinHeap();
  for (const n of [5, 3, 8, 1, 9, 2]) h.insert(n);
  const out = [];
  while (h.size() > 0) out.push(h.extractMin());
  eq(out, [1, 2, 3, 5, 8, 9]);
});

test('peek shows the minimum without removing it', () => {
  const h = new MinHeap();
  for (const n of [4, 2, 6]) h.insert(n);
  eq(h.peek(), 2);
  eq(h.peek(), 2);
  eq(h.size(), 3);
});

test('duplicates come out as often as they went in', () => {
  const h = new MinHeap();
  for (const n of [3, 1, 3, 1]) h.insert(n);
  eq([h.extractMin(), h.extractMin(), h.extractMin()], [1, 1, 3]);
});

test('every parent stays <= its children after inserts', () => {
  const h = new MinHeap();
  for (const n of [9, 4, 7, 1, 8, 2, 6, 3]) h.insert(n);
  ok(heapProperty(h.items), `heap property broken: ${h.items}`);
  eq(h.items[0], 1, 'the root is always the minimum');
});

test('the heap property survives extraction too', () => {
  const h = new MinHeap();
  for (const n of [9, 4, 7, 1, 8, 2, 6, 3]) h.insert(n);
  h.extractMin();
  h.extractMin();
  ok(heapProperty(h.items), `heap property broken: ${h.items}`);
  eq(h.peek(), 3);
});

test('application: an event loop runs the earliest deadline first', () => {
  const timers = new MinHeap();
  for (const runAtMs of [500, 20, 900, 120]) timers.insert(runAtMs);
  eq(timers.extractMin(), 20);
  timers.insert(60);
  eq(timers.extractMin(), 60, 'a sooner timer jumps the queue');
  eq(timers.extractMin(), 120);
});
