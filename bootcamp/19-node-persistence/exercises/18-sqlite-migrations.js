// ─────────────────────────────────────────────────────────────────────────
//  18 · a migration runner                                  ★★★ stretch
//  concepts: schema evolution · bookkeeping · idempotence
//  run: node 18-sqlite-migrations.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Your schema will change, and the database on the user's laptop is at
//  whatever version they last ran. So you keep an ordered list of
//  migrations and a table recording which ones this database has already
//  seen. Startup then means "apply everything not in that table" — safe
//  to run on a fresh database, on a half-migrated one, and on every boot
//  forever.
//
//      const MIGRATIONS = [
//        { name: '001-users',  up: (db) => db.exec('CREATE TABLE ...') },
//        { name: '002-emails', up: (db) => db.exec('ALTER TABLE ...') },
//      ];
//      runMigrations(db, MIGRATIONS)   → ['001-users', '002-emails']
//      runMigrations(db, MIGRATIONS)   → []      ← nothing left to do
//
//  Build two things:
//    · runMigrations(db, migrations)  create the bookkeeping table if
//                                     needed, apply the unapplied ones in
//                                     order, record each one, and return
//                                     the names applied THIS run
//    · appliedMigrations(db)          the recorded names, in the order
//                                     they were applied
//
//  Bookkeeping table:
//      migrations(name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)
//
//  Each migration and its bookkeeping row must land together: if `up`
//  throws, that migration's schema changes AND its record must both be
//  gone — sqlite can roll back CREATE TABLE, so a transaction gets you
//  this for free. Everything applied before it stays applied.
//
//  hint: CREATE TABLE IF NOT EXISTS, then a Set of the names already in
//  it. Order by applied_at then name so ties in the clock cannot shuffle
//  the history.

import { test, eq, ok, throws } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

// Provided: an empty database, closed after each test.
function withDb(run) {
  const db = new DatabaseSync(':memory:');
  try {
    return run(db);
  } finally {
    db.close();
  }
}

// Provided: two migrations to start from.
const MIGRATIONS = [
  {
    name: '001-create-users',
    up: (db) =>
      db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)'),
  },
  {
    name: '002-add-email',
    up: (db) => db.exec('ALTER TABLE users ADD COLUMN email TEXT'),
  },
];

const tableNames = (db) =>
  db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((r) => r.name);

export function runMigrations(db, migrations) {
  throw new Error('TODO');
}

export function appliedMigrations(db) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a fresh database applies every migration, in order', () => {
  withDb((db) => {
    eq(runMigrations(db, MIGRATIONS), ['001-create-users', '002-add-email']);
    eq(appliedMigrations(db), ['001-create-users', '002-add-email']);
  });
});

test('the schema really exists afterwards', () => {
  withDb((db) => {
    runMigrations(db, MIGRATIONS);
    db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run('ada', 'a@x');
    eq(db.prepare('SELECT name, email FROM users').get().email, 'a@x');
  });
});

test('running it again applies nothing', () => {
  withDb((db) => {
    runMigrations(db, MIGRATIONS);
    eq(runMigrations(db, MIGRATIONS), []);
    eq(runMigrations(db, MIGRATIONS), []);
    eq(appliedMigrations(db).length, 2);
  });
});

test('the bookkeeping table is created on demand', () => {
  withDb((db) => {
    eq(tableNames(db), []);
    runMigrations(db, MIGRATIONS);
    ok(tableNames(db).includes('migrations'), `got ${tableNames(db)}`);
  });
});

test('only the new migration runs when you add one', () => {
  withDb((db) => {
    runMigrations(db, MIGRATIONS);
    const extended = [
      ...MIGRATIONS,
      {
        name: '003-create-posts',
        up: (db2) => db2.exec('CREATE TABLE posts (id INTEGER PRIMARY KEY)'),
      },
    ];
    eq(runMigrations(db, extended), ['003-create-posts']);
    ok(tableNames(db).includes('posts'));
    eq(appliedMigrations(db).length, 3);
  });
});

test('a broken migration is not recorded as applied', () => {
  withDb((db) => {
    const broken = [
      ...MIGRATIONS,
      { name: '003-bad', up: () => { throw new Error('bad SQL'); } },
    ];
    throws(() => runMigrations(db, broken), 'bad SQL');
    eq(appliedMigrations(db), ['001-create-users', '002-add-email']);
  });
});

test('a broken migration leaves no half-built schema behind', () => {
  withDb((db) => {
    const broken = [
      ...MIGRATIONS,
      {
        name: '003-half',
        up: (db2) => {
          db2.exec('CREATE TABLE posts (id INTEGER PRIMARY KEY)');
          throw new Error('failed after the CREATE');
        },
      },
    ];
    throws(() => runMigrations(db, broken), 'failed after the CREATE');
    ok(!tableNames(db).includes('posts'), 'DDL rolls back too');
  });
});

test('after a failure the earlier migrations are still applied', () => {
  withDb((db) => {
    const broken = [
      ...MIGRATIONS,
      { name: '003-bad', up: () => { throw new Error('bad SQL'); } },
    ];
    throws(() => runMigrations(db, broken));
    eq(runMigrations(db, MIGRATIONS), [], 'the good ones stay done');
    db.prepare('INSERT INTO users (name) VALUES (?)').run('ada');
    eq(db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 1);
  });
});
