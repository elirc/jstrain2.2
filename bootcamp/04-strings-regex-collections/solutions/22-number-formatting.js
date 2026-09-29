// ─────────────────────────────────────────────────────────────────────────
//  22 · number formatting — SOLUTION                            ★★☆ core
//  run: node 22-number-formatting.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: round2 scales up, rounds, scales back — the standard
//  trick. Number.EPSILON is the smallest gap between 1 and the next
//  double; adding it nudges values like 1.005 (stored as
//  1.00499999999999989) over the .5 line before Math.round sees them.
//  toFixed(2) would answer '1.00' — and a string, which then gets
//  compared, sorted or added as text somewhere downstream.
//  Intl.NumberFormat does the presentation. ALWAYS pass a locale: with no
//  argument it reads the machine's, so 1234.5 prints '1.234,5' in Germany
//  and your test fails on a colleague's laptop. Constructing the
//  formatter once at module scope is also much faster than per call.

import { test, eq, ok } from '../../_lib/check.js';

const groupFormat = new Intl.NumberFormat('en-US');
const usdFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatThousands(n) {
  return groupFormat.format(n);
}

export function formatUSD(amount) {
  return usdFormat.format(amount);
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
