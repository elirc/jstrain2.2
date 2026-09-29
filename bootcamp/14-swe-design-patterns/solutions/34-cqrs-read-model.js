// ─────────────────────────────────────────────────────────────────────────
//  34 · CQRS, lite — SOLUTION                                  ★★★ stretch
//  concepts: CQRS · read model · eventual consistency
//  run: node solutions/34-cqrs-read-model.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — split the model that changes state from the model that
//  answers questions, and let events carry one to the other.
//  The write side is small, validating and normalised: it is the only
//  thing that can say no. The read side is wide, denormalised and dumb:
//  `customerSummary` is one Map lookup because the projector did the
//  counting when the event arrived, not when the dashboard asked.
//  Queries never validate and never throw — an unknown customer is a
//  zeroed summary (null object, exercise 03), because a read model has
//  no authority to have an opinion.
//  The uncomfortable part is deliberate: right after a command the read
//  model is WRONG. That is eventual consistency, compressed into one
//  microtask so a test can see it. In production the gap is a queue and
//  it is milliseconds to minutes, which is why "place order then
//  redirect to the list page" shows an empty list. You handle it — you
//  do not pretend it is not there: return the created id from the
//  command, render from the write result, or wait for the projection.
//  Batching per tick (`Promise.resolve().then` scheduled once) is how
//  real projectors work: pull everything queued, apply in order, once.
//  Order within the batch is the invariant — `OrderCancelled` before
//  `OrderPlaced` corrupts the summary permanently, because a read model
//  is a fold and folds are not commutative.
//  When NOT to use: most apps. CQRS doubles your models and adds a
//  consistency lag; it earns its keep when reads and writes have
//  genuinely different shapes or wildly different volume. You do NOT
//  need event sourcing to do it, and it is not "one database per side"
//  either — a materialised view is CQRS.
//  In the wild: Elasticsearch index fed from Postgres, materialised
//  views, Kafka Streams state stores, Redux selectors over a normalised
//  store, GraphQL read APIs beside command endpoints, Axon/EventStore.

import { test, eq, ok, spy, throws } from '../../_lib/check.js';

export function createOrderApp({ onProject } = {}) {
  const orders = new Map(); // write model: the truth
  const byId = new Map(); // read model: what the UI asks for
  const byCustomer = new Map();
  const queue = [];
  let flushing = null;

  // ── read side ──────────────────────────────────────────────────────────
  const project = (event) => {
    if (event.type === 'OrderPlaced') {
      byId.set(event.id, {
        id: event.id,
        customer: event.customer,
        totalCents: event.totalCents,
        status: 'placed',
      });
      const summary = byCustomer.get(event.customer) ?? {
        customer: event.customer,
        orders: 0,
        cancelled: 0,
        totalCents: 0,
      };
      summary.orders += 1;
      summary.totalCents += event.totalCents;
      byCustomer.set(event.customer, summary);
    }

    if (event.type === 'OrderCancelled') {
      const view = byId.get(event.id);
      if (!view) return;
      view.status = 'cancelled';
      const summary = byCustomer.get(view.customer);
      summary.cancelled += 1;
      summary.totalCents -= view.totalCents;
    }
  };

  // ── the seam: events, drained once per tick ────────────────────────────
  const publish = (event) => {
    queue.push(event);
    flushing ??= Promise.resolve().then(() => {
      const batch = queue.splice(0, queue.length);
      flushing = null;
      for (const queued of batch) project(queued);
      onProject?.(batch);
    });
  };

  return {
    // ── write side ───────────────────────────────────────────────────────
    placeOrder({ id, customer, totalCents }) {
      if (orders.has(id)) throw new Error(`duplicate order: ${id}`);
      orders.set(id, { id, customer, totalCents, status: 'placed' });
      publish({ type: 'OrderPlaced', id, customer, totalCents });
      return { ok: true, id };
    },

    cancelOrder(id) {
      const order = orders.get(id);
      if (!order) throw new Error(`unknown order: ${id}`);
      if (order.status === 'cancelled') {
        throw new Error(`already cancelled: ${id}`);
      }
      order.status = 'cancelled';
      publish({ type: 'OrderCancelled', id });
      return { ok: true, id };
    },

    // ── query side ───────────────────────────────────────────────────────
    orderById: (id) => (byId.has(id) ? { ...byId.get(id) } : null),

    customerSummary: (customer) => ({
      customer,
      orders: 0,
      cancelled: 0,
      totalCents: 0,
      ...byCustomer.get(customer),
    }),

    topCustomers: (n) =>
      [...byCustomer.values()]
        .sort((a, b) => b.totalCents - a.totalCents)
        .slice(0, n)
        .map((row) => ({ ...row })),

    settled: () => flushing ?? Promise.resolve(),
  };
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
