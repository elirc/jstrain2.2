// ─────────────────────────────────────────────────────────────────────────
//  35 · safe integers — SOLUTION                                ★★☆ core
//  run: node 35-safe-integers.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Number.isSafeInteger` answers three questions at once —
//  is it a number, is it whole, and is it inside ±(2**53 - 1). It never
//  coerces, so '41' and 1n are simply false and no extra typeof is needed.
//
//  nextId separates two different failures on purpose. Bad input is a
//  TypeError (the caller passed nonsense); running out of ids is a
//  RangeError (the caller did everything right and the number space is
//  finished). Both are loud, which is the point: the silent version of
//  this bug hands out the same id twice and corrupts data downstream.
//
//  safeAdd checks the RESULT as well as the operands. Two safe integers
//  can add up to an unsafe one, and `+` will still return something — the
//  nearest representable double — with no signal that it rounded. Where
//  the answer legitimately needs to be that big, BigInt is the tool
//  (exercises 27 and 28).

import { test, eq, throws } from '../../_lib/check.js';

export function nextId(current) {
  if (!Number.isSafeInteger(current)) {
    throw new TypeError(`not a safe integer: ${String(current)}`);
  }
  if (current >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError('id space exhausted — switch to BigInt');
  }
  return current + 1;
}

export function safeAdd(a, b) {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) return null;
  const sum = a + b;
  return Number.isSafeInteger(sum) ? sum : null;
}

export function describeInteger(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'not a number';
  }
  if (!Number.isInteger(value)) return 'not an integer';
  return Number.isSafeInteger(value) ? 'safe' : 'unsafe';
}

// ──────────────────────────── tests ──────────────────────────────────────

test('nextId walks the ordinary range', () => {
  eq(nextId(41), 42);
  eq(nextId(0), 1);
  eq(nextId(-1), 0);
  eq(nextId(Number.MAX_SAFE_INTEGER - 1), Number.MAX_SAFE_INTEGER);
});

test('nextId refuses to step past the last exact integer', () => {
  throws(() => nextId(Number.MAX_SAFE_INTEGER), 'exhausted');
  throws(() => nextId(2 ** 53), 'safe integer');
});

test('the reason it refuses: up there, +1 changes nothing', () => {
  eq(nextId(1), 2);
  eq(2 ** 53 === 2 ** 53 + 1, true);
  eq(Number.MAX_SAFE_INTEGER, 2 ** 53 - 1);
  eq(Number.isSafeInteger(2 ** 53), false);
});

test('nextId refuses anything that is not a safe integer', () => {
  throws(() => nextId(1.5), 'safe integer');
  throws(() => nextId(NaN), 'safe integer');
  throws(() => nextId('41'), 'safe integer');
  throws(() => nextId(undefined), 'safe integer');
});

test('safeAdd adds ordinary numbers', () => {
  eq(safeAdd(2, 3), 5);
  eq(safeAdd(-5, 3), -2);
  eq(safeAdd(0, 0), 0);
});

test('safeAdd returns null when the sum leaves the safe range', () => {
  eq(safeAdd(Number.MAX_SAFE_INTEGER, 1), null);
  eq(safeAdd(Number.MIN_SAFE_INTEGER, -1), null);
  eq(Number.MAX_SAFE_INTEGER + 1, 9007199254740992); // + answers anyway
});

test('safeAdd never coerces its operands', () => {
  eq(safeAdd('1', 1), null);
  eq(safeAdd(1.5, 1), null);
  eq(safeAdd(1, null), null);
  eq(safeAdd(1n, 1), null);
});

test('describeInteger sorts a value into one of four buckets', () => {
  eq(describeInteger(42), 'safe');
  eq(describeInteger(0), 'safe');
  eq(describeInteger(Number.MIN_SAFE_INTEGER), 'safe');
  eq(describeInteger(2 ** 53), 'unsafe');
  eq(describeInteger(1e300), 'unsafe');
  eq(describeInteger(1.5), 'not an integer');
  eq(describeInteger(NaN), 'not a number');
  eq(describeInteger(Infinity), 'not a number');
  eq(describeInteger('42'), 'not a number');
  eq(describeInteger(42n), 'not a number');
});
