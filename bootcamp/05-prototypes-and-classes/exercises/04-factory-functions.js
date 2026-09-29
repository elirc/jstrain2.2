// ─────────────────────────────────────────────────────────────────────────
//  04 · factory functions                                  ★☆☆ warm-up
//  concepts: factories · closures · private state
//  run: node 04-factory-functions.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A factory is just a function that returns an object. No `new`, no
//  prototypes — and the state can hide in the closure.
//
//  Build createCounter(start) returning an object with three methods and
//  NO exposed number:
//
//      const c = createCounter();
//      c.inc()        → 1        (inc(by = 1) returns the new value)
//      c.inc(5)       → 6
//      c.count()      → 6
//      c.reset()      → 0        (back to the value it STARTED with)
//      createCounter(10).count()  → 10
//
//  Exercise 05 builds the same counter with `new` — keep this one around
//  to compare.

import { test, eq, ok } from '../../_lib/check.js';

export function createCounter(start = 0) {
  throw new Error('TODO');
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
