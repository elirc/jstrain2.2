// ─────────────────────────────────────────────────────────────────────────
//  21 · the report that loses customers — SOLUTION           ★★★ stretch
//  concepts: bug hunt · LEFT JOIN · WHERE vs ON
//  run: node 21-left-join-gone.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Bug class: a LEFT JOIN silently turned inner. The join itself was
//  right — every customer survived it, the orderless ones with NULLs in
//  the order columns. Then the WHERE ran. `NULL >= 5000` is NULL, NULL
//  is not true, so every unmatched row was filtered out — along with
//  Linus, whose only rows were small orders. A WHERE on a right-table
//  column undoes the LEFT in LEFT JOIN.
//  The tell: LEFT JOIN + a WHERE that touches the right table. That
//  combination is almost always a bug (the one exception: `WHERE o.id
//  IS NULL`, which deliberately keeps ONLY the unmatched rows).
//  The minimal fix: move the condition INTO the join, so it decides what
//  matches instead of which rows survive:
//      LEFT JOIN orders o
//        ON o.customer_id = c.id AND o.total_cents >= 5000
//  Note that `WHERE ... OR o.id IS NULL` would NOT fix it — it rescues
//  Edsger and Katherine but still deletes Linus, whose rows matched the
//  join and then failed the filter. That half-fix passes two of the
//  three red tests and is exactly how this bug survives code review.
//  In the wild: "active users with their December purchases" reports
//  that lose every user who didn't buy in December.

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
       LEFT JOIN orders o
         ON o.customer_id = c.id AND o.total_cents >= 5000
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
