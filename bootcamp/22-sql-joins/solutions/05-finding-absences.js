// ─────────────────────────────────────────────────────────────────────────
//  05 · finding what is missing — the anti-join — SOLUTION       ★★☆ core
//  run: node 05-finding-absences.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two steps that look like one. The LEFT JOIN keeps every
//  customer and pads the non-buyers with NULLs; the WHERE then throws away
//  everything that DID match, leaving only the padding.
//
//      SELECT c.id, c.name
//        FROM customers c
//        LEFT JOIN orders o ON o.customer_id = c.id
//       WHERE o.id IS NULL
//       ORDER BY c.name
//
//  Test the right column. `o.id` is a NOT NULL primary key, so it is NULL
//  in exactly one situation — the LEFT JOIN invented this row. Testing a
//  nullable column instead ("WHERE o.note IS NULL") mixes "no order" with
//  "an order without a note", and that bug is quiet.
//  NULL is not a value, it is the absence of one, so nothing equals it —
//  not even another NULL. `o.id = NULL` evaluates to NULL, WHERE keeps
//  only rows that are true, and you get zero rows back with no error and
//  no warning. That silence is why this is the classic SQL trap.
//  The same query, once per direction of the relationship: customers with
//  no orders, products with no line items, invoices with no payment, users
//  who never logged in. You will also see `NOT EXISTS` and `NOT IN` used
//  for this — `NOT IN` has its own NULL landmine, so the LEFT JOIN … IS
//  NULL form is the one to keep in your fingers.
//  In app code this is the churn report and the dead-inventory report.

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

export function customersWithNoOrders(db) {
  return db
    .prepare(
      `SELECT c.id AS id, c.name AS name
         FROM customers c
         LEFT JOIN orders o ON o.customer_id = c.id
        WHERE o.id IS NULL
        ORDER BY c.name`
    )
    .all()
    .map((row) => ({ ...row }));
}

export function productsNeverSold(db) {
  return db
    .prepare(
      `SELECT p.id AS id, p.name AS name
         FROM products p
         LEFT JOIN order_items oi ON oi.product_id = p.id
        WHERE oi.id IS NULL
        ORDER BY p.name`
    )
    .all()
    .map((row) => ({ ...row }));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('two customers have never placed an order', () => {
  withShop((db) => {
    eq(customersWithNoOrders(db), [
      { id: 7, name: 'Edsger' },
      { id: 8, name: 'Katherine' },
    ]);
  });
});

test('exactly one product has never been sold', () => {
  withShop((db) => {
    eq(productsNeverSold(db), [{ id: 6, name: 'laptop stand' }]);
  });
});

test('give Edsger an order and he drops off the list', () => {
  withShop((db) => {
    eq(customersWithNoOrders(db).length, 2);
    db.exec("INSERT INTO orders VALUES (13, 7, '2024-06-01', 5000)");
    eq(customersWithNoOrders(db), [{ id: 8, name: 'Katherine' }]);
  });
});

test('sell one laptop stand and the dead-stock list empties', () => {
  withShop((db) => {
    eq(productsNeverSold(db).length, 1);
    db.exec(`INSERT INTO orders      VALUES (13, 1, '2024-06-01', 6000);
             INSERT INTO order_items VALUES (21, 13, 6, 1)`);
    eq(productsNeverSold(db), []);
  });
});

test('= NULL matches nothing, which is why it must be IS NULL', () => {
  withShop((db) => {
    eq(customersWithNoOrders(db).length, 2);
    const wrong = db
      .prepare(
        `SELECT c.id FROM customers c
           LEFT JOIN orders o ON o.customer_id = c.id
          WHERE o.id = NULL`
      )
      .all();
    eq(wrong, [], 'NULL = NULL is NULL, and NULL is not true');
  });
});

test('the rows come back as plain objects', () => {
  withShop((db) => {
    const row = customersWithNoOrders(db)[0];
    eq(Object.getPrototypeOf(row), Object.prototype);
    eq(Object.keys(row).sort(), ['id', 'name']);
  });
});
