// ─────────────────────────────────────────────────────────────────────────
//  13 · indexes on the columns you join on — SOLUTION         ★★★ stretch
//  run: node 13-join-indexes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: run `EXPLAIN QUERY PLAN` on a query and sqlite tells you,
//  in one line per table, how it intends to reach the rows.
//
//      SCAN o      read every row of orders and throw most away
//      SEARCH o    jump to the matching rows through an index
//
//  Before the index, `WHERE o.customer_id = ?` is a SCAN: 12 rows, so it
//  is instant, and that is exactly why the habit has to come from reading
//  the plan rather than from timing it. At a million orders the same query
//  is the same shape and a thousand times slower.
//
//      CREATE INDEX IF NOT EXISTS idx_orders_customer
//        ON orders(customer_id);
//
//  Now the plan says SEARCH … USING COVERING INDEX. "Covering" means every
//  column the query needed was in the index itself, so sqlite never had to
//  go back to the table at all — a bonus, not a different mechanism.
//  And the planner really is deciding, not obeying. Ask the same join for
//  a column the index does not hold and it may go back to scanning,
//  because for that query the scan is genuinely cheaper. Which is the
//  whole point of reading the plan instead of trusting that "I added an
//  index" means "the index is used".
//  Which columns? The ones you join on, filter on and sort by. The primary
//  key side of a foreign key is already indexed for you (`c.id` shows up
//  as SEARCH USING INTEGER PRIMARY KEY even with no indexes at all); the
//  CHILD side — `orders.customer_id`, `order_items.order_id` — is not.
//  Almost every "the app got slow as we grew" story is an unindexed
//  foreign key, because that is the column every join uses.
//  Indexes are not free: each one is a second structure to update on every
//  INSERT, UPDATE and DELETE, and it costs disk. Index what you actually
//  query, then check the plan rather than believing yourself.
//  `IF NOT EXISTS` is what makes this safe to run on every boot — the same
//  idempotence a migration runner is built on. And the last test is the
//  one that matters: the plan changed, the answers did not.

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

// Provided: two queries whose plans you are about to change.
const BY_CUSTOMER = `
  SELECT c.name AS name, o.id AS id
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
   WHERE o.customer_id = ?
   ORDER BY o.id
`;
const ONE_ORDERS_LINES = `
  SELECT o.id AS id, oi.qty AS qty
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
   WHERE o.id = ?
`;

export function planFor(db, sql, ...params) {
  return db
    .prepare('EXPLAIN QUERY PLAN ' + sql)
    .all(...params)
    .map((row) => row.detail)
    .join(' | ');
}

export function addJoinIndexes(db) {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_customer
      ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_items_order
      ON order_items(order_id);
  `);
  return ['idx_orders_customer', 'idx_items_order'];
}

// ──────────────────────────── tests ──────────────────────────────────────

test('planFor reports the planner in its own words', () => {
  withShop((db) => {
    const plan = planFor(db, BY_CUSTOMER, 2);
    eq(typeof plan, 'string');
    ok(/SCAN|SEARCH/.test(plan), `got: ${plan}`);
  });
});

test('with no index, filtering orders by customer is a full scan', () => {
  withShop((db) => {
    const plan = planFor(db, BY_CUSTOMER, 2);
    ok(plan.includes('SCAN o'), `expected a scan of orders, got: ${plan}`);
    ok(!/INDEX/.test(plan), `no user index exists yet, got: ${plan}`);
  });
});

test('addJoinIndexes creates the two indexes it names', () => {
  withShop((db) => {
    eq(addJoinIndexes(db), ['idx_orders_customer', 'idx_items_order']);
    const names = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all()
      .map((row) => row.name)
      .sort();
    eq(names, ['idx_items_order', 'idx_orders_customer']);
  });
});

test('after the index the same query searches instead of scanning', () => {
  withShop((db) => {
    addJoinIndexes(db);
    const plan = planFor(db, BY_CUSTOMER, 2);
    ok(/USING (COVERING )?INDEX/.test(plan), `got: ${plan}`);
    ok(plan.includes('idx_orders_customer'), `got: ${plan}`);
    ok(!plan.includes('SCAN o'), `orders should not be scanned: ${plan}`);
  });
});

test("one order's line items go from a scan to a search", () => {
  withShop((db) => {
    const before = planFor(db, ONE_ORDERS_LINES, 4);
    ok(before.includes('SCAN oi'), `got: ${before}`);
    addJoinIndexes(db);
    const after = planFor(db, ONE_ORDERS_LINES, 4);
    ok(after.includes('idx_items_order'), `got: ${after}`);
    ok(!after.includes('SCAN'), `nothing is scanned now: ${after}`);
  });
});

test('the primary key side was already indexed for free', () => {
  withShop((db) => {
    const plan = planFor(db, BY_CUSTOMER, 2);
    ok(
      plan.includes('INTEGER PRIMARY KEY'),
      `customers is reached by rowid: ${plan}`
    );
  });
});

test('running it twice is not an error', () => {
  withShop((db) => {
    addJoinIndexes(db);
    addJoinIndexes(db);
    eq(
      db
        .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'index'")
        .get().n,
      2
    );
  });
});

test('the plan changed — the answer did not', () => {
  withShop((db) => {
    const rows = () =>
      db.prepare(BY_CUSTOMER).all(2).map((row) => ({ ...row }));
    const before = rows();
    eq(before.length, 3, 'Grace placed three orders');
    addJoinIndexes(db);
    eq(rows(), before, 'an index is a shortcut, never a different answer');
  });
});
