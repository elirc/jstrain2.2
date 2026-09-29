// ─────────────────────────────────────────────────────────────────────────
//  11 · toNumber — SOLUTION                                  ★★★ stretch
//  run: node 11-number-parsing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: gate on TYPE first, then convert, then validate.
//
//  Only numbers and strings are plausible input, so everything else is
//  rejected before any coercion can happen — that kills Number(null),
//  Number(true) and Number([]) in one line. Empty and whitespace-only
//  strings are rejected explicitly because Number('') is 0, which is the
//  single nastiest silent bug in form handling.
//
//  Number.isFinite (the static one, not the global isFinite) then throws
//  out NaN and both infinities without coercing anything.
//
//  toSafeInt adds Number.isSafeInteger: above 2**53 doubles can no
//  longer represent every integer, so '9007199254740993' silently parses
//  as ...992 and must be refused — that is where BigInt starts.

import { test, eq } from '../../_lib/check.js';

export function toNumber(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  if (typeof input !== 'string') return null;
  if (input.trim() === '') return null;
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toSafeInt(input) {
  const parsed = toNumber(input);
  return parsed !== null && Number.isSafeInteger(parsed) ? parsed : null;
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
