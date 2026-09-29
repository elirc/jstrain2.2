// ─────────────────────────────────────────────────────────────────────────
//  28 · scaled units — SOLUTION                              ★★★ stretch
//  run: node 28-bigint-units.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole trick is that no float ever appears. '12.34'
//  becomes the digit string '1234' by concatenation, and only then does
//  BigInt() see it — so `12.34 * 100` (and its rounding error) never
//  happens. Going back is the mirror image: pad to `decimals + 1` digits
//  so there is always a whole-number digit, then slice the string in two.
//
//  The sign is stripped up front and re-applied at the end, because
//  '-0.50' must not turn into BigInt('-050'.padEnd(...)) with the minus
//  stuck in the middle of the digits. BigInt has no negative zero, so
//  '-0.00' collapses to plain 0n with no special case.
//
//  Refusing an over-precise amount instead of rounding it is deliberate:
//  silently turning '12.345' into 12.34 is how ledgers drift. If you want
//  rounding, the caller should ask for it explicitly.

import { test, eq, throws } from '../../_lib/check.js';

const AMOUNT = /^-?\d+(\.\d+)?$/;

export function toUnits(amount, decimals) {
  const text = typeof amount === 'string' ? amount.trim() : '';
  if (!AMOUNT.test(text)) throw new Error(`bad amount: ${String(amount)}`);
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = (negative ? text.slice(1) : text).split('.');
  if (fraction.length > decimals) {
    throw new RangeError(`too many decimals: ${text} at scale ${decimals}`);
  }
  const value = BigInt(whole + fraction.padEnd(decimals, '0'));
  return negative ? -value : value;
}

export function formatUnits(value, decimals) {
  const negative = value < 0n;
  const digits = (negative ? -value : value)
    .toString()
    .padStart(decimals + 1, '0');
  const cut = digits.length - decimals;
  const fraction = decimals > 0 ? `.${digits.slice(cut)}` : '';
  return `${negative ? '-' : ''}${digits.slice(0, cut)}${fraction}`;
}

export function totalUnits(amounts, decimals) {
  return amounts.reduce((sum, amount) => sum + toUnits(amount, decimals), 0n);
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
