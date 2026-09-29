// ─────────────────────────────────────────────────────────────────────────
//  09 · nearlyEqual — SOLUTION                                  ★★☆ core
//  run: node 09-float-compare.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the `a === b` fast path does two jobs — it is cheap, and
//  it makes Infinity equal itself (Infinity - Infinity is NaN, which
//  would fail every later comparison). The finiteness guard then stops
//  Infinity from swallowing everything else: it scales the tolerance to
//  Infinity, which would call 1e308 "nearly infinite".
//
//  Number.EPSILON is the gap between 1 and the next representable double,
//  so it is the natural unit of "one rounding error" — but only near 1.
//  Multiplying by max(1, |a|, |b|) turns it into a relative tolerance
//  that still behaves at 1e12, while the floor of 1 keeps it usable near
//  zero (a purely relative tolerance can never accept 0 vs 1e-300).
//
//  NaN falls out for free: NaN <= anything is false.

import { test, eq, ok } from '../../_lib/check.js';

export function nearlyEqual(a, b, epsilon = Number.EPSILON * 4) {
  if (a === b) return true;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= epsilon * scale;
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
