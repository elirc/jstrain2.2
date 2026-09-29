// ─────────────────────────────────────────────────────────────────────────
//  04 · LEFT JOIN — keeping the unmatched rows — SOLUTION        ★★☆ core
//  run: node 04-left-join.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the difference is one word and it is the most important
//  word in this module.
//
//      FROM customers c
//      JOIN orders o ON o.customer_id = c.id        -- 12 rows
//      LEFT JOIN orders o ON o.customer_id = c.id   -- 14 rows
//
//  Row-wise: for each customer, find the orders whose customer_id matches.
//  INNER emits one row per match and nothing when there are none. LEFT
//  emits one row per match too, but if a customer matched nothing it still
//  emits ONE row, with every `orders` column set to NULL. So the left
//  result is the inner result plus exactly one row per unmatched customer:
//  12 + 2 = 14. Pin that arithmetic and the concept is yours.
//  "Left" means the table named first, in FROM. `customers LEFT JOIN
//  orders` keeps all customers; `orders LEFT JOIN customers` keeps all
//  orders, which here is the same as an inner join because every order has
//  a real customer. Choosing which table goes on the left IS the design
//  decision — the question you are asking picks it.
//  In JavaScript those NULLs land as `null`, and the key is still there,
//  so `'total' in row` is true while `row.total` is null. Code that does
//  `row.total.toFixed(2)` crashes on exactly the customers you added the
//  LEFT JOIN to include, which is a wonderfully ironic bug.
//  This is the "every user, with their subscription if they have one" query
//  behind most dashboards.

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

const COLUMNS = `
  SELECT c.name        AS customer,
         o.id          AS order_id,
         o.total_cents AS total
`;
const TAIL = ' ORDER BY c.id, o.id';

export function onlyCustomersWhoOrdered(db) {
  return db
    .prepare(
      COLUMNS +
        `FROM customers c
           JOIN orders o ON o.customer_id = c.id` +
        TAIL
    )
    .all()
    .map((row) => ({ ...row }));
}

export function everyCustomerWithOrders(db) {
  return db
    .prepare(
      COLUMNS +
        `FROM customers c
           LEFT JOIN orders o ON o.customer_id = c.id` +
        TAIL
    )
    .all()
    .map((row) => ({ ...row }));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the inner join has one row per order', () => {
  withShop((db) => {
    eq(onlyCustomersWhoOrdered(db).length, 12);
  });
});

test('the left join has one row per order PLUS the customers with none', () => {
  withShop((db) => {
    eq(everyCustomerWithOrders(db).length, 14);
  });
});

test('the difference is exactly the customers who never ordered', () => {
  withShop((db) => {
    const inner = onlyCustomersWhoOrdered(db);
    const left = everyCustomerWithOrders(db);
    eq(left.length - inner.length, 2);
  });
});

test('the unmatched rows carry null, not zero and not undefined', () => {
  withShop((db) => {
    const empty = everyCustomerWithOrders(db).filter(
      (r) => r.order_id === null
    );
    eq(
      empty.map((r) => r.customer),
      ['Edsger', 'Katherine']
    );
    eq(empty[0], { customer: 'Edsger', order_id: null, total: null });
    ok('total' in empty[0], 'the column is there — its value is empty');
  });
});

test('every customer shows up at least once in the left version', () => {
  withShop((db) => {
    const names = new Set(everyCustomerWithOrders(db).map((r) => r.customer));
    eq(names.size, 8);
  });
});

test('two customers are missing entirely from the inner version', () => {
  withShop((db) => {
    const names = new Set(onlyCustomersWhoOrdered(db).map((r) => r.customer));
    eq(names.size, 6);
    ok(!names.has('Edsger'));
    ok(!names.has('Katherine'));
  });
});

test('a customer who did order looks identical in both reports', () => {
  withShop((db) => {
    const ada = (rows) => rows.filter((r) => r.customer === 'Ada');
    eq(ada(everyCustomerWithOrders(db)), ada(onlyCustomersWhoOrdered(db)));
    eq(ada(onlyCustomersWhoOrdered(db)).length, 3);
  });
});
