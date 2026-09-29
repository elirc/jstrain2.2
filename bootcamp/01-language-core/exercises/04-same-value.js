// ─────────────────────────────────────────────────────────────────────────
//  04 · sameValue                                               ★★☆ core
//  concepts: Object.is · NaN · negative zero
//  run: node 04-same-value.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Rebuild Object.is from scratch. It is `===` with the two historical
//  bugs fixed: NaN counts as the same value as NaN, and +0 is a different
//  value from -0.
//
//      sameValue(NaN, NaN)   → true    (=== says false)
//      sameValue(0, -0)      → false   (=== says true)
//      sameValue(1, '1')     → false   (no coercion, ever)
//      sameValue(null, null) → true
//
//  You may use ===, typeof and Number.isNaN. You may NOT use Object.is.
//
//  hint: two zeros that are `===` can still be told apart — divide by
//  them and look at which infinity you get.

import { test, eq, ok } from '../../_lib/check.js';

export function sameValue(a, b) {
  throw new Error('TODO');
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
