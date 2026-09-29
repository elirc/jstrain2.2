// ─────────────────────────────────────────────────────────────────────────
//  09 · nearlyEqual                                             ★★☆ core
//  concepts: IEEE 754 · Number.EPSILON · tolerance
//  run: node 09-float-compare.js
// ─────────────────────────────────────────────────────────────────────────
//
//  0.1 + 0.2 is 0.30000000000000004. Every JS number is a binary double,
//  and 0.1 has no exact binary form — so `===` is the wrong tool for
//  arithmetic results. Write the comparison you should be using.
//
//      nearlyEqual(0.1 + 0.2, 0.3)   → true
//      nearlyEqual(0.1, 0.2)         → false
//      nearlyEqual(NaN, NaN)         → false
//
//  Rule: identical numbers are always nearly equal (Infinity included).
//  Any other non-finite pair — NaN anywhere, or Infinity against a finite
//  number — is never nearly equal. Otherwise the difference must be
//  within `epsilon` SCALED by the bigger magnitude, floored at 1:
//
//      |a - b| <= epsilon * max(1, |a|, |b|)
//
//      nearlyEqual(100, 100.5, 0.006) → true    (0.006 * 100 = 0.6)
//      nearlyEqual(100, 100.5, 0.004) → false   (0.004 * 100 = 0.4)
//
//  hint: a fixed tolerance like 1e-9 is meaningless at 1e12, where the
//  gap between neighbouring doubles is already bigger than that.

import { test, eq, ok } from '../../_lib/check.js';

export function nearlyEqual(a, b, epsilon = Number.EPSILON * 4) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('forgives the classic 0.1 + 0.2 drift', () => {
  eq(nearlyEqual(0.1 + 0.2, 0.3), true);
  ok(0.1 + 0.2 !== 0.3, 'the raw comparison really is false');
});

test('identical numbers are nearly equal', () => {
  eq(nearlyEqual(1, 1), true);
  eq(nearlyEqual(0, 0), true);
  eq(nearlyEqual(-5.5, -5.5), true);
});

test('genuinely different numbers are not', () => {
  eq(nearlyEqual(0.1, 0.2), false);
  eq(nearlyEqual(1, 1.0001), false);
});

test('the tolerance scales with magnitude', () => {
  eq(nearlyEqual(100, 100.5, 0.006), true);
  eq(nearlyEqual(100, 100.5, 0.004), false);
});

test('the scale never drops below 1, so small numbers still work', () => {
  eq(nearlyEqual(0, 0.005, 0.006), true);
  eq(nearlyEqual(0, 0.5, 0.006), false);
});

test('NaN is nearly equal to nothing, itself included', () => {
  eq(nearlyEqual(NaN, NaN), false);
  eq(nearlyEqual(NaN, 1), false);
});

test('Infinity equals itself but beats every finite number', () => {
  eq(nearlyEqual(Infinity, Infinity), true);
  eq(nearlyEqual(Infinity, 1e308), false);
});
