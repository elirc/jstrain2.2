// ─────────────────────────────────────────────────────────────────────────
//  14 · capstone — two reports for a dashboard — SOLUTION     ★★★ stretch
//  run: node 14-reporting-capstone.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two reports, and each one carries a trap from earlier in
//  the module.
//
//      SELECT strftime('%Y-%m', o.placed_on) AS month,
//             COUNT(DISTINCT o.id)           AS orders,
//             SUM(oi.qty * p.price)          AS revenue
//        FROM orders o
//        JOIN order_items oi ON oi.order_id = o.id
//        JOIN products p     ON p.id = oi.product_id
//       GROUP BY month
//       ORDER BY month
//
//  The grain of that join is the LINE ITEM: February's three orders arrive
//  as seven rows, so COUNT(*) would report 7 and COUNT(DISTINCT o.id)
//  reports 3. Every "our order count is too high" bug is this. SUM is fine
//  — one line's money is counted once — but the moment you also joined
//  something with two rows per order, the revenue would double too.
//  Dates: sqlite has no date type, just TEXT. 'YYYY-MM-DD' is the format
//  worth insisting on because it sorts and compares correctly as a string
//  and `strftime` understands it. Feed strftime '06/2024' and you get NULL
//  back — no error, a silent hole in the report. Validate at the boundary.
//
//      SELECT c.name                          AS customer,
//             COUNT(o.id)                     AS orders,
//             COALESCE(SUM(o.total_cents), 0) AS revenue,
//             MIN(o.placed_on)                AS first_order,
//             MAX(o.placed_on)                AS last_order
//        FROM customers c
//        LEFT JOIN orders o ON o.customer_id = c.id
//       GROUP BY c.id
//       ORDER BY revenue DESC, c.name
//
//  LEFT JOIN so the silent customers appear, COUNT(o.id) so they score 0
//  and not 1, COALESCE so revenue is a number, and MIN/MAX left honestly
//  null — there is no first order to name. And `, c.name` on the ORDER BY,
//  because two people on zero revenue must not swap places between runs.
//  Note this one joins orders only. Reaching for line items here as well
//  would multiply each order's total by its number of lines.

import { test, eq, ok } from '../../_lib/check.js';
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

export function monthlyRevenue(db) {
  return db
    .prepare(
      `SELECT strftime('%Y-%m', o.placed_on) AS month,
              COUNT(DISTINCT o.id)           AS orders,
              SUM(oi.qty * p.price)          AS revenue
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         JOIN products p     ON p.id = oi.product_id
        GROUP BY month
        ORDER BY month`
    )
    .all()
    .map((row) => ({ ...row }));
}

export function customerLifetimeValue(db) {
  return db
    .prepare(
      `SELECT c.name                          AS customer,
              COUNT(o.id)                     AS orders,
              COALESCE(SUM(o.total_cents), 0) AS revenue,
              MIN(o.placed_on)                AS first_order,
              MAX(o.placed_on)                AS last_order
         FROM customers c
         LEFT JOIN orders o ON o.customer_id = c.id
        GROUP BY c.id
        ORDER BY revenue DESC, c.name`
    )
    .all()
    .map((row) => ({ ...row }));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('one row per month that had an order, oldest first', () => {
  withShop((db) => {
    eq(
      monthlyRevenue(db).map((r) => r.month),
      ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05']
    );
  });
});

test('February is the big month', () => {
  withShop((db) => {
    eq(monthlyRevenue(db)[1], {
      month: '2024-02',
      orders: 3,
      revenue: 68200,
    });
    eq(monthlyRevenue(db).at(-1), {
      month: '2024-05',
      orders: 1,
      revenue: 2500,
    });
  });
});

test('the months add up to the whole shop', () => {
  withShop((db) => {
    const total = monthlyRevenue(db).reduce((sum, r) => sum + r.revenue, 0);
    eq(total, 167300);
    eq(
      monthlyRevenue(db).reduce((sum, r) => sum + r.orders, 0),
      12
    );
  });
});

test('counting orders over the line-item join needs DISTINCT', () => {
  withShop((db) => {
    eq(monthlyRevenue(db)[1].orders, 3);
    const lines = db
      .prepare(
        `SELECT COUNT(*) AS n
           FROM orders o
           JOIN order_items oi ON oi.order_id = o.id
          WHERE strftime('%Y-%m', o.placed_on) = '2024-02'`
      )
      .get().n;
    eq(lines, 7, 'COUNT(*) would report seven orders in February');
  });
});

test('month is a YYYY-MM string, and strftime is fussy about input', () => {
  withShop((db) => {
    ok(/^\d{4}-\d{2}$/.test(monthlyRevenue(db)[0].month));
    const bad = db
      .prepare("SELECT strftime('%Y-%m', '06/2024') AS month")
      .get().month;
    eq(bad, null, 'a non-ISO date is a silent hole, not an error');
  });
});

test('lifetime value covers every customer, richest first', () => {
  withShop((db) => {
    const rows = customerLifetimeValue(db);
    eq(rows.length, 8);
    eq(
      rows.map((r) => r.customer),
      ['Margaret', 'Grace', 'Linus', 'Ada', 'Alan', 'Barbara',
       'Edsger', 'Katherine']
    );
    eq(rows[0], {
      customer: 'Margaret',
      orders: 2,
      revenue: 49500,
      first_order: '2024-02-28',
      last_order: '2024-05-06',
    });
  });
});

test('the customers who never ordered score zero, not null', () => {
  withShop((db) => {
    const quiet = customerLifetimeValue(db).filter((r) => r.orders === 0);
    eq(quiet.length, 2);
    eq(quiet[0], {
      customer: 'Edsger',
      orders: 0,
      revenue: 0,
      first_order: null,
      last_order: null,
    });
  });
});

test('ties are broken by name, so the report is stable', () => {
  withShop((db) => {
    // Katherine's first order ties her with Alan at exactly 9700
    db.exec("INSERT INTO orders VALUES (13, 8, '2024-06-01', 9700)");
    const rows = customerLifetimeValue(db);
    eq(
      rows.map((r) => r.customer),
      ['Margaret', 'Grace', 'Linus', 'Ada', 'Alan', 'Katherine',
       'Barbara', 'Edsger']
    );
    eq(rows[4].revenue, rows[5].revenue);
    eq(rows[5].first_order, '2024-06-01');
  });
});
