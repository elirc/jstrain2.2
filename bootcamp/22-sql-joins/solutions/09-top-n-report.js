// ─────────────────────────────────────────────────────────────────────────
//  09 · top-N reports — join, group, order, limit — SOLUTION     ★★☆ core
//  run: node 09-top-n-report.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the ranking pipeline, and it never changes shape.
//
//      SELECT p.name            AS product,
//             SUM(oi.qty)       AS units,
//             SUM(oi.qty * p.price) AS revenue
//        FROM products p
//        JOIN order_items oi ON oi.product_id = p.id
//       GROUP BY p.id
//       ORDER BY revenue DESC, p.name
//       LIMIT ?
//
//  Row-wise: every line item is joined to its product, the lines collapse
//  into one row per product, and the aggregate is what you sort on. Doing
//  this in SQL sends five rows over the wire instead of twenty; doing it
//  in JavaScript means fetching everything first, which stops working at
//  exactly the data size where the report starts to matter.
//  Two lessons hide in the numbers. First, ranking by the wrong measure
//  tells a different story: the mouse sells the most units (7) and comes
//  FOURTH by revenue, because it is cheap. Decide which column the
//  business means before you write ORDER BY.
//  Second, both queries are INNER joins, so the laptop stand nobody bought
//  and the customers who never ordered simply are not there. For a top-N
//  that is right — but the same instinct applied to "all products, with
//  sales" would silently hide your dead stock. That is exercise 05's job.
//  LIMIT takes a `?` like any other value; a "number" out of a query
//  string is a string until you have checked it, so parameterise it.
//  And ties: without `, p.name` two equal revenues can swap places between
//  runs, which makes a paginated report skip and repeat rows.

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

export function topCustomers(db, limit) {
  return db
    .prepare(
      `SELECT c.name              AS customer,
              COUNT(*)            AS orders,
              SUM(o.total_cents)  AS revenue
         FROM customers c
         JOIN orders o ON o.customer_id = c.id
        GROUP BY c.id
        ORDER BY revenue DESC, c.name
        LIMIT ?`
    )
    .all(limit)
    .map((row) => ({ ...row }));
}

export function topProducts(db, limit) {
  return db
    .prepare(
      `SELECT p.name                AS product,
              SUM(oi.qty)           AS units,
              SUM(oi.qty * p.price) AS revenue
         FROM products p
         JOIN order_items oi ON oi.product_id = p.id
        GROUP BY p.id
        ORDER BY revenue DESC, p.name
        LIMIT ?`
    )
    .all(limit)
    .map((row) => ({ ...row }));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the three best customers, richest first', () => {
  withShop((db) => {
    eq(topCustomers(db, 3), [
      { customer: 'Margaret', orders: 2, revenue: 49500 },
      { customer: 'Grace', orders: 3, revenue: 45800 },
      { customer: 'Linus', orders: 2, revenue: 28600 },
    ]);
  });
});

test('the limit is honoured at both ends', () => {
  withShop((db) => {
    eq(topCustomers(db, 0), []);
    eq(topCustomers(db, 1).length, 1);
    eq(topCustomers(db, 99).length, 6, 'only six customers ever ordered');
  });
});

test('the best seller by revenue is the monitor', () => {
  withShop((db) => {
    eq(topProducts(db, 1), [
      { product: 'monitor', units: 4, revenue: 79600 },
    ]);
  });
});

test('most units sold is not most revenue', () => {
  withShop((db) => {
    const all = topProducts(db, 99);
    const byUnits = [...all].sort((a, b) => b.units - a.units);
    eq(byUnits[0].product, 'mouse', 'seven mice, more than anything else');
    eq(all[3].product, 'mouse', 'and still only fourth by revenue');
  });
});

test('a product nobody ever bought is not in the ranking at all', () => {
  withShop((db) => {
    const names = topProducts(db, 99).map((r) => r.product);
    eq(names.length, 5);
    ok(!names.includes('laptop stand'), 'an inner join has nothing to say');
  });
});

test('ties are broken by name, so the ranking is stable', () => {
  withShop((db) => {
    // this makes Barbara tie Alan at exactly 9700
    db.exec("INSERT INTO orders VALUES (13, 6, '2024-06-01', 4200)");
    const tail = topCustomers(db, 99).slice(4);
    eq(
      tail.map((r) => r.customer),
      ['Alan', 'Barbara']
    );
    eq(tail[0].revenue, tail[1].revenue);
  });
});
