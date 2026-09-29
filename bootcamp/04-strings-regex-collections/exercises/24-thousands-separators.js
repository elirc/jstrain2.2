// ─────────────────────────────────────────────────────────────────────────
//  24 · inserting thousands separators                       ★★★ stretch
//  concepts: lookahead · lookbehind · zero-width replace
//  run: node 24-thousands-separators.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Intl.NumberFormat does this for you (exercise 22). Do it by hand once,
//  because "insert something between characters without deleting them" is
//  the whole point of zero-width assertions: the match is EMPTY, so the
//  replacement is pure insertion.
//
//      groupThousands('1234567')    → '1,234,567'
//      groupThousands('999')        → '999'
//      groupThousands('1234.5678')  → '1,234.5678'   (fraction untouched)
//      groupThousands('-1000')      → '-1,000'       (no comma after '-')
//      parseGrouped('1,234.5')      → 1234.5         (a number)
//
//  Input and output of groupThousands are STRINGS of digits, with an
//  optional leading '-' and an optional '.' fraction. parseGrouped goes
//  the other way and returns a number.
//
//  hint: you want the positions that have a digit behind them and a
//  multiple of three digits ahead: /(?<=\d)(?=(?:\d{3})+$)/g. Two traps
//  live here — anchor the group count, and remember that '.5678' is a run
//  of digits too, so the fraction needs to be out of the way first.

import { test, eq } from '../../_lib/check.js';

export function groupThousands(numberText) {
  throw new Error('TODO');
}

export function parseGrouped(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('groups a long integer every three digits', () => {
  eq(groupThousands('1234567'), '1,234,567');
  eq(groupThousands('1000'), '1,000');
});

test('leaves three digits or fewer alone', () => {
  eq(groupThousands('999'), '999');
  eq(groupThousands('12'), '12');
  eq(groupThousands('0'), '0');
});

test('never groups the digits after the decimal point', () => {
  eq(groupThousands('1234.5678'), '1,234.5678');
  eq(groupThousands('0.123456'), '0.123456');
});

test('groups the integer part of a long decimal', () => {
  eq(groupThousands('9876543.21'), '9,876,543.21');
});

test('keeps a leading minus and puts no comma after it', () => {
  eq(groupThousands('-1000'), '-1,000');
  eq(groupThousands('-999'), '-999');
  eq(groupThousands('-1234567.5'), '-1,234,567.5');
});

test('parseGrouped strips the separators and returns a number', () => {
  eq(parseGrouped('1,234.5'), 1234.5);
  eq(parseGrouped('1,000,000'), 1000000);
  eq(parseGrouped('42'), 42);
});

test('parseGrouped keeps the sign', () => {
  eq(parseGrouped('-1,234'), -1234);
});

test('the two functions round-trip', () => {
  for (const n of [0, 7, 1234, 1234567, -98765.25]) {
    eq(parseGrouped(groupThousands(String(n))), n);
  }
});
