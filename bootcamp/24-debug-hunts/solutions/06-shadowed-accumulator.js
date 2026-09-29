// ─────────────────────────────────────────────────────────────────────────
//  06 · rollUp — SOLUTION                                       ★★☆ core
//  run: node 06-shadowed-accumulator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: shadowing. Two variables, one name, and the `+=` you can
//  see is not touching the one you think it is.
//
//  The tell: `let totalCents = 0;` twice — once before the loop, once
//  inside it. The inner `let` opens a brand new binding for the body of
//  each iteration, so `totalCents += cents` fills the per-order total and
//  the grand total stays 0 from declaration to return. Everything that
//  reads the inner one (the per-order rows) is correct, which is why the
//  first two tests pass and only the grand total is wrong.
//
//  The fix is a rename, not a rewrite: call the inner one `orderCents`,
//  push it as `{ id: order.id, totalCents: orderCents }`, and add the one
//  line that was missing all along — `totalCents += orderCents;`.
//
//  In the wild: a `catch (err)` inside a function that already has an
//  `err`, a callback parameter named `data` inside a scope that already
//  has `data`, or `for (const item of items)` nested inside another loop
//  over `item`. Reusing the obvious name is exactly how it happens.

import { test, eq } from '../../_lib/check.js';

const ORDERS = [
  {
    id: 'o1',
    items: [
      { sku: 'kbd', category: 'input', qty: 1, unitCents: 8900 },
      { sku: 'hub', category: 'adapter', qty: 2, unitCents: 2900 },
    ],
  },
  {
    id: 'o2',
    items: [
      { sku: 'mon', category: 'display', qty: 1, unitCents: 32000 },
      { sku: 'kbd', category: 'input', qty: 3, unitCents: 8900 },
    ],
  },
  { id: 'o3', items: [] },
];

export function rollUp(orders) {
  let totalCents = 0;
  const byCategory = new Map();
  const perOrder = [];

  for (const order of orders) {
    let orderCents = 0;
    for (const item of order.items) {
      const cents = item.qty * item.unitCents;
      orderCents += cents;
      const soFar = byCategory.get(item.category) ?? 0;
      byCategory.set(item.category, soFar + cents);
    }
    totalCents += orderCents;
    perOrder.push({ id: order.id, totalCents: orderCents });
  }

  return {
    totalCents,
    orders: perOrder,
    byCategory: Object.fromEntries(byCategory),
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('each order gets a total of its own lines', () => {
  eq(rollUp(ORDERS).orders, [
    { id: 'o1', totalCents: 14700 },
    { id: 'o2', totalCents: 58700 },
    { id: 'o3', totalCents: 0 },
  ]);
});

test('categories are summed across every order', () => {
  eq(rollUp(ORDERS).byCategory, {
    input: 35600,
    adapter: 5800,
    display: 32000,
  });
});

test('the grand total counts every line of every order', () => {
  eq(rollUp(ORDERS).totalCents, 73400);
});

test('the grand total equals the per-order totals added up', () => {
  const report = rollUp(ORDERS);
  const sum = report.orders.reduce((acc, o) => acc + o.totalCents, 0);
  eq(report.totalCents, sum);
});

test('the grand total equals the category totals added up', () => {
  const report = rollUp(ORDERS);
  const sum = Object.values(report.byCategory).reduce((a, b) => a + b, 0);
  eq(report.totalCents, sum);
});

test('no orders at all rolls up to zeros', () => {
  eq(rollUp([]), { totalCents: 0, orders: [], byCategory: {} });
});

test('an order with no items still gets a row worth nothing', () => {
  eq(rollUp([{ id: 'x', items: [] }]), {
    totalCents: 0,
    orders: [{ id: 'x', totalCents: 0 }],
    byCategory: {},
  });
});
