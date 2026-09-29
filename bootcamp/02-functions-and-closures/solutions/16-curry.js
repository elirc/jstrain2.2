// ─────────────────────────────────────────────────────────────────────────
//  16 · curry2 and curry3 — SOLUTION                       ★★☆ core
//  run: node 16-curry.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: each arrow closes over the arguments collected so far, so
//  the chain is really a stack of closures. Only the innermost arrow
//  calls fn, which is why the spy sees zero calls until the final
//  argument arrives — and why a half-applied function can be stored and
//  reused any number of times. `inTens` is a plain one-argument function,
//  so it drops into map untouched. The classic wrong turn is calling
//  `fn(a)` early and hoping the rest turns up later.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function curry2(fn) {
  return (a) => (b) => fn(a, b);
}

export function curry3(fn) {
  return (a) => (b) => (c) => fn(a, b, c);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('curry2 takes its arguments one at a time', () => {
  const add = (a, b) => a + b;
  eq(curry2(add)(2)(3), 5);
  eq(curry2((a, b) => a - b)(10)(3), 7);
});

test('every stage of curry2 is a function', () => {
  const curried = curry2((a, b) => a + b);
  ok(typeof curried === 'function');
  ok(typeof curried(1) === 'function');
  eq(curried(1)(1), 2);
});

test('the original is not called until the last argument', () => {
  const fn = spy((a, b) => a + b);
  const curried = curry2(fn);
  const waiting = curried(1);
  eq(fn.callCount, 0);
  eq(waiting(2), 3);
  eq(fn.calls, [[1, 2]]);
});

test('a half-applied function can be reused', () => {
  const greet = curry2((greeting, name) => `${greeting}, ${name}`);
  const hi = greet('Hi');
  eq(['Ada', 'Grace'].map(hi), ['Hi, Ada', 'Hi, Grace']);
  eq(hi('Alan'), 'Hi, Alan');
});

test('two partials of the same function stay independent', () => {
  const greet = curry2((greeting, name) => `${greeting}, ${name}`);
  const hi = greet('Hi');
  const bye = greet('Bye');
  eq(hi('Ada'), 'Hi, Ada');
  eq(bye('Ada'), 'Bye, Ada');
});

test('curry3 chains three single-argument calls', () => {
  const clamp = (lo, hi, n) => Math.min(Math.max(n, lo), hi);
  eq(curry3(clamp)(0)(10)(42), 10);
  eq(curry3(clamp)(0)(10)(-5), 0);
  eq(curry3(clamp)(0)(10)(7), 7);
});

test('curry3 keeps the argument order of the original', () => {
  const fn = spy((a, b, c) => [a, b, c]);
  eq(curry3(fn)('a')('b')('c'), ['a', 'b', 'c']);
  eq(fn.calls, [['a', 'b', 'c']]);
});

test('a curry3 stage can be captured and reused', () => {
  const between = curry3((lo, hi, n) => n >= lo && n <= hi);
  const inTens = between(10)(19);
  eq([9, 10, 19, 20].map(inTens), [false, true, true, false]);
});
