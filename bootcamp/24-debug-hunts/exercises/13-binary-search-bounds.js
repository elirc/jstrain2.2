// ─────────────────────────────────────────────────────────────────────────
//  13 · sorted-array bounds                                  ★★★ stretch
//  concepts: bug hunt · binary search · half-open intervals
//  run: node 13-binary-search-bounds.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The two bounds every sorted-array utility is built from. `lowerBound`
//  returns the first index whose value is >= target; `upperBound` the
//  first index whose value is > target. Both return an index in the
//  range 0…length, where `length` itself is a legal answer meaning
//  "past the last element". Everything else here is derived from them.
//
//      lowerBound([1, 3, 5, 7], 4)       → 2   (where a 4 would go)
//      lowerBound([1, 2, 2, 2, 5], 2)    → 1   (the first copy)
//      upperBound([1, 2, 2, 2, 5], 2)    → 4   (one past the last copy)
//      countInRange([1, 3, 5, 7], 5, 7)  → 2
//      insertInOrder([1, 3, 5, 7], 9)    → [1, 3, 5, 7, 9]
//
//  The code below is fully written — and wrong. 3 tests fail. Find the
//  bug, fix it with the smallest change. Don't rewrite.
//
//  hint: don't re-derive the algorithm in your head — instrument it.
//  Print lo/hi/mid on every iteration for one failing input and one
//  passing input, then diff the two traces. The question that cracks it:
//  what values is this function even CAPABLE of returning?

import { test, eq } from '../../_lib/check.js';

function bisect(sorted, target, includeEqual) {
  let lo = 0;
  let hi = sorted.length - 1;
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
