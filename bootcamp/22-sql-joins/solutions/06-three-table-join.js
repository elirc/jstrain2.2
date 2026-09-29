// ─────────────────────────────────────────────────────────────────────────
//  06 · three tables — orders, line items, products — SOLUTION   ★★☆ core
//  run: node 06-three-table-join.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: chained joins are just the two-table join applied again.
//  sqlite builds orders × order_items first, then joins products onto
//  that intermediate result.
//
//      SELECT p.name          AS product,
//             oi.qty          AS qty,
//             p.price         AS price,
//             oi.qty * p.price AS line_total
//        FROM orders o
//        JOIN order_items oi ON oi.order_id = o.id
//        JOIN products p     ON p.id = oi.product_id
//       WHERE o.id = ?
//       ORDER BY p.name
//
//  Row-wise: take an order, find its line items, and for each line item
//  find the one product it names. The result has one row per LINE ITEM —
//  the grain of the output is set by the finest table in the chain. All 20
//  line items joined this way stay 20 rows; add a fourth table with two
//  matches per line and it would become 40. Knowing the grain of a query
//  is how you avoid double-counting money later.
//  Each ON links the new table to something already present. Forget the ON
//  entirely and you get a CROSS JOIN — every combination, 12 × 20 × 6 rows
//  — which returns quickly enough on this data to fool you.
//  `qty * price` is an expression, not a column, so it MUST be aliased or
//  your object key becomes the literal string `oi.qty * p.price`.
//  The last test is the payoff: the total this three-table join computes
//  matches the `total_cents` denormalised onto each order. When they stop
//  agreeing, one of the two is a bug — and that is a real check to run.
//  In app code: the order-detail page, the invoice PDF, the packing slip.

import { test, eq } from '../../_lib/check.js';
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

export function lineItems(db, orderId) {
  return db
    .prepare(
      `SELECT p.name           AS product,
              oi.qty           AS qty,
              p.price          AS price,
              oi.qty * p.price AS line_total
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         JOIN products p     ON p.id = oi.product_id
        WHERE o.id = ?
        ORDER BY p.name`
    )
    .all(orderId)
    .map((row) => ({ ...row }));
}

export function receipt(db, orderId) {
  const head = db
    .prepare(
      `SELECT o.id        AS order_id,
              c.name      AS customer,
              o.placed_on AS placed_on
         FROM orders o
         JOIN customers c ON c.id = o.customer_id
        WHERE o.id = ?`
    )
    .get(orderId);
  if (!head) return null;
  const lines = lineItems(db, orderId);
  return {
    ...head,
    lines,
    total: lines.reduce((sum, line) => sum + line.line_total, 0),
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('lineItems turns product ids into product names', () => {
  withShop((db) => {
    eq(
      lineItems(db, 4).map((l) => l.product),
      ['keyboard', 'mouse', 'usb hub']
    );
  });
});

test('line_total is qty times price, computed by sqlite', () => {
  withShop((db) => {
    eq(lineItems(db, 1), [
      { product: 'keyboard', qty: 1, price: 7200, line_total: 7200 },
      { product: 'mouse', qty: 2, price: 2500, line_total: 5000 },
    ]);
  });
});

test('an order with one line has one row', () => {
  withShop((db) => {
    eq(lineItems(db, 2), [
      { product: 'monitor', qty: 1, price: 19900, line_total: 19900 },
    ]);
  });
});

test('an order that does not exist has no lines', () => {
  withShop((db) => {
    eq(lineItems(db, 999), []);
  });
});

test('receipt carries a name from three tables away', () => {
  withShop((db) => {
    const r = receipt(db, 4);
    eq(r.order_id, 4);
    eq(r.customer, 'Linus');
    eq(r.placed_on, '2024-02-14');
    eq(r.lines.length, 3);
    eq(r.total, 14200);
  });
});

test('receipt is null when the order does not exist', () => {
  withShop((db) => {
    eq(receipt(db, 999), null);
  });
});

test('every recomputed total matches the one stored on the order', () => {
  withShop((db) => {
    const stored = db
      .prepare('SELECT id, total_cents FROM orders ORDER BY id')
      .all();
    for (const order of stored) {
      eq(
        receipt(db, order.id).total,
        order.total_cents,
        `order ${order.id} disagrees with its line items`
      );
    }
    eq(stored.length, 12);
  });
});
