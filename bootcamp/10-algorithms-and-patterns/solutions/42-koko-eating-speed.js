// ─────────────────────────────────────────────────────────────────────────
//  42 · minEatingSpeed — SOLUTION                           ★★★ stretch
//  concepts: pattern: binary search on the ANSWER · feasibility predicate
//  run: node 42-koko-eating-speed.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: binary search on the answer space (exercise 13,
//  one level up: the predicate now costs a full pass over the data).
//  Smell: "the SMALLEST rate / capacity / size that still gets the job
//  done" — nothing is sorted, but feasibility is monotone. Write the
//  predicate first: `hoursNeeded(k) <= hours`. If speed k works, every
//  faster speed works too, so the predicate flips exactly once and you can
//  halve the range around the flip.
//  Bounds: 1 (slowest imaginable) to max(piles) — going faster than the
//  biggest pile buys nothing, because you cannot start a second pile in
//  the same hour. That cap is the whole reason the search is cheap.
//  Time O(n log(max pile)) — 30 predicate passes for a billion-banana
//  pile. The naive version tries k = 1, 2, 3, ... until one fits:
//  O(n · max pile), a billion passes on the same input.
//  Bites: Math.ceil, not Math.round — a leftover banana still costs a full
//  hour. And keep the last speed that WORKED in `best`; returning `low`
//  works too but only if you get the ± 1 exactly right.

import { test, eq } from '../../_lib/check.js';

export function minEatingSpeed(piles, hours) {
  const hoursNeeded = (speed) =>
    piles.reduce((total, pile) => total + Math.ceil(pile / speed), 0);

  let low = 1;
  let high = Math.max(...piles);
  let best = high;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (hoursNeeded(mid) <= hours) {
      best = mid; // fast enough — try slower
      high = mid - 1;
    } else {
      low = mid + 1; // too slow
    }
  }
  return best;
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
