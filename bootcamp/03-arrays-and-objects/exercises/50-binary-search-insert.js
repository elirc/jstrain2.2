// ─────────────────────────────────────────────────────────────────────────
//  50 · binary search for an insert position               ★★☆ core
//  concepts: sorted arrays · lower bound · O(log n)
//  run: node 50-binary-search-insert.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A reading log is already sorted by minute. Appending and re-sorting is
//  O(n log n) per insert; finding the slot by halving the range is
//  O(log n) — and the same search answers "where would this go?" for range
//  queries and merges.
//
//      lowerBound(READINGS, 30, r => r.minute)  → 2   (first key >= 30)
//      lowerBound(READINGS, 40, r => r.minute)  → 4   (lands in the gap)
//      insertSorted(READINGS, LATE, r => r.minute)    → new array
//
//  `lowerBound` returns the FIRST index of a run of equal keys, so it is
//  also "how many are strictly smaller". `insertSorted` puts a newcomer
//  AFTER the equal ones — same minute, later arrival.
//
//  hint: `low = 0`, `high = length` (one past the end), loop while
//  `low < high`, and never touch `sorted[high]`.

import { test, eq, ok, spy } from '../../_lib/check.js';

const READINGS = Object.freeze([
  Object.freeze({ id: 'r1', minute: 0,  tempC: 8 }),
  Object.freeze({ id: 'r2', minute: 15, tempC: 9 }),
  Object.freeze({ id: 'r3', minute: 30, tempC: 11 }),
  Object.freeze({ id: 'r4', minute: 30, tempC: 12 }),
  Object.freeze({ id: 'r5', minute: 45, tempC: 13 }),
]);

const minuteOf = (r) => r.minute;
const ids = (list) => list.map((r) => r.id);

export function lowerBound(sorted, target, keyOf) {
  throw new Error('TODO');
}

export function insertSorted(sorted, item, keyOf) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('lowerBound stops at the first key that is not smaller', () => {
  eq(lowerBound(READINGS, 30, minuteOf), 2);
  eq(lowerBound(READINGS, 15, minuteOf), 1);
});

test('a target between two entries lands in the gap', () => {
  eq(lowerBound(READINGS, 40, minuteOf), 4);
  eq(lowerBound(READINGS, 20, minuteOf), 2);
});

test('before everything is 0, after everything is the length', () => {
  eq(lowerBound(READINGS, -5, minuteOf), 0);
  eq(lowerBound(READINGS, 99, minuteOf), 5);
});

test('an empty log always inserts at 0', () => {
  eq(lowerBound([], 30, minuteOf), 0);
  eq(insertSorted([], READINGS[0], minuteOf), [READINGS[0]]);
});

test('insertSorted puts a newcomer after the equal ones', () => {
  const late = { id: 'rx', minute: 30, tempC: 99 };
  eq(ids(insertSorted(READINGS, late, minuteOf)), [
    'r1', 'r2', 'r3', 'r4', 'rx', 'r5',
  ]);
});

test('insertSorted drops a mid-range reading into its gap', () => {
  const gap = { id: 'ry', minute: 20, tempC: 10 };
  eq(ids(insertSorted(READINGS, gap, minuteOf)), [
    'r1', 'r2', 'ry', 'r3', 'r4', 'r5',
  ]);
});

test('insertSorted returns a new array and the frozen log survives', () => {
  const next = insertSorted(READINGS, { id: 'rz', minute: 5 }, minuteOf);
  ok(next !== READINGS);
  eq(next.length, 6);
  eq(ids(READINGS), ['r1', 'r2', 'r3', 'r4', 'r5']);
});

test('it halves the range instead of scanning it', () => {
  const big = Array.from({ length: 1000 }, (_, i) => ({ minute: i * 2 }));
  const probe = spy(minuteOf);
  eq(lowerBound(big, 777, probe), 389);
  ok(probe.callCount <= 12, `expected ~10 probes, made ${probe.callCount}`);
});
