// ─────────────────────────────────────────────────────────────────────────
//  27 · BigInt basics                                           ★★☆ core
//  concepts: BigInt · no mixing with Number · truncating division
//  run: node 27-bigint-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Doubles stop counting exactly at 2**53. Snowflake ids, database bigints
//  and nanosecond timestamps all live past that line, so they arrive as
//  strings and must stay exact. That is what BigInt is for.
//
//      toBigInt(42)      → 42n        toBigInt(4.5)      → null
//      toBigInt('  42 ') → 42n        toBigInt('4e3')    → null
//      toBigInt(-7n)     → -7n        toBigInt(true)     → null
//      toBigInt('9007199254740993') → 9007199254740993n  (exact!)
//
//  Only three input shapes are legal: a bigint, a SAFE integer number, and
//  a string of optional '-' plus digits. Everything else is null.
//
//  sumBig(values) adds a list of those, exactly, and throws a TypeError
//  whose message starts 'not an integer:' on anything toBigInt rejects.
//
//  toSafeNumber(value) converts back to a plain number, or null when the
//  value no longer fits in the safe integer range.
//
//  hint: BigInt('') is 0n and BigInt(' 12 ') is 12n, so BigInt() is too
//  forgiving to be your validator — check the shape with a regex first.

import { test, eq, throws } from '../../_lib/check.js';

export function toBigInt(input) {
  throw new Error('TODO');
}

export function sumBig(values) {
  throw new Error('TODO');
}

export function toSafeNumber(value) {
  throw new Error('TODO');
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
