// ─────────────────────────────────────────────────────────────────────────
//  11 · binarySearch / searchInsert — SOLUTION              ★☆☆ warm-up
//  concepts: pattern: binary search · halving the search space
//  run: node 11-binary-search.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: binary search. Keep a [low, high] range that
//  is guaranteed to contain the answer. Look at the middle: too small?
//  the answer is to the right (low = mid + 1). Too big? to the left
//  (high = mid - 1). Every step halves the range, so it is O(log n) time
//  and O(1) space versus the naive O(n) linear scan. At n = 1,000,000
//  that is 20 comparisons instead of a million.
//  searchInsert is the same loop, except when it ends `low` is exactly
//  the slot where the target belongs — that is the whole trick.
//  Bites: `while (low <= high)` (not `<`), or a one-element range never
//  gets examined; and always move past `mid`, never `high = mid`, or you
//  can loop forever. `(low + high) >> 1` is the usual overflow-safe midpoint
//  in other languages; in JS `Math.floor((low + high) / 2)` is fine.

import { test, eq } from '../../_lib/check.js';

export function binarySearch(sorted, target) {
  let low = 0;
  let high = sorted.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

export function searchInsert(sorted, target) {
  let low = 0;
  let high = sorted.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return low;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('binarySearch finds a value in the middle', () => {
  eq(binarySearch([1, 3, 5, 7, 9], 5), 2);
});

test('binarySearch finds the first and last values', () => {
  eq(binarySearch([1, 3, 5, 7, 9], 1), 0);
  eq(binarySearch([1, 3, 5, 7, 9], 9), 4);
});

test('binarySearch returns -1 for a missing value', () => {
  eq(binarySearch([1, 3, 5], 4), -1);
  eq(binarySearch([1, 3, 5], 99), -1);
});

test('binarySearch handles empty and single-element arrays', () => {
  eq(binarySearch([], 1), -1);
  eq(binarySearch([2], 2), 0);
});

test('binarySearch scales to a thousand values', () => {
  const evens = Array.from({ length: 1000 }, (_, i) => i * 2);
  eq(binarySearch(evens, 998), 499);
  eq(binarySearch(evens, 999), -1);
});

test('searchInsert returns the index of an existing value', () => {
  eq(searchInsert([1, 3, 5, 6], 5), 2);
});

test('searchInsert points at the gap for a missing value', () => {
  eq(searchInsert([1, 3, 5, 6], 2), 1);
  eq(searchInsert([1, 3, 5, 6], 0), 0);
});

test('searchInsert can point past the end, and handles empty', () => {
  eq(searchInsert([1, 3, 5, 6], 7), 4);
  eq(searchInsert([], 3), 0);
});
