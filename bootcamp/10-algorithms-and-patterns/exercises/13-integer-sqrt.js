// ─────────────────────────────────────────────────────────────────────────
//  13 · integerSqrt                                         ★★☆ core
//  concepts: pattern: binary search on the ANSWER space · monotonicity
//  run: node 13-integer-sqrt.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Given a whole number n >= 0, return floor(sqrt(n)) — the largest whole
//  number whose square is <= n. No Math.sqrt, no `** 0.5`.
//
//      integerSqrt(16)  → 4
//      integerSqrt(8)   → 2     (2*2 = 4 <= 8 < 9 = 3*3)
//      integerSqrt(1)   → 1
//      integerSqrt(0)   → 0
//
//  There is no array here — you are searching the range of possible
//  ANSWERS, 0..n. That range is sorted by definition, and "is this
//  candidate too big?" is a yes/no question that flips exactly once.
//
//  hint: binary search over candidate answers, keeping the biggest one
//  whose square still fits

import { test, eq } from '../../_lib/check.js';

export function integerSqrt(n) {
  throw new Error('TODO');
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
