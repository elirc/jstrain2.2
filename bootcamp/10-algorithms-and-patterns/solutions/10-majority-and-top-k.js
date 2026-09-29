// ─────────────────────────────────────────────────────────────────────────
//  10 · majorityElement / topKFrequent — SOLUTION           ★★☆ core
//  concepts: pattern: frequency counting · counts → ranking · stable sort
//  run: node 10-majority-and-top-k.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: frequency counting, then read the map.
//  majorityElement: count everything, then look for a count strictly
//  greater than n / 2. "Strictly" is the whole test — 2 out of 4 is not a
//  majority. O(n) time, O(n) space. (Boyer-Moore voting does it in O(1)
//  space; mention it, but only if you can also say why it works.)
//  topKFrequent: count, then sort the entries by count descending and
//  take k. A Map iterates in insertion order and Array#sort is stable in
//  modern JS, so equal counts naturally keep first-appearance order — no
//  extra tie-break code. O(n + d log d) for d distinct values; a heap of
//  size k gets you O(n + d log k) when k is much smaller than d.
//  The naive top-k is "for each distinct value, scan the array and count
//  it": O(n·d), and the naive majority check is the same shape.
//  09/19 solves the same top-k shape with a min-heap: O(n log k) and only
//  k values in memory — same problem, different tradeoff.

import { test, eq } from '../../_lib/check.js';

function countValues(items) {
  const counts = new Map();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return counts;
}

export function majorityElement(nums) {
  const counts = countValues(nums);
  for (const [value, count] of counts) {
    if (count > nums.length / 2) return value;
  }
  return null;
}

export function topKFrequent(items, k) {
  const counts = [...countValues(items)];
  counts.sort((a, b) => b[1] - a[1]);
  return counts.slice(0, k).map(([value]) => value);
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
