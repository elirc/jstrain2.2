// ─────────────────────────────────────────────────────────────────────────
//  04 · factory functions — SOLUTION                       ★☆☆ warm-up
//  run: node 04-factory-functions.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `count` is a local variable, and the three returned
//  methods close over it. Nothing outside the factory can name that
//  variable, so the state is genuinely private — stronger than `_count`,
//  and it predates #private fields by two decades.
//
//  `reset` closes over `start` too, which is why it returns to 10 and not
//  to 0. The classic wrong turn is `count = 0`.
//
//  The price is in the last test: closures cannot be shared, so every
//  counter allocates three new function objects. Prototypes (exercise 05)
//  trade that memory back — at the cost of losing closure privacy.

import { test, eq, ok } from '../../_lib/check.js';

export function createCounter(start = 0) {
  let count = start;

  return {
    inc(by = 1) {
      count += by;
      return count;
    },

    count() {
      return count;
    },

    reset() {
      count = start;
      return count;
    },
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('starts at zero by default', () => {
  eq(createCounter().count(), 0);
});

test('starts at the number it was given', () => {
  eq(createCounter(10).count(), 10);
});

test('inc adds one, or the step you pass', () => {
  const c = createCounter();
  eq(c.inc(), 1);
  eq(c.inc(5), 6);
  eq(c.count(), 6);
});

test('reset goes back to the starting value, not to zero', () => {
  const c = createCounter(10);
  c.inc(5);
  eq(c.reset(), 10);
  eq(c.count(), 10);
});

test('two counters never share state', () => {
  const a = createCounter();
  const b = createCounter();
  a.inc();
  a.inc();
  eq(a.count(), 2);
  eq(b.count(), 0);
});

test('the number itself is not reachable from outside', () => {
  const c = createCounter(7);
  ok(
    Object.values(c).every((v) => typeof v === 'function'),
    'only methods should be exposed'
  );
});

test('but every counter pays for its own copy of every method', () => {
  const a = createCounter();
  const b = createCounter();
  ok(a.inc !== b.inc, 'closures cannot be shared between objects');
});
