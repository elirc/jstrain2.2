// ─────────────────────────────────────────────────────────────────────────
//  07 · GROUP BY over a join, and the COUNT trap              ★★★ stretch
//  concepts: GROUP BY · COUNT(*) vs COUNT(col) · COALESCE · AVG
//  run: node 07-group-by-with-joins.js
// ─────────────────────────────────────────────────────────────────────────
//
//  GROUP BY collapses the joined rows into one row per key, and the
//  aggregate functions describe each group. Over a LEFT JOIN there is a
//  trap waiting: the padded row invented for a customer with no orders is
//  still a row, so `COUNT(*)` reports 1 where the truth is 0.
//
//  Build two reports over ALL EIGHT customers, ordered by name:
//
//    · orderStats(db)  → { customer, orders, revenue, avg_order }
//    · countTrap(db)   → { customer, rows_seen, orders }
//
//      orders     how many real orders — 0 for Edsger
//      revenue    SUM of total_cents  — 0 for Edsger, not null
//      avg_order  AVG of total_cents  — leave it null for Edsger
//      rows_seen  COUNT(*), the trap, kept on purpose so you can see it
//
//  hint: COUNT(*) counts rows. COUNT(column) counts rows where that column
//  is not NULL. COALESCE(x, 0) turns an empty SUM into a zero.

import { test, eq, ok, approx } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

// ── provided: the same little shop in every file of this module ──────────
//   8 customers · 6 products · 12 orders · 20 line items
//   money is in CENTS (integers — floats and money do not mix)
//   Edsger and Katherine have never ordered; nobody ever bought the
//   laptop stand. Those three gaps are what the joins are for.
const SCHEMA = `
  CREATE TABLE customers (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL
  );
  CREATE TABLE products (
    id    INTEGER PRIMARY KEY,
    name  TEXT NOT NULL,
    price INTEGER NOT NULL
  );
  CREATE TABLE orders (
    id          INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    placed_on   TEXT    NOT NULL,
    total_cents INTEGER NOT NULL
  );
  CREATE TABLE order_items (
    id         INTEGER PRIMARY KEY,
    order_id   INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    qty        INTEGER NOT NULL
  );
`;

const CUSTOMERS = [
  // id, name, city
  [1, 'Ada', 'London'],        [2, 'Grace', 'New York'],
  [3, 'Linus', 'Helsinki'],    [4, 'Margaret', 'Boston'],
  [5, 'Alan', 'London'],       [6, 'Barbara', 'New York'],
  [7, 'Edsger', 'Amsterdam'],  [8, 'Katherine', 'Hampton'],
];
const PRODUCTS = [
  // id, name, price
  [1, 'keyboard', 7200],  [2, 'mouse', 2500],
  [3, 'monitor', 19900],  [4, 'desk mat', 1500],
  [5, 'usb hub', 4500],   [6, 'laptop stand', 6000],
];
const ORDERS = [
  // id, customer_id, placed_on, total_cents
  [1, 1, '2024-01-05', 12200],  [2, 2, '2024-01-17', 19900],
  [3, 1, '2024-02-02', 7000],   [4, 3, '2024-02-14', 14200],
  [5, 4, '2024-02-28', 47000],  [6, 2, '2024-03-03', 1500],
  [7, 5, '2024-03-11', 9700],   [8, 1, '2024-03-22', 9000],
  [9, 6, '2024-04-02', 5500],   [10, 2, '2024-04-14', 24400],
  [11, 3, '2024-04-25', 14400], [12, 4, '2024-05-06', 2500],
];
const ITEMS = [
  // id, order_id, product_id, qty
  [1, 1, 1, 1],   [2, 1, 2, 2],   [3, 2, 3, 1],   [4, 3, 2, 1],
  [5, 3, 4, 3],   [6, 4, 1, 1],   [7, 4, 2, 1],   [8, 4, 5, 1],
  [9, 5, 3, 2],   [10, 5, 1, 1],  [11, 6, 4, 1],  [12, 7, 1, 1],
  [13, 7, 2, 1],  [14, 8, 5, 2],  [15, 9, 2, 1],  [16, 9, 4, 2],
  [17, 10, 3, 1], [18, 10, 5, 1], [19, 11, 1, 2], [20, 12, 2, 1],
];

// Open the shop, run your test body, always close it.
function withShop(run) {
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
  const load = (sql, rows) => {
    const stmt = db.prepare(sql);
    for (const row of rows) stmt.run(...row);
  };
  load('INSERT INTO customers   VALUES (?, ?, ?)', CUSTOMERS);
  load('INSERT INTO products    VALUES (?, ?, ?)', PRODUCTS);
  load('INSERT INTO orders      VALUES (?, ?, ?, ?)', ORDERS);
  load('INSERT INTO order_items VALUES (?, ?, ?, ?)', ITEMS);
  try {
    return run(db);
  } finally {
    db.close();
  }
}

// Provided: index a report by customer name, for readable assertions.
const byName = (rows) => Object.fromEntries(rows.map((r) => [r.customer, r]));

export function orderStats(db) {
  throw new Error('TODO');
}

export function countTrap(db) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('there is one row per customer, all eight of them', () => {
  withShop((db) => {
    const rows = orderStats(db);
    eq(rows.length, 8);
    eq(
      rows.map((r) => r.customer),
      ['Ada', 'Alan', 'Barbara', 'Edsger', 'Grace', 'Katherine',
       'Linus', 'Margaret']
    );
  });
});

test('the aggregates describe each customer', () => {
  withShop((db) => {
    const stats = byName(orderStats(db));
    eq(stats.Ada, {
      customer: 'Ada',
      orders: 3,
      revenue: 28200,
      avg_order: 9400,
    });
    eq(stats.Margaret.orders, 2);
    eq(stats.Margaret.revenue, 49500);
  });
});

test('a customer with no orders has revenue 0, not null', () => {
  withShop((db) => {
    const stats = byName(orderStats(db));
    eq(stats.Edsger.orders, 0);
    eq(stats.Edsger.revenue, 0, 'SUM of nothing is NULL — COALESCE it');
  });
});

test('COUNT(*) sees a row that COUNT(o.id) does not', () => {
  withShop((db) => {
    const trap = byName(countTrap(db));
    eq(trap.Edsger, { customer: 'Edsger', rows_seen: 1, orders: 0 });
    eq(trap.Katherine.rows_seen, 1);
    eq(trap.Katherine.orders, 0);
  });
});

test('for everyone who did order, the two counts agree', () => {
  withShop((db) => {
    for (const row of countTrap(db)) {
      if (row.orders > 0) eq(row.rows_seen, row.orders, row.customer);
    }
    eq(byName(countTrap(db)).Ada.rows_seen, 3);
  });
});

test('AVG over nothing is null — zero would be a lie', () => {
  withShop((db) => {
    const stats = byName(orderStats(db));
    eq(stats.Edsger.avg_order, null);
    approx(stats.Grace.avg_order, 45800 / 3, 1e-6);
    ok(!Number.isInteger(stats.Grace.avg_order), 'AVG returns a float');
  });
});

test('the revenues add up to the whole shop', () => {
  withShop((db) => {
    const total = orderStats(db).reduce((sum, r) => sum + r.revenue, 0);
    eq(total, 167300);
  });
});
