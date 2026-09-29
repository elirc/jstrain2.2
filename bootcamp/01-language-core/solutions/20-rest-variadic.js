// ─────────────────────────────────────────────────────────────────────────
//  20 · rest parameters — SOLUTION                              ★★☆ core
//  run: node 20-rest-variadic.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: rest gives you a genuine Array, so reduce, join and
//  length work immediately — no Array.from(arguments) dance.
//
//  Two symmetric halves worth naming: `...` in a PARAMETER list packs
//  arguments into an array; `...` at a CALL site unpacks an array into
//  arguments. maxOf uses both — it collects values, then spreads them
//  into Math.max, which is variadic and would otherwise return NaN for
//  an array argument.
//
//  The empty case is the interesting one: Math.max() returns -Infinity
//  (correct as an identity element, useless as an answer), so the guard
//  turns it into an explicit null.

import { test, eq } from '../../_lib/check.js';

export function sumAll(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}

export function tagged(name, ...tags) {
  return tags.length > 0 ? `${name} [${tags.join(', ')}]` : name;
}

export function maxOf(...values) {
  return values.length > 0 ? Math.max(...values) : null;
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
