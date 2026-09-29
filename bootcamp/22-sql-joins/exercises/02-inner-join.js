// ─────────────────────────────────────────────────────────────────────────
//  02 · INNER JOIN — the database does the lookup             ★☆☆ warm-up
//  concepts: JOIN · ON · table aliases · AS
//  run: node 02-inner-join.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An order row holds `customer_id`, a number. Nobody wants a report full
//  of numbers. A JOIN is the lookup that turns the number back into the
//  row it points at: for each order, find the customer whose id matches,
//  and hand the two rows back glued side by side.
//
//      SELECT o.id, c.name
//        FROM orders o
//        JOIN customers c ON c.id = o.customer_id
//
//  Build two readers over the shop below:
//
//    · ordersWithCustomer(db)  every order, oldest first, shaped
//                              { order_id, customer, total }
//    · orderById(db, id)       one such row, or null when there is none
//
//  `AS` names the columns of the result, and those names become the keys
//  of the objects you get back — the aliases are your API.

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

export function ordersWithCustomer(db) {
  throw new Error('TODO');
}

export function orderById(db, id) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('there is one row per order, oldest first', () => {
  withShop((db) => {
    const rows = ordersWithCustomer(db);
    eq(rows.length, 12);
    eq(
      rows.map((r) => r.order_id),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
  });
});

test('each row carries the name, not the id', () => {
  withShop((db) => {
    eq(ordersWithCustomer(db)[0], {
      order_id: 1,
      customer: 'Ada',
      total: 12200,
    });
  });
});

test('a customer with three orders appears three times', () => {
  withShop((db) => {
    const ada = ordersWithCustomer(db).filter((r) => r.customer === 'Ada');
    eq(ada.length, 3, 'the join repeats the customer, once per match');
    eq(
      ada.map((r) => r.order_id),
      [1, 3, 8]
    );
  });
});

test('the AS aliases decide the property names', () => {
  withShop((db) => {
    eq(Object.keys(ordersWithCustomer(db)[0]).sort(), [
      'customer',
      'order_id',
      'total',
    ]);
  });
});

test('orderById reads one joined row as a plain object', () => {
  withShop((db) => {
    const row = orderById(db, 5);
    eq(row, { order_id: 5, customer: 'Margaret', total: 47000 });
    eq(Object.getPrototypeOf(row), Object.prototype);
  });
});

test('orderById returns null for an order that is not there', () => {
  withShop((db) => {
    eq(orderById(db, 999), null);
  });
});

test('an inner join has nothing to say about customers who never ordered', () => {
  withShop((db) => {
    const names = new Set(ordersWithCustomer(db).map((r) => r.customer));
    eq(names.size, 6, 'only the six who actually bought something');
    ok(!names.has('Edsger'), 'Edsger has no order to join to');
    ok(!names.has('Katherine'));
  });
});
