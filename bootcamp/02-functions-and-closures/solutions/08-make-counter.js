// ─────────────────────────────────────────────────────────────────────────
//  08 · makeCounter — SOLUTION                             ★☆☆ warm-up
//  run: node 08-make-counter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `count` is an ordinary local variable, but because the
//  returned function still references it, it is not thrown away when
//  makeCounter returns. Every CALL to makeCounter creates a new binding,
//  which is why two counters never collide. Move `let count` outside the
//  factory and all counters would suddenly share one number — that is the
//  classic wrong turn.

import { test, eq, ok } from '../../_lib/check.js';

export function makeCounter(start = 0) {
  let count = start;
  return () => {
    count += 1;
    return count;
  };
}

export function makeAccumulator() {
  let total = 0;
  return (amount) => {
    total += amount;
    return total;
  };
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
