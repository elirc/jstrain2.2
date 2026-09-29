// ─────────────────────────────────────────────────────────────────────────
//  33 · max-heap: flip the comparison — SOLUTION            ★☆☆ warm-up
//  run: node 33-max-heap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: identical to the min-heap, with `<=` swapped for `>=` and
//  "smallest" swapped for "largest". insert appends — the only position
//  that keeps the tree complete — then sifts up; extractMax takes the
//  root, plugs the hole with the last item so the shape stays complete,
//  and sifts down past the LARGER child.
//  insert and extractMax are O(log n) because a complete tree of n nodes
//  is log2(n) deep; peek and size are O(1). A sorted array would give O(1)
//  peek but O(n) per insert, and re-sorting on each arrival is O(n log n)
//  every time — the heap wins whenever work keeps ARRIVING while you
//  drain it: auctions, schedulers, rate limiters, top-K feeds.
//  In real code you would write ONE heap taking a comparator (that is the
//  version handed to you in exercises 35 and 40) — but write it both ways
//  once, and the index arithmetic stops being something you look up.
//  Classic wrong turn: sifting down against the first child instead of the
//  larger one, which breaks the invariant on the very next extraction.

import { test, eq, ok } from '../../_lib/check.js';

export class MaxHeap {
  constructor() {
    this.items = [];
  }

  insert(value) {
    const items = this.items;
    items.push(value);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent] >= items[i]) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
    return this;
  }

  extractMax() {
    const items = this.items;
    if (items.length === 0) return undefined;
    const max = items[0];
    const last = items.pop();
    if (items.length === 0) return max;

    items[0] = last;
    let i = 0;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let largest = i;
      if (left < items.length && items[left] > items[largest]) largest = left;
      if (right < items.length && items[right] > items[largest]) largest = right;
      if (largest === i) break;
      [items[largest], items[i]] = [items[i], items[largest]];
      i = largest;
    }
    return max;
  }

  peek() {
    return this.items[0];
  }

  size() {
    return this.items.length;
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
