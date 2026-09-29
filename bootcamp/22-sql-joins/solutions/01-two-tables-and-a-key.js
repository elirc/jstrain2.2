// ─────────────────────────────────────────────────────────────────────────
//  01 · two tables and the key between them — SOLUTION        ★☆☆ warm-up
//  run: node 01-two-tables-and-a-key.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `REFERENCES customers(id)` on the column is the entire
//  declaration, and it says two things at once — a documentation claim
//  ("this integer is a customer id") and a rule enforced on every write.
//
//      customer_id INTEGER NOT NULL REFERENCES customers(id)
//
//  That rule is what makes a join trustworthy. If customer_id could hold
//  any integer at all, then
//
//      JOIN customers c ON c.id = o.customer_id
//
//  would quietly drop the orders whose customer does not exist, and your
//  revenue report would be short by an amount nobody can explain.
//  The pragma is the catch. The sqlite C library ships with foreign_keys
//  OFF for compatibility with databases written before 2009: you declare
//  the key, get no enforcement, and meet the orphans years later.
//  node:sqlite flips it ON when it opens the database, so the default here
//  is the safe one — but a different driver has a different default, which
//  is why real startup code sets it explicitly instead of hoping.
//  Enforcement runs both ways. An INSERT cannot invent a parent, and a
//  DELETE cannot remove one that still has children; sqlite refuses rather
//  than leave orders pointing at nothing. If you want the children removed
//  too you have to say so — `REFERENCES customers(id) ON DELETE CASCADE`.
//  Silence is not a policy, it is NO ACTION.
//  In app code this is the migration file, written once and then relied on
//  by every query in the rest of this module.

import { test, eq, ok, throws } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

// Provided: a fresh, empty database, closed after each test.
function withDb(run) {
  const db = new DatabaseSync(':memory:');
  try {
    return run(db);
  } finally {
    db.close();
  }
}

export function createShop(db) {
  db.exec(`
    CREATE TABLE customers (
      id   INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL
    );
    CREATE TABLE orders (
      id          INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      placed_on   TEXT    NOT NULL,
      total_cents INTEGER NOT NULL
    );
  `);
}

export function addCustomer(db, name, city) {
  return db
    .prepare('INSERT INTO customers (name, city) VALUES (?, ?)')
    .run(name, city).lastInsertRowid;
}

export function addOrder(db, customerId, placedOn, totalCents) {
  return db
    .prepare(
      `INSERT INTO orders (customer_id, placed_on, total_cents)
       VALUES (?, ?, ?)`
    )
    .run(customerId, placedOn, totalCents).lastInsertRowid;
}

export function foreignKeysOn(db) {
  return db.prepare('PRAGMA foreign_keys').get().foreign_keys === 1;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('createShop creates both tables', () => {
  withDb((db) => {
    createShop(db);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name)
      .sort();
    eq(tables, ['customers', 'orders']);
  });
});

test('orders.customer_id is declared as a key into customers', () => {
  withDb((db) => {
    createShop(db);
    const keys = db.prepare('PRAGMA foreign_key_list(orders)').all();
    eq(keys.length, 1, 'expected exactly one foreign key on orders');
    eq(keys[0].table, 'customers');
    eq(keys[0].from, 'customer_id');
    eq(keys[0].to, 'id');
  });
});

test('a customer, then an order that points at them', () => {
  withDb((db) => {
    createShop(db);
    const ada = addCustomer(db, 'Ada', 'London');
    eq(ada, 1);
    const order = addOrder(db, ada, '2024-01-05', 12200);
    eq(order, 1);
    eq({ ...db.prepare('SELECT * FROM orders WHERE id = ?').get(order) }, {
      id: 1,
      customer_id: 1,
      placed_on: '2024-01-05',
      total_cents: 12200,
    });
  });
});

test('node:sqlite turns key enforcement on for you', () => {
  withDb((db) => {
    createShop(db);
    eq(foreignKeysOn(db), true, 'plain sqlite would say false here');
  });
});

test('an order for a customer who does not exist is refused', () => {
  withDb((db) => {
    createShop(db);
    addCustomer(db, 'Ada', 'London');
    throws(() => addOrder(db, 999, '2024-01-05', 500), 'FOREIGN KEY');
    eq(db.prepare('SELECT COUNT(*) AS n FROM orders').get().n, 0);
  });
});

test('turn the pragma off and the same orphan slips straight in', () => {
  withDb((db) => {
    createShop(db);
    addCustomer(db, 'Ada', 'London');
    db.exec('PRAGMA foreign_keys = OFF');
    eq(foreignKeysOn(db), false);
    addOrder(db, 999, '2024-01-05', 500);
    eq(db.prepare('SELECT COUNT(*) AS n FROM orders').get().n, 1);
  });
});

test('a customer with orders cannot be deleted out from under them', () => {
  withDb((db) => {
    createShop(db);
    const ada = addCustomer(db, 'Ada', 'London');
    addOrder(db, ada, '2024-01-05', 12200);
    throws(
      () => db.exec('DELETE FROM customers WHERE id = 1'),
      'FOREIGN KEY'
    );
    eq(db.prepare('SELECT COUNT(*) AS n FROM customers').get().n, 1);
  });
});
