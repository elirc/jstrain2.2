// ─────────────────────────────────────────────────────────────────────────
//  10 · roundTo                                                 ★★☆ core
//  concepts: rounding · float dust · half-away-from-zero
//  run: node 10-round-to.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Money code needs `roundTo(value, digits)`. The obvious version,
//  `Math.round(value * 100) / 100`, is wrong twice:
//
//      1.005 * 100          → 100.49999999999999  → rounds DOWN to 1
//      Math.round(-2.5)     → -2  (JS rounds .5 toward +Infinity)
//
//  Build the version that gets both right — round half AWAY from zero:
//
//      roundTo(1.005, 2)      → 1.01
//      roundTo(2.675, 2)      → 2.68
//      roundTo(0.1 + 0.2, 2)  → 0.3
//      roundTo(2.5)           → 3        (digits defaults to 0)
//      roundTo(-2.5)          → -3
//
//  hint: `Number(`${n}e2`)` re-parses the decimal text and lands exactly
//  on 100.5, where `n * 100` does not. Shift, round, shift back — and
//  handle the sign yourself.

import { test, eq } from '../../_lib/check.js';

export function roundTo(value, digits = 0) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('rounds to the requested number of decimals', () => {
  eq(roundTo(1.234, 2), 1.23);
  eq(roundTo(2.345, 2), 2.35);
  eq(roundTo(1 / 3, 4), 0.3333);
});

test('beats the 1.005 trap', () => {
  eq(roundTo(1.005, 2), 1.01);
  eq(roundTo(2.675, 2), 2.68);
});

test('cleans up float dust', () => {
  eq(roundTo(0.1 + 0.2, 2), 0.3);
  eq(roundTo(0.1 + 0.7, 1), 0.8);
});

test('digits defaults to 0', () => {
  eq(roundTo(2.5), 3);
  eq(roundTo(2.4), 2);
  eq(roundTo(7), 7);
});

test('rounds halves away from zero, not toward +Infinity', () => {
  eq(roundTo(-2.5), -3);
  eq(roundTo(-1.005, 2), -1.01);
  eq(roundTo(-0.125, 2), -0.13);
});

test('leaves already-round values alone', () => {
  eq(roundTo(5, 2), 5);
  eq(roundTo(0, 2), 0);
  eq(roundTo(-4, 3), -4);
});
