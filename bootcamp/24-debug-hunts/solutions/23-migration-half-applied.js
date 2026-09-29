// ─────────────────────────────────────────────────────────────────────────
//  23 · the migration that poisoned later deploys — SOLUTION  ★★★
//  concepts: transactions · rollback · migrations
//  run: node 23-migration-half-applied.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Bug class: commit-on-error — a transaction whose failure path ends in
//  COMMIT instead of ROLLBACK. The word is `COMMIT` in the catch block;
//  the fix is `ROLLBACK`.
//  What it did: migration 2 created `notes`, then failed on the index
//  over a column that doesn't exist. The catch committed everything the
//  transaction had done so far — the new table — and then threw. The
//  version row was never inserted (that statement never ran), so the
//  ledger said "2 is pending" while the database said "notes exists".
//  Every later deploy retried migration 2 and died on `table notes
//  already exists`: a schema that no longer matches any version, and an
//  error message pointing at the wrong migration entirely.
//  The tell: an error path that ends in the same call as the success
//  path. In a try/catch around a transaction the two branches must
//  differ — if COMMIT appears twice, one of them is wrong. Same shape
//  as a `catch` that logs and continues: the failure is noticed and
//  then confirmed anyway.
//  Why the tests could not see it: the happy-path tests exercise COMMIT
//  and pass. Rollback behaviour only shows up in a test that makes a
//  migration FAIL and then inspects the database — the "what does the
//  next run see" test almost nobody writes.
//  In the wild: any hand-rolled `BEGIN`/`COMMIT` block, batch importers
//  that commit per row inside a catch, and "cleanup" handlers that
//  finalise the very state they were meant to unwind. Prefer a
//  transaction helper (`db.transaction(fn)`) that owns both paths, so
//  there is no catch block to get backwards.

import { test, eq, ok, throws } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

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
      db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(
        m.version
      );
      db.exec('COMMIT');
      applied.push(m.version);
    } catch (err) {
      db.exec('ROLLBACK');
      throw new Error(`migration ${m.version} failed: ${err.message}`);
    }
  }
  return applied;
}

// ─── fixtures ─────────────────────────────────────────────────────────────

const M1 = {
  version: 1,
  sql: 'CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT);',
};

// the second statement references a column that does not exist
const M2_BROKEN = {
  version: 2,
  sql: `CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT);
        CREATE INDEX notes_author ON notes (author_id);`,
};

const M2_FIXED = {
  version: 2,
  sql: `CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT);
        CREATE INDEX notes_body ON notes (body);`,
};

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
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name = ?")
    .get(name);

const appliedVersions = (db) =>
  db
    .prepare('SELECT version FROM schema_migrations ORDER BY version')
    .all()
    .map((r) => r.version);

// ──────────────────────────── tests ──────────────────────────────────────

test('applies pending migrations in version order', () => {
  withDb((db) => {
    eq(runMigrations(db, [M2_FIXED, M1]), [1, 2]);
    ok(tableExists(db, 'users'));
    ok(tableExists(db, 'notes'));
  });
});

test('a second run applies nothing', () => {
  withDb((db) => {
    runMigrations(db, [M1, M2_FIXED]);
    eq(runMigrations(db, [M1, M2_FIXED]), []);
  });
});

test('a failing migration reaches the caller', () => {
  withDb((db) => {
    throws(() => runMigrations(db, [M1, M2_BROKEN]), 'migration 2 failed');
    eq(appliedVersions(db), [1]);
  });
});

test('a failing migration leaves nothing of itself behind', () => {
  withDb((db) => {
    throws(() => runMigrations(db, [M1, M2_BROKEN]), 'migration 2 failed');
    ok(!tableExists(db, 'notes'), 'the half-applied table survived');
  });
});

test('the fixed migration applies cleanly on the next run', () => {
  withDb((db) => {
    throws(() => runMigrations(db, [M1, M2_BROKEN]), 'migration 2 failed');
    eq(runMigrations(db, [M1, M2_FIXED]), [2]);
    ok(tableExists(db, 'notes'));
  });
});
