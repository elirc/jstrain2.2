// ─────────────────────────────────────────────────────────────────────────
//  05 · rest parameters and `arguments`                    ★☆☆ warm-up
//  concepts: rest parameters · arguments object
//  run: node 05-rest-parameters.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `...rest` gathers the leftover arguments into a REAL array. The old
//  `arguments` object does something similar but is only array-LIKE, and
//  arrows do not get one at all.
//
//      sumRest(1, 2, 3)             → 6
//      tail('a', 'b', 'c')          → ['b', 'c']
//      argumentsInfo(1, 2, 3)       → { count: 3, isArray: false,
//                                       asArray: [1, 2, 3] }
//      firstViaArrow('a', 'b')      → 'a'
//
//  argumentsInfo must declare NO parameters and read `arguments`.
//  firstViaArrow must return the result of an inner ARROW that reads
//  `arguments[0]` — arrows borrow the enclosing function's arguments.

import { test, eq, ok } from '../../_lib/check.js';

export function sumRest(...nums) {
  throw new Error('TODO');
}

export function tail(first, ...rest) {
  throw new Error('TODO');
}

export function argumentsInfo() {
  throw new Error('TODO');
}

export function firstViaArrow() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sums any number of arguments', () => {
  eq(sumRest(1, 2, 3), 6);
  eq(sumRest(5), 5);
});

test('an empty rest list sums to zero', () => {
  eq(sumRest(), 0);
});

test('a rest parameter is a real array', () => {
  eq(tail('a', 'b', 'c'), ['b', 'c']);
  ok(Array.isArray(tail('a', 'b')), 'rest should be a genuine Array');
  eq(tail('a'), []);
});

test('rest parameters do not count toward length', () => {
  eq(sumRest(1), 1);
  eq(sumRest.length, 0);
  eq(tail.length, 1);
});

test('arguments holds every argument even with no parameters', () => {
  eq(argumentsInfo(1, 2, 3).count, 3);
  eq(argumentsInfo().count, 0);
  eq(argumentsInfo.length, 0);
});

test('arguments is array-like, not an array', () => {
  const info = argumentsInfo(1, 2, 3);
  eq(info.isArray, false);
  eq(info.asArray, [1, 2, 3]);
});

test('an arrow borrows the enclosing function arguments', () => {
  eq(firstViaArrow('a', 'b'), 'a');
  eq(firstViaArrow(42), 42);
});
