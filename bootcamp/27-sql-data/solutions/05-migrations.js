// ─────────────────────────────────────────────────────────────────────────
//  05 · schema migrations, applied once — SOLUTION              ★★☆ core
//  concepts: migrations · versioning · idempotency
//  run: node 05-migrations.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  A migration runner is a tiny state machine over one bookkeeping
//  table, schema_migrations. Read the set of applied versions, sort the
//  input, and for each version not yet applied, run its SQL and record
//  the version — both inside ONE transaction so a crash mid-migration
//  can't leave the change half-done AND recorded. That last point is the
//  whole reliability story: if the ALTER succeeds but the process dies
//  before the INSERT, a non-transactional runner re-applies it next
//  boot and errors on the duplicate.
//  Idempotency comes from the Set check, not from making each SQL
//  statement re-runnable — you write migrations forward-only and let the
//  ledger decide what's pending. Sorting defends the ordering invariant
//  against a caller who passes them shuffled.
//  On failure we ROLLBACK that migration and re-throw, leaving it
//  UNrecorded so the next run retries exactly it and nothing before it —
//  which is what the last test pins.
//  Classic wrong turns: no transaction (half-applied schemas), keying on
//  a filename/string instead of an ordered integer (10 sorts before 2),
//  or "CREATE TABLE IF NOT EXISTS" everywhere instead of a ledger — that
//  hides drift and can't express an ALTER that must run once.

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
  db.exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);'
  );
  const done = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map((r) => r.version)
  );
  const pending = [...migrations]
    .sort((a, b) => a.version - b.version)
    .filter((m) => !done.has(m.version));

  const applied = [];
  for (const m of pending) {
    db.exec('BEGIN');
    try {
      db.exec(m.sql);
      db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(m.version);
      db.exec('COMMIT');
      applied.push(m.version);
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
  return applied;
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
    const applied = db
      .prepare('SELECT version FROM schema_migrations ORDER BY version')
      .all()
      .map((r) => r.version);
    eq(applied, [1]);
  });
});
