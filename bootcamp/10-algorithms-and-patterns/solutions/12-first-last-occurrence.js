// ─────────────────────────────────────────────────────────────────────────
//  12 · firstOccurrence / lastOccurrence — SOLUTION         ★★★ stretch
//  concepts: pattern: binary search on boundaries · keep searching
//  run: node 12-first-last-occurrence.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: binary search for a BOUNDARY, not for a value.
//  The change from exercise 11 is one line: on a hit, do not return.
//  Remember the index as the best answer so far, then keep searching the
//  left half (for the first occurrence) or the right half (for the last).
//  Both are O(log n) time, O(1) space.
//  The naive fix — binary search, then walk outwards to the edges of the
//  run — degrades to O(n) on an array of 200,000 identical values, which
//  is exactly what the last test builds.
//  Same generalisation powers lower_bound / upper_bound and "how many
//  values are < x": search for a boundary, not a match.

import { test, eq } from '../../_lib/check.js';

export function firstOccurrence(sorted, target) {
  let low = 0;
  let high = sorted.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (sorted[mid] === target) {
      found = mid;
      high = mid - 1;
    } else if (sorted[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
}

export function lastOccurrence(sorted, target) {
  let low = 0;
  let high = sorted.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (sorted[mid] === target) {
      found = mid;
      low = mid + 1;
    } else if (sorted[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds both ends of a run', () => {
  eq(firstOccurrence([5, 7, 7, 8, 8, 10], 8), 3);
  eq(lastOccurrence([5, 7, 7, 8, 8, 10], 8), 4);
});

test('returns -1 when the target is absent', () => {
  eq(firstOccurrence([5, 7, 7, 8, 8, 10], 6), -1);
  eq(lastOccurrence([5, 7, 7, 8, 8, 10], 6), -1);
});

test('handles an array that is all one value', () => {
  eq(firstOccurrence([2, 2, 2, 2], 2), 0);
  eq(lastOccurrence([2, 2, 2, 2], 2), 3);
});

test('handles a run that starts at index 0', () => {
  eq(firstOccurrence([1, 1, 2, 3], 1), 0);
  eq(lastOccurrence([1, 1, 2, 3], 1), 1);
});

test('handles a run that ends at the last index', () => {
  eq(firstOccurrence([1, 2, 3, 3], 3), 2);
  eq(lastOccurrence([1, 2, 3, 3], 3), 3);
});

test('handles single-element and empty arrays', () => {
  eq(firstOccurrence([2], 2), 0);
  eq(lastOccurrence([2], 3), -1);
  eq(firstOccurrence([], 1), -1);
});

test('stays fast on a huge run of duplicates', () => {
  const many = new Array(200000).fill(4);
  many[0] = 1;
  eq(firstOccurrence(many, 4), 1);
  eq(lastOccurrence(many, 4), 199999);
});
