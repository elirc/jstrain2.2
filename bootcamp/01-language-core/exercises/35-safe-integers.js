// ─────────────────────────────────────────────────────────────────────────
//  35 · safe integers                                           ★★☆ core
//  concepts: MAX_SAFE_INTEGER · isSafeInteger · where counting stops
//  run: node 35-safe-integers.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A double holds 53 bits of significand, so above 2**53 the integers
//  start skipping: 9007199254740992 + 1 IS 9007199254740992. An id
//  allocator that crosses that line hands out duplicate ids and no
//  exception is raised anywhere.
//
//      nextId(41)                        → 42
//      nextId(Number.MAX_SAFE_INTEGER)   → throws RangeError ('exhausted')
//      nextId(1.5)                       → throws TypeError ('safe integer')
//
//      safeAdd(2, 3)                            → 5
//      safeAdd(Number.MAX_SAFE_INTEGER, 1)      → null
//      safeAdd(Number.MIN_SAFE_INTEGER, -1)     → null
//      safeAdd('1', 1)                          → null
//
//      describeInteger(42)      → 'safe'         describeInteger(2 ** 53)
//      describeInteger(1.5)     → 'not an integer'          → 'unsafe'
//      describeInteger(NaN)     → 'not a number'
//      describeInteger('42')    → 'not a number'
//
//  hint: Number.isSafeInteger is the whole job — it is Number.isInteger
//  plus the range check, and it never coerces, so a string is simply
//  false. Check the SUM as well as the operands.

import { test, eq, throws } from '../../_lib/check.js';

export function nextId(current) {
  throw new Error('TODO');
}

export function safeAdd(a, b) {
  throw new Error('TODO');
}

export function describeInteger(value) {
  throw new Error('TODO');
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
