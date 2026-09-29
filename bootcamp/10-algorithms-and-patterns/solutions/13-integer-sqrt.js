// ─────────────────────────────────────────────────────────────────────────
//  13 · integerSqrt — SOLUTION                              ★★☆ core
//  concepts: pattern: binary search on the ANSWER space · monotonicity
//  run: node 13-integer-sqrt.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: binary search where the "array" is the range of
//  possible answers. Nothing is sorted in memory; what makes it work is
//  MONOTONICITY: if mid*mid <= n then every smaller candidate also fits,
//  and if mid*mid > n then every bigger one also overshoots. The predicate
//  flips exactly once, so you can halve the range around the flip.
//  Search 0..n, keep the last candidate that fit, and return it.
//  Time O(log n), space O(1). The naive loop counts 1, 2, 3, ... until it
//  overshoots: O(sqrt(n)) — for n = 10^18 that is a billion steps versus
//  60. Learn to spot this shape: "smallest/largest x such that f(x) is
//  true" is a binary search even when there is no array in sight.
//  Bite: `low = 0, high = n` and comparing `mid * mid <= n` is exact for
//  integers here; do NOT reach for floats.

import { test, eq } from '../../_lib/check.js';

export function integerSqrt(n) {
  if (n < 2) return n;
  let low = 1;
  let high = n;
  let best = 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (mid * mid <= n) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return best;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the exact root of a perfect square', () => {
  eq(integerSqrt(16), 4);
  eq(integerSqrt(144), 12);
});

test('floors a non-perfect square', () => {
  eq(integerSqrt(8), 2);
  eq(integerSqrt(26), 5);
});

test('handles 0 and 1', () => {
  eq(integerSqrt(0), 0);
  eq(integerSqrt(1), 1);
});

test('handles the smallest non-trivial inputs', () => {
  eq(integerSqrt(2), 1);
  eq(integerSqrt(3), 1);
});

test('is right on either side of a perfect square', () => {
  eq(integerSqrt(999999), 999);
  eq(integerSqrt(1000000), 1000);
});

test('stays fast on a large number', () => {
  eq(integerSqrt(123456789), 11111);
});
