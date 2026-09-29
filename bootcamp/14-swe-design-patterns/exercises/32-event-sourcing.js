// ─────────────────────────────────────────────────────────────────────────
//  32 · event sourcing, lite                                  ★★★ stretch
//  concepts: event sourcing · fold · replay · append-only
//  run: node exercises/32-event-sourcing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A row in a `carts` table answers "what is in the cart". It cannot
//  answer "what was in it before the coupon", "who removed the mug", or
//  "how often do people add and then remove". Store the FACTS instead
//  and compute the row.
//
//  1. An append-only log:
//         log.append('ItemAdded', { sku: 'tea', qty: 2, priceCents: 500 })
//           → { seq: 1, type: 'ItemAdded', data: {...} }
//         log.events()     → every event, oldest first (a copy)
//         log.replayTo(2)  → the events up to and including seq 2
//
//  2. A projection that folds events into state:
//         cartProjection(log.events())
//           → { items: [{ sku, qty, priceCents }], coupon,
//               subtotalCents, discountCents, totalCents }
//
//  The event types: ItemAdded {sku,qty,priceCents} · QuantityChanged
//  {sku,qty} · ItemRemoved {sku} · CouponApplied {code,percent} ·
//  CartCleared {}. `coupon` is the code string or null; discount is
//  `round(subtotal * percent / 100)`. An event type you do not know must
//  be ignored, not thrown at — a log outlives the code that reads it.
//
//  hint: the projection is a reduce over a table of per-type handlers;
//  nothing in it may read the clock or the outside world

import { test, eq, ok } from '../../_lib/check.js';

export function createEventLog() {
  // append(type, data) -> event · events() -> copy · replayTo(seq)
  throw new Error('TODO');
}

export function cartProjection(events) {
  throw new Error('TODO');
}

const shopping = (log) => {
  log.append('ItemAdded', { sku: 'tea', qty: 2, priceCents: 500 });
  log.append('ItemAdded', { sku: 'mug', qty: 1, priceCents: 1200 });
  log.append('QuantityChanged', { sku: 'tea', qty: 3 });
  log.append('CouponApplied', { code: 'SAVE10', percent: 10 });
  log.append('ItemRemoved', { sku: 'mug' });
  return log;
};

// ──────────────────────────── tests ──────────────────────────────────────

test('append stamps a growing sequence number and echoes the event', () => {
  const log = createEventLog();
  eq(log.append('ItemAdded', { sku: 'tea', qty: 1, priceCents: 500 }), {
    seq: 1,
    type: 'ItemAdded',
    data: { sku: 'tea', qty: 1, priceCents: 500 },
  });
  eq(log.append('CartCleared', {}).seq, 2);
  eq(log.events().length, 2);
});

test('the log is append-only: events() hands out a copy', () => {
  const log = createEventLog();
  log.append('ItemAdded', { sku: 'tea', qty: 1, priceCents: 500 });
  const stolen = log.events();
  stolen.push({ seq: 99, type: 'Forged', data: {} });
  stolen[0].type = 'Rewritten';
  eq(log.events().length, 1);
  eq(log.events()[0].type, 'ItemAdded');
});

test('the current state is a fold of every event', () => {
  const state = cartProjection(shopping(createEventLog()).events());
  eq(state, {
    items: [{ sku: 'tea', qty: 3, priceCents: 500 }],
    coupon: 'SAVE10',
    subtotalCents: 1500,
    discountCents: 150,
    totalCents: 1350,
  });
});

test('replay rebuilds the cart as it was at any point in the past', () => {
  const log = shopping(createEventLog());
  const beforeCoupon = cartProjection(log.replayTo(3));
  eq(beforeCoupon.coupon, null);
  eq(beforeCoupon.subtotalCents, 2700);
  eq(beforeCoupon.totalCents, 2700);

  const twoItems = cartProjection(log.replayTo(2));
  eq(twoItems.items.map((item) => item.sku), ['tea', 'mug']);
  eq(twoItems.totalCents, 2200);
});

test('an unknown event type is ignored so old logs still load', () => {
  const log = shopping(createEventLog());
  const before = cartProjection(log.events());
  log.append('GiftWrapRequested', { paper: 'kraft' });
  eq(cartProjection(log.events()), before);
});

test('the projection is pure: same events in, equal state out', () => {
  const events = shopping(createEventLog()).events();
  const first = cartProjection(events);
  const second = cartProjection(events);
  eq(first, second);
  ok(first !== second, 'a fresh object each time, not a cached one');
});

test('you correct a mistake by appending, never by editing', () => {
  const log = createEventLog();
  log.append('ItemAdded', { sku: 'mug', qty: 1, priceCents: 1200 });
  log.append('ItemRemoved', { sku: 'mug' });
  eq(cartProjection(log.events()).items, []);
  eq(log.events().length, 2);
  eq(cartProjection(log.replayTo(1)).items.length, 1);
});

test('clearing the cart drops the items and the coupon', () => {
  const log = shopping(createEventLog());
  log.append('CartCleared', {});
  eq(cartProjection(log.events()), {
    items: [],
    coupon: null,
    subtotalCents: 0,
    discountCents: 0,
    totalCents: 0,
  });
});
