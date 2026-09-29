// ─────────────────────────────────────────────────────────────────────────
//  28 · scaled units                                         ★★★ stretch
//  concepts: BigInt · fixed-point amounts · string digits over floats
//  run: node 28-bigint-units.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every serious money/crypto API stores amounts as integers in the
//  smallest unit: cents (2 decimals), satoshis (8), wei (18). Doubles
//  cannot hold 18-decimal amounts, so the scaling has to be done on the
//  DIGITS of the string — never by multiplying a float.
//
//      toUnits('12.34', 2)    → 1234n       toUnits('7', 2)   → 700n
//      toUnits('0.05', 2)     → 5n          toUnits('7', 0)   → 7n
//      toUnits('-0.50', 2)    → -50n        toUnits('1', 18)  → 10n ** 18n
//
//      formatUnits(1234n, 2)  → '12.34'     formatUnits(5n, 2)  → '0.05'
//      formatUnits(0n, 2)     → '0.00'      formatUnits(7n, 0)  → '7'
//      formatUnits(-50n, 2)   → '-0.50'
//
//      totalUnits(['1.10', '2.20'], 2)      → 330n
//
//  An amount is a string: optional '-', then digits, then optionally '.'
//  and at least one digit. Anything else throws an Error whose message
//  starts 'bad amount:'. More fraction digits than the scale allows
//  throws a RangeError containing 'too many decimals'.
//
//  hint: split on '.', padEnd the fraction to `decimals`, glue the two
//  halves back together and hand ONE digit string to BigInt(). Going the
//  other way, padStart to `decimals + 1` so small values keep a leading 0.

import { test, eq, throws } from '../../_lib/check.js';

export function toUnits(amount, decimals) {
  throw new Error('TODO');
}

export function formatUnits(value, decimals) {
  throw new Error('TODO');
}

export function totalUnits(amounts, decimals) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('scales a decimal string up into whole units', () => {
  eq(toUnits('12.34', 2), 1234n);
  eq(toUnits('0.05', 2), 5n);
  eq(toUnits('0.00', 2), 0n);
});

test('pads a short fraction and handles a scale of zero', () => {
  eq(toUnits('1.1', 2), 110n);
  eq(toUnits('7', 2), 700n);
  eq(toUnits('7', 0), 7n);
  eq(toUnits('1', 18), 1000000000000000000n);
});

test('formatUnits puts the point back, padding small values', () => {
  eq(formatUnits(1234n, 2), '12.34');
  eq(formatUnits(5n, 2), '0.05');
  eq(formatUnits(0n, 2), '0.00');
  eq(formatUnits(7n, 0), '7');
});

test('the two directions round-trip any amount', () => {
  for (const amount of ['12.34', '0.05', '1000.00', '0.00']) {
    eq(formatUnits(toUnits(amount, 2), 2), amount);
  }
  eq(formatUnits(toUnits('1', 18), 18), '1.000000000000000000');
});

test('negative amounts keep their sign on both sides', () => {
  eq(toUnits('-0.50', 2), -50n);
  eq(toUnits('-12', 2), -1200n);
  eq(formatUnits(-50n, 2), '-0.50');
  eq(formatUnits(-1234n, 2), '-12.34');
});

test('malformed amounts are refused, not guessed at', () => {
  throws(() => toUnits('abc', 2), 'bad amount:');
  throws(() => toUnits('.5', 2), 'bad amount:');
  throws(() => toUnits('12.', 2), 'bad amount:');
  throws(() => toUnits(12.34, 2), 'bad amount:');
});

test('an amount finer than the scale is an error, not a rounding', () => {
  throws(() => toUnits('12.345', 2), 'too many decimals');
  throws(() => toUnits('0.000000001', 8), 'too many decimals');
});

test('totalUnits sums exactly, past where a double gives up', () => {
  eq(totalUnits(['1.10', '2.20', '0.05'], 2), 335n);
  eq(totalUnits([], 2), 0n);
  eq(totalUnits(['90071992.54740993'], 8), 9007199254740993n);
  eq(Number(9007199254740993n), 9007199254740992); // why this is a BigInt
});
