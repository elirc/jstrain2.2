// ─────────────────────────────────────────────────────────────────────────
//  08 · HAVING vs WHERE — filtering before and after — SOLUTION  ★★☆ core
//  run: node 08-having-vs-where.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: SQL evaluates a grouped query in a fixed order, and every
//  confusing result in this exercise comes from forgetting it:
//
//      FROM / JOIN   build the joined rows
//      WHERE         throw rows away          ← before counting
//      GROUP BY      collapse into groups
//      HAVING        throw groups away        ← after counting
//      ORDER BY      sort what survived
//      LIMIT         keep the first n
//
//  So WHERE cannot mention COUNT(*): at that point nothing has been
//  counted, and sqlite answers "misuse of aggregate: COUNT()". HAVING can
//  mention it, because the aggregate is exactly what it is there to test.
//
//      SELECT c.name AS customer, COUNT(*) AS orders
//        FROM customers c
//        JOIN orders o ON o.customer_id = c.id
//       WHERE o.placed_on >= ?
//       GROUP BY c.id
//      HAVING COUNT(*) >= ?
//       ORDER BY orders DESC, c.name
//
//  Read those two filters as different questions. WHERE asks "which orders
//  count towards this report?"; HAVING asks "which customers are worth
//  showing?". Since March, Ada has only one qualifying order, so she is
//  counted (WHERE kept one row) and then cut (HAVING wanted two) — Grace
//  is the only survivor. Moving a condition from WHERE to HAVING silently
//  changes the answer, and that is a bug you cannot see in a diff.
//  Note COUNT(*) is fine here: this is an INNER join, so there are no
//  padded rows to miscount. Over a LEFT JOIN it would be COUNT(o.id).
//  In app code: "power users in the last 30 days" — the date window is
//  WHERE, the threshold is HAVING.

import { test, eq, throws } from '../../_lib/check.js';
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

export function repeatCustomers(db, minOrders) {
  return db
    .prepare(
      `SELECT c.name AS customer, COUNT(*) AS orders
         FROM customers c
         JOIN orders o ON o.customer_id = c.id
        GROUP BY c.id
       HAVING COUNT(*) >= ?
        ORDER BY orders DESC, c.name`
    )
    .all(minOrders)
    .map((row) => ({ ...row }));
}

export function repeatCustomersSince(db, sinceDate, minOrders) {
  return db
    .prepare(
      `SELECT c.name AS customer, COUNT(*) AS orders
         FROM customers c
         JOIN orders o ON o.customer_id = c.id
        WHERE o.placed_on >= ?
        GROUP BY c.id
       HAVING COUNT(*) >= ?
        ORDER BY orders DESC, c.name`
    )
    .all(sinceDate, minOrders)
    .map((row) => ({ ...row }));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('four customers have ordered at least twice', () => {
  withShop((db) => {
    eq(repeatCustomers(db, 2), [
      { customer: 'Ada', orders: 3 },
      { customer: 'Grace', orders: 3 },
      { customer: 'Linus', orders: 2 },
      { customer: 'Margaret', orders: 2 },
    ]);
  });
});

test('the threshold is a parameter, and it really filters', () => {
  withShop((db) => {
    eq(repeatCustomers(db, 3).map((r) => r.customer), ['Ada', 'Grace']);
    eq(repeatCustomers(db, 4), []);
  });
});

test('a threshold of 1 is still an inner join — the silent two stay out', () => {
  withShop((db) => {
    eq(repeatCustomers(db, 1).length, 6);
  });
});

test('WHERE runs first, so a date window changes every count', () => {
  withShop((db) => {
    eq(repeatCustomersSince(db, '2024-03-01', 2), [
      { customer: 'Grace', orders: 2 },
    ]);
  });
});

test('widen the window and the same threshold lets four through', () => {
  withShop((db) => {
    eq(
      repeatCustomersSince(db, '2024-02-01', 2).map((r) => r.customer),
      ['Ada', 'Grace', 'Linus', 'Margaret']
    );
    eq(repeatCustomersSince(db, '2024-01-01', 2).length, 4);
  });
});

test('a window with too little in it produces nothing', () => {
  withShop((db) => {
    eq(repeatCustomersSince(db, '2024-05-01', 2), []);
    eq(repeatCustomersSince(db, '2024-05-01', 1), [
      { customer: 'Margaret', orders: 1 },
    ]);
  });
});

test('WHERE cannot see an aggregate — that is what HAVING is for', () => {
  withShop((db) => {
    eq(repeatCustomers(db, 2).length, 4);
    throws(
      () =>
        db
          .prepare(
            `SELECT c.name FROM customers c
               JOIN orders o ON o.customer_id = c.id
              WHERE COUNT(*) >= 2
              GROUP BY c.id`
          )
          .all(),
      'misuse of aggregate'
    );
  });
});
