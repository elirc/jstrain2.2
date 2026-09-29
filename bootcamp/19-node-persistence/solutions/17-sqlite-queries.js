// ─────────────────────────────────────────────────────────────────────────
//  17 · aggregates, ordering and an index — SOLUTION            ★★☆ core
//  run: node 17-sqlite-queries.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: GROUP BY collapses rows into one row per distinct value,
//  and the aggregate functions (COUNT, SUM, MIN, MAX, AVG) describe each
//  group. Doing that in SQL moves four million rows' worth of arithmetic
//  to where the bytes already are, and returns three rows over the wire.
//  Always name aggregates with AS. Without it the property key is the raw
//  expression — `row['SUM(amount)']` — which is horrible to read and
//  changes if you reformat the query.
//  ORDER BY units DESC alone is a latent flake. SQL results are a SET,
//  not a sequence: when two rows tie, the engine may return them in any
//  order, and it may pick a different one after an index is added or the
//  table grows. Add a unique tiebreaker — here `product ASC` — to any
//  ordering you intend to assert on or paginate through.
//  LIMIT takes a `?` like any other value. Concatenating a "number" from
//  a query string is still injection: it is a string until you check.
//
//  About the index. Without one, `WHERE region = ?` is a SCAN: sqlite
//  reads every row and throws most away. The index is a sorted structure
//  mapping region → rowids, so the same query becomes a SEARCH: jump
//  straight to the matching entries. Nine rows do not care. A million
//  rows is the difference between 3ms and 3 seconds.
//  Indexes are not free — each one is a second structure to update on
//  every INSERT, UPDATE and DELETE, and it takes disk. Index the columns
//  you actually filter, join and sort on, then check with EXPLAIN QUERY
//  PLAN that the planner agrees with you. Guessing is not a strategy;
//  `EXPLAIN QUERY PLAN` is one line and it tells you the truth.
//  `IF NOT EXISTS` makes creation idempotent, which is what lets this run
//  on every startup — and is the seed of the migration runner in 18.

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
  return db
    .prepare(
      `SELECT region, COUNT(*) AS orders, SUM(amount) AS total
         FROM sales
        GROUP BY region
        ORDER BY total DESC`
    )
    .all()
    .map((row) => ({ ...row }));
}

export function topProducts(db, limit) {
  return db
    .prepare(
      `SELECT product, SUM(amount) AS units
         FROM sales
        GROUP BY product
        ORDER BY units DESC, product ASC
        LIMIT ?`
    )
    .all(limit)
    .map((row) => ({ ...row }));
}

export function addRegionIndex(db) {
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_region ON sales(region)');
  return 'idx_sales_region';
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
