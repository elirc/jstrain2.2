// ─────────────────────────────────────────────────────────────────────────
//  03 · filtering across the join                                ★★☆ core
//  concepts: JOIN + WHERE · qualified columns · parameters
//  run: node 03-join-and-filter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Same join, now with a WHERE. The filter runs against the joined row,
//  so it can name a column from either table — that is the whole point.
//
//    · ordersOver(db, cents)       orders above that amount, biggest
//                                  first, ties broken by order_id, shaped
//                                  { order_id, customer, city, total }
//    · ordersFromCity(db, city)    orders placed by people in that city,
//                                  by order_id, shaped
//                                  { order_id, customer, total }
//
//  "Over" means strictly greater than.
//
//      ordersOver(db, 10000)         → 6 rows, Margaret's $470.00 first
//      ordersFromCity(db, 'London')  → orders 1, 3, 7, 8 (two Londoners)
//
//  hint: qualify every column (`o.total_cents`, `c.city`) once a second
//  table is in play — bare `id` is ambiguous and sqlite will say so.

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

export function ordersOver(db, cents) {
  throw new Error('TODO');
}

export function ordersFromCity(db, city) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('ordersOver keeps only the orders above the bound', () => {
  withShop((db) => {
    eq(ordersOver(db, 10000).length, 6);
    eq(ordersOver(db, 0).length, 12);
  });
});

test('the biggest order comes first, with the buyer and their city', () => {
  withShop((db) => {
    eq(ordersOver(db, 10000)[0], {
      order_id: 5,
      customer: 'Margaret',
      city: 'Boston',
      total: 47000,
    });
  });
});

test('the whole list is sorted by total, descending', () => {
  withShop((db) => {
    eq(
      ordersOver(db, 10000).map((r) => r.total),
      [47000, 24400, 19900, 14400, 14200, 12200]
    );
  });
});

test('"over" is strictly greater than, so the bound itself is out', () => {
  withShop((db) => {
    eq(
      ordersOver(db, 19900).map((r) => r.order_id),
      [5, 10],
      'order 2 is exactly 19900 and must not appear'
    );
    eq(ordersOver(db, 47000), []);
  });
});

test('ordersFromCity filters on a column of the other table', () => {
  withShop((db) => {
    const london = ordersFromCity(db, 'London');
    eq(
      london.map((r) => r.order_id),
      [1, 3, 7, 8]
    );
    eq(
      london.map((r) => r.customer),
      ['Ada', 'Ada', 'Alan', 'Ada'],
      'two different Londoners'
    );
  });
});

test('a city whose only customer never ordered comes back empty', () => {
  withShop((db) => {
    eq(ordersFromCity(db, 'Amsterdam'), []);
    eq(ordersFromCity(db, 'Atlantis'), []);
  });
});

test('the city is a parameter, not string glue', () => {
  withShop((db) => {
    eq(
      ordersFromCity(db, "' OR 1 = 1 --"),
      [],
      'a value can never become syntax'
    );
  });
});
