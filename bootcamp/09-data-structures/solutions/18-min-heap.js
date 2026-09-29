// ─────────────────────────────────────────────────────────────────────────
//  18 · binary min-heap (priority queue) — SOLUTION        ★★★ stretch
//  run: node 18-min-heap.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a heap is a complete binary tree flattened into an array,
//  so no node objects and no pointers — the index arithmetic IS the tree.
//  insert appends (the only spot that keeps the tree complete) and sifts
//  up; extractMin takes the root, plugs the hole with the last element so
//  the shape stays complete, and sifts down past the SMALLER child.
//  Both are O(log n) because a complete tree of n nodes is log2(n) deep;
//  peek is O(1).
//  Why not just sort? A sorted array gives O(1) peek but O(n) insert, and
//  re-sorting on every arrival is O(n log n) each time. When work keeps
//  arriving while you are draining — schedulers, Dijkstra, merging log
//  streams, rate limiters — the heap is the structure that keeps up.
//  Do not read anything into items[1] vs items[2]: a heap is NOT sorted,
//  only the root is guaranteed. Sorting a heap array is the classic
//  misunderstanding — and would throw away the cheap insert you paid for.

import { test, eq, ok } from '../../_lib/check.js';

export class MinHeap {
  constructor() {
    this.items = [];
  }

  insert(value) {
    const items = this.items;
    items.push(value);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent] <= items[i]) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
    return this;
  }

  extractMin() {
    const items = this.items;
    if (items.length === 0) return undefined;
    const min = items[0];
    const last = items.pop();
    if (items.length === 0) return min;

    items[0] = last;
    let i = 0;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let smallest = i;
      if (left < items.length && items[left] < items[smallest]) {
        smallest = left;
      }
      if (right < items.length && items[right] < items[smallest]) {
        smallest = right;
      }
      if (smallest === i) break;
      [items[smallest], items[i]] = [items[i], items[smallest]];
      i = smallest;
    }
    return min;
  }

  peek() {
    return this.items[0];
  }

  size() {
    return this.items.length;
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
