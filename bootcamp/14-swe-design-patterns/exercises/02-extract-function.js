// ─────────────────────────────────────────────────────────────────────────
//  02 · processOrder                                            ★★☆ core
//  concepts: decomposition · single responsibility · composition
//  run: node exercises/02-extract-function.js
// ─────────────────────────────────────────────────────────────────────────
//
//  One 60-line `processOrder` does five jobs and can only be tested from
//  the outside. Split it into four small exported functions plus one
//  composer that wires them together. Use the provided `round2` on every
//  money value so cents never drift.
//
//      subtotal(items)              → round2(sum of price × qty)
//      discountFor(sub, coupon)     → 'SAVE10' → 10% of sub, else 0
//      shippingFor(amount, coupon)  → 0 if coupon is 'FREESHIP'
//                                     0 if amount >= 50, else 5.99
//      taxFor(amount, rate)         → round2(amount × rate)
//
//      processOrder({ items, coupon, taxRate }) →
//        { subtotal, discount, shipping, tax, total }
//
//  In the composer: taxable = round2(subtotal − discount); shipping and
//  tax are both computed from `taxable`, and
//  total = round2(taxable + shipping + tax).
//
//  hint: the composer should be ~6 lines and contain no arithmetic
//  beyond one subtraction and one addition

import { test, eq } from '../../_lib/check.js';

export const round2 = (n) => Math.round(n * 100) / 100;

export function subtotal(items) {
  throw new Error('TODO');
}

export function discountFor(amount, coupon) {
  throw new Error('TODO');
}

export function shippingFor(amount, coupon) {
  throw new Error('TODO');
}

export function taxFor(amount, rate) {
  throw new Error('TODO');
}

export function processOrder(order) {
  throw new Error('TODO');
}

const CART = [
  { sku: 'mug', price: 9.99, qty: 2 },
  { sku: 'tee', price: 20, qty: 1 },
];

// ──────────────────────────── tests ──────────────────────────────────────

test('subtotal sums price times quantity', () => {
  eq(subtotal(CART), 39.98);
  eq(subtotal([]), 0);
});

test('discountFor only honours the coupon it knows', () => {
  eq(discountFor(39.98, 'SAVE10'), 4);
  eq(discountFor(39.98, 'BOGUS'), 0);
  eq(discountFor(39.98, undefined), 0);
});

test('shippingFor is free over 50 or with FREESHIP', () => {
  eq(shippingFor(35.98, undefined), 5.99);
  eq(shippingFor(50, undefined), 0);
  eq(shippingFor(1, 'FREESHIP'), 0);
});

test('taxFor rounds to cents', () => {
  eq(taxFor(35.98, 0.08), 2.88);
  eq(taxFor(0, 0.08), 0);
});

test('processOrder returns every line of the summary', () => {
  eq(processOrder({ items: CART, coupon: 'SAVE10', taxRate: 0.08 }), {
    subtotal: 39.98,
    discount: 4,
    shipping: 5.99,
    tax: 2.88,
    total: 44.85,
  });
});

test('a big cart ships free and takes no discount', () => {
  eq(processOrder({ items: [{ sku: 'rug', price: 60, qty: 1 }], taxRate: 0.08 }), {
    subtotal: 60,
    discount: 0,
    shipping: 0,
    tax: 4.8,
    total: 64.8,
  });
});

test('FREESHIP zeroes shipping but not tax', () => {
  const out = processOrder({ items: CART, coupon: 'FREESHIP', taxRate: 0.1 });
  eq(out.shipping, 0);
  eq(out.discount, 0);
  eq(out.total, 43.98);
});
