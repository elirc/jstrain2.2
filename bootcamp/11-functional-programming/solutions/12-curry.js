// ─────────────────────────────────────────────────────────────────────────
//  12 · curry — SOLUTION                                    ★★★ stretch
//  run: node 12-curry.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: four lines, one recursion. `curried` asks a single
//  question — do I have at least fn.length arguments? If yes, call. If no,
//  return a function that appends whatever comes next and asks again.
//  Every partial closes over its OWN `args` array and never mutates it
//  (`...args, ...more` builds a new one), which is why `add(1)` can be
//  called twice with different follow-ups and why two partials of the same
//  curried function cannot leak into each other. Push onto a shared array
//  instead and you get the classic "my partial remembered the last call"
//  bug.
//  Limits worth knowing: fn.length ignores default parameters and rest
//  parameters, so `(a, b = 1) => ...` has arity 1 and `(...xs) => ...` has
//  arity 0. Curry variadic functions and they fire immediately.

import { test, eq } from '../../_lib/check.js';

const add3 = (a, b, c) => a + b + c;

export function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn(...args);
    return (...more) => curried(...args, ...more);
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('passes straight through when given everything at once', () => {
  eq(curry(add3)(1, 2, 3), 6);
});

test('accepts one argument at a time', () => {
  eq(curry(add3)(1)(2)(3), 6);
});

test('accepts any grouping of the arguments', () => {
  eq(curry(add3)(1, 2)(3), 6);
  eq(curry(add3)(1)(2, 3), 6);
});

test('a partial can be reused without being used up', () => {
  const add10 = curry(add3)(10);
  eq(add10(1)(2), 13);
  eq(add10(5)(5), 20);
});

test('two partials of the same function do not share arguments', () => {
  const add = curry(add3);
  const from1 = add(1);
  const from100 = add(100);
  eq(from1(2, 3), 6);
  eq(from100(2, 3), 105);
});

test('arity comes from the declared parameters', () => {
  const join4 = (a, b, c, d) => [a, b, c, d].join('-');
  eq(curry(join4)('a')('b')('c')('d'), 'a-b-c-d');
  eq(curry((a, b) => a * b)(6)(7), 42);
});

test('the wrapped function is not called until it is saturated', () => {
  const calls = [];
  const raw = (a, b) => {
    calls.push([a, b]);
    return a + b;
  };
  const partial = curry(raw)(1);
  eq(calls.length, 0);
  eq(partial(2), 3);
  eq(calls, [[1, 2]]);
});

test('a zero-argument function fires on the first call', () => {
  eq(curry(() => 7)(), 7);
});
