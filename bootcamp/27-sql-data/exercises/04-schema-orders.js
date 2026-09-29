// ─────────────────────────────────────────────────────────────────────────
//  04 · model it — orders, items, refunds                       ★★★ stretch
//  concepts: schema design · foreign keys · normalization
//  run: node 04-schema-orders.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Interviews love "design the schema for X". Here X is a tiny store:
//  customers place orders, an order has many line items (a product +
//  quantity + the price AT PURCHASE TIME), and an order can be refunded
//  in part or full.
//
//  Return a SINGLE SQL string from schema() that CREATEs four tables:
//    customers(id, name)
//    orders(id, customer_id → customers)
//    order_items(id, order_id → orders, product, unit_cents, qty)
//    refunds(id, order_id → orders, cents, reason)
//  Rules the tests enforce:
//    · every id is INTEGER PRIMARY KEY
//    · every *_id is a REAL foreign key (REFERENCES ...) and NOT NULL
//    · money is integer cents; qty and unit_cents are NOT NULL
//    · price is stored ON THE LINE ITEM, not looked up from a products
//      table — an order must remember what it charged even if the
//      catalog price later changes
//
//  Then build orderTotalCents(db, orderId): the sum of unit_cents × qty
//  over that order's items.
//
//  hint: the "price at purchase time" rule is the whole lesson — a
//  foreign key to a live products.price would rewrite history every time
//  pricing changes. Copy the number onto the line item.

import { test, eq, ok } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

export function schema() {
  throw new Error('TODO');
}

export function orderTotalCents(db, orderId) {
  throw new Error('TODO');
}

// ── test helpers: build the db from YOUR schema, then probe it ───────────
function withStore(run) {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(schema());
  try {
    return run(db);
  } finally {
    db.close();
  }
}

const tableInfo = (db, table) =>
  db.prepare(`PRAGMA table_info(${table})`).all();
const fkList = (db, table) =>
  db.prepare(`PRAGMA foreign_key_list(${table})`).all();

// ──────────────────────────── tests ──────────────────────────────────────

test('all four tables exist', () => {
  withStore((db) => {
    const names = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((r) => r.name);
    for (const t of ['customers', 'order_items', 'orders', 'refunds']) {
      ok(names.includes(t), `missing table: ${t}`);
    }
  });
});

test('foreign keys are declared, not just implied by naming', () => {
  withStore((db) => {
    eq(fkList(db, 'orders').map((f) => f.table), ['customers']);
    eq(fkList(db, 'order_items').map((f) => f.table), ['orders']);
    eq(fkList(db, 'refunds').map((f) => f.table), ['orders']);
  });
});

test('the FK is actually enforced at runtime', () => {
  withStore((db) => {
    db.prepare('INSERT INTO customers (id, name) VALUES (1, ?)').run('Ada');
    db.prepare('INSERT INTO orders (id, customer_id) VALUES (1, 1)').run();
    // an item pointing at a non-existent order must be rejected
    let threw = false;
    try {
      db.prepare(
        'INSERT INTO order_items (order_id, product, unit_cents, qty) VALUES (999, ?, 100, 1)'
      ).run('ghost');
    } catch {
      threw = true;
    }
    ok(threw, 'inserting an item for a missing order should violate the FK');
  });
});

test('price lives on the line item and survives a later catalog change', () => {
  withStore((db) => {
    const cols = tableInfo(db, 'order_items').map((c) => c.name);
    ok(cols.includes('unit_cents'), 'order_items must store unit_cents');
  });
});

test('orderTotalCents sums unit_cents × qty for the order', () => {
  withStore((db) => {
    db.prepare('INSERT INTO customers (id, name) VALUES (1, ?)').run('Ada');
    db.prepare('INSERT INTO orders (id, customer_id) VALUES (1, 1)').run();
    const item = db.prepare(
      'INSERT INTO order_items (order_id, product, unit_cents, qty) VALUES (1, ?, ?, ?)'
    );
    item.run('keyboard', 7200, 1);
    item.run('mouse', 2500, 2);
    eq(orderTotalCents(db, 1), 12200);
  });
});
