// ─────────────────────────────────────────────────────────────────────────
//  10 · restock report                                          ★★☆ core
//  concepts: bug hunt · async iteration · await
//  run: node 10-foreach-async.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A nightly stock job. It reads a batch of SKUs from the warehouse,
//  finds the ones below their reorder point, places an order for each,
//  and resolves with a report of what it did. The report must be
//  complete: when the promise settles, every order has come back.
//
//      fetchAll(['ink', 'paper'], fetchRow)  → rows, in that order
//      needsRestock({ onHand: 1, reorderAt: 6 })            → true
//      orderQuantity({ onHand: 1, reorderAt: 6 })           → 11
//      (await restock(skus, fetchRow, placeOrder)).placed
//        → [{ sku: 'paper', qty: 16, orderId: 'ord-paper' }, …]
//
//  The code below is fully written — and wrong. 3 tests fail. Find the
//  bug, fix it with the smallest change. Don't rewrite.
//
//  hint: when a promise resolves with less than it should, log a line at
//  the top of the function and a line right after every `await` inside
//  it. Read the printed ORDER. Work that happens after the report is
//  printed is work nobody waited for.

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

  low.forEach(async (row) => {
    const qty = orderQuantity(row);
    const orderId = await placeOrder(row.sku, qty);
    unitsOrdered += qty;
    placed.push({ sku: row.sku, qty, orderId });
  });

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
