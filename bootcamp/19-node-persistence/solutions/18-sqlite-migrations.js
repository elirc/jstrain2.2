// ─────────────────────────────────────────────────────────────────────────
//  18 · a migration runner — SOLUTION                        ★★★ stretch
//  run: node 18-sqlite-migrations.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole design is "the database remembers what it has
//  already seen". That single table turns an unsafe, order-dependent pile
//  of ALTER statements into an operation you can run on every boot: read
//  the applied names into a Set, skip those, apply the rest in order.
//  Idempotence is the property that matters. Running twice must be a
//  no-op, because you cannot know whether the last deploy finished, the
//  laptop slept, or someone restored an old backup.
//  Each migration runs in its OWN transaction, with its bookkeeping row
//  written inside it. That coupling is the point: schema change and
//  "we did that one" commit together or not at all, so there is no state
//  where the table exists but the runner will try to create it again.
//  sqlite (and Postgres) can roll back DDL, which is why the failed
//  CREATE TABLE really does vanish. MySQL cannot — there, a failed
//  migration leaves half a schema and someone fixes it by hand at 3am.
//  Two rules from operating these. Migrations are APPEND-ONLY: never edit
//  one that has shipped, because databases that already ran it will never
//  run it again — write 004 instead. And name them so they sort in
//  application order (numeric or timestamp prefixes); alphabetical order
//  on ad-hoc names is how migration 10 runs before migration 2.
//  This is what Flyway, Alembic, Prisma Migrate and Rails all are
//  underneath: an ordered list plus a table of names.

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
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      name       TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);

  const done = new Set(
    db.prepare('SELECT name FROM migrations').all().map((r) => r.name)
  );
  const record = db.prepare(
    'INSERT INTO migrations (name, applied_at) VALUES (?, ?)'
  );

  const applied = [];
  for (const migration of migrations) {
    if (done.has(migration.name)) continue;

    db.exec('BEGIN');
    try {
      migration.up(db);
      record.run(migration.name, Date.now());
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    applied.push(migration.name);
  }
  return applied;
}

export function appliedMigrations(db) {
  return db
    .prepare('SELECT name FROM migrations ORDER BY applied_at, name')
    .all()
    .map((r) => r.name);
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
