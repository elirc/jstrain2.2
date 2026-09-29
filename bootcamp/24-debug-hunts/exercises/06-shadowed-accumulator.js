// ─────────────────────────────────────────────────────────────────────────
//  06 · rollUp                                                  ★★☆ core
//  concepts: block scope · shadowing · accumulators
//  run: node 06-shadowed-accumulator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  rollUp(orders) turns a pile of orders into one report:
//
//      { totalCents, orders: [{ id, totalCents }], byCategory: {...} }
//
//  A line is worth qty × unitCents. `orders` carries one total per order,
//  `byCategory` sums those lines by category across every order, and
//  `totalCents` is the grand total — every line of every order. An order
//  with no items still gets a row, worth 0.
//
//  The code below is fully written — and wrong: 3 tests fail. Find the
//  planted bug and fix it with the smallest change that turns everything
//  green. It is one of the classic bug families; WHERE is the exercise.
//
//  hint: log the number you are about to return once per order. Watching
//  where it does NOT move is faster than re-reading the arithmetic.

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
    let totalCents = 0;
    for (const item of order.items) {
      const cents = item.qty * item.unitCents;
      totalCents += cents;
      const soFar = byCategory.get(item.category) ?? 0;
      byCategory.set(item.category, soFar + cents);
    }
    perOrder.push({ id: order.id, totalCents });
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
