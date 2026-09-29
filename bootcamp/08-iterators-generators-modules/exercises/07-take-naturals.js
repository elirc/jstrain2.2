// ─────────────────────────────────────────────────────────────────────────
//  07 · naturals · take                                     ★☆☆ warm-up
//  concepts: infinite generators · laziness
//  run: node 07-take-naturals.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An array has to exist before you can use it. A generator only
//  computes the value you actually pull — so `while (true)` is not a
//  bug, it is a feature.
//
//      [...take(5, naturals())]     → [1, 2, 3, 4, 5]
//      [...take(0, naturals())]     → []      (and does NOT hang)
//      [...take(2, ['a','b','c'])]  → ['a', 'b']
//      [...take(9, 'hi')]           → ['h', 'i']
//
//  naturals() yields 1, 2, 3, … forever. take(n, iterable) yields at
//  most the first n values of ANY iterable and then stops pulling.

import { test, eq, ok } from '../../_lib/check.js';

export function* naturals() {
  throw new Error('TODO');
}

export function* take(n, iterable) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('take pulls the first n values of an endless generator', () => {
  eq([...take(5, naturals())], [1, 2, 3, 4, 5]);
});

test('take of 0 yields nothing and does not hang', () => {
  eq([...take(0, naturals())], []);
});

test('naturals starts over at 1 on every call', () => {
  eq([...take(3, naturals())], [1, 2, 3]);
  eq([...take(3, naturals())], [1, 2, 3]);
});

test('take works on a plain array', () => {
  eq([...take(2, ['a', 'b', 'c'])], ['a', 'b']);
});

test('take of more than exists gives everything', () => {
  eq([...take(9, [1, 2])], [1, 2]);
  eq([...take(3, [])], []);
});

test('take works on strings and Sets', () => {
  eq([...take(9, 'hi')], ['h', 'i']);
  eq([...take(2, new Set([4, 5, 6]))], [4, 5]);
});

test('take returns something lazy, not an array', () => {
  const t = take(2, [1, 2, 3]);
  ok(!Array.isArray(t), 'take should hand back an iterable, not an array');
  eq([...t], [1, 2]);
});
