// ─────────────────────────────────────────────────────────────────────────
//  01 · two tables and the key between them                   ★☆☆ warm-up
//  concepts: REFERENCES · foreign keys · PRAGMA foreign_keys
//  run: node 01-two-tables-and-a-key.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two tables and a pointer between them is the whole idea a join rests
//  on. `orders.customer_id` holds a number that must exist as an id over
//  in `customers`. Declare that and the database polices it for you.
//
//      customers(id, name, city)
//      orders(id, customer_id → customers.id, placed_on, total_cents)
//
//  Build four things:
//
//    · createShop(db)                       both tables, the key declared
//    · addCustomer(db, name, city)          → the new id
//    · addOrder(db, customerId, on, cents)  → the new id
//    · foreignKeysOn(db)                    → true / false, asked of sqlite
//
//  Then find out what happens when an order points at customer 999, who
//  does not exist. Do not guess whether enforcement is on — read it:
//
//      db.prepare('PRAGMA foreign_keys').get()   → { foreign_keys: 0 | 1 }
//
//  hint: `REFERENCES customers(id)` goes on the column, after its type.

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
  throw new Error('TODO');
}

export function addCustomer(db, name, city) {
  throw new Error('TODO');
}

export function addOrder(db, customerId, placedOn, totalCents) {
  throw new Error('TODO');
}

export function foreignKeysOn(db) {
  throw new Error('TODO');
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
