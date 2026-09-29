// ─────────────────────────────────────────────────────────────────────────
//  08 · makeCounter                                        ★☆☆ warm-up
//  concepts: closures · captured variables
//  run: node 08-make-counter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A closure is a function plus the variables it was born next to. The
//  variables outlive the call that created them, so state can live in a
//  function instead of in an object.
//
//      const next = makeCounter();      next() → 1   next() → 2
//      const page = makeCounter(10);    page() → 11  page() → 12
//
//      const total = makeAccumulator();
//      total(5) → 5      total(3) → 8      total(-8) → 0
//
//  Each counter must own its state — two counters never share a number.

import { test, eq, ok } from '../../_lib/check.js';

export function makeCounter(start = 0) {
  throw new Error('TODO');
}

export function makeAccumulator() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('counts up from zero by default', () => {
  const next = makeCounter();
  eq(next(), 1);
  eq(next(), 2);
  eq(next(), 3);
});

test('starts counting after the given value', () => {
  const page = makeCounter(10);
  eq(page(), 11);
  eq(page(), 12);
});

test('two counters do not share their state', () => {
  const a = makeCounter();
  const b = makeCounter(100);
  eq(a(), 1);
  eq(b(), 101);
  eq(a(), 2);
  eq(b(), 102);
});

test('the counter is a function, not an object', () => {
  const next = makeCounter();
  ok(typeof next === 'function');
  next();
  next();
  eq(next(), 3);
});

test('the accumulator keeps a running total', () => {
  const total = makeAccumulator();
  eq(total(5), 5);
  eq(total(3), 8);
  eq(total(-8), 0);
});

test('two accumulators keep separate totals', () => {
  const a = makeAccumulator();
  const b = makeAccumulator();
  eq(a(2), 2);
  eq(b(10), 10);
  eq(a(2), 4);
});
