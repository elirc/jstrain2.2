// ─────────────────────────────────────────────────────────────────────────
//  23 · the migration that poisoned later deploys         ★★★ stretch
//  concepts: transactions · rollback · migrations
//  run: node 23-migration-half-applied.js
// ─────────────────────────────────────────────────────────────────────────
//
//  runMigrations(db, migrations) applies every migration the ledger has
//  not seen, in version order, each one inside its own transaction. The
//  contract when a migration throws is the interesting half:
//
//      · nothing that migration did survives  (all-or-nothing)
//      · its version is NOT recorded          (so it will be retried)
//      · the error reaches the caller         (the deploy fails loudly)
//
//  One migration had a typo in its second statement. It failed, as it
//  should. Then the fixed version failed too — with a different error —
//  and so did every deploy after that, on a database nobody could
//  explain.
//
//  Two tests are red. The bug is one word. Find it, fix it, and do not
//  restructure the loop.
//
//  hint: the happy path is fine, so read only the unhappy one. Walk the
//  failing migration through the catch block and ask what state the
//  database is left in — then ask what the NEXT run sees.

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
      db.exec('COMMIT');
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
