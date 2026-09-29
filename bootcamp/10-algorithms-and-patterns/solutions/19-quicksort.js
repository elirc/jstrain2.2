// ─────────────────────────────────────────────────────────────────────────
//  19 · quickSort — SOLUTION                                ★★★ stretch
//  concepts: pattern: divide and conquer · partition around a pivot
//  run: node 19-quicksort.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: divide and conquer, but the work happens BEFORE
//  the recursion (partition), not after it (merge). Lomuto partition:
//  take the last element of the range as the pivot, walk the range with a
//  `boundary` cursor, and every time an item belongs before the pivot,
//  swap it into `boundary` and bump it. Finally swap the pivot into
//  `boundary` — it is now in its final resting place — and recurse on the
//  two sides, excluding the pivot.
//  Time O(n log n) average, O(n²) worst case (a pivot that is always the
//  smallest or largest value — e.g. last-element pivot on already sorted
//  data). Space O(log n) average for the stack, and no copies: the
//  in-place partition is why quicksort usually beats merge sort in
//  practice despite the worse worst case. Mitigations: median-of-three,
//  a random pivot, or bailing to heapsort after too many levels
//  (introsort). This version picks the MIDDLE element and swaps it to the
//  end, which keeps sorted input fast and keeps the tests deterministic.
//  Against the naive O(n²) sorts (insertion, selection, bubble) it is a
//  rout at scale: ~1.7 million operations for 100,000 items instead of
//  ~10^10. Against merge sort it trades a worst case for locality.
//  Quicksort is NOT stable — a swap can hurl an equal item across the
//  array — which is why this exercise has no stability test and merge
//  sort (18) does. That is the trade-off to state out loud in interviews.
//  Compared to `.sort()`: hand-roll only to show the mechanics, or when
//  you need a related trick like quickselect (partition once, recurse on
//  one side only) to get the k-th smallest in O(n) average.

import { test, eq, ok } from '../../_lib/check.js';

function swap(items, i, j) {
  [items[i], items[j]] = [items[j], items[i]];
}

function partition(items, low, high, compare) {
  const middle = Math.floor((low + high) / 2);
  swap(items, middle, high);
  const pivot = items[high];
  let boundary = low;
  for (let i = low; i < high; i += 1) {
    if (compare(items[i], pivot) < 0) {
      swap(items, i, boundary);
      boundary += 1;
    }
  }
  swap(items, boundary, high);
  return boundary;
}

export function quickSort(items, compare = (a, b) => a - b) {
  const sortRange = (low, high) => {
    if (low >= high) return;
    const pivotIndex = partition(items, low, high, compare);
    sortRange(low, pivotIndex - 1);
    sortRange(pivotIndex + 1, high);
  };
  sortRange(0, items.length - 1);
  return items;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sorts numbers ascending by default', () => {
  eq(quickSort([5, 2, 9, 1, 5, 6]), [1, 2, 5, 5, 6, 9]);
});

test('handles empty and single-element arrays', () => {
  eq(quickSort([]), []);
  eq(quickSort([7]), [7]);
});

test('survives an array where every value is the same', () => {
  eq(quickSort([7, 7, 7, 7, 7]), [7, 7, 7, 7, 7]);
});

test('handles already sorted and reversed input', () => {
  eq(quickSort([1, 2, 3, 4]), [1, 2, 3, 4]);
  eq(quickSort([4, 3, 2, 1]), [1, 2, 3, 4]);
});

test('handles duplicates mixed through the array', () => {
  eq(quickSort([3, 1, 3, 1, 2]), [1, 1, 2, 3, 3]);
});

test('honours a custom comparator', () => {
  eq(quickSort([1, 3, 2], (a, b) => b - a), [3, 2, 1]);
});

test('sorts in place and returns the same array', () => {
  const nums = [3, 1, 2];
  ok(quickSort(nums) === nums, 'should return the same array reference');
  eq(nums, [1, 2, 3]);
});

test('sorts two hundred values, worst-case ordering included', () => {
  const descending = Array.from({ length: 200 }, (_, i) => 199 - i);
  const expected = Array.from({ length: 200 }, (_, i) => i);
  eq(quickSort(descending), expected);
});
