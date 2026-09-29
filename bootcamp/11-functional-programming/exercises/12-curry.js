// ─────────────────────────────────────────────────────────────────────────
//  12 · curry                                               ★★★ stretch
//  concepts: closures · recursion · arity · partial application
//  run: node 12-curry.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You have been hand-rolling partial application with factories. Now
//  build the general machine: `curry(fn)` collects arguments — however
//  they arrive — and calls fn as soon as it has enough of them.
//
//      const add3 = (a, b, c) => a + b + c;
//      const add = curry(add3);
//
//      add(1)(2)(3)      → 6
//      add(1, 2)(3)      → 6
//      add(1)(2, 3)      → 6
//      add(1, 2, 3)      → 6
//
//      const add10 = add(10);       // a reusable partial
//      add10(1)(2)                  → 13
//      add10(5)(5)                  → 20   (add10 is not "used up")
//
//  "Enough" means fn.length — the number of declared parameters. It must
//  work for any arity, including 0 (call straight away).
//
//  hint: a named function expression can call itself, and `args.length >=
//  fn.length` is the whole decision.

import { test, eq } from '../../_lib/check.js';

const add3 = (a, b, c) => a + b + c;

export function curry(fn) {
  throw new Error('TODO');
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
