// ─────────────────────────────────────────────────────────────────────────
//  05 · mergeSorted — SOLUTION                              ★☆☆ warm-up
//  concepts: pattern: two pointers (parallel scan) · the merge step
//  run: node 05-merge-sorted.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: two pointers, one per array, both moving
//  forward. At every step the smallest unused value is at one of the two
//  cursors, so compare the heads, take the smaller, advance that cursor.
//  When one array runs out, the other's remainder is already sorted, so
//  append it wholesale.
//  Time O(n + m), space O(n + m) for the output (unavoidable — you are
//  building a new array). The naive `[...a, ...b].sort((x, y) => x - y)`
//  throws away the fact that both halves are already sorted and costs
//  O((n+m) log(n+m)).
//  Note `<=` on the comparison: taking from `a` on ties is what makes the
//  merge STABLE, and stability is why merge sort is stable.

import { test, eq } from '../../_lib/check.js';

export function mergeSorted(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) {
      out.push(a[i]);
      i += 1;
    } else {
      out.push(b[j]);
      j += 1;
    }
  }
  while (i < a.length) {
    out.push(a[i]);
    i += 1;
  }
  while (j < b.length) {
    out.push(b[j]);
    j += 1;
  }
  return out;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('interleaves two arrays of the same length', () => {
  eq(mergeSorted([1, 3, 5], [2, 4, 6]), [1, 2, 3, 4, 5, 6]);
});

test('drains whichever array still has values left', () => {
  eq(mergeSorted([1, 2, 3], [10]), [1, 2, 3, 10]);
  eq(mergeSorted([10], [1, 2, 3]), [1, 2, 3, 10]);
});

test('handles one empty array on either side', () => {
  eq(mergeSorted([], [1, 2]), [1, 2]);
  eq(mergeSorted([1, 2], []), [1, 2]);
});

test('handles two empty arrays', () => {
  eq(mergeSorted([], []), []);
});

test('keeps duplicates from both sides', () => {
  eq(mergeSorted([1, 1, 2], [1, 3]), [1, 1, 1, 2, 3]);
});

test('works with negative numbers', () => {
  eq(mergeSorted([-3, -1], [-2, 0]), [-3, -2, -1, 0]);
});

test('does not modify the inputs', () => {
  const a = [1, 2];
  const b = [3];
  mergeSorted(a, b);
  eq(a, [1, 2]);
  eq(b, [3]);
});
