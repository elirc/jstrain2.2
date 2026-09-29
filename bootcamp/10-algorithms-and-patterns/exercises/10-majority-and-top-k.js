// ─────────────────────────────────────────────────────────────────────────
//  10 · majorityElement / topKFrequent                      ★★☆ core
//  concepts: pattern: frequency counting · counts → ranking · stable sort
//  run: node 10-majority-and-top-k.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Same count map as 09, now used to rank things.
//
//      majorityElement([3, 3, 4, 2, 3, 3, 3])  → 3    (5 of 7 > half)
//      majorityElement([1, 1, 2, 2])           → null (2 of 4 is NOT
//                                                      more than half)
//      topKFrequent(['a', 'b', 'a', 'c', 'b', 'a'], 2)  → ['a', 'b']
//
//  majorityElement returns the value appearing MORE than n / 2 times, or
//  null. topKFrequent returns the k most common values, most common
//  first; ties are broken by first appearance in the input. If k is
//  bigger than the number of distinct values, return them all.
//
//  09/19 solves the same top-k shape with a min-heap: O(n log k) and only
//  k values in memory — same problem, different tradeoff.
//
//  hint: Array.prototype.sort is stable in modern JS, and a Map iterates
//  in insertion order — those two facts hand you the tie-break for free

import { test, eq } from '../../_lib/check.js';

export function majorityElement(nums) {
  throw new Error('TODO');
}

export function topKFrequent(items, k) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('majorityElement finds a value in more than half the slots', () => {
  eq(majorityElement([3, 3, 4, 2, 3, 3, 3]), 3);
});

test('majorityElement returns null when nothing dominates', () => {
  eq(majorityElement([1, 2, 3]), null);
});

test('majorityElement rejects an exact half', () => {
  eq(majorityElement([1, 1, 2, 2]), null);
});

test('majorityElement handles empty and single-element arrays', () => {
  eq(majorityElement([]), null);
  eq(majorityElement([5]), 5);
});

test('topKFrequent ranks by count, most frequent first', () => {
  eq(topKFrequent(['a', 'b', 'a', 'c', 'b', 'a'], 2), ['a', 'b']);
  eq(topKFrequent(['a', 'b', 'a', 'c', 'b', 'a'], 1), ['a']);
});

test('topKFrequent breaks ties by first appearance', () => {
  eq(topKFrequent(['x', 'y', 'z'], 2), ['x', 'y']);
});

test('topKFrequent caps at the number of distinct values', () => {
  eq(topKFrequent(['a', 'a', 'b'], 5), ['a', 'b']);
});

test('topKFrequent handles an empty input and k of 0', () => {
  eq(topKFrequent([], 3), []);
  eq(topKFrequent(['a'], 0), []);
});
