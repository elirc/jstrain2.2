// ─────────────────────────────────────────────────────────────────────────
//  10 · restock report — SOLUTION                               ★★☆ core
//  run: node 10-foreach-async.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: bug class — un-awaited async. `forEach` ignores whatever
//  its callback returns, and an `async` callback returns a promise. So
//  `restock` starts two orders and returns the report in the same tick,
//  long before either order comes back. The orders DO happen — which is
//  why the spy sees both calls — they just land after everyone stopped
//  listening.
//
//  The tell: `async` inside a callback whose return value is discarded.
//  `forEach`, and equally `map` without a `Promise.all` around it, are
//  the two shapes to grep for. If the array method does not return
//  something you `await`, the await inside it is decorative.
//
//  The minimal fix: `for (const row of low)` — a real loop, so `await`
//  suspends `restock` itself. That also makes the orders sequential,
//  which is what you want when each one hits a rate-limited supplier.
//  For parallel, the fix is `await Promise.all(low.map(async …))`.
//
//  The classic wild variant: the report LOOKS right in dev because the
//  fake API resolves in a microtask, so the pushes sneak in before the
//  caller reads the array — then real latency arrives in production and
//  the array is empty. Note that `placed` (an array mutated later) and
//  `unitsOrdered` (a number copied at return) fail differently. That
//  difference is the fingerprint of this bug.

import { test, eq, ok, rejects, spy, sleep } from '../../_lib/check.js';

const STOCK = {
  paper: { sku: 'paper', onHand: 4, reorderAt: 10 },
  ink: { sku: 'ink', onHand: 1, reorderAt: 6 },
  toner: { sku: 'toner', onHand: 30, reorderAt: 12 },
  clips: { sku: 'clips', onHand: 80, reorderAt: 25 },
};

export function makeWarehouse(rows, latency = 2) {
  return async function fetchRow(sku) {
    await sleep(latency);
    const row = rows[sku];
    if (!row) throw new Error(`unknown sku: ${sku}`);
    return { ...row };
  };
}

export async function fetchAll(skus, fetchRow) {
  const rows = new Array(skus.length);
  await Promise.all(
    skus.map(async (sku, i) => {
      rows[i] = await fetchRow(sku);
    })
  );
  return rows;
}

export function needsRestock(row) {
  return row.onHand < row.reorderAt;
}

export function orderQuantity(row) {
  return row.reorderAt * 2 - row.onHand;
}

export async function restock(skus, fetchRow, placeOrder) {
  const rows = await fetchAll(skus, fetchRow);
  const low = rows.filter(needsRestock);
  const placed = [];
  let unitsOrdered = 0;

  for (const row of low) {
    const qty = orderQuantity(row);
    const orderId = await placeOrder(row.sku, qty);
    unitsOrdered += qty;
    placed.push({ sku: row.sku, qty, orderId });
  }

  return { checked: rows.length, skipped: rows.length - low.length,
    unitsOrdered, placed };
}

const SKUS = ['paper', 'ink', 'toner', 'clips'];

// ──────────────────────────── tests ──────────────────────────────────────

test('fetchAll returns rows in the order they were asked for', async () => {
  const fetchRow = makeWarehouse(STOCK);
  const rows = await fetchAll(['clips', 'ink'], fetchRow);
  eq(rows.map((row) => row.sku), ['clips', 'ink']);
});

test('an unknown sku rejects instead of returning a hole', async () => {
  const fetchRow = makeWarehouse(STOCK);
  await rejects(() => fetchAll(['ink', 'nope'], fetchRow), 'unknown sku');
});

test('the reorder rules read straight off the row', () => {
  eq(needsRestock(STOCK.ink), true);
  eq(needsRestock(STOCK.toner), false);
  eq(orderQuantity(STOCK.ink), 11);
  eq(orderQuantity(STOCK.paper), 16);
});

test('the report counts every row it looked at', async () => {
  const fetchRow = makeWarehouse(STOCK);
  const placeOrder = async (sku) => `ord-${sku}`;
  const report = await restock(SKUS, fetchRow, placeOrder);
  eq(report.checked, 4);
  eq(report.skipped, 2);
});

test('one order goes out per low row, with the right quantity', async () => {
  const fetchRow = makeWarehouse(STOCK);
  const placeOrder = spy(async (sku) => `ord-${sku}`);
  await restock(SKUS, fetchRow, placeOrder);
  eq(placeOrder.callCount, 2);
  eq(placeOrder.calls, [['paper', 16], ['ink', 11]]);
});

test('every order has come back before the report resolves', async () => {
  const fetchRow = makeWarehouse(STOCK);
  let confirmed = 0;
  const placeOrder = async (sku) => {
    await sleep(3);
    confirmed += 1;
    return `ord-${sku}`;
  };
  await restock(SKUS, fetchRow, placeOrder);
  eq(confirmed, 2);
});

test('the report lists the orders it placed', async () => {
  const fetchRow = makeWarehouse(STOCK);
  const placeOrder = async (sku) => {
    await sleep(3);
    return `ord-${sku}`;
  };
  const report = await restock(SKUS, fetchRow, placeOrder);
  eq(report.placed.length, 2);
  eq(report.placed.map((order) => order.sku).sort(), ['ink', 'paper']);
  ok(report.placed.every((order) => order.orderId.startsWith('ord-')));
});

test('the report totals the units it ordered', async () => {
  const fetchRow = makeWarehouse(STOCK);
  const placeOrder = async (sku) => `ord-${sku}`;
  const report = await restock(SKUS, fetchRow, placeOrder);
  eq(report.unitsOrdered, 27);
});
