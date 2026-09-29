// ─────────────────────────────────────────────────────────────────────────
//  13 · sorted-array bounds — SOLUTION                       ★★★ stretch
//  run: node 13-binary-search-bounds.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: bug class — off-by-one in the bounds. `hi` was seeded
//  with `sorted.length - 1`, an INCLUSIVE last index, inside a loop
//  written for a HALF-OPEN interval [lo, hi). The two conventions were
//  mixed, and the answer `length` — "past the last element" — dropped
//  out of the reachable range. `lo` can now never exceed `length - 1`.
//
//  The tell: the whole search space never contains the last slot, and
//  every failing case is an answer that should have been `length`. The
//  diagnostic that gets you there without re-deriving anything: ask what
//  the function is capable of returning. `lo` starts at 0 and stops at
//  `hi`, so the output range is 0…length-1 — one short.
//
//  The minimal fix: `let hi = sorted.length;`. One character class of
//  change, three tests. Note it does not break the empty array: `lo < hi`
//  is `0 < 0`, the loop never runs, and 0 is the right answer.
//
//  The classic wild variant: the same mix-up with `while (lo <= hi)` and
//  `hi = mid`, which does not shrink the interval when `lo === hi` and
//  spins forever. Wrong answers you find in review; infinite loops you
//  find at 3am. When you write a binary search, pick the convention
//  first — half-open `[lo, hi)` with `hi = length` — and never mix.

import { test, eq } from '../../_lib/check.js';

function bisect(sorted, target, includeEqual) {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const value = sorted[mid];
    const goRight = includeEqual ? value <= target : value < target;
    if (goRight) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function lowerBound(sorted, target) {
  return bisect(sorted, target, false);
}

export function upperBound(sorted, target) {
  return bisect(sorted, target, true);
}

export function contains(sorted, target) {
  const at = lowerBound(sorted, target);
  return at < sorted.length && sorted[at] === target;
}

export function countInRange(sorted, low, high) {
  return upperBound(sorted, high) - lowerBound(sorted, low);
}

export function insertInOrder(sorted, value) {
  const at = upperBound(sorted, value);
  const out = sorted.slice();
  out.splice(at, 0, value);
  return out;
}

const NUMBERS = [1, 3, 5, 7];
const REPEATS = [1, 2, 2, 2, 5];

// ──────────────────────────── tests ──────────────────────────────────────

test('lowerBound stops at the first copy of a repeated value', () => {
  eq(lowerBound(REPEATS, 2), 1);
  eq(lowerBound(REPEATS, 1), 0);
  eq(lowerBound(NUMBERS, 3), 1);
});

test('a value that is missing gives the index it would go in', () => {
  eq(lowerBound(NUMBERS, 4), 2);
  eq(lowerBound(NUMBERS, 0), 0);
  eq(lowerBound(NUMBERS, 6), 3);
  eq(lowerBound([], 5), 0);
  eq(upperBound([], 5), 0);
});

test('upperBound stops one past the last copy', () => {
  eq(upperBound(REPEATS, 2), 4);
  eq(upperBound(NUMBERS, 1), 1);
  eq(upperBound(NUMBERS, 4), 2);
});

test('contains says yes only when the value is really there', () => {
  eq(contains(NUMBERS, 5), true);
  eq(contains(NUMBERS, 7), true);
  eq(contains(NUMBERS, 4), false);
  eq(contains(NUMBERS, 9), false);
  eq(contains([], 1), false);
});

test('a value bigger than everything lands past the end', () => {
  eq(lowerBound(NUMBERS, 9), 4);
  eq(upperBound(NUMBERS, 7), 4);
  eq(upperBound(REPEATS, 5), 5);
});

test('countInRange counts an inclusive window', () => {
  eq(countInRange(NUMBERS, 3, 5), 2);
  eq(countInRange(NUMBERS, 0, 2), 1);
  eq(countInRange(REPEATS, 2, 2), 3);
});

test('countInRange still counts a window that reaches the last value', () => {
  eq(countInRange(NUMBERS, 5, 7), 2);
  eq(countInRange(NUMBERS, 1, 7), 4);
  eq(countInRange(REPEATS, 2, 5), 4);
});

test('insertInOrder drops the value into the right slot', () => {
  eq(insertInOrder(NUMBERS, 4), [1, 3, 4, 5, 7]);
  eq(insertInOrder(NUMBERS, 0), [0, 1, 3, 5, 7]);
  eq(insertInOrder(REPEATS, 2), [1, 2, 2, 2, 2, 5]);
  eq(insertInOrder(NUMBERS, 9), [1, 3, 5, 7, 9]);
  eq(NUMBERS, [1, 3, 5, 7]);
});
