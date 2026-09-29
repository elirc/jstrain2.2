// ─────────────────────────────────────────────────────────────────────────
//  32 · event sourcing, lite — SOLUTION                        ★★★ stretch
//  concepts: event sourcing · fold · replay · append-only
//  run: node solutions/32-event-sourcing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — make the sequence of facts the source of truth, and treat
//  current state as a derived value: `state = events.reduce(apply)`.
//  Two rules keep it honest. Events are past tense and immutable —
//  `ItemRemoved` happened, you cannot un-happen it, you can only append
//  a compensating fact. And the projection is pure: no clock, no random,
//  no I/O, so replaying the same log always yields the same state. Break
//  purity and "replay" stops being a debugging superpower.
//  Ignoring unknown event types is not laziness, it is versioning. Logs
//  outlive the code that reads them; a projection that throws on
//  `GiftWrapRequested` cannot be deployed before every writer stops
//  emitting it.
//  What you buy: a free audit trail, time travel (`replayTo`), new
//  reports over old data (write a second projection, replay from event
//  1), and debugging by replaying a customer's exact history.
//  What you pay: no `UPDATE`. Every question needs a projection, the log
//  grows forever (snapshots exist for that reason), and schema evolution
//  becomes upcasting old events.
//  When NOT to use: CRUD where nobody asks "how did it get this way".
//  Event-sourcing a settings page is a career-shortening move.
//  In the wild: Kafka topics + compacted state, git (commits are events,
//  the worktree is a projection), Redux (actions folded by reducers),
//  database WAL/binlog, double-entry accounting ledgers, EventStoreDB.
//  Exercise 34 takes the next step: keeping a read model up to date.

import { test, eq, ok } from '../../_lib/check.js';

export function createEventLog() {
  const events = [];

  return {
    append(type, data) {
      const event = { seq: events.length + 1, type, data };
      events.push(event);
      return { ...event };
    },
    events: () => events.map((event) => ({ ...event })),
    replayTo: (seq) =>
      events.filter((event) => event.seq <= seq).map((event) => ({ ...event })),
  };
}

// one handler per event type; anything unlisted is a no-op
const APPLY = {
  ItemAdded(state, data) {
    const existing = state.items.find((item) => item.sku === data.sku);
    if (existing) existing.qty += data.qty;
    else
      state.items.push({
        sku: data.sku,
        qty: data.qty,
        priceCents: data.priceCents,
      });
  },
  QuantityChanged(state, data) {
    const item = state.items.find((entry) => entry.sku === data.sku);
    if (item) item.qty = data.qty;
  },
  ItemRemoved(state, data) {
    state.items = state.items.filter((item) => item.sku !== data.sku);
  },
  CouponApplied(state, data) {
    state.coupon = { code: data.code, percent: data.percent };
  },
  CartCleared(state) {
    state.items = [];
    state.coupon = null;
  },
};

export function cartProjection(events) {
  const state = { items: [], coupon: null };
  for (const event of events) {
    const apply = APPLY[event.type];
    if (apply) apply(state, event.data); // unknown types: ignored on purpose
  }

  const subtotalCents = state.items.reduce(
    (total, item) => total + item.qty * item.priceCents,
    0
  );
  const discountCents = state.coupon
    ? Math.round((subtotalCents * state.coupon.percent) / 100)
    : 0;

  return {
    items: state.items,
    coupon: state.coupon ? state.coupon.code : null,
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
  };
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
