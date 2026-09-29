// ─────────────────────────────────────────────────────────────────────────
//  51 · histogram bucketing — SOLUTION                     ★★☆ core
//  run: node 51-histogram-buckets.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Math.floor(value / size) * size` snaps a value to the
//  start of its bucket, and `floor` rather than `trunc` is the whole reason
//  -2 lands in [-5, 0) instead of jumping to [0, 5) and inventing a bucket
//  boundary at zero. Counting is a tally into a Map keyed by bucket start;
//  the second half — walking `from` by `size` from the lowest occupied
//  bucket to the highest — is what makes the output DENSE. Build the array
//  straight from the tally instead and every empty bucket disappears, so
//  the bars slide together and the chart shows a distribution that does not
//  exist. Half-open intervals `[from, to)` keep each value in exactly one
//  bucket; use `<= to` anywhere and boundary values get counted twice.

import { test, eq } from '../../_lib/check.js';

const TEMPS = Object.freeze([12.5, 18, 9.5, 14, 21, 9.9, 27, -2]);

export function bucketOf(value, size) {
  return Math.floor(value / size) * size;
}

export function histogram(values, size) {
  if (values.length === 0) return [];

  const starts = values.map((value) => bucketOf(value, size));
  const counts = starts.reduce(
    (tally, start) => tally.set(start, (tally.get(start) ?? 0) + 1),
    new Map()
  );

  const lowest = Math.min(...starts);
  const highest = Math.max(...starts);
  const buckets = [];
  for (let from = lowest; from <= highest; from += size) {
    buckets.push({ from, to: from + size, count: counts.get(from) ?? 0 });
  }
  return buckets;
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
