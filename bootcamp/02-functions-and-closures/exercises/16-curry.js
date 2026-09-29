// ─────────────────────────────────────────────────────────────────────────
//  16 · curry2 and curry3                                  ★★☆ core
//  concepts: currying · closures
//  run: node 16-curry.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Currying turns "one call with N arguments" into "N calls with one
//  argument". Each stage returns a function that remembers what it has
//  been given so far; nothing runs until the last argument lands.
//
//      const add = (a, b) => a + b;
//      curry2(add)(2)(3)                → 5
//
//      const greet = curry2((greeting, name) => `${greeting}, ${name}`);
//      const hi = greet('Hi');
//      ['Ada', 'Grace'].map(hi)         → ['Hi, Ada', 'Hi, Grace']
//
//      const clamp = (lo, hi, n) => Math.min(Math.max(n, lo), hi);
//      curry3(clamp)(0)(10)(42)         → 10
//
//  hint: `(a) => (b) => fn(a, b)` — read the arrows right to left

import { test, eq, ok, spy } from '../../_lib/check.js';

export function curry2(fn) {
  throw new Error('TODO');
}

export function curry3(fn) {
  throw new Error('TODO');
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
