// ─────────────────────────────────────────────────────────────────────────
//  35 · merge k sorted arrays with a heap                   ★★★ stretch
//  concepts: heaps · k-way merge · streaming
//  run: node 35-merge-k-sorted.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 24 merged TWO sorted lists by comparing two heads. With k of
//  them you need "the smallest of k heads", repeatedly — which is exactly
//  what a priority queue is for. The MinHeap below is given to you; this
//  exercise is about USING it.
//
//      mergeKSorted([[1, 4, 7], [2, 5], [3]])  → [1, 2, 3, 4, 5, 7]
//      mergeKSorted([[], [1, 2], []])          → [1, 2]
//      mergeKSorted([])                        → []
//
//  Seed the heap with the FIRST item of each non-empty array, remembering
//  which array it came from and where. Then repeatedly take the smallest
//  and push the next item from that same array. The heap therefore never
//  holds more than k entries.
//
//  hint: the heap takes a comparator, so store little records like
//  { value, list, index } and compare on `value`

import { test, eq, ok } from '../../_lib/check.js';

class MinHeap {
  constructor(compare) {
    this.items = [];
    this.compare = compare;
  }

  insert(value) {
    const items = this.items;
    items.push(value);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(items[parent], items[i]) <= 0) break;
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
      if (left < items.length && this.compare(items[left], items[smallest]) < 0) {
        smallest = left;
      }
      if (right < items.length && this.compare(items[right], items[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === i) break;
      [items[smallest], items[i]] = [items[i], items[smallest]];
      i = smallest;
    }
    return min;
  }

  size() {
    return this.items.length;
  }
}

export function mergeKSorted(arrays) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('three sorted arrays come out as one sorted run', () => {
  eq(mergeKSorted([[1, 4, 7], [2, 5, 8], [3, 6, 9]]), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('nothing to merge gives an empty array', () => {
  eq(mergeKSorted([]), []);
  eq(mergeKSorted([[], []]), []);
});

test('empty arrays are skipped, not stumbled over', () => {
  eq(mergeKSorted([[], [1, 2], []]), [1, 2]);
  eq(mergeKSorted([[3], [], [1]]), [1, 3]);
});

test('a single array comes back as a new sorted array', () => {
  const only = [1, 2, 3];
  const out = mergeKSorted([only]);
  eq(out, [1, 2, 3]);
  ok(out !== only, 'a fresh array, not the input');
});

test('duplicates across arrays all survive', () => {
  const out = mergeKSorted([[1, 1], [1], [2]]);
  eq(out, [1, 1, 1, 2]);
  eq(out.length, 4, 'the total is the sum of the parts');
});

test('an array that runs out early does not stall the merge', () => {
  eq(mergeKSorted([[1, 2, 3, 4, 5], [0], [6, 7]]), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test('many arrays of uneven length still merge correctly', () => {
  const lists = [[1, 9], [2, 3, 4], [5], [6, 7, 8, 10], [0]];
  const expected = lists.flat().sort((a, b) => a - b);
  eq(mergeKSorted(lists), expected);
});

test('application: k sorted log files become one timeline', () => {
  const web = [100, 250, 900];
  const worker = [140, 260];
  const cron = [90, 1000];
  eq(mergeKSorted([web, worker, cron]), [90, 100, 140, 250, 260, 900, 1000]);
});
