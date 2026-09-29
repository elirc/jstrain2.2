// ─────────────────────────────────────────────────────────────────────────
//  38 · sparse arrays and holes                            ★☆☆ warm-up
//  concepts: holes vs undefined · which methods skip them
//  run: node 38-sparse-arrays-and-holes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A gym log written straight into a week-shaped array leaves gaps on the
//  days you did not train. Those gaps are HOLES, not `undefined` values,
//  and `map`, `forEach`, `filter` and `reduce` all walk straight past them
//  while `length` still counts them.
//
//      WEEK          → [45, <hole>, 60, <4 holes>, 30]   length 7
//      recordedDays(WEEK)    → 3
//      visitedDays(WEEK)     → [0, 2, 6]
//      denseCopy(WEEK, 0)    → [45, 0, 60, 0, 0, 0, 30]
//      blankWeek(3, 0)       → [0, 0, 0]   with no holes
//
//  hint: `i in array` is the only honest test for "is there a value here".
//  `Object.keys` of an array lists exactly the indexes that exist.

import { test, eq, ok } from '../../_lib/check.js';

const WEEK = [];
WEEK[0] = 45;
WEEK[2] = 60;
WEEK[6] = 30;
Object.freeze(WEEK);

export function recordedDays(week) {
  throw new Error('TODO');
}

export function visitedDays(week) {
  throw new Error('TODO');
}

export function denseCopy(week, filler) {
  throw new Error('TODO');
}

export function blankWeek(days, minutes) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('recordedDays counts entries, length counts slots', () => {
  eq(recordedDays(WEEK), 3);
  eq(WEEK.length, 7);
});

test('a hole reads as undefined but is not a value', () => {
  eq(visitedDays(WEEK).includes(1), false);
  ok(WEEK[1] === undefined);
  ok(!(1 in WEEK));
});

test('forEach never visits a hole', () => {
  let visited = 0;
  WEEK.forEach(() => {
    visited += 1;
  });
  eq(recordedDays(WEEK), visited);
});

test('visitedDays lists the indexes that really exist', () => {
  eq(visitedDays(WEEK), [0, 2, 6]);
});

test('denseCopy fills every hole', () => {
  eq(denseCopy(WEEK, 0), [45, 0, 60, 0, 0, 0, 30]);
});

test('denseCopy of an already-dense array is a plain copy', () => {
  const dense = [1, 2, 3];
  eq(denseCopy(dense, 0), [1, 2, 3]);
  ok(denseCopy(dense, 0) !== dense);
});

test('denseCopy leaves the original sparse', () => {
  denseCopy(WEEK, 0);
  ok(!(3 in WEEK));
});

test('blankWeek builds a hole-free array, unlike new Array(n)', () => {
  const fresh = blankWeek(3, 0);
  eq(fresh, [0, 0, 0]);
  ok(0 in fresh);
  ok(!(0 in new Array(3)));
});
