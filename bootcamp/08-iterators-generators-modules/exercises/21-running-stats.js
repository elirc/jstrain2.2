// ─────────────────────────────────────────────────────────────────────────
//  21 · runningTotal · runningAverage                       ★☆☆ warm-up
//  concepts: generators that carry an accumulator
//  run: node 21-running-stats.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A dashboard does not want the final total, it wants the total SO
//  FAR after every reading — one output value per input value. Two
//  generators, one local variable each.
//
//      [...runningTotal([1, 2, 3])]     → [1, 3, 6]
//      [...runningAverage([1, 2, 3])]   → [1, 1.5, 2]
//      [...runningTotal([])]            → []
//
//  Take any iterable, not just arrays, and stay lazy so an endless
//  source still works.

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
  throw new Error('TODO');
}

export function* runningAverage(numbers) {
  throw new Error('TODO');
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
