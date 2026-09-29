// ─────────────────────────────────────────────────────────────────────────
//  09 · invoice settlement                                      ★★☆ core
//  concepts: bug hunt · floating point · money in cents
//  run: node 09-floating-point-money.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A billing module. Every amount inside it is an integer number of
//  cents — dollars exist only at the edges, on the way in and on the
//  way out. An invoice is settled when the balance is exactly zero.
//
//      lineCents({ unitPrice: 1.1, quantity: 3 })  → 330
//      taxCents(1999, 0.0825)                      → 165
//      formatUsd(1799)                             → '$17.99'
//      settle(DESK, 0, [15, 4.75]).balanceCents    → 24
//      settle(SNACKS, 0, [1.1, 2.2]).settled       → true
//
//  The code below is fully written — and wrong. 2 tests fail. Find the
//  bug, fix it with the smallest change. Don't rewrite.
//
//  hint: this module has an invariant — every number it hands around is
//  a whole number of cents. Walk the failing case forward and print each
//  intermediate; the bug is wherever that invariant first breaks.

import { test, eq, ok } from '../../_lib/check.js';

export function toCents(dollars) {
  return Math.round(dollars * 100);
}

export function formatUsd(cents) {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, '0');
  return `${sign}$${whole}.${rest}`;
}

export function lineCents(line) {
  return toCents(line.unitPrice) * line.quantity;
}

export function subtotalCents(lines) {
  return lines.reduce((sum, line) => sum + lineCents(line), 0);
}

export function taxCents(subtotal, rate) {
  return Math.round(subtotal * rate);
}

export function invoiceCents(lines, rate) {
  const subtotal = subtotalCents(lines);
  return subtotal + taxCents(subtotal, rate);
}

export function settle(lines, rate, payments) {
  const dueCents = invoiceCents(lines, rate);
  const paidCents = payments.reduce((sum, paid) => sum + paid * 100, 0);
  const balanceCents = dueCents - paidCents;
  return { dueCents, paidCents, balanceCents, settled: balanceCents === 0 };
}

const SNACKS = [
  { sku: 'muffin', unitPrice: 1.1, quantity: 1 },
  { sku: 'juice', unitPrice: 2.2, quantity: 1 },
];
const DESK = [{ sku: 'desk', unitPrice: 19.99, quantity: 1 }];

// ──────────────────────────── tests ──────────────────────────────────────

test('toCents lands on the cent a human would write down', () => {
  eq(toCents(1.15), 115);
  eq(toCents(0.29), 29);
  eq(toCents(19.99), 1999);
  eq(toCents(0), 0);
});

test('formatUsd pads the cents and keeps the sign', () => {
  eq(formatUsd(1799), '$17.99');
  eq(formatUsd(5), '$0.05');
  eq(formatUsd(0), '$0.00');
  eq(formatUsd(-501), '-$5.01');
});

test('a line multiplies whole cents, never dollars', () => {
  eq(lineCents({ unitPrice: 1.1, quantity: 3 }), 330);
  eq(lineCents({ unitPrice: 19.99, quantity: 2 }), 3998);
  eq(subtotalCents([...SNACKS, ...DESK]), 2329);
});

test('tax rounds to the nearest cent', () => {
  eq(taxCents(1999, 0.0825), 165);
  eq(invoiceCents(DESK, 0.0825), 2164);
  eq(invoiceCents(DESK, 0), 1999);
});

test('a partial payment leaves an exact positive balance', () => {
  const result = settle(DESK, 0, [15, 4.75]);
  eq(result.paidCents, 1975);
  eq(result.balanceCents, 24);
  eq(result.settled, false);
});

test('an overpayment reports a negative balance, not a settlement', () => {
  const result = settle(DESK, 0, [25]);
  eq(result.balanceCents, -501);
  eq(result.settled, false);
});

test('payments in awkward dollars still total a whole number of cents', () => {
  const result = settle(SNACKS, 0, [1.1, 2.2]);
  ok(Number.isInteger(result.paidCents), 'paidCents must be an integer');
  eq(result.paidCents, 330);
});

test('$1.10 plus $2.20 settles a $3.30 invoice', () => {
  const result = settle(SNACKS, 0, [1.1, 2.2]);
  eq(result.balanceCents, 0);
  eq(result.settled, true);
});
