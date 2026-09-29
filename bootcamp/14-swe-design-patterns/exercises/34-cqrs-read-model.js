// ─────────────────────────────────────────────────────────────────────────
//  34 · CQRS, lite                                            ★★★ stretch
//  concepts: CQRS · read model · eventual consistency
//  run: node exercises/34-cqrs-read-model.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The dashboard asks "top customers by spend" on every page load and
//  the query joins three tables. The write path needs consistency; the
//  read path needs speed. Stop making one model serve both.
//
//  Build an app with two sides that only meet through events:
//
//      WRITE — validates, owns the truth, publishes what happened
//        app.placeOrder({ id, customer, totalCents })  → { ok, id }
//        app.cancelOrder(id)                           → { ok, id }
//        duplicate id / unknown id / double cancel     → throws
//        app.cancelOrder('nope')  → throws 'unknown order: nope'
//
//      READ  — denormalised, dumb, never validates anything
//        app.orderById(id)          → a copy, or null
//        app.customerSummary(name)  → { customer, orders, cancelled,
//                                       totalCents }  (zeros if unknown)
//        app.topCustomers(n)        → summary rows, biggest spend first
//
//  status is 'placed' until cancelOrder, then 'cancelled'. Cancelling
//  keeps the order in `orders`, adds one to `cancelled`, and takes its
//  amount off `totalCents`. Every query hands back copies, not live rows.
//
//  The projector runs ASYNCHRONOUSLY — one flush per tick, applying the
//  whole batch in order. So right after a command the read model is
//  still stale, and `await app.settled()` is how a test waits for it:
//
//      app.placeOrder({ id: 'o1', ... });
//      app.orderById('o1')        → null      // not projected yet
//      await app.settled();
//      app.orderById('o1')        → { ..., status: 'placed' }
//
//  `createOrderApp({ onProject })` calls `onProject(batch)` once per
//  flush with the events it just applied — `{ type: 'OrderPlaced', id,
//  customer, totalCents }` and `{ type: 'OrderCancelled', id }`.
//
//  hint: queue events, and schedule the drain with
//  `Promise.resolve().then(...)` only if one is not already scheduled

import { test, eq, ok, spy, throws } from '../../_lib/check.js';

export function createOrderApp({ onProject } = {}) {
  // commands: placeOrder, cancelOrder · queries: orderById,
  // customerSummary, topCustomers · plus settled()
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a command returns at once and the read side is still stale', async () => {
  const app = createOrderApp();
  eq(app.placeOrder({ id: 'o1', customer: 'ada', totalCents: 5000 }), {
    ok: true,
    id: 'o1',
  });
  eq(app.orderById('o1'), null);
  await app.settled();
  eq(app.orderById('o1'), {
    id: 'o1',
    customer: 'ada',
    totalCents: 5000,
    status: 'placed',
  });
});

test('the read model is denormalised: no joins, no maths at query time', async () => {
  const app = createOrderApp();
  app.placeOrder({ id: 'o1', customer: 'ada', totalCents: 5000 });
  app.placeOrder({ id: 'o2', customer: 'ada', totalCents: 4000 });
  app.placeOrder({ id: 'o3', customer: 'grace', totalCents: 9500 });
  await app.settled();

  eq(app.customerSummary('ada'), {
    customer: 'ada',
    orders: 2,
    cancelled: 0,
    totalCents: 9000,
  });
  eq(app.topCustomers(2).map((row) => row.customer), ['grace', 'ada']);
});

test('a cancellation reaches both sides', async () => {
  const app = createOrderApp();
  app.placeOrder({ id: 'o1', customer: 'ada', totalCents: 5000 });
  app.placeOrder({ id: 'o2', customer: 'ada', totalCents: 4000 });
  await app.settled();
  eq(app.cancelOrder('o1'), { ok: true, id: 'o1' });
  await app.settled();

  eq(app.orderById('o1').status, 'cancelled');
  eq(app.customerSummary('ada'), {
    customer: 'ada',
    orders: 2,
    cancelled: 1,
    totalCents: 4000,
  });
});

test('the write side is the one that says no', async () => {
  const app = createOrderApp();
  app.placeOrder({ id: 'o1', customer: 'ada', totalCents: 5000 });
  throws(() => app.placeOrder({ id: 'o1', customer: 'x', totalCents: 1 }));
  throws(() => app.cancelOrder('nope'), 'unknown order: nope');
  app.cancelOrder('o1');
  throws(() => app.cancelOrder('o1'));
  await app.settled();
  eq(app.customerSummary('ada').cancelled, 1);
});

test('the read side never throws, it answers with nothing', () => {
  const app = createOrderApp();
  eq(app.orderById('never-existed'), null);
  eq(app.customerSummary('nobody'), {
    customer: 'nobody',
    orders: 0,
    cancelled: 0,
    totalCents: 0,
  });
  eq(app.topCustomers(5), []);
});

test('queries hand out copies of the read model', async () => {
  const app = createOrderApp();
  app.placeOrder({ id: 'o1', customer: 'ada', totalCents: 5000 });
  await app.settled();

  const stolen = app.orderById('o1');
  stolen.totalCents = 999999;
  const summary = app.customerSummary('ada');
  summary.orders = 42;

  eq(app.orderById('o1').totalCents, 5000);
  eq(app.customerSummary('ada').orders, 1);
});

test('commands in one tick are projected in one pass, in order', async () => {
  const flushes = spy();
  const app = createOrderApp({ onProject: flushes });
  app.placeOrder({ id: 'o1', customer: 'ada', totalCents: 1000 });
  app.placeOrder({ id: 'o2', customer: 'ada', totalCents: 2000 });
  app.cancelOrder('o1');
  eq(flushes.callCount, 0);

  await app.settled();
  eq(flushes.callCount, 1);
  eq(flushes.calls[0][0].map((event) => event.type), [
    'OrderPlaced',
    'OrderPlaced',
    'OrderCancelled',
  ]);
  eq(app.customerSummary('ada'), {
    customer: 'ada',
    orders: 2,
    cancelled: 1,
    totalCents: 2000,
  });
});

test('a later command is a second flush', async () => {
  const flushes = spy();
  const app = createOrderApp({ onProject: flushes });
  app.placeOrder({ id: 'o1', customer: 'ada', totalCents: 1000 });
  await app.settled();
  app.placeOrder({ id: 'o2', customer: 'grace', totalCents: 3000 });
  await app.settled();
  eq(flushes.callCount, 2);
  ok(app.topCustomers(1)[0].customer === 'grace');
});
