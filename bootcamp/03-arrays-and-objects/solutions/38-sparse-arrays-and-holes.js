// ─────────────────────────────────────────────────────────────────────────
//  38 · sparse arrays and holes — SOLUTION                 ★☆☆ warm-up
//  run: node 38-sparse-arrays-and-holes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a hole is the absence of a property, so `Object.keys` — an
//  own-property list — is the exact tool for both counting and locating
//  them, and `i in week` is the per-index version. The rule to remember is
//  that the iteration methods (`map`, `forEach`, `filter`, `reduce`, `some`,
//  `every`) skip holes, while the newer and the index-based ones do not:
//  `Array.from`, spread, `join`, `at`, `fill` and a plain `for` loop all see
//  `undefined` there instead. That split is why `new Array(3).map(() => 0)`
//  returns three holes and does nothing at all, while
//  `Array.from({ length: 3 }, () => 0)` — an array-LIKE, which has no holes
//  by definition — gives you the three zeros you wanted.

import { test, eq, ok } from '../../_lib/check.js';

const WEEK = [];
WEEK[0] = 45;
WEEK[2] = 60;
WEEK[6] = 30;
Object.freeze(WEEK);

export function recordedDays(week) {
  return Object.keys(week).length;
}

export function visitedDays(week) {
  return Object.keys(week).map(Number);
}

export function denseCopy(week, filler) {
  return Array.from({ length: week.length }, (_, i) =>
    i in week ? week[i] : filler
  );
}

export function blankWeek(days, minutes) {
  return Array.from({ length: days }, () => minutes);
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
