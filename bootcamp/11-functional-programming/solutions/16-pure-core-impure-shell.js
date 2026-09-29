// ─────────────────────────────────────────────────────────────────────────
//  16 · pure core, impure shell — SOLUTION                  ★★★ stretch
//  run: node 16-pure-core-impure-shell.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: five functions that only know arithmetic, and one that
//  only knows plumbing. Look at what that buys you — every pricing rule in
//  this file is tested with a plain `eq` and no test double at all; the
//  spies appear exactly once, in the two tests that cover the shell.
//  `summarize` is the seam. It is the whole business calculation as ONE
//  pure function, so a caller in an HTTP route, a cron job or a refund
//  script all get identical numbers.
//  `deps` is dependency injection with no framework: the clock is a
//  function you pass in, which is why the test can assert `at` exactly
//  instead of fuzzing around Date.now(). Reading the clock inside a
//  "pure" function is the most common way purity dies quietly.
//  Note the shell contains no arithmetic — the moment you write
//  `subtotal * 0.9` in there, that rule is only reachable through deps.

import { test, eq, ok, spy } from '../../_lib/check.js';

const round2 = (n) => Math.round(n * 100) / 100;

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const order = deepFreeze({
  id: 'o-1',
  digital: false,
  lines: [
    { sku: 'mug', qty: 2, unitPrice: 12.5 },
    { sku: 'pen', qty: 3, unitPrice: 1.25 },
  ],
});

const bigOrder = deepFreeze({
  id: 'o-2',
  digital: false,
  lines: [{ sku: 'chair', qty: 4, unitPrice: 15 }],
});

const TIER_RATES = { gold: 0.1, silver: 0.05 };
const FREE_SHIPPING_FROM = 50;
const FLAT_SHIPPING = 4.99;

export function lineTotal(line) {
  return round2(line.qty * line.unitPrice);
}

export function orderSubtotal(order) {
  return round2(order.lines.reduce((sum, line) => sum + lineTotal(line), 0));
}

export function discountFor(subtotal, customer) {
  return round2(subtotal * (TIER_RATES[customer.tier] ?? 0));
}

export function shippingFor(amount, order) {
  if (order.digital) return 0;
  return amount >= FREE_SHIPPING_FROM ? 0 : FLAT_SHIPPING;
}

export function summarize(order, customer) {
  const subtotal = orderSubtotal(order);
  const discount = discountFor(subtotal, customer);
  const shipping = shippingFor(round2(subtotal - discount), order);
  const total = round2(subtotal - discount + shipping);
  return { subtotal, discount, shipping, total };
}

export function processOrder(order, customer, deps) {
  const summary = summarize(order, customer);
  const record = { id: order.id, at: deps.now(), ...summary };
  deps.save(record);
  deps.log(`order ${record.id} processed for ${record.total}`);
  return record;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('lineTotal multiplies quantity by unit price and rounds', () => {
  eq(lineTotal({ sku: 'mug', qty: 2, unitPrice: 12.5 }), 25);
  eq(lineTotal({ sku: 'nut', qty: 3, unitPrice: 0.1 }), 0.3);
});

test('orderSubtotal adds up every line', () => {
  eq(orderSubtotal(order), 28.75);
  eq(orderSubtotal({ id: 'x', digital: false, lines: [] }), 0);
});

test('discountFor knows the tiers and ignores the rest', () => {
  eq(discountFor(100, { tier: 'gold' }), 10);
  eq(discountFor(100, { tier: 'silver' }), 5);
  eq(discountFor(100, { tier: 'bronze' }), 0);
  eq(discountFor(100, {}), 0);
});

test('shipping is free over the threshold and for digital orders', () => {
  eq(shippingFor(49.99, order), 4.99);
  eq(shippingFor(50, order), 0);
  eq(shippingFor(1, { ...order, digital: true }), 0);
});

test('summarize puts the four numbers together, touching nothing', () => {
  eq(summarize(order, { tier: 'gold' }), {
    subtotal: 28.75,
    discount: 2.88,
    shipping: 4.99,
    total: 30.86,
  });
  eq(order.lines[0].qty, 2, 'the frozen order is unchanged');
});

test('summarize charges no shipping once the discount still clears 50', () => {
  eq(summarize(bigOrder, { tier: 'silver' }), {
    subtotal: 60,
    discount: 3,
    shipping: 0,
    total: 57,
  });
});

test('processOrder saves one record built from the summary', () => {
  const save = spy();
  const log = spy();
  const record = processOrder(
    order,
    { tier: 'gold' },
    { now: () => 1700000000000, save, log }
  );
  eq(record, {
    id: 'o-1',
    at: 1700000000000,
    subtotal: 28.75,
    discount: 2.88,
    shipping: 4.99,
    total: 30.86,
  });
  eq(save.callCount, 1);
  eq(save.calls[0][0], record);
});

test('processOrder takes the time from deps and logs exactly once', () => {
  const log = spy();
  const record = processOrder(
    bigOrder,
    { tier: 'none' },
    { now: () => 42, save: spy(), log }
  );
  eq(record.at, 42);
  eq(log.callCount, 1);
  ok(typeof log.calls[0][0] === 'string', 'log is called with a message');
});
