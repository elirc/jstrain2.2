// ─────────────────────────────────────────────────────────────────────────
//  01 · pairWithTargetSum                                   ★★☆ core
//  concepts: pattern: two pointers · sorted input · O(1) space
//  run: node 01-pair-with-target-sum.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Given an array sorted ascending and a target, find two DIFFERENT slots
//  whose values add up to the target. Return their indices as
//  [smaller, larger], or null if no such pair exists.
//
//      pairWithTargetSum([1, 2, 4, 6, 8, 9], 14)  → [3, 4]   (6 + 8)
//      pairWithTargetSum([1, 2, 3], 6)            → null
//      pairWithTargetSum([], 7)                   → null
//
//  The array being sorted is the whole point: if a sum is too small you
//  need a bigger number, if it is too big you need a smaller one. One
//  pass, no nested loop, no extra Map.
//
//  hint: put one index at each end and walk them toward each other

import { test, eq } from '../../_lib/check.js';

export function pairWithTargetSum(sorted, target) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds a pair sitting in the middle of the array', () => {
  eq(pairWithTargetSum([1, 2, 4, 6, 8, 9], 14), [3, 4]);
});

test('finds a pair made of the two ends', () => {
  eq(pairWithTargetSum([2, 3], 5), [0, 1]);
});

test('works with negative numbers', () => {
  eq(pairWithTargetSum([-5, -2, 0, 3, 7], 1), [1, 3]);
});

test('returns null when no pair reaches the target', () => {
  eq(pairWithTargetSum([1, 2, 3, 4], 100), null);
});

test('never uses the same element twice', () => {
  eq(pairWithTargetSum([1, 2, 3], 6), null);
});

test('handles duplicate values', () => {
  eq(pairWithTargetSum([3, 3], 6), [0, 1]);
});

test('handles empty and single-element arrays', () => {
  eq(pairWithTargetSum([], 7), null);
  eq(pairWithTargetSum([4], 8), null);
});
