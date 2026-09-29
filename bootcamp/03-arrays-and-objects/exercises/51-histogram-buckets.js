// ─────────────────────────────────────────────────────────────────────────
//  51 · histogram bucketing                                ★★☆ core
//  concepts: floor arithmetic · dense ranges · negative numbers
//  run: node 51-histogram-buckets.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Before you can draw a distribution you have to bucket it. The maths is
//  one `Math.floor`; the part that goes wrong is the RANGE — a chart with
//  the empty buckets missing is not a histogram, it is a lie with bars.
//
//      bucketOf(12.5, 5)     → 10        // the bucket [10, 15)
//      bucketOf(-2, 5)       → -5        // floor goes down, not toward 0
//      histogram(TEMPS, 5)
//        → [ { from: -5, to: 0, count: 1 }, { from: 0, to: 5, count: 0 }, … ]
//
//  Buckets run from the lowest occupied one to the highest, with nothing
//  skipped in between, and each covers `[from, to)` — a value exactly on
//  the boundary starts the next bucket.
//
//  hint: `Math.floor(value / size) * size`. `Math.trunc` looks equivalent
//  and quietly puts -2 in the [0, 5) bucket.

import { test, eq } from '../../_lib/check.js';

const TEMPS = Object.freeze([12.5, 18, 9.5, 14, 21, 9.9, 27, -2]);

export function bucketOf(value, size) {
  throw new Error('TODO');
}

export function histogram(values, size) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('bucketOf floors to the start of the bucket', () => {
  eq(bucketOf(12.5, 5), 10);
  eq(bucketOf(9.9, 5), 5);
  eq(bucketOf(27, 5), 25);
});

test('bucketOf floors negatives downward, not toward zero', () => {
  eq(bucketOf(-2, 5), -5);
  eq(bucketOf(-5, 5), -5);
});

test('a value on a boundary starts the next bucket', () => {
  eq(bucketOf(10, 5), 10);
  eq(bucketOf(9.999, 5), 5);
});

test('the buckets span lowest to highest with no gaps', () => {
  eq(histogram(TEMPS, 5).map((b) => b.from), [-5, 0, 5, 10, 15, 20, 25]);
  eq(histogram(TEMPS, 5).map((b) => b.to), [0, 5, 10, 15, 20, 25, 30]);
});

test('empty buckets are present, with a count of 0', () => {
  eq(histogram(TEMPS, 5)[1], { from: 0, to: 5, count: 0 });
});

test('the counts add up to the number of values', () => {
  const total = histogram(TEMPS, 5).reduce((n, b) => n + b.count, 0);
  eq(total, TEMPS.length);
  eq(histogram(TEMPS, 5)[2].count, 2);
});

test('one value makes exactly one bucket', () => {
  eq(histogram([7], 5), [{ from: 5, to: 10, count: 1 }]);
});

test('no values make no buckets, and the input is untouched', () => {
  eq(histogram([], 5), []);
  eq(TEMPS[0], 12.5);
});
