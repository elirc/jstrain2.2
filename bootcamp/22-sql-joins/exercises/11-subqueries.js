// ─────────────────────────────────────────────────────────────────────────
//  11 · subqueries — a query used as a value                  ★★★ stretch
//  concepts: scalar subqueries · derived tables · HAVING with a subquery
//  run: node 11-subqueries.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A SELECT that returns exactly one row and one column can be used
//  anywhere a value can — including inside another query's HAVING. That is
//  how you compare each row against a summary of the whole table without
//  two round trips.
//
//    · averageCustomerSpend(db)  → one number: the mean lifetime spend of
//                                  the customers who have actually ordered
//    · bigSpenders(db)           → [{ customer, spend }], the customers
//                                  above that average, biggest first
//
//  The average is over CUSTOMERS, not over orders, so you need to total
//  each customer up first and then average those totals — a query used as
//  a table, which SQL calls a derived table:
//
//      SELECT AVG(spend) FROM (SELECT SUM(...) AS spend ... GROUP BY ...)
//
//  hint: four customers clear the bar, and one of them clears it by less
//  than 1%. Do not round anything.

import { test, eq, ok, approx } from '../../_lib/check.js';
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

export function averageCustomerSpend(db) {
  throw new Error('TODO');
}

export function bigSpenders(db) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the average is the mean of the six customers who ordered', () => {
  withShop((db) => {
    approx(averageCustomerSpend(db), 167300 / 6, 1e-6);
  });
});

test('the two who never ordered are not in the denominator', () => {
  withShop((db) => {
    const average = averageCustomerSpend(db);
    ok(
      Math.abs(average - 167300 / 8) > 1,
      'averaging over all eight would give a very different bar'
    );
  });
});

test('four customers spend more than the average', () => {
  withShop((db) => {
    eq(
      bigSpenders(db).map((r) => r.customer),
      ['Margaret', 'Grace', 'Linus', 'Ada']
    );
  });
});

test('the list is biggest first and carries the totals', () => {
  withShop((db) => {
    eq(bigSpenders(db)[0], { customer: 'Margaret', spend: 49500 });
    eq(bigSpenders(db)[1], { customer: 'Grace', spend: 45800 });
  });
});

test('Ada clears the bar by about one percent', () => {
  withShop((db) => {
    const ada = bigSpenders(db).find((r) => r.customer === 'Ada');
    eq(ada.spend, 28200);
    ok(ada.spend > averageCustomerSpend(db), 'barely, and that counts');
  });
});

test('the average is recomputed, not baked in', () => {
  withShop((db) => {
    eq(bigSpenders(db).length, 4);
    // one huge order from Barbara drags the average up past two people
    db.exec("INSERT INTO orders VALUES (13, 6, '2024-06-01', 60000)");
    eq(
      bigSpenders(db).map((r) => r.customer),
      ['Barbara', 'Margaret', 'Grace']
    );
  });
});

test('AVG hands back a float, not a rounded integer', () => {
  withShop((db) => {
    const average = averageCustomerSpend(db);
    eq(typeof average, 'number');
    ok(!Number.isInteger(average), 'do not round it before comparing');
  });
});
