// ─────────────────────────────────────────────────────────────────────────
//  22 · recursion basics                                   ★★☆ core
//  concepts: recursion · base cases
//  run: node 22-recursion-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A recursive function calls itself on a smaller problem and stops at a
//  base case. Three classics — write all of them recursively, no loops
//  and no Array.prototype.flat.
//
//      countdown(3)                  → [3, 2, 1]
//      countdown(0)                  → []
//
//      sumNested([1, [2, [3, 4]]])   → 10
//      deepFlatten([1, [2, [3]]])    → [1, 2, 3]
//
//  hint: write the base case first, then assume the recursive call
//  already works and use its result

import { test, eq, ok } from '../../_lib/check.js';

export function countdown(n) {
  throw new Error('TODO');
}

export function sumNested(values) {
  throw new Error('TODO');
}

export function deepFlatten(values) {
  throw new Error('TODO');
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
