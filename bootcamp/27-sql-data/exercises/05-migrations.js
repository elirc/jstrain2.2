// ─────────────────────────────────────────────────────────────────────────
//  05 · schema migrations, applied once                         ★★☆ core
//  concepts: migrations · versioning · idempotency
//  run: node 05-migrations.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A migration is a numbered, forward-only change to the schema. The
//  runner must apply pending ones IN ORDER, record which it applied, and
//  be safe to run again — a second run does nothing. That "runs on every
//  deploy, applies only what's new" property is the whole point.
//
//  Build runMigrations(db, migrations), where migrations is an array of
//  { version, sql } (version is a positive integer):
//    · ensure a schema_migrations(version) table exists
//    · apply every migration whose version is NOT already recorded,
//      in ascending version order, each inside a transaction
//    · record each applied version
//    · return the list of versions applied THIS call (ascending)
//
//      first run  → applies [1, 2], returns [1, 2]
//      second run → applies nothing, returns []
//      add v3, run → returns [3]
//
//  hint: read the applied versions into a Set first. Sort the input by
//  version so callers can't break ordering by passing them shuffled.

import { test, eq } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

const withDb = (run) => {
  const db = new DatabaseSync(':memory:');
  try {
    return run(db);
  } finally {
    db.close();
  }
};

const tableExists = (db, name) =>
  !!db
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
    .get(name);

export function runMigrations(db, migrations) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

const M = [
  { version: 1, sql: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);' },
  { version: 2, sql: 'ALTER TABLE users ADD COLUMN email TEXT;' },
];

test('the first run applies every migration in order', () => {
  withDb((db) => {
    eq(runMigrations(db, M), [1, 2]);
    eq(tableExists(db, 'users'), true);
  });
});

test('a second run applies nothing', () => {
  withDb((db) => {
    runMigrations(db, M);
    eq(runMigrations(db, M), []);
  });
});

test('a newly added migration is the only one applied next time', () => {
  withDb((db) => {
    runMigrations(db, M);
    const withV3 = [
      ...M,
      { version: 3, sql: 'CREATE TABLE posts (id INTEGER PRIMARY KEY);' },
    ];
    eq(runMigrations(db, withV3), [3]);
    eq(tableExists(db, 'posts'), true);
  });
});

test('migrations passed out of order are still applied in order', () => {
  withDb((db) => {
    const shuffled = [M[1], M[0]]; // version 2 before version 1
    eq(runMigrations(db, shuffled), [1, 2]);
  });
});

test('a broken migration does not record itself as applied', () => {
  withDb((db) => {
    runMigrations(db, []); // unguarded: reports todo until built
    const bad = [
      { version: 1, sql: 'CREATE TABLE ok (id INTEGER PRIMARY KEY);' },
      { version: 2, sql: 'CREATE TABLE ok (id INTEGER PRIMARY KEY);' }, // dup → error
    ];
    let threw = false;
    try { runMigrations(db, bad); } catch { threw = true; }
    eq(threw, true);
    // v1 applied and recorded; v2 failed, so a re-run retries ONLY v2
    const applied = db
      .prepare('SELECT version FROM schema_migrations ORDER BY version')
      .all()
      .map((r) => r.version);
    eq(applied, [1]);
  });
});
