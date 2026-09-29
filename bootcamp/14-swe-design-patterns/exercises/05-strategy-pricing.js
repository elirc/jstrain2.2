// ─────────────────────────────────────────────────────────────────────────
//  05 · pricing strategies                                      ★★☆ core
//  concepts: strategy · runtime selection · behaviour as a parameter
//  run: node exercises/05-strategy-pricing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Checkout needs three price rules today and marketing will invent a
//  fourth on Friday. Write each rule as a plain function with the same
//  signature `(unitPrice, qty) → number`, then a context object that
//  holds whichever one it was handed.
//
//      regularPrice(20, 3)   → 60      unitPrice × qty
//      memberPrice(20, 3)    → 54      10% off — 15% off at qty >= 10
//      salePrice(20, 7)      → 100     buy 2 get 1 free (pay for 5 of 7)
//
//      pickPricing('member') → memberPrice     unknown tier → regularPrice
//
//      const p = createPricer({ pricing: regularPrice, shipping: flat });
//      p.quote(20, 3, 2)  → { goods: 60, shipping: 6, total: 66 }
//      p.setPricing(memberPrice)   // same object, new behaviour
//      p.setShipping(byWeight)
//
//  Round every money value with the provided `round2`.
//
//  hint: the pricer never asks "which tier is this?" — it just calls
//  the function it is holding

import { test, eq, ok } from '../../_lib/check.js';

const round2 = (n) => Math.round(n * 100) / 100;

export function regularPrice(unitPrice, qty) {
  throw new Error('TODO');
}

export function memberPrice(unitPrice, qty) {
  throw new Error('TODO');
}

export function salePrice(unitPrice, qty) {
  throw new Error('TODO');
}

export function pickPricing(tier) {
  throw new Error('TODO');
}

export function createPricer({ pricing, shipping }) {
  throw new Error('TODO');
}

// two shipping strategies, already written — same idea, different axis
const flatShipping = () => 6;
const byWeightShipping = (weightKg) => round2(2 + weightKg * 1.5);

// ──────────────────────────── tests ──────────────────────────────────────

test('the regular price is just unit price times quantity', () => {
  eq(regularPrice(20, 3), 60);
  eq(regularPrice(9.99, 3), 29.97);
});

test('members save 10 percent', () => {
  eq(memberPrice(20, 3), 54);
});

test('members save 15 percent from ten units', () => {
  eq(memberPrice(20, 10), 170);
  eq(memberPrice(20, 9), 162);
});

test('the sale gives every third unit free', () => {
  eq(salePrice(20, 7), 100);
  eq(salePrice(20, 2), 40);
  eq(salePrice(20, 3), 40);
});

test('a tier name selects a strategy, unknown tiers fall back', () => {
  ok(pickPricing('member') === memberPrice);
  ok(pickPricing('sale') === salePrice);
  ok(pickPricing('regular') === regularPrice);
  ok(pickPricing('platinum-elite') === regularPrice);
});

test('the pricer quotes with the strategies it was handed', () => {
  const pricer = createPricer({ pricing: regularPrice, shipping: flatShipping });
  eq(pricer.quote(20, 3, 2), { goods: 60, shipping: 6, total: 66 });
});

test('swapping the pricing strategy needs no new pricer', () => {
  const pricer = createPricer({ pricing: regularPrice, shipping: flatShipping });
  pricer.setPricing(memberPrice);
  eq(pricer.quote(20, 3, 2), { goods: 54, shipping: 6, total: 60 });
});

test('shipping swaps on its own axis', () => {
  const pricer = createPricer({ pricing: salePrice, shipping: flatShipping });
  pricer.setShipping(byWeightShipping);
  eq(pricer.quote(20, 7, 2), { goods: 100, shipping: 5, total: 105 });
});
