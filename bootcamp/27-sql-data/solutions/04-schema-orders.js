// ─────────────────────────────────────────────────────────────────────────
//  04 · model it — orders, items, refunds — SOLUTION            ★★★ stretch
//  concepts: schema design · foreign keys · normalization
//  run: node 04-schema-orders.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Four tables, each id an INTEGER PRIMARY KEY, each *_id a real
//  REFERENCES foreign key marked NOT NULL so an orphan row cannot exist.
//  The one decision that separates a junior schema from a correct one is
//  unit_cents living ON order_items instead of a foreign key to a live
//  products.price. An order is a historical record: it must remember
//  what it charged. Point it at today's catalog price and every past
//  order silently re-prices when marketing runs a sale — the books stop
//  reconciling. Copy the price at purchase time; that is denormalization
//  on purpose, and it is correct.
//  money is integer cents everywhere (floats and money never mix), qty
//  and unit_cents are NOT NULL so a line item is always computable, and
//  refunds hang off orders so a partial refund is just another row —
//  you never mutate the original order to record one.
//  orderTotalCents is a plain SUM(unit_cents * qty); the refunds table
//  would net against it, which is why refunds are separate rows rather
//  than a mutable balance on the order.
//  Classic wrong turns: storing money as REAL, a "products" FK for
//  price, or cramming items into a comma-joined string column (now you
//  can't SUM without parsing — the first normal form exists for this).

import { test, eq, ok } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

export function schema() {
  return `
    CREATE TABLE customers (
      id   INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE orders (
      id          INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id)
    );
    CREATE TABLE order_items (
      id         INTEGER PRIMARY KEY,
      order_id   INTEGER NOT NULL REFERENCES orders(id),
      product    TEXT    NOT NULL,
      unit_cents INTEGER NOT NULL,
      qty        INTEGER NOT NULL
    );
    CREATE TABLE refunds (
      id       INTEGER PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      cents    INTEGER NOT NULL,
      reason   TEXT
    );
  `;
}

export function orderTotalCents(db, orderId) {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(unit_cents * qty), 0) AS total
       FROM order_items WHERE order_id = ?`
    )
    .get(orderId);
  return row.total;
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
