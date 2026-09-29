// ─────────────────────────────────────────────────────────────────────────
//  33 · cents, not floats                                       ★★☆ core
//  concepts: integer money · float traps · parsing digits not doubles
//  run: node 33-money-cents.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The rule every payments team learns once: money is an integer count of
//  the smallest unit. Convert at the edges, never store dollars in a
//  double, and never multiply a price by 100 to "get cents".
//
//      parsePrice('12.34')      → 1234       parsePrice('7')      → 700
//      parsePrice('$1,234.50')  → 123450     parsePrice('0.5')    → 50
//      parsePrice('-2.50')      → -250       parsePrice('12.345') → null
//
//  A price is an optional leading '$', optional thousands commas, digits,
//  and at most two decimals. Anything else — including a number instead of
//  a string — is null.
//
//      formatCents(1234) → '$12.34'    formatCents(5)  → '$0.05'
//      formatCents(0)    → '$0.00'     formatCents(-5) → '-$0.05'
//
//  cartTotal(items, taxPercent) sums `price` × `qty` (qty defaults to 1) in
//  whole cents, then adds tax ONCE, rounded to the nearest cent:
//
//      cartTotal([{ price: '12.34', qty: 2 }, { price: '0.99' }])  → 2567
//      cartTotal([{ price: '12.34', qty: 2 }, { price: '0.99' }], 8.25)
//      → 2779         (2567 + round(2567 × 8.25 / 100) = 2567 + 212)
//
//  A price cartTotal cannot parse throws an Error starting 'bad price:'.
//
//  hint: split the string on '.' and pad the fraction to two digits, so
//  the cents come from CHARACTERS. `Math.round(1.005 * 100)` is 100.

import { test, eq, throws } from '../../_lib/check.js';

export function parsePrice(text) {
  throw new Error('TODO');
}

export function formatCents(cents) {
  throw new Error('TODO');
}

export function cartTotal(items, taxPercent = 0) {
  throw new Error('TODO');
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
