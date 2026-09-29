// ─────────────────────────────────────────────────────────────────────────
//  05 · constructor functions — SOLUTION                   ★☆☆ warm-up
//  run: node 05-constructor-functions.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `new Counter(7)` does four things — create an empty
//  object, point its internal [[Prototype]] at Counter.prototype, run the
//  body with `this` bound to it, and return it (exercise 06 implements
//  exactly that).
//
//  So the constructor only assigns per-instance DATA. The methods go on
//  `Counter.prototype`, one copy for every instance that will ever exist;
//  `c.inc()` fails to find `inc` on `c`, follows the prototype link, and
//  finds it there — with `this` still pointing at `c`.
//
//  Classic wrong turn: calling `Counter(7)` without `new`. In a module
//  (always strict mode) `this` is undefined and you get a TypeError. That
//  footgun is the reason `class` refuses to run without `new` at all.

import { test, eq, ok } from '../../_lib/check.js';

export function Counter(start = 0) {
  this.start = start;
  this.count = start;
}

Counter.prototype.inc = function (by = 1) {
  this.count += by;
  return this.count;
};

Counter.prototype.reset = function () {
  this.count = this.start;
  return this.count;
};

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
