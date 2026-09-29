// ─────────────────────────────────────────────────────────────────────────
//  12 · firstOccurrence / lastOccurrence                    ★★★ stretch
//  concepts: pattern: binary search on boundaries · keep searching
//  run: node 12-first-last-occurrence.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The array is sorted but now duplicates are allowed. Find where a run
//  of equal values STARTS and where it ENDS. Return -1 if absent.
//
//      firstOccurrence([5, 7, 7, 8, 8, 10], 8)  → 3
//      lastOccurrence([5, 7, 7, 8, 8, 10], 8)   → 4
//      firstOccurrence([5, 7, 7, 8, 8, 10], 6)  → -1
//
//  Plain binary search lands SOMEWHERE in the run — you cannot know
//  which slot. Walking left from there is O(n) when the whole array is
//  one value, so that is not the answer either. Both lookups must stay
//  O(log n).
//
//  hint: when you hit the target, record the index and keep halving on
//  the side you still care about

import { test, eq } from '../../_lib/check.js';

export function firstOccurrence(sorted, target) {
  throw new Error('TODO');
}

export function lastOccurrence(sorted, target) {
  throw new Error('TODO');
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
