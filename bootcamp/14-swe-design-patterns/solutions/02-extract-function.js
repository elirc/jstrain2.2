// ─────────────────────────────────────────────────────────────────────────
//  02 · processOrder — SOLUTION                                 ★★☆ core
//  concepts: decomposition · single responsibility · composition
//  run: node solutions/02-extract-function.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — give every rule its own name so it can be read, tested and
//  changed alone. The composer becomes a table of contents: you can see
//  the whole checkout policy in six lines without reading any arithmetic.
//  Each piece is a pure function of its inputs, so the tests above pin
//  the *rules* (discount, shipping) separately from the *sequence*.
//  When NOT to use: don't extract a function you can only name after its
//  caller (`doStep2`) — that's a sign the seam is in the wrong place, and
//  a chain of one-line indirections is harder to read than the original.
//  In the wild: this is the refactor behind every "service layer" — and
//  it is what makes a Redux reducer or a pricing engine testable.
//  Classic wrong turn: rounding only at the end. Round each money value
//  as you produce it and every intermediate number stays a real price.

import { test, eq } from '../../_lib/check.js';

export const round2 = (n) => Math.round(n * 100) / 100;

export function subtotal(items) {
  return round2(items.reduce((sum, item) => sum + item.price * item.qty, 0));
}

export function discountFor(amount, coupon) {
  return coupon === 'SAVE10' ? round2(amount * 0.1) : 0;
}

export function shippingFor(amount, coupon) {
  if (coupon === 'FREESHIP') return 0;
  return amount >= 50 ? 0 : 5.99;
}

export function taxFor(amount, rate) {
  return round2(amount * rate);
}

export function processOrder(order) {
  const sub = subtotal(order.items);
  const discount = discountFor(sub, order.coupon);
  const taxable = round2(sub - discount);
  const shipping = shippingFor(taxable, order.coupon);
  const tax = taxFor(taxable, order.taxRate);
  return {
    subtotal: sub,
    discount,
    shipping,
    tax,
    total: round2(taxable + shipping + tax),
  };
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
