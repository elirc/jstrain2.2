// ─────────────────────────────────────────────────────────────────────────
//  33 · cents, not floats — SOLUTION                            ★★☆ core
//  run: node 33-money-cents.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: parsePrice never converts the whole price to a number.
//  It splits on '.', pads the fraction to two characters, and adds
//  `dollars * 100 + cents` — all integers, all exact. The tempting
//  `Math.round(Number(text) * 100)` works for most inputs and then quietly
//  loses a cent on the ones that matter: `1.005 * 100` is
//  100.49999999999999, so Math.round gives 100 and the customer is
//  undercharged.
//
//  Once everything is cents, arithmetic is integer arithmetic and stays
//  exact up to 2**53 cents — about 90 trillion dollars, which is enough.
//
//  Tax is applied ONCE to the subtotal. Rounding per line item instead
//  gives a different total for the same basket, which is the classic
//  "the invoice is off by one cent" bug.

import { test, eq, throws } from '../../_lib/check.js';

const PRICE = /^-?\d+(\.\d{1,2})?$/;

export function parsePrice(text) {
  if (typeof text !== 'string') return null;
  const cleaned = text.trim().replace(/^\$/, '').replace(/,/g, '');
  if (!PRICE.test(cleaned)) return null;
  const negative = cleaned.startsWith('-');
  const [dollars, fraction = ''] = (
    negative ? cleaned.slice(1) : cleaned
  ).split('.');
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, '0'));
  return negative ? -cents : cents;
}

export function formatCents(cents) {
  const abs = Math.abs(cents);
  const sign = cents < 0 ? '-' : '';
  const rest = String(abs % 100).padStart(2, '0');
  return `${sign}$${Math.trunc(abs / 100)}.${rest}`;
}

export function cartTotal(items, taxPercent = 0) {
  let subtotal = 0;
  for (const { price, qty = 1 } of items) {
    const cents = parsePrice(price);
    if (cents === null) throw new Error(`bad price: ${String(price)}`);
    subtotal += cents * qty;
  }
  return subtotal + Math.round((subtotal * taxPercent) / 100);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('parsePrice converts a price string to whole cents', () => {
  eq(parsePrice('12.34'), 1234);
  eq(parsePrice('0.5'), 50);
  eq(parsePrice('0.05'), 5);
  eq(parsePrice('7'), 700);
});

test('parsePrice accepts the shapes people actually type', () => {
  eq(parsePrice('$12.34'), 1234);
  eq(parsePrice('  $9.99  '), 999);
  eq(parsePrice('$1,234.50'), 123450);
  eq(parsePrice('-2.50'), -250);
});

test('parsePrice refuses anything it cannot read exactly', () => {
  eq(parsePrice('12.345'), null);
  eq(parsePrice('12.'), null);
  eq(parsePrice('.5'), null);
  eq(parsePrice('abc'), null);
  eq(parsePrice(''), null);
  eq(parsePrice(12.34), null);
  eq(parsePrice(null), null);
});

test('whole cents dodge the float traps dollars fall into', () => {
  eq(parsePrice('0.10') + parsePrice('0.20'), 30);
  eq(0.1 + 0.2 === 0.3, false); // the same sum in dollars
  eq(1.1 * 100, 110.00000000000001); // "just multiply by 100"
  eq(Math.round(1.005 * 100), 100); // and rounding does not save you
});

test('formatCents renders dollars, padding the cents', () => {
  eq(formatCents(1234), '$12.34');
  eq(formatCents(123450), '$1234.50');
  eq(formatCents(700), '$7.00');
});

test('formatCents handles zero, sub-dollar and negative amounts', () => {
  eq(formatCents(0), '$0.00');
  eq(formatCents(5), '$0.05');
  eq(formatCents(-5), '-$0.05');
  eq(formatCents(-250), '-$2.50');
});

test('cartTotal multiplies quantities in whole cents', () => {
  eq(cartTotal([{ price: '12.34', qty: 2 }, { price: '0.99' }]), 2567);
  eq(cartTotal([{ price: '0.01', qty: 3 }]), 3);
  eq(cartTotal([]), 0);
});

test('cartTotal applies tax once at the end, and refuses bad prices', () => {
  eq(cartTotal([{ price: '12.34', qty: 2 }, { price: '0.99' }], 8.25), 2779);
  eq(cartTotal([{ price: '10.00' }], 10), 1100);
  throws(() => cartTotal([{ price: 'free' }]), 'bad price:');
  throws(() => cartTotal([{ price: '1.005' }]), 'bad price:');
});
