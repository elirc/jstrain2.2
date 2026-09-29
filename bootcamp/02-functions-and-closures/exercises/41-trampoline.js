// ─────────────────────────────────────────────────────────────────────────
//  41 · trampoline                                         ★★★ stretch
//  concepts: recursion · stack safety · thunks
//  run: node 41-trampoline.js
// ─────────────────────────────────────────────────────────────────────────
//
//  JavaScript engines do not eliminate tail calls, so a recursion 100_000
//  levels deep dies with "Maximum call stack size exceeded". A trampoline
//  turns that recursion into a loop without rewriting the logic: instead
//  of CALLING itself, the step RETURNS the next call wrapped in an arrow —
//  a thunk — and the trampoline keeps bouncing until a real value appears.
//
//      const step = (n) => (n === 0 ? 'done' : () => step(n - 1));
//      trampoline(step)(3)   → 'done'   after 4 bounces, 1 stack frame
//
//  Then use it: `sumTo(n)` adds 1..n with a recursive step and must
//  survive n = 100_000.
//
//      sumTo(4)        → 10
//      sumTo(100000)   → 5000050000
//
//  hint: `while (typeof result === 'function') result = result();` — and
//  inside the step, `() => step(...)` is a thunk while `step(...)` is a
//  stack frame

import { test, eq, ok, spy } from '../../_lib/check.js';

export function trampoline(fn) {
  throw new Error('TODO');
}

export function sumTo(n) {
  throw new Error('TODO');
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
