// ─────────────────────────────────────────────────────────────────────────
//  17 · aggregates, ordering and an index                       ★★☆ core
//  concepts: GROUP BY · ORDER BY · LIMIT · query plans
//  run: node 17-sqlite-queries.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Pulling every row into JavaScript and reducing it there is the most
//  common way to make a fast database slow. SUM, COUNT and GROUP BY run
//  where the data already is, and hand you back the four rows you wanted
//  instead of the four million you did not.
//
//      SELECT region, COUNT(*) AS orders, SUM(amount) AS total
//        FROM sales GROUP BY region ORDER BY total DESC
//
//  Build three functions over sales(id, region, product, amount):
//
//    · regionTotals(db)         [{ region, orders, total }], richest
//                               region first
//    · topProducts(db, limit)   [{ product, units }] — the `limit` best
//                               sellers, ties broken by product name A→Z
//    · addRegionIndex(db)       CREATE INDEX idx_sales_region ON
//                               sales(region), return the index name
//
//  `limit` is a value, so it is a `?` parameter like any other. Ties
//  matter: ORDER BY units DESC alone leaves equal rows in whatever order
//  the engine felt like, and "flaky test" is what that looks like later.
//
//  hint: name your aggregates with AS — the column key in the returned
//  object is the SQL expression text otherwise. Spread rows into
//  `{ ...row }` before returning them.

import { test, eq, ok } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

// Provided: nine sales across three regions, closed after each test.
function withDb(run) {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE sales (
      id      INTEGER PRIMARY KEY,
      region  TEXT NOT NULL,
      product TEXT NOT NULL,
      amount  INTEGER NOT NULL
    )
  `);
  const insert = db.prepare(
    'INSERT INTO sales (region, product, amount) VALUES (?, ?, ?)'
  );
  for (const row of [
    ['eu', 'widget', 100],
    ['eu', 'widget', 150],
    ['eu', 'gizmo', 50],
    ['us', 'widget', 400],
    ['us', 'gizmo', 200],
    ['us', 'doohickey', 25],
    ['apac', 'gizmo', 75],
    ['apac', 'doohickey', 25],
    ['apac', 'widget', 10],
  ]) {
    insert.run(...row);
  }
  try {
    return run(db);
  } finally {
    db.close();
  }
}

export function regionTotals(db) {
  throw new Error('TODO');
}

export function topProducts(db, limit) {
  throw new Error('TODO');
}

export function addRegionIndex(db) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('regionTotals returns one row per region', () => {
  withDb((db) => {
    const rows = regionTotals(db);
    eq(rows.length, 3);
    eq(
      rows.map((r) => r.region).sort(),
      ['apac', 'eu', 'us']
    );
  });
});

test('it counts and sums each group correctly', () => {
  withDb((db) => {
    const byRegion = Object.fromEntries(
      regionTotals(db).map((r) => [r.region, r])
    );
    eq(byRegion.eu, { region: 'eu', orders: 3, total: 300 });
    eq(byRegion.us, { region: 'us', orders: 3, total: 625 });
    eq(byRegion.apac.total, 110);
  });
});

test('the richest region comes first', () => {
  withDb((db) => {
    eq(
      regionTotals(db).map((r) => r.region),
      ['us', 'eu', 'apac']
    );
  });
});

test('topProducts honours the limit', () => {
  withDb((db) => {
    eq(topProducts(db, 1), [{ product: 'widget', units: 660 }]);
    eq(topProducts(db, 2).length, 2);
    eq(topProducts(db, 99).length, 3);
    eq(topProducts(db, 0), []);
  });
});

test('the best seller is first, and ties are broken by name', () => {
  withDb((db) => {
    // this makes doohickey tie gizmo at 325 — the order must be stable
    db.prepare('INSERT INTO sales (region, product, amount) VALUES (?, ?, ?)')
      .run('eu', 'doohickey', 275);
    eq(
      topProducts(db, 3).map((p) => p.product),
      ['widget', 'doohickey', 'gizmo']
    );
  });
});

test('addRegionIndex creates the index it says it does', () => {
  withDb((db) => {
    eq(addRegionIndex(db), 'idx_sales_region');
    const names = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all()
      .map((r) => r.name);
    ok(names.includes('idx_sales_region'), `got ${names}`);
  });
});

test('the planner scans the whole table until the index exists', () => {
  withDb((db) => {
    const plan = () =>
      db
        .prepare('EXPLAIN QUERY PLAN SELECT * FROM sales WHERE region = ?')
        .all('eu')
        .map((r) => r.detail)
        .join(' ');

    ok(plan().includes('SCAN'), `expected a full scan, got: ${plan()}`);
    addRegionIndex(db);
    ok(
      plan().includes('idx_sales_region'),
      `expected the index to be used, got: ${plan()}`
    );
  });
});

test('running addRegionIndex twice is not an error', () => {
  withDb((db) => {
    addRegionIndex(db);
    addRegionIndex(db);
    eq(regionTotals(db).length, 3);
  });
});
