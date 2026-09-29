// ─────────────────────────────────────────────────────────────────────────
//  10 · the N+1 problem, and the join that kills it — SOLUTION ★★★ stretch
//  run: node 10-n-plus-one.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the naive version is not stupid code. It is the most
//  natural code, and every ORM makes it easy to write by accident:
//
//      for (const order of orders) {
//        order.customer = await Customer.findById(order.customerId);
//      }
//
//  One query for the list, then one per row. Twelve orders → 13 queries.
//  A thousand orders → 1001, each with its own round trip, and on a
//  network database that is a second of latency doing nothing useful. It
//  sails through local tests, because with 12 rows in sqlite you cannot
//  feel it. It falls over in production, where the row count grew and the
//  database is on another machine.
//  The fix is to say what you want in one sentence:
//
//      SELECT o.id, o.placed_on, o.total_cents, c.name AS customer
//        FROM orders o
//        JOIN customers c ON c.id = o.customer_id
//       ORDER BY o.id
//
//  sqlite does the same lookups internally — but it does them with the
//  index already in memory, in one pass, and it sends one result back.
//  Note what the counter shows: the naive cost tracks ROWS, not distinct
//  customers. Ada appears three times and is fetched three times; nothing
//  caches. That is why "just add a cache" is the wrong first answer.
//  The real names for the two fixes: eager loading (a join, or the ORM's
//  `include`/`joinedload`/`with`) and batching (collect the ids, issue one
//  `WHERE id IN (…)` — this is exactly what DataLoader does for GraphQL).
//  When a page is mysteriously slow, count the queries first. A query log
//  that scrolls is the diagnosis, and the loop is where you look.

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

// Provided: wraps a database so every query actually executed is
// counted. Only prepare/all/get are forwarded — enough for this file.
function counting(real) {
  const counter = { queries: 0 };
  const db = {
    prepare(sql) {
      const stmt = real.prepare(sql);
      return {
        all(...args) {
          counter.queries += 1;
          return stmt.all(...args);
        },
        get(...args) {
          counter.queries += 1;
          return stmt.get(...args);
        },
      };
    },
  };
  return { db, counter };
}

export function getOrdersNaive(db) {
  const orders = db
    .prepare(
      'SELECT id, customer_id, placed_on, total_cents FROM orders ORDER BY id'
    )
    .all();
  const findCustomer = db.prepare('SELECT name FROM customers WHERE id = ?');
  return orders.map((order) => ({
    id: order.id,
    placed_on: order.placed_on,
    total_cents: order.total_cents,
    customer: findCustomer.get(order.customer_id).name, // ← one per row
  }));
}

export function getOrdersJoined(db) {
  return db
    .prepare(
      `SELECT o.id          AS id,
              o.placed_on   AS placed_on,
              o.total_cents AS total_cents,
              c.name        AS customer
         FROM orders o
         JOIN customers c ON c.id = o.customer_id
        ORDER BY o.id`
    )
    .all()
    .map((row) => ({ ...row }));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the naive version lists every order with its customer', () => {
  withShop((real) => {
    const { db } = counting(real);
    const rows = getOrdersNaive(db);
    eq(rows.length, 12);
    eq(rows[0], {
      id: 1,
      placed_on: '2024-01-05',
      total_cents: 12200,
      customer: 'Ada',
    });
    eq(rows[11].customer, 'Margaret');
  });
});

test('the joined version returns exactly the same data', () => {
  withShop((real) => {
    const naive = getOrdersNaive(counting(real).db);
    const joined = getOrdersJoined(counting(real).db);
    eq(joined, naive, 'same rows, same order, same values');
  });
});

test('the naive version costs one query per order, plus one', () => {
  withShop((real) => {
    const { db, counter } = counting(real);
    getOrdersNaive(db);
    eq(counter.queries, 13, '1 for the list + 12 for the customers');
  });
});

test('the joined version costs exactly one query', () => {
  withShop((real) => {
    const { db, counter } = counting(real);
    getOrdersJoined(db);
    eq(counter.queries, 1);
  });
});

test('the cost follows rows, not distinct customers', () => {
  withShop((real) => {
    const { db, counter } = counting(real);
    const rows = getOrdersNaive(db);
    const people = new Set(rows.map((r) => r.customer));
    eq(people.size, 6, 'only six customers…');
    eq(counter.queries, 13, '…but twelve lookups — nothing is cached');
  });
});

test('with a single order the naive version still pays the +1', () => {
  withShop((real) => {
    real.exec('DELETE FROM order_items; DELETE FROM orders WHERE id > 1');
    const naive = counting(real);
    eq(getOrdersNaive(naive.db).length, 1);
    eq(naive.counter.queries, 2, 'the outer query is the "+1"');
    const joined = counting(real);
    eq(getOrdersJoined(joined.db).length, 1);
    eq(joined.counter.queries, 1);
  });
});

test('six more orders cost the naive version six more queries', () => {
  withShop((real) => {
    for (let i = 13; i <= 18; i += 1) {
      real.exec(`INSERT INTO orders VALUES (${i}, 1, '2024-06-01', 1000)`);
    }
    const naive = counting(real);
    eq(getOrdersNaive(naive.db).length, 18);
    eq(naive.counter.queries, 19);
    const joined = counting(real);
    eq(getOrdersJoined(joined.db).length, 18);
    eq(joined.counter.queries, 1, 'the join does not care how many rows');
  });
});

test('both versions hand back plain objects with the same four keys', () => {
  withShop((real) => {
    const keys = (rows) => Object.keys(rows[0]).sort();
    const naive = getOrdersNaive(counting(real).db);
    const joined = getOrdersJoined(counting(real).db);
    eq(keys(naive), ['customer', 'id', 'placed_on', 'total_cents']);
    eq(keys(joined), keys(naive));
    ok(Object.getPrototypeOf(joined[0]) === Object.prototype);
  });
});
