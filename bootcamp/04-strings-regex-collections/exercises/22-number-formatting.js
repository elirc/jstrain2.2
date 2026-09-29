// ─────────────────────────────────────────────────────────────────────────
//  22 · number formatting                                       ★★☆ core
//  concepts: toFixed · floating point · Intl.NumberFormat
//  run: node 22-number-formatting.js
// ─────────────────────────────────────────────────────────────────────────
//
//  toFixed returns a STRING and rounds the binary double, not the
//  decimal you typed: (1.005).toFixed(2) is '1.00', because 1.005 is
//  really 1.00499999999999989. Round with numbers, format with Intl.
//
//      round2(3.14159)          → 3.14      (a number, not a string)
//      round2(1.005)            → 1.01      (the case toFixed gets wrong)
//      round2(2)                → 2
//      formatThousands(1234567) → '1,234,567'
//      formatUSD(1234.5)        → '$1,234.50'
//
//  Always pass an explicit locale to Intl — 'en-US' here — or your
//  output changes with the machine's settings and your tests lie.
//
//  hint: Math.round((n + Number.EPSILON) * 100) / 100 nudges the value
//  past the binary shortfall before rounding; Intl.NumberFormat('en-US')
//  with no options already groups thousands, and { style: 'currency',
//  currency: 'USD' } does money.

import { test, eq, ok } from '../../_lib/check.js';

export function round2(n) {
  throw new Error('TODO');
}

export function formatThousands(n) {
  throw new Error('TODO');
}

export function formatUSD(amount) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('round2 returns a number, not a string', () => {
  ok(typeof round2(1.5) === 'number');
});

test('round2 keeps two decimals', () => {
  eq(round2(3.14159), 3.14);
  eq(round2(2.71828), 2.72);
});

test('round2 rounds 1.005 up, where toFixed rounds it down', () => {
  eq(round2(1.005), 1.01);
  eq((1.005).toFixed(2), '1.00');
});

test('round2 leaves whole and short numbers alone', () => {
  eq(round2(2), 2);
  eq(round2(0.5), 0.5);
});

test('formatThousands groups with commas', () => {
  eq(formatThousands(1234567), '1,234,567');
});

test('formatThousands leaves small numbers ungrouped', () => {
  eq(formatThousands(42), '42');
  eq(formatThousands(0), '0');
});

test('formatUSD prints the symbol and two decimals', () => {
  eq(formatUSD(1234.5), '$1,234.50');
  eq(formatUSD(0), '$0.00');
});

test('formatUSD rounds to whole cents', () => {
  eq(formatUSD(9.999), '$10.00');
  eq(formatUSD(1000000), '$1,000,000.00');
});
