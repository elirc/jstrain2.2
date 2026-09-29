// ─────────────────────────────────────────────────────────────────────────
//  05 · pricing strategies — SOLUTION                           ★★☆ core
//  concepts: strategy · runtime selection · behaviour as a parameter
//  run: node solutions/05-strategy-pricing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — make an algorithm a value you can pass around, so the code
//  that *uses* it never grows a branch when a new one appears.
//  The tell is in `createPricer`: no `if (tier === ...)` anywhere. It
//  calls `this.pricing(...)`, so adding a Black Friday rule means adding
//  a function and one registry entry — the pricer file stays closed.
//  In JS a strategy is just a function; classes are optional ceremony.
//  When NOT to use: two branches that will never grow are cheaper as an
//  `if`. Strategy also hurts when the "strategies" need wildly different
//  arguments — that's a sign they aren't the same operation.
//  In the wild: `[].sort(comparator)`, Passport strategies, webpack
//  loaders, Express's `app.set('view engine', ...)`.
//  Classic wrong turn: letting the context inspect the strategy
//  (`if (pricing === memberPrice)`) — that puts the branch right back.

import { test, eq, ok } from '../../_lib/check.js';

const round2 = (n) => Math.round(n * 100) / 100;

export function regularPrice(unitPrice, qty) {
  return round2(unitPrice * qty);
}

export function memberPrice(unitPrice, qty) {
  const rate = qty >= 10 ? 0.85 : 0.9;
  return round2(unitPrice * qty * rate);
}

export function salePrice(unitPrice, qty) {
  const payable = qty - Math.floor(qty / 3);
  return round2(unitPrice * payable);
}

const PRICING = { regular: regularPrice, member: memberPrice, sale: salePrice };

export function pickPricing(tier) {
  return PRICING[tier] ?? regularPrice;
}

export function createPricer({ pricing, shipping }) {
  let price = pricing;
  let ship = shipping;
  return {
    quote(unitPrice, qty, weightKg) {
      const goods = round2(price(unitPrice, qty));
      const freight = round2(ship(weightKg));
      return { goods, shipping: freight, total: round2(goods + freight) };
    },
    setPricing(next) {
      price = next;
    },
    setShipping(next) {
      ship = next;
    },
  };
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
