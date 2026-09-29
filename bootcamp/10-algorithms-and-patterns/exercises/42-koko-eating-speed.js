// ─────────────────────────────────────────────────────────────────────────
//  42 · minEatingSpeed                                      ★★★ stretch
//  concepts: pattern: binary search on the ANSWER · feasibility predicate
//  run: node 42-koko-eating-speed.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A monkey eats one pile per hour at a fixed speed of k bananas/hour. If
//  a pile has fewer than k bananas left she still spends the whole hour on
//  it and starts the next pile in the next hour. Given the piles and the
//  hours available, return the SMALLEST integer speed that finishes in
//  time. There are always at least as many hours as piles.
//
//      minEatingSpeed([3, 6, 7, 11], 8)          → 4
//      minEatingSpeed([30, 11, 23, 4, 20], 5)    → 30
//      minEatingSpeed([30, 11, 23, 4, 20], 6)    → 23
//
//  Nothing here is sorted, but the answer space is: if speed k finishes in
//  time, so does every speed above it. Search that.
//
//  hint: hours at speed k = sum of Math.ceil(pile / k); the range worth
//        searching is 1 .. the biggest pile

import { test, eq } from '../../_lib/check.js';

export function minEatingSpeed(piles, hours) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('finds the smallest workable speed', () => {
  eq(minEatingSpeed([3, 6, 7, 11], 8), 4);
});

test('with one hour per pile the speed is the biggest pile', () => {
  eq(minEatingSpeed([30, 11, 23, 4, 20], 5), 30);
  eq(minEatingSpeed([3, 6, 7, 11], 4), 11);
});

test('one spare hour lowers the speed', () => {
  eq(minEatingSpeed([30, 11, 23, 4, 20], 6), 23);
});

test('plenty of time means the slowest possible speed', () => {
  eq(minEatingSpeed([5], 10), 1);
  eq(minEatingSpeed([1, 1, 1], 3), 1);
});

test('a single pile in a single hour must be eaten whole', () => {
  eq(minEatingSpeed([100], 1), 100);
});

test('does not slow down below the leftover-hour boundary', () => {
  eq(minEatingSpeed([4, 4], 3), 4);
});

test('stays fast on huge piles', () => {
  eq(minEatingSpeed([1000000000], 2), 500000000);
});
