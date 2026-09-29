// ─────────────────────────────────────────────────────────────────────────
//  19 · top-K with a heap — SOLUTION                       ★★★ stretch
//  run: node 19-top-k.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the counter-intuitive part is using a MIN-heap to track
//  the MAXIMUM values. The root is the weakest current winner, so deciding
//  whether a new number belongs is an O(1) look and an O(log k) swap —
//  never a scan of the winners.
//  Cost: O(n log k) time and O(k) memory, versus O(n log n) time and O(n)
//  memory for `[...numbers].sort().slice(-k)`. With n = 1,000,000 and
//  k = 5 that is the difference between holding five numbers and holding a
//  million, which is what makes this the standard streaming answer: it
//  works even when the input never fits in memory at all.
//  Draining the heap at the end yields ascending order for free, because
//  extractMin always hands back the smallest of what is left.
//  For small n, sort-and-slice is honestly fine and more readable — reach
//  for the heap when n is large, streaming, or k is tiny.
//  10/10 solves the same top-k shape with a count map + sort; this heap
//  is O(n log k) and holds only k — same problem, different tradeoff.

import { test, eq } from '../../_lib/check.js';

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

export function topK(numbers, k) {
  if (k <= 0) return [];
  const heap = new MinHeap();
  for (const n of numbers) {
    heap.insert(n);
    if (heap.size() > k) heap.extractMin();
  }
  const out = [];
  while (heap.size() > 0) out.push(heap.extractMin());
  return out;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the k largest values in ascending order', () => {
  eq(topK([5, 1, 9, 3, 7], 3), [5, 7, 9]);
});

test('k of 0 returns nothing', () => {
  eq(topK([4, 1, 8], 0), []);
});

test('k larger than the input returns everything, sorted', () => {
  eq(topK([4, 1], 10), [1, 4]);
});

test('an empty input returns an empty array', () => {
  eq(topK([], 3), []);
});

test('keeps duplicates that belong in the top k', () => {
  eq(topK([2, 9, 2, 9, 1], 3), [2, 9, 9]);
});

test('works with negative numbers', () => {
  eq(topK([-10, -3, -7, -1], 2), [-3, -1]);
});

test('handles a large input without sorting all of it', () => {
  const numbers = Array.from({ length: 5000 }, (_, i) => (i * 7919) % 10007);
  const expected = [...numbers].sort((a, b) => a - b).slice(-5);
  eq(topK(numbers, 5), expected);
});

test('application: the 3 slowest endpoints in a latency log', () => {
  const log = [
    { route: '/health', ms: 3 },
    { route: '/search', ms: 940 },
    { route: '/cart', ms: 120 },
    { route: '/report', ms: 2100 },
    { route: '/home', ms: 45 },
    { route: '/upload', ms: 780 },
  ];
  const slowest = topK(log.map((entry) => entry.ms), 3);
  eq(slowest, [780, 940, 2100]);
  eq(slowest.at(-1), 2100, 'the worst offender is last');
});
