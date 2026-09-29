// ─────────────────────────────────────────────────────────────────────────
//  22 · revenue that grows in the joining                    ★★★ stretch
//  concepts: bug hunt · join fan-out · aggregates
//  run: node 22-group-by-fanout.js
// ─────────────────────────────────────────────────────────────────────────
//
//  revenueByCustomer(db) powers the monthly board slide: for every
//  customer, the sum of their orders' totals, in cents:
//
//      { customer: 'Ada',   revenue: 15000 }   // 10000 + 5000
//      { customer: 'Grace', revenue: 8000 }
//
//  Finance reconciled the slide against the orders table and the numbers
//  are TOO HIGH — but not for everyone, and never too low. The overshoot
//  is worst for customers with busy multi-item orders.
//
//  The code below is fully written — and wrong. 2 tests fail. Find the
//  bug, fix it with the smallest change. Don't rewrite.
//
//  hint: drop the GROUP BY and the SUM for a second, SELECT the raw
//  joined rows for Ada, and count how many times order #1's total
//  appears. A join multiplies rows; an aggregate then adds up whatever
//  the join produced.

import { test, eq } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

// ── provided: 3 customers, 4 orders, 7 line items, cents ─────────────────
//   Ada's order #1 has three line items; Linus's single order has one.
const SCHEMA = `
  CREATE TABLE customers (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );
  CREATE TABLE orders (
    id          INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    total_cents INTEGER NOT NULL
  );
  CREATE TABLE order_items (
    id       INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    sku      TEXT NOT NULL,
    qty      INTEGER NOT NULL
  );
`;
const CUSTOMERS = [[1, 'Ada'], [2, 'Grace'], [3, 'Linus']];
const ORDERS = [
  // id, customer_id, total_cents
  [1, 1, 10000], [2, 1, 5000],
  [3, 2, 8000],
  [4, 3, 2000],
];
const ITEMS = [
  // id, order_id, sku, qty
  [1, 1, 'keyboard', 1], [2, 1, 'mouse', 2], [3, 1, 'mat', 1],
  [4, 2, 'hub', 1],
  [5, 3, 'monitor', 1], [6, 3, 'cable', 3],
  [7, 4, 'mouse', 1],
];

function withShop(run) {
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
  const load = (sql, rows) => {
    const stmt = db.prepare(sql);
    for (const row of rows) stmt.run(...row);
  };
  load('INSERT INTO customers   VALUES (?, ?)', CUSTOMERS);
  load('INSERT INTO orders      VALUES (?, ?, ?)', ORDERS);
  load('INSERT INTO order_items VALUES (?, ?, ?, ?)', ITEMS);
  try {
    return run(db);
  } finally {
    db.close();
  }
}

export function revenueByCustomer(db) {
  return db
    .prepare(
      `SELECT c.name AS customer, SUM(o.total_cents) AS revenue
       FROM customers c
       JOIN orders o      ON o.customer_id = c.id
       JOIN order_items i ON i.order_id = o.id
       GROUP BY c.id
       ORDER BY c.id`
    )
    .all();
}

// ──────────────────────────── tests ──────────────────────────────────────

test('one row per customer who ordered, in id order', () => {
  withShop((db) => {
    eq(revenueByCustomer(db).map((r) => r.customer), ['Ada', 'Grace', 'Linus']);
  });
});

test('a customer whose orders have one item each is correct', () => {
  withShop((db) => {
    const linus = revenueByCustomer(db).find((r) => r.customer === 'Linus');
    eq(linus.revenue, 2000);
  });
});

test("Ada's revenue is the sum of her order totals, once each", () => {
  withShop((db) => {
    const ada = revenueByCustomer(db).find((r) => r.customer === 'Ada');
    eq(ada.revenue, 15000); // 10000 + 5000 — nothing more
  });
});

test('the slide reconciles: revenues add up to the orders table', () => {
  withShop((db) => {
    const slide = revenueByCustomer(db).reduce((sum, r) => sum + r.revenue, 0);
    const truth = db
      .prepare('SELECT SUM(total_cents) AS total FROM orders')
      .get().total;
    eq(slide, truth); // 25000
  });
});
