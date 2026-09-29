// ─────────────────────────────────────────────────────────────────────────
//  20 · rest parameters                                         ★★☆ core
//  concepts: rest params · variadic functions · spread at call sites
//  run: node 20-rest-variadic.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `...rest` in a parameter list collects the remaining arguments into a
//  real array — unlike `arguments`, which is array-LIKE, ignores default
//  parameters and does not exist in arrow functions at all.
//
//      sumAll(1, 2, 3)              → 6
//      sumAll()                     → 0
//      sumAll(...[1, 2, 3, 4])      → 10
//
//      tagged('post', 'js', 'node') → 'post [js, node]'
//      tagged('post')               → 'post'
//
//      maxOf(3, 9, 4)               → 9
//      maxOf()                      → null   (not -Infinity)
//
//  hint: rest must be the LAST parameter, and there can only be one.

import { test, eq } from '../../_lib/check.js';

export function sumAll(...numbers) {
  throw new Error('TODO');
}

export function tagged(name, ...tags) {
  throw new Error('TODO');
}

export function maxOf(...values) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sumAll adds however many arguments it is given', () => {
  eq(sumAll(1, 2, 3), 6);
  eq(sumAll(5), 5);
  eq(sumAll(1, 2, 3, 4, 5, 6), 21);
});

test('sumAll of nothing is 0', () => {
  eq(sumAll(), 0);
});

test('sumAll works with an array spread at the call site', () => {
  eq(sumAll(...[1, 2, 3, 4]), 10);
  eq(sumAll(...[]), 0);
});

test('tagged joins the trailing arguments', () => {
  eq(tagged('post', 'js', 'node'), 'post [js, node]');
  eq(tagged('post', 'js'), 'post [js]');
});

test('tagged with no tags is just the name', () => {
  eq(tagged('post'), 'post');
});

test('maxOf finds the largest value', () => {
  eq(maxOf(3, 9, 4), 9);
  eq(maxOf(-5, -1, -9), -1);
  eq(maxOf(7), 7);
});

test('maxOf of nothing is null, not -Infinity', () => {
  eq(maxOf(), null);
});
