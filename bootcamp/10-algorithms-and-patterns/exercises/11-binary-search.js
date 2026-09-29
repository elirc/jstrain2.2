// ─────────────────────────────────────────────────────────────────────────
//  11 · binarySearch / searchInsert                         ★☆☆ warm-up
//  concepts: pattern: binary search · halving the search space
//  run: node 11-binary-search.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The array is sorted ascending with no duplicates.
//
//      binarySearch([1, 3, 5, 7, 9], 5)   → 2
//      binarySearch([1, 3, 5], 4)         → -1
//      searchInsert([1, 3, 5, 6], 5)      → 2   (already there)
//      searchInsert([1, 3, 5, 6], 2)      → 1   (goes between 1 and 3)
//
//  Same loop, different answer when the target is missing: binarySearch
//  gives up with -1, searchInsert reports the slot where the value would
//  keep the array sorted (which can be arr.length).

import { test, eq } from '../../_lib/check.js';

export function binarySearch(sorted, target) {
  throw new Error('TODO');
}

export function searchInsert(sorted, target) {
  throw new Error('TODO');
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
