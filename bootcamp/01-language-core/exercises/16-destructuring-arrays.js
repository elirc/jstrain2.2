// ─────────────────────────────────────────────────────────────────────────
//  16 · array destructuring                                 ★☆☆ warm-up
//  concepts: array destructuring · holes · defaults · swap
//  run: node 16-destructuring-arrays.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Destructuring pulls values out by position. A comma with nothing in
//  front of it skips a slot, and `= fallback` fills a slot that is
//  undefined — and ONLY undefined.
//
//      firstTwo([10, 20, 30])   → { first: 10, second: 20 }
//      firstTwo(['solo'])       → { first: 'solo', second: undefined }
//
//      swap([1, 2])             → [2, 1]
//
//      thirdOr([1, 2, 9], '-')  → 9
//      thirdOr([1, 2], '-')     → '-'
//      thirdOr([1, 2, null], '-') → null    ← null is a real value

import { test, eq } from '../../_lib/check.js';

export function firstTwo(list) {
  throw new Error('TODO');
}

export function swap(pair) {
  throw new Error('TODO');
}

export function thirdOr(list, fallback) {
  throw new Error('TODO');
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
