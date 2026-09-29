// ─────────────────────────────────────────────────────────────────────────
//  05 · constructor functions                              ★☆☆ warm-up
//  concepts: new · Ctor.prototype · instanceof
//  run: node 05-constructor-functions.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Same counter as exercise 04, built the other way. A constructor is an
//  ordinary function you call with `new`; the shared methods hang off its
//  `.prototype` object.
//
//      const c = new Counter(10);
//      c.count             → 10     (a plain property this time)
//      c.inc()             → 11
//      c.reset()           → 10
//      c instanceof Counter          → true
//      new Counter().inc === new Counter().inc   → true   (ONE function)
//
//  Write the body of Counter (set `this.start` and `this.count`), then
//  attach `inc(by = 1)` and `reset()` to Counter.prototype below.

import { test, eq, ok } from '../../_lib/check.js';

export function Counter(start = 0) {
  throw new Error('TODO');
}

// TODO: Counter.prototype.inc = function (by = 1) { ... };
// TODO: Counter.prototype.reset = function () { ... };

// ──────────────────────────── tests ──────────────────────────────────────

test('new Counter() starts at zero', () => {
  const c = new Counter();
  eq(c.count, 0);
});

test('new Counter(7) starts at seven', () => {
  const c = new Counter(7);
  eq(c.count, 7);
});

test('inc bumps the count and returns it', () => {
  const c = new Counter();
  eq(c.inc(), 1);
  eq(c.inc(5), 6);
  eq(c.count, 6);
});

test('reset goes back to the starting value', () => {
  const c = new Counter(10);
  c.inc(3);
  eq(c.reset(), 10);
});

test('the methods are not on the instance — they are inherited', () => {
  const c = new Counter();
  eq(Object.hasOwn(c, 'inc'), false);
  eq(Object.keys(c).sort(), ['count', 'start']);
});

test('every instance shares one single copy of each method', () => {
  const a = new Counter();
  const b = new Counter();
  ok(a.inc === b.inc);
  ok(a.inc === Counter.prototype.inc);
});

test('instances are linked to Counter.prototype', () => {
  const c = new Counter();
  ok(c instanceof Counter);
  ok(Object.getPrototypeOf(c) === Counter.prototype);
  ok(Counter.prototype.constructor === Counter);
});
