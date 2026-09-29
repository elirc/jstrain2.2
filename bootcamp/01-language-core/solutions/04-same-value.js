// ─────────────────────────────────────────────────────────────────────────
//  04 · sameValue — SOLUTION                                    ★★☆ core
//  run: node 04-same-value.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: start from `===` and patch its two exceptions.
//
//  If a === b, the only pair that must NOT count as the same is +0/-0.
//  They are indistinguishable by comparison, so probe them: 1/+0 is
//  Infinity and 1/-0 is -Infinity. Guarding with `a !== 0` first keeps
//  the fast path for every other equal pair.
//
//  If a !== b, the only pair that must count as the same is NaN/NaN —
//  and NaN is exactly the value that is not equal to itself, so
//  `a !== a && b !== b` identifies it without calling anything.

import { test, eq, ok } from '../../_lib/check.js';

export function sameValue(a, b) {
  if (a === b) return a !== 0 || 1 / a === 1 / b;
  return a !== a && b !== b;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('matches === for ordinary primitives', () => {
  eq(sameValue(1, 1), true);
  eq(sameValue('a', 'a'), true);
  eq(sameValue(true, true), true);
  eq(sameValue(1, 2), false);
});

test('NaN is the same value as NaN', () => {
  eq(sameValue(NaN, NaN), true);
  eq(sameValue(NaN, 0), false);
  eq(sameValue(0, NaN), false);
});

test('+0 and -0 are different values', () => {
  eq(sameValue(0, -0), false);
  eq(sameValue(-0, 0), false);
  eq(sameValue(-0, -0), true);
  eq(sameValue(0, 0), true);
});

test('null and undefined are each only themselves', () => {
  eq(sameValue(null, null), true);
  eq(sameValue(undefined, undefined), true);
  eq(sameValue(null, undefined), false);
});

test('never coerces', () => {
  eq(sameValue(1, '1'), false);
  eq(sameValue(0, false), false);
  eq(sameValue('', false), false);
  eq(sameValue(null, 0), false);
});

test('objects are compared by reference', () => {
  const box = { n: 1 };
  const list = [1];
  eq(sameValue(box, box), true);
  eq(sameValue(list, list), true);
  eq(sameValue({ n: 1 }, { n: 1 }), false);
});

test('agrees with the real Object.is on a whole table', () => {
  const pairs = [
    [NaN, NaN],
    [0, -0],
    [-0, 0],
    [1, 1],
    ['x', 'x'],
    [null, undefined],
    [Infinity, Infinity],
    [Infinity, -Infinity],
  ];
  for (const [a, b] of pairs) {
    const label = `${String(a)} vs ${String(b)}`;
    ok(sameValue(a, b) === Object.is(a, b), `mismatch for ${label}`);
  }
});
