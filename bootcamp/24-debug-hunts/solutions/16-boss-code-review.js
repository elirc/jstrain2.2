// ─────────────────────────────────────────────────────────────────────────
//  16 · the code review — SOLUTION                           ★★★ stretch
//  run: node 16-boss-code-review.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three bugs, three classes, one file.
//
//  1 · SHARED REFERENCE — `copyCart`. The spread copies the cart object
//  and `map` gives the lines new objects, but `coupons` came along as
//  the same array. The tell is the asymmetry: someone thought carefully
//  about one nested array and not the other, which is what a half-done
//  deep copy always looks like. Fix: `coupons: [...cart.coupons]`. A
//  spread is one level deep — say that out loud at every `{ ...x }`.
//
//  2 · SORT COMPARATOR — `bestCoupon`. `sort` is ascending, `[0]` is the
//  smallest, so "best" meant "cheapest discount": the customer was
//  handed $5 off instead of $24. The tell is a function whose NAME says
//  max and whose body says `sort(…a - b…)[0]`. Never trust the name over
//  the body. Fix: subtract the other way round — or skip the sort and
//  use `reduce` to keep the max, which cannot be read backwards.
//
//  3 · FLOAT MONEY — `discountCents`. 10% of 23997 is 2399.7, and a
//  fraction of a cent then leaks into every total downstream. The tell
//  is a division inside a function whose name ends in `Cents`. Fix:
//  `Math.round(…)` around the percentage — round once, at the moment
//  money is created, never at the moment it is displayed.
//
//  Why they survived CI: each bug needs two coupons, or two carts, or a
//  price that is not a round number. Every test that used one coupon on
//  one cart at $100.00 passed. Fixtures that are too tidy are how bugs
//  get through review, and picking the awkward number on purpose is the
//  cheapest test-design habit you can build.

import { test, eq, ok, throws } from '../../_lib/check.js';

export const CATALOG = {
  'desk-01': 19999,
  'chair-7': 8950,
  'lamp-3': 1999,
  'mat-2': 1250,
};

export const COUPONS = [
  { code: 'FIVER', kind: 'flat', cents: 500 },
  { code: 'TWENTY', kind: 'flat', cents: 2000, minCents: 10000 },
  { code: 'TENOFF', kind: 'percent', percent: 10 },
  { code: 'HALF', kind: 'percent', percent: 50, minCents: 50000 },
];

export function createCart() {
  return { lines: [], coupons: [] };
}

export function copyCart(cart) {
  return {
    ...cart,
    lines: cart.lines.map((line) => ({ ...line })),
    coupons: [...cart.coupons],
  };
}

export function addLine(cart, sku, qty = 1) {
  const priceCents = CATALOG[sku];
  if (priceCents === undefined) throw new Error(`unknown sku: ${sku}`);
  const existing = cart.lines.find((line) => line.sku === sku);
  if (existing) existing.qty += qty;
  else cart.lines.push({ sku, priceCents, qty });
  return cart;
}

export function addCoupon(cart, code) {
  const coupon = COUPONS.find((entry) => entry.code === code);
  if (!coupon) throw new Error(`unknown coupon: ${code}`);
  cart.coupons.push(coupon);
  return cart;
}

export function subtotalCents(cart) {
  return cart.lines.reduce((sum, line) => sum + line.priceCents * line.qty, 0);
}

export function discountCents(coupon, subtotal) {
  if (subtotal < (coupon.minCents ?? 0)) return 0;
  if (coupon.kind === 'flat') return Math.min(coupon.cents, subtotal);
  return Math.round(subtotal * (coupon.percent / 100));
}

export function bestCoupon(cart) {
  const subtotal = subtotalCents(cart);
  const usable = cart.coupons.filter(
    (coupon) => discountCents(coupon, subtotal) > 0
  );
  if (usable.length === 0) return null;
  const ranked = [...usable].sort(
    (a, b) => discountCents(b, subtotal) - discountCents(a, subtotal)
  );
  return ranked[0];
}

export function totalCents(cart) {
  const subtotal = subtotalCents(cart);
  const coupon = bestCoupon(cart);
  return subtotal - (coupon ? discountCents(coupon, subtotal) : 0);
}

export function receipt(cart) {
  const coupon = bestCoupon(cart);
  return {
    items: cart.lines.reduce((count, line) => count + line.qty, 0),
    subtotalCents: subtotalCents(cart),
    couponCode: coupon ? coupon.code : null,
    totalCents: totalCents(cart),
  };
}

const couponBy = (code) => COUPONS.find((entry) => entry.code === code);

// ──────────────────────────── tests ──────────────────────────────────────

test('addLine merges repeats and prices them from the catalog', () => {
  const cart = createCart();
  addLine(cart, 'lamp-3', 2);
  addLine(cart, 'lamp-3');
  eq(cart.lines.length, 1);
  eq(cart.lines[0], { sku: 'lamp-3', priceCents: 1999, qty: 3 });
  eq(subtotalCents(cart), 5997);
});

test('unknown skus and coupon codes are refused', () => {
  const cart = createCart();
  throws(() => addLine(cart, 'nope'), 'unknown sku');
  throws(() => addCoupon(cart, 'NOPE'), 'unknown coupon');
  eq(receipt(cart).couponCode, null);
  eq(totalCents(cart), 0);
});

test('a flat coupon is capped at the subtotal and gated by its minimum', () => {
  eq(discountCents(couponBy('FIVER'), 300), 300);
  eq(discountCents(couponBy('FIVER'), 19999), 500);
  eq(discountCents(couponBy('TWENTY'), 5000), 0);
  eq(discountCents(couponBy('TWENTY'), 19999), 2000);
});

test('a copied cart gets its own line objects', () => {
  const original = createCart();
  addLine(original, 'lamp-3', 2);
  const draft = copyCart(original);
  addLine(draft, 'lamp-3', 5);
  addLine(draft, 'mat-2');
  eq(original.lines.length, 1);
  eq(original.lines[0].qty, 2);
  eq(draft.lines[0].qty, 7);
});

test('a copied cart gets its own coupons', () => {
  const original = createCart();
  addLine(original, 'lamp-3');
  const draft = copyCart(original);
  addCoupon(draft, 'FIVER');
  eq(draft.coupons.length, 1);
  eq(original.coupons.length, 0);
  eq(bestCoupon(original), null);
});

test('the best coupon is the one worth the most money', () => {
  const cart = createCart();
  addLine(cart, 'desk-01');
  addCoupon(cart, 'FIVER');
  addCoupon(cart, 'TWENTY');
  eq(bestCoupon(cart).code, 'TWENTY');
  eq(totalCents(cart), 17999);
});

test('a percentage discount lands on a whole number of cents', () => {
  eq(discountCents(couponBy('TENOFF'), 1999), 200);
  eq(discountCents(couponBy('TENOFF'), 10000), 1000);
  ok(Number.isInteger(discountCents(couponBy('TENOFF'), 23997)));
});

test('the receipt the customer complained about', () => {
  const cart = createCart();
  addLine(cart, 'desk-01');
  addLine(cart, 'lamp-3', 2);
  addCoupon(cart, 'FIVER');
  addCoupon(cart, 'TENOFF');
  addCoupon(cart, 'HALF');
  eq(receipt(cart), {
    items: 3,
    subtotalCents: 23997,
    couponCode: 'TENOFF',
    totalCents: 21597,
  });
});
