// ─────────────────────────────────────────────────────────────────────────
//  11 · toNumber                                             ★★★ stretch
//  concepts: Number vs parseInt vs unary + · isFinite · safe integers
//  run: node 11-number-parsing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three ways to turn text into a number, three different sets of lies:
//
//      parseInt('42px')  → 42        (stops at the first bad character)
//      parseInt('1e3')   → 1         (there is no exponent in an int)
//      Number('')        → 0         (so is Number(null) and Number([]))
//      +' '              → 0
//
//  Write the strict parser you actually want for user input. Return a
//  finite number, or null if the input is not entirely a number.
//
//      toNumber('42')      → 42       toNumber('42px')  → null
//      toNumber('  7  ')   → 7        toNumber('')      → null
//      toNumber('-3.5')    → -3.5     toNumber(null)    → null
//      toNumber('1e3')     → 1000     toNumber(true)    → null
//      toNumber(0)         → 0        toNumber(NaN)     → null
//
//  Then toSafeInt: the same, but the result must also be an integer that
//  survives a round trip through a double.
//
//      toSafeInt('42') → 42     toSafeInt('4.5') → null
//      toSafeInt(2 ** 53) → null     (2**53 === 2**53 + 1 — really)
//
//  hint: only two input types are acceptable at all; check typeof before
//  you convert, and check Number.isFinite after.

import { test, eq } from '../../_lib/check.js';

export function toNumber(input) {
  throw new Error('TODO');
}

export function toSafeInt(input) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('parses ordinary numeric strings', () => {
  eq(toNumber('42'), 42);
  eq(toNumber('-3.5'), -3.5);
  eq(toNumber('0'), 0);
});

test('accepts real numbers unchanged and tolerates whitespace', () => {
  eq(toNumber(0), 0);
  eq(toNumber(-7.25), -7.25);
  eq(toNumber('  7  '), 7);
});

test('rejects the strings parseInt would half-eat', () => {
  eq(toNumber('42px'), null);
  eq(toNumber('3 apples'), null);
  eq(parseInt('42px'), 42); // proof of the thing you are avoiding
});

test('rejects the values Number() quietly turns into 0', () => {
  eq(toNumber(''), null);
  eq(toNumber('   '), null);
  eq(toNumber(null), null);
  eq(toNumber([]), null);
  eq(Number(''), 0); // proof again
});

test('rejects anything that is not finite', () => {
  eq(toNumber(NaN), null);
  eq(toNumber(Infinity), null);
  eq(toNumber('1e999'), null);
});

test('rejects booleans, undefined and objects', () => {
  eq(toNumber(true), null);
  eq(toNumber(false), null);
  eq(toNumber(undefined), null);
  eq(toNumber({}), null);
});

test('understands exponent and hex notation, like Number does', () => {
  eq(toNumber('1e3'), 1000);
  eq(toNumber('0x1f'), 31);
});

test('toSafeInt demands a whole number inside the safe range', () => {
  eq(toSafeInt('42'), 42);
  eq(toSafeInt(-9), -9);
  eq(toSafeInt('4.5'), null);
  eq(toSafeInt(Number.MAX_SAFE_INTEGER), 9007199254740991);
  eq(toSafeInt(2 ** 53), null);
  eq(toSafeInt('9007199254740993'), null);
});
