// ─────────────────────────────────────────────────────────────────────────
//  05 · rest parameters and `arguments` — SOLUTION         ★☆☆ warm-up
//  run: node 05-rest-parameters.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: rest gives you an Array, so .reduce/.map/.slice just work.
//  `arguments` gives you an array-like object — it has .length and index
//  keys but no array methods, which is why old code is full of
//  Array.prototype.slice.call(arguments); today Array.from() does it.
//  Arrows have no `arguments` binding, so an arrow inside a function
//  reads the OUTER function's arguments — occasionally handy, usually a
//  reason to prefer `...rest` everywhere.

import { test, eq, ok } from '../../_lib/check.js';

export function sumRest(...nums) {
  return nums.reduce((total, n) => total + n, 0);
}

export function tail(first, ...rest) {
  return rest;
}

export function argumentsInfo() {
  return {
    count: arguments.length,
    isArray: Array.isArray(arguments),
    asArray: Array.from(arguments),
  };
}

export function firstViaArrow() {
  const grab = () => arguments[0];
  return grab();
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
