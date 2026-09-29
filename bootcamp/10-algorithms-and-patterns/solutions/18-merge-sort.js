// ─────────────────────────────────────────────────────────────────────────
//  18 · mergeSort — SOLUTION                                ★★★ stretch
//  concepts: pattern: divide and conquer · the merge step · stability
//  run: node 18-merge-sort.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: divide and conquer. Split in half, recurse on
//  each half, merge the two sorted halves with the two-pointer merge from
//  exercise 05. log n levels of splitting, O(n) merging per level:
//  O(n log n) time, guaranteed — no bad inputs, unlike quicksort.
//  Space O(n) for the merge buffers (plus O(log n) stack), which is the
//  price you pay for that guarantee.
//  Stability comes from ONE character: `compare(left[i], right[j]) <= 0`
//  takes from the left half on ties, and the left half holds the items
//  that came first. Flip it to `<` and equal items silently swap order —
//  which breaks "sort by date, then by name" chains.
//  Naive comparison: insertion sort (17) is O(n²); on 100,000 items that
//  is ~10^10 operations versus ~1.7 million here.
//  When would you hand-roll it? Rarely — V8's `.sort()` is already a
//  stable O(n log n) Timsort. You reach for merge sort by hand when data
//  does not fit in memory (external / k-way merge of sorted files) or
//  when merging sorted streams, which is the same merge step.

import { test, eq, ok } from '../../_lib/check.js';

function merge(left, right, compare) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (compare(left[i], right[j]) <= 0) {
      out.push(left[i]);
      i += 1;
    } else {
      out.push(right[j]);
      j += 1;
    }
  }
  while (i < left.length) out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}

export function mergeSort(items, compare = (a, b) => a - b) {
  if (items.length <= 1) return [...items];
  const middle = Math.floor(items.length / 2);
  const left = mergeSort(items.slice(0, middle), compare);
  const right = mergeSort(items.slice(middle), compare);
  return merge(left, right, compare);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sorts numbers ascending by default', () => {
  eq(mergeSort([5, 2, 9, 1, 5, 6]), [1, 2, 5, 5, 6, 9]);
});

test('handles empty, single-element and all-same arrays', () => {
  eq(mergeSort([]), []);
  eq(mergeSort([7]), [7]);
  eq(mergeSort([4, 4, 4]), [4, 4, 4]);
});

test('returns a new array and leaves the input untouched', () => {
  const nums = [3, 1, 2];
  const sorted = mergeSort(nums);
  ok(sorted !== nums, 'should not return the same array reference');
  eq(nums, [3, 1, 2]);
  eq(sorted, [1, 2, 3]);
});

test('handles odd lengths and reversed input', () => {
  eq(mergeSort([5, 4, 3, 2, 1]), [1, 2, 3, 4, 5]);
});

test('honours a custom comparator', () => {
  const words = ['ccc', 'a', 'bb'];
  eq(mergeSort(words, (x, y) => x.length - y.length), ['a', 'bb', 'ccc']);
});

test('is stable: ties keep their original order', () => {
  const rows = [
    { name: 'a', rank: 2 },
    { name: 'b', rank: 1 },
    { name: 'c', rank: 2 },
    { name: 'd', rank: 1 },
  ];
  const sorted = mergeSort(rows, (x, y) => x.rank - y.rank);
  eq(sorted.map((r) => r.name), ['b', 'd', 'a', 'c']);
});

test('sorts a hundred values without breaking a sweat', () => {
  const descending = Array.from({ length: 100 }, (_, i) => 99 - i);
  const expected = Array.from({ length: 100 }, (_, i) => i);
  eq(mergeSort(descending), expected);
});
