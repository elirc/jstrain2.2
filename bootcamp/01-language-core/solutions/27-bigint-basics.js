// ─────────────────────────────────────────────────────────────────────────
//  27 · BigInt basics — SOLUTION                                ★★☆ core
//  run: node 27-bigint-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: gate on type, then on SHAPE, then convert — the same order
//  as exercise 11, for the same reason. BigInt() is a coercion, not a
//  parser: BigInt('') is 0n and BigInt(' 12 ') is 12n, so a regex has to
//  decide what counts as a number before the conversion happens.
//
//  Number input is only accepted when it is already a safe integer. Taking
//  BigInt(2 ** 53 + 1) would happily hand back 9007199254740992n — the
//  precision was lost before BigInt ever saw the value, and converting a
//  wrong number cannot make it right.
//
//  The classic wrong turn is `total += toBigInt(v)` with `let total = 0`:
//  0 is a Number, so the first addition throws 'Cannot mix BigInt and other
//  types'. Bigint accumulators must start at 0n.

import { test, eq, throws } from '../../_lib/check.js';

export function toBigInt(input) {
  if (typeof input === 'bigint') return input;
  if (typeof input === 'number') {
    return Number.isSafeInteger(input) ? BigInt(input) : null;
  }
  if (typeof input !== 'string') return null;
  const text = input.trim();
  return /^-?\d+$/.test(text) ? BigInt(text) : null;
}

export function sumBig(values) {
  let total = 0n;
  for (const value of values) {
    const big = toBigInt(value);
    if (big === null) throw new TypeError(`not an integer: ${String(value)}`);
    total += big;
  }
  return total;
}

export function toSafeNumber(value) {
  const big = toBigInt(value);
  if (big === null) return null;
  const asNumber = Number(big);
  return Number.isSafeInteger(asNumber) ? asNumber : null;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('accepts bigints, safe integers and digit strings', () => {
  eq(toBigInt(7n), 7n);
  eq(toBigInt(42), 42n);
  eq(toBigInt(0), 0n);
  eq(toBigInt('  42 '), 42n);
  eq(toBigInt('-9'), -9n);
});

test('rejects everything that is not a whole number', () => {
  eq(toBigInt(4.5), null);
  eq(toBigInt(NaN), null);
  eq(toBigInt(Infinity), null);
  eq(toBigInt(2 ** 53), null);
  eq(toBigInt(''), null);
  eq(toBigInt('4e3'), null);
  eq(toBigInt('12px'), null);
  eq(toBigInt(true), null);
  eq(toBigInt(null), null);
  eq(toBigInt([]), null);
});

test('keeps the digits a double would round away', () => {
  eq(toBigInt('9007199254740993'), 9007199254740993n);
  eq(Number('9007199254740993'), 9007199254740992); // the loss, in one line
});

test('mixing a bigint with a number in arithmetic throws', () => {
  eq(toBigInt(1), 1n);
  throws(() => 1n + 1, 'Cannot mix BigInt');
  eq(1n + 1n, 2n);
  eq(1n < 2, true); // comparisons are fine — only arithmetic is banned
});

test('bigint division truncates; there are no fractions', () => {
  eq(toBigInt('7'), 7n);
  eq(7n / 2n, 3n);
  eq(-7n / 2n, -3n);
  eq(7n % 2n, 1n);
});

test('sumBig adds a mixed list exactly', () => {
  eq(sumBig([1, '2', 3n]), 6n);
  eq(sumBig([]), 0n);
  eq(sumBig(['9007199254740993', '9007199254740993']), 18014398509481986n);
});

test('sumBig refuses a value it cannot convert', () => {
  throws(() => sumBig([1, 2.5]), 'not an integer:');
  throws(() => sumBig(['nope']), 'not an integer:');
});

test('toSafeNumber only converts back inside the safe range', () => {
  eq(toSafeNumber(42n), 42);
  eq(toSafeNumber('-9'), -9);
  eq(toSafeNumber(BigInt(Number.MAX_SAFE_INTEGER)), 9007199254740991);
  eq(toSafeNumber(2n ** 60n), null);
  eq(toSafeNumber('nope'), null);
});
