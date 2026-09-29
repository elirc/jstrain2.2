// ─────────────────────────────────────────────────────────────────────────
//  35 · merge k sorted arrays with a heap — SOLUTION        ★★★ stretch
//  run: node 35-merge-k-sorted.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the heap holds one candidate per input array — the head of
//  each. Extract the smallest, emit it, and immediately push the next item
//  from the array it came from. The invariant is "the true global minimum
//  is always somewhere in the heap", because every array is sorted, so
//  nothing behind a head can beat it.
//  For N items across k arrays that is O(N log k): N extractions, each
//  costing log k because the heap never grows past k entries. Memory is
//  O(k), not O(N) — and that is the real prize. Concat-then-sort is
//  O(N log N) AND requires every item in memory at once; this version
//  merges files far larger than RAM because it only ever holds k heads.
//  (Merging two at a time in a loop is O(N·k) — the heap is what turns
//  that k into log k.)
//  Classic wrong turns: pushing every element into the heap up front
//  (that is just heapsort, and it throws away the memory win), and
//  forgetting to push the NEXT item from the list you just drew from —
//  which silently drops all but the first element of every array.

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
  const heap = new MinHeap((a, b) => a.value - b.value);

  arrays.forEach((list, listIndex) => {
    if (list.length > 0) {
      heap.insert({ value: list[0], list: listIndex, index: 0 });
    }
  });

  const merged = [];
  while (heap.size() > 0) {
    const { value, list, index } = heap.extractMin();
    merged.push(value);
    const next = index + 1;
    if (next < arrays[list].length) {
      heap.insert({ value: arrays[list][next], list, index: next });
    }
  }
  return merged;
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
