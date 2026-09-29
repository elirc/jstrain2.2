// ─────────────────────────────────────────────────────────────────────────
//  16 · array destructuring — SOLUTION                      ★☆☆ warm-up
//  run: node 16-destructuring-arrays.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `const [a, b] = list` reads positions, so a short array
//  simply yields undefined rather than throwing. `const [, , third]`
//  uses elisions to skip the first two positions.
//
//  The point worth memorising: a destructuring default fires on
//  undefined only. `[1, 2, null]` keeps the null, because null is a
//  value someone deliberately put there. Same rule as `??`, and the
//  opposite of `||`.
//
//  swap needs no temp variable and no mutation: destructure, rebuild.

import { test, eq } from '../../_lib/check.js';

export function firstTwo(list) {
  const [first, second] = list;
  return { first, second };
}

export function swap(pair) {
  const [a, b] = pair;
  return [b, a];
}

export function thirdOr(list, fallback) {
  const [, , third = fallback] = list;
  return third;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('firstTwo names the first two slots', () => {
  eq(firstTwo([10, 20, 30]), { first: 10, second: 20 });
  eq(firstTwo(['a', 'b']), { first: 'a', second: 'b' });
});

test('a missing slot is undefined, not an error', () => {
  eq(firstTwo(['solo']), { first: 'solo', second: undefined });
  eq(firstTwo([]), { first: undefined, second: undefined });
});

test('swap flips a pair', () => {
  eq(swap([1, 2]), [2, 1]);
  eq(swap(['x', null]), [null, 'x']);
});

test('swap leaves the original array alone', () => {
  const pair = Object.freeze([1, 2]);
  eq(swap(pair), [2, 1]);
  eq(pair, [1, 2]);
});

test('thirdOr reaches past the first two slots', () => {
  eq(thirdOr([1, 2, 9], '-'), 9);
  eq(thirdOr([1, 2, 3, 4], '-'), 3);
});

test('thirdOr falls back only when the slot is undefined', () => {
  eq(thirdOr([1, 2], '-'), '-');
  eq(thirdOr([], '-'), '-');
  eq(thirdOr([1, 2, undefined], '-'), '-');
  eq(thirdOr([1, 2, null], '-'), null);
  eq(thirdOr([1, 2, 0], '-'), 0);
});
