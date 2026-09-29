// ─────────────────────────────────────────────────────────────────────────
//  52 · median and percentiles — SOLUTION                  ★★☆ core
//  run: node 52-percentile-lite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three separate traps, only one of them arithmetic. First,
//  `sort()` with no comparator sorts as strings, so 100 comes before 9 —
//  and `toSorted` copies, which matters because a metrics array usually
//  belongs to someone else. Second, the even/odd split: an odd list has a
//  real middle, an even one has to average two, and `length >> 1` gives you
//  the upper of the pair. Third, the definition itself. Nearest rank always
//  returns a value that was actually measured, so it cannot invent a
//  response time nobody saw; the linear-interpolation definition (what
//  Excel's PERCENTILE and most dashboards use) blends the two neighbours
//  instead, which is why your p50 and your median disagree on an even list
//  and why two "p95" numbers from two tools rarely match. Say which one you
//  are using before anyone asks.

import { test, eq, approx } from '../../_lib/check.js';

const AMOUNTS = Object.freeze([120, 40, 90, 15, 300, 75, 210, 60]);

export function median(values) {
  if (values.length === 0) return null;
  const sorted = values.toSorted((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = values.toSorted((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  const index = Math.min(Math.max(rank - 1, 0), sorted.length - 1);
  return sorted[index];
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the median of an even list is the mean of the two middles', () => {
  approx(median(AMOUNTS), 82.5);
});

test('the median of an odd list is the middle value', () => {
  eq(median([120, 40, 90, 15, 300]), 90);
});

test('sorting is numeric, and it happens on a copy', () => {
  eq(median([10, 9, 100]), 10);
  median(AMOUNTS);
  eq(AMOUNTS[0], 120);
});

test('percentile picks the nearest measured rank', () => {
  eq(percentile(AMOUNTS, 90), 300);
  eq(percentile(AMOUNTS, 25), 40);
});

test('p50 is not the same thing as the median on an even list', () => {
  eq(percentile(AMOUNTS, 50), 75);
  approx(median(AMOUNTS), 82.5);
});

test('p0 is the minimum and p100 is the maximum', () => {
  eq(percentile(AMOUNTS, 0), 15);
  eq(percentile(AMOUNTS, 100), 300);
});

test('one value is its own median and every percentile', () => {
  eq(median([7]), 7);
  eq(percentile([7], 33), 7);
  eq(percentile([7], 100), 7);
});

test('nothing to measure is null, not zero', () => {
  eq(median([]), null);
  eq(percentile([], 90), null);
});
