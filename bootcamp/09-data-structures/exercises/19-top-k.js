// ─────────────────────────────────────────────────────────────────────────
//  19 · top-K with a heap                                  ★★★ stretch
//  concepts: heaps · bounded memory · O(n log k)
//  run: node 19-top-k.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "Give me the 5 slowest requests out of a million." Sorting the whole
//  million to read 5 values is O(n log n) and needs all of it in memory.
//  Instead keep a MIN-heap of the k best seen so far: the smallest of your
//  current winners sits at the root, ready to be kicked out the moment
//  something better arrives.
//
//      topK([5, 1, 9, 3, 7], 3)   → [5, 7, 9]      ascending
//      topK([2, 2, 2], 2)         → [2, 2]
//      topK([4, 1], 10)           → [1, 4]         k bigger than the input
//      topK([4, 1], 0)            → []
//
//  A working MinHeap is provided. Return the k largest values in
//  ASCENDING order.
//
//  10/10 solves the same top-k shape with a count map + sort; this heap
//  is O(n log k) and holds only k — same problem, different tradeoff.
//
//  hint: push everything, and whenever the heap holds more than k, drop
//  its minimum — that is the weakest of your current winners

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
  throw new Error('TODO');
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
