// ─────────────────────────────────────────────────────────────────────────
//  21 · the report that loses customers                      ★★★ stretch
//  concepts: bug hunt · LEFT JOIN · WHERE vs ON
//  run: node 21-left-join-gone.js
// ─────────────────────────────────────────────────────────────────────────
//
//  bigOrderReport(db) is the account managers' overview: EVERY customer,
//  with how many big orders (5000 cents or more) they have placed —
//  zeroes included, because "no big orders yet" is exactly who they want
//  to call:
//
//      { customer: 'Ada',       big_orders: 2 }
//      { customer: 'Linus',     big_orders: 0 }   ← small orders only
//      { customer: 'Katherine', big_orders: 0 }   ← no orders at all
//
//  The query even uses a LEFT JOIN, like the book says. And yet the
//  report keeps coming back with rows missing — precisely the customers
//  the managers most wanted to see.
//
//  The code below is fully written — and wrong. 3 tests fail. Find the
//  bug, fix it with the smallest change. Don't rewrite.
//
//  hint: run the query in your head one clause at a time, on ONE lost
//  customer. What does the joined row for Katherine look like before the
//  WHERE runs — and what is `NULL >= 5000`?

import { test, eq } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

// ── provided: a small shop — 5 customers, 6 orders, cents ────────────────
//   Ada has two big orders and a tiny one; Grace one big, one small;
//   Linus only small orders; Edsger and Katherine none at all.
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
`;
const CUSTOMERS = [
  [1, 'Ada'], [2, 'Grace'], [3, 'Linus'], [4, 'Edsger'], [5, 'Katherine'],
];
const ORDERS = [
  // id, customer_id, total_cents
  [1, 1, 12200], [2, 1, 7000], [3, 1, 800],
  [4, 2, 19900], [5, 2, 1500],
  [6, 3, 4200],
];

function withShop(run) {
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
  const load = (sql, rows) => {
    const stmt = db.prepare(sql);
    for (const row of rows) stmt.run(...row);
  };
  load('INSERT INTO customers VALUES (?, ?)', CUSTOMERS);
  load('INSERT INTO orders    VALUES (?, ?, ?)', ORDERS);
  try {
    return run(db);
  } finally {
    db.close();
  }
}

export function bigOrderReport(db) {
  return db
    .prepare(
      `SELECT c.name AS customer, COUNT(o.id) AS big_orders
       FROM customers c
       LEFT JOIN orders o ON o.customer_id = c.id
       WHERE o.total_cents >= 5000
       GROUP BY c.id
       ORDER BY c.id`
    )
    .all();
}

// ──────────────────────────── tests ──────────────────────────────────────

test('customers WITH big orders are counted correctly', () => {
  withShop((db) => {
    const byName = Object.fromEntries(
      bigOrderReport(db).map((r) => [r.customer, r.big_orders])
    );
    eq(byName.Ada, 2);
    eq(byName.Grace, 1);
  });
});

test('every customer gets a row — that is the whole point', () => {
  withShop((db) => {
    eq(bigOrderReport(db).length, 5);
  });
});

test('small-orders-only customers show up with zero', () => {
  withShop((db) => {
    const linus = bigOrderReport(db).find((r) => r.customer === 'Linus');
    eq(linus?.big_orders, 0, 'Linus must be present, with zero');
  });
});

test('customers who never ordered show up with zero', () => {
  withShop((db) => {
    const rows = bigOrderReport(db);
    eq(rows.find((r) => r.customer === 'Edsger')?.big_orders, 0);
    eq(rows.find((r) => r.customer === 'Katherine')?.big_orders, 0);
  });
});

test('the count is big orders only, not all orders', () => {
  withShop((db) => {
    const ada = bigOrderReport(db).find((r) => r.customer === 'Ada');
    eq(ada.big_orders, 2); // Ada has 3 orders, but the 800 one is small
  });
});
