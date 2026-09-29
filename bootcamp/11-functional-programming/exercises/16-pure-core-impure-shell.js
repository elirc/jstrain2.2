// ─────────────────────────────────────────────────────────────────────────
//  16 · pure core, impure shell                             ★★★ stretch
//  concepts: purity · decomposition · dependency injection
//  run: node 16-pure-core-impure-shell.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The finale. One 40-line `processOrder` currently does the maths, reads
//  the clock, writes to the database and logs — so it can only be tested
//  with a database. Break it into five pure functions plus ONE thin shell
//  that touches the outside world.
//
//    lineTotal({ qty: 2, unitPrice: 12.5 })      → 25
//    orderSubtotal(order)                        → sum of line totals
//    discountFor(subtotal, customer)             → gold 10%, silver 5%,
//                                                  anything else 0
//    shippingFor(amount, order)                  → 0 if order.digital,
//                                                  0 if amount >= 50,
//                                                  else 4.99
//    summarize(order, customer)
//      → { subtotal, discount, shipping, total }
//        shipping is decided on the DISCOUNTED amount (subtotal - discount)
//        total = subtotal - discount + shipping
//
//    processOrder(order, customer, deps)   ← the only impure one
//      builds { id, at, ...summary } with at = deps.now(),
//      calls deps.save(record) once, then deps.log(...) once,
//      and returns the record.
//
//  Round every money value with the provided round2. The order is frozen.
//
//  hint: the shell should have no arithmetic in it at all — if it does,
//  that logic is untestable without deps.

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

export function lineTotal(line) {
  throw new Error('TODO');
}

export function orderSubtotal(order) {
  throw new Error('TODO');
}

export function discountFor(subtotal, customer) {
  throw new Error('TODO');
}

export function shippingFor(amount, order) {
  throw new Error('TODO');
}

export function summarize(order, customer) {
  throw new Error('TODO');
}

export function processOrder(order, customer, deps) {
  throw new Error('TODO');
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
