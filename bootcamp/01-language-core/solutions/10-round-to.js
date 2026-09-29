// ─────────────────────────────────────────────────────────────────────────
//  10 · roundTo — SOLUTION                                      ★★☆ core
//  run: node 10-round-to.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two separate bugs, two separate fixes.
//
//  Float dust: `1.005 * 100` computes in binary and lands just under
//  100.5. Building the string '1.005e2' and letting Number() parse it
//  runs the decimal-to-double conversion once, landing exactly on 100.5.
//  Same trick shifts back afterwards.
//
//  Sign: Math.round breaks ties toward +Infinity, so -2.5 becomes -2.
//  Rounding the absolute value and re-applying the sign gives the
//  half-away-from-zero behaviour money code expects.
//
//  Note the limits: this relies on String(n) not using exponent notation,
//  so it is a formatting-scale tool, not a big-number tool.

import { test, eq } from '../../_lib/check.js';

export function roundTo(value, digits = 0) {
  const sign = value < 0 ? -1 : 1;
  const shifted = Number(`${Math.abs(value)}e${digits}`);
  return sign * Number(`${Math.round(shifted)}e-${digits}`);
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
