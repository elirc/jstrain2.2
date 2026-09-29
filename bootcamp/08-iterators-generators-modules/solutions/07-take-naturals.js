// ─────────────────────────────────────────────────────────────────────────
//  07 · naturals · take — SOLUTION                          ★☆☆ warm-up
//  run: node 07-take-naturals.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: naturals is an infinite loop that only advances when
//  someone pulls. The consumer sets the pace, so `while (true)` costs
//  nothing until you ask for a millionth value.
//
//  take is the brake. Two details matter: the `n <= 0` guard (without
//  it the for-of pulls one value before you can bail, which both
//  yields a wrong value and wakes a source that should have stayed
//  asleep), and `return` INSIDE the loop right after the nth yield —
//  that stops the source at exactly n pulls instead of n + 1.

import { test, eq, ok } from '../../_lib/check.js';

export function* naturals() {
  let n = 1;
  while (true) {
    yield n;
    n += 1;
  }
}

export function* take(n, iterable) {
  if (n <= 0) return;
  let taken = 0;
  for (const value of iterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
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
