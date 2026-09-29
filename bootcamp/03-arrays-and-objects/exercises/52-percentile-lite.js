// ─────────────────────────────────────────────────────────────────────────
//  52 · median and percentiles                             ★★☆ core
//  concepts: sorting a copy · even vs odd · nearest rank
//  run: node 52-percentile-lite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Averages hide the tail; percentiles are what people actually mean when
//  they say "typical" and "worst case". Both start by sorting a COPY —
//  numerically, or `[15, 300, 40]` sorts to `[15, 300, 40]`.
//
//      median(AMOUNTS)          → 82.5   // mean of the two middles
//      percentile(AMOUNTS, 90)  → 300
//      percentile(AMOUNTS, 25)  → 40
//
//  Use the nearest-rank rule: `index = ceil(p / 100 × n) - 1`, clamped
//  into the array. It never invents a value that was not measured — which
//  is why `percentile(evenList, 50)` and `median(evenList)` can differ.
//
//  hint: `toSorted((a, b) => a - b)`, then it is index arithmetic. Nothing
//  to measure means `null`, not 0 and not NaN.

import { test, eq, approx } from '../../_lib/check.js';

const AMOUNTS = Object.freeze([120, 40, 90, 15, 300, 75, 210, 60]);

export function median(values) {
  throw new Error('TODO');
}

export function percentile(values, p) {
  throw new Error('TODO');
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
