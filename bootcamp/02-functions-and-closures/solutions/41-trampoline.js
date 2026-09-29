// ─────────────────────────────────────────────────────────────────────────
//  41 · trampoline — SOLUTION                              ★★★ stretch
//  run: node 41-trampoline.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the trampoline is four lines — call the function once,
//  then keep calling whatever it hands back for as long as that is a
//  function. Every bounce returns to the same stack frame, so depth costs
//  nothing and only the closures are allocated.
//  The discipline is in the step: `return () => step(i + 1, total + i)`
//  builds a description of the next call, while `return step(i + 1, ...)`
//  performs it and grows the stack. The accumulator is what makes that
//  possible — `n + sumTo(n - 1)` has work left to do after the recursive
//  call, so it can never be a thunk; carry the running total forward
//  instead and the recursive call becomes the last thing that happens.
//  The obvious cost: the wrapped function can no longer return a function
//  as a legitimate value, because the trampoline would call it. Some
//  implementations wrap thunks in a tagged object for that reason.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function trampoline(fn) {
  return (...args) => {
    let result = fn(...args);
    while (typeof result === 'function') result = result();
    return result;
  };
}

export function sumTo(n) {
  const step = (i, total) => (i > n ? total : () => step(i + 1, total + i));
  return trampoline(step)(1, 0);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('trampoline returns a function', () => {
  ok(typeof trampoline(() => 1) === 'function');
});

test('a step that returns a plain value is passed straight through', () => {
  eq(trampoline(() => 42)(), 42);
  eq(trampoline((a, b) => a + b)(2, 3), 5);
});

test('it keeps bouncing until a non-function comes back', () => {
  const step = spy((n) => (n === 0 ? 'done' : () => step(n - 1)));
  eq(trampoline(step)(3), 'done');
  eq(step.callCount, 4, '3 bounces plus the final answer');
});

test('the first call receives the arguments untouched', () => {
  const fn = spy((a, b) => `${a}:${b}`);
  eq(trampoline(fn)('host', 5432), 'host:5432');
  eq(fn.calls, [['host', 5432]]);
});

test('a falsy final value ends the bouncing too', () => {
  eq(trampoline((n) => (n === 0 ? 0 : () => 0))(1), 0);
  eq(trampoline(() => '')(), '');
});

test('sumTo adds up the whole numbers to n', () => {
  eq(sumTo(4), 10);
  eq(sumTo(1), 1);
  eq(sumTo(0), 0);
});

test('sumTo survives a depth that would blow the stack', () => {
  eq(sumTo(100_000), 5_000_050_000);
});
