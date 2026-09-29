// ─────────────────────────────────────────────────────────────────────────
//  22 · recursion basics — SOLUTION                        ★★☆ core
//  run: node 22-recursion-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: every one of these is "base case, then combine". For
//  countdown the base case is n <= 0 → []; otherwise put n in front of
//  the countdown of n - 1. For the array pair the smaller problem is one
//  element: if it is an array, recurse into it, otherwise treat it as a
//  value. reduce carries the running answer so the whole thing stays a
//  single expression. Forget the base case and you get "Maximum call
//  stack size exceeded" — that message almost always means a missing or
//  unreachable base case.

import { test, eq, ok } from '../../_lib/check.js';

export function countdown(n) {
  if (n <= 0) return [];
  return [n, ...countdown(n - 1)];
}

export function sumNested(values) {
  return values.reduce(
    (total, value) =>
      total + (Array.isArray(value) ? sumNested(value) : value),
    0
  );
}

export function deepFlatten(values) {
  return values.reduce((out, value) => {
    if (Array.isArray(value)) return [...out, ...deepFlatten(value)];
    return [...out, value];
  }, []);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('countdown counts down to one', () => {
  eq(countdown(3), [3, 2, 1]);
  eq(countdown(1), [1]);
});

test('countdown stops at the base case', () => {
  eq(countdown(0), []);
  eq(countdown(-2), []);
});

test('sumNested adds up a flat array', () => {
  eq(sumNested([1, 2, 3]), 6);
  eq(sumNested([]), 0);
});

test('sumNested digs through any depth', () => {
  eq(sumNested([1, [2, [3, 4]]]), 10);
  eq(sumNested([[[[5]]]]), 5);
  eq(sumNested([1, [], [2, []]]), 3);
});

test('deepFlatten flattens one level', () => {
  eq(deepFlatten([1, [2, 3]]), [1, 2, 3]);
  eq(deepFlatten([]), []);
});

test('deepFlatten flattens any depth, keeping the order', () => {
  eq(deepFlatten([1, [2, [3, [4]]], 5]), [1, 2, 3, 4, 5]);
  eq(deepFlatten([['a'], [['b', 'c']]]), ['a', 'b', 'c']);
});

test('deepFlatten drops empty arrays', () => {
  eq(deepFlatten([1, [], [[]], [2]]), [1, 2]);
});

test('deepFlatten is hand written, not Array.prototype.flat', () => {
  eq(deepFlatten([1, [2]]), [1, 2]);
  ok(!/\.flat\s*\(/.test(deepFlatten.toString()), 'write the recursion');
});
