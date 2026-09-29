// ─────────────────────────────────────────────────────────────────────────
//  21 · runningTotal · runningAverage — SOLUTION            ★☆☆ warm-up
//  run: node 21-running-stats.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the accumulator is an ordinary `let` in the generator
//  body. It survives between pulls because the whole stack frame does —
//  that is the only thing a generator really gives you over a callback,
//  and it is enough to write a running statistic as a plain loop.
//
//  runningAverage needs a second piece of state, the count, and it must
//  divide AFTER the increment so the first value averages to itself
//  rather than to Infinity. Note the empty-source case falls out for
//  free: the loop body never runs, so no division happens at all.

import { test, eq } from '../../_lib/check.js';

// scaffolding: helpers from earlier exercises. Do not edit.
function* take(n, iterable) {
  if (n <= 0) return;
  let taken = 0;
  for (const value of iterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
}

function* naturals() {
  let n = 1;
  while (true) {
    yield n;
    n += 1;
  }
}

export function* runningTotal(numbers) {
  let total = 0;
  for (const n of numbers) {
    total += n;
    yield total;
  }
}

export function* runningAverage(numbers) {
  let total = 0;
  let count = 0;
  for (const n of numbers) {
    total += n;
    count += 1;
    yield total / count;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('runningTotal yields the total after each value', () => {
  eq([...runningTotal([1, 2, 3])], [1, 3, 6]);
});

test('runningTotal copes with negatives and zeros', () => {
  eq([...runningTotal([5, -5, 0])], [5, 0, 0]);
});

test('runningAverage yields the mean of what it has seen', () => {
  eq([...runningAverage([1, 2, 3])], [1, 1.5, 2]);
  eq([...runningAverage([4])], [4]);
});

test('an empty source yields nothing — and never divides by zero', () => {
  eq([...runningTotal([])], []);
  eq([...runningAverage([])], []);
});

test('they read any iterable, not just arrays', () => {
  eq([...runningTotal(new Set([2, 4]))], [2, 6]);
  eq([...runningAverage(new Set([2, 4]))], [2, 3]);
});

test('they stay lazy over an endless source', () => {
  eq([...take(4, runningTotal(naturals()))], [1, 3, 6, 10]);
  eq([...take(3, runningAverage(naturals()))], [1, 1.5, 2]);
});
