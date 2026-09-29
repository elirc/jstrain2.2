// ─────────────────────────────────────────────────────────────────────────
//  15 · UPDATE, DELETE and why parameters exist — SOLUTION       ★★☆ core
//  run: node 15-sqlite-params.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `changes` is the return value people forget. An UPDATE
//  that matched nothing is not an error in SQL — it is a successful
//  update of zero rows. If your handler does not look at `changes`, PATCH
//  /users/999 returns 200 OK and the user is never told their edit went
//  nowhere.
//
//  Now the injection. Written by string concatenation, findUsersByName is:
//
//      db.prepare(`SELECT * FROM users WHERE name = '${name}'`)
//
//  Feed it   ' OR 1 = 1 --   and the text sqlite compiles becomes:
//
//      SELECT * FROM users WHERE name = '' OR 1 = 1 --'
//                                          ^^^^^^^^ always true
//                                                   ^^ rest commented out
//
//  Every user in the table comes back. Feed it
//  Robert'); DROP TABLE users;--  and — with any driver that allows
//  multiple statements — the table is gone. The bug is not "quotes were
//  not escaped". The bug is that DATA WAS CONCATENATED INTO CODE, so the
//  parser cannot tell one from the other.
//
//      db.prepare('SELECT * FROM users WHERE name = ?').all(name)
//
//  Here the SQL is compiled ONCE, before the value exists. The value is
//  bound afterwards into a slot in the compiled program, so it can never
//  become syntax — no escaping, no sanitising, no blocklist of scary
//  words. That is also why O'Hara needs no special handling: an
//  apostrophe is only dangerous when you are building code out of text.
//  The rule is absolute: values go in as parameters, always. Identifiers
//  (table and column names) cannot be parameters — those you validate
//  against a fixed allowlist you wrote yourself.

import { test, eq } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

// Provided: a database seeded with four users, closed after each test.
function withDb(run) {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE users (
      id   INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);
  const insert = db.prepare('INSERT INTO users (name, role) VALUES (?, ?)');
  insert.run('ada', 'admin');
  insert.run('grace', 'admin');
  insert.run('linus', 'guest');
  insert.run("O'Hara", 'guest');
  try {
    return run(db);
  } finally {
    db.close();
  }
}

const countUsers = (db) => db.prepare('SELECT COUNT(*) AS n FROM users').get().n;

export function renameUser(db, id, name) {
  return db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, id).changes;
}

export function deleteUsersByRole(db, role) {
  return db.prepare('DELETE FROM users WHERE role = ?').run(role).changes;
}

export function findUsersByName(db, name) {
  return db
    .prepare('SELECT * FROM users WHERE name = ? ORDER BY id')
    .all(name)
    .map((row) => ({ ...row }));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('renameUser changes one row and says so', () => {
  withDb((db) => {
    eq(renameUser(db, 1, 'ada lovelace'), 1);
    eq(findUsersByName(db, 'ada lovelace').length, 1);
    eq(findUsersByName(db, 'ada'), []);
  });
});

test('renaming a user who does not exist changes nothing', () => {
  withDb((db) => {
    eq(renameUser(db, 999, 'ghost'), 0);
    eq(countUsers(db), 4);
  });
});

test('deleteUsersByRole reports how many it removed', () => {
  withDb((db) => {
    eq(deleteUsersByRole(db, 'guest'), 2);
    eq(countUsers(db), 2);
  });
});

test('deleting a role nobody has removes nothing', () => {
  withDb((db) => {
    eq(deleteUsersByRole(db, 'wizard'), 0);
    eq(countUsers(db), 4);
  });
});

test('findUsersByName returns the matching rows', () => {
  withDb((db) => {
    const found = findUsersByName(db, 'grace');
    eq(found.length, 1);
    eq(found[0].role, 'admin');
    eq(Object.getPrototypeOf(found[0]), Object.prototype);
  });
});

test("a name with an apostrophe just works — O'Hara is a person", () => {
  withDb((db) => {
    eq(findUsersByName(db, "O'Hara").length, 1);
  });
});

test('the classic injection matches nobody', () => {
  withDb((db) => {
    eq(findUsersByName(db, "' OR 1 = 1 --"), []);
    eq(findUsersByName(db, "' OR '1'='1"), []);
  });
});

test('little Bobby Tables cannot drop the table', () => {
  withDb((db) => {
    eq(findUsersByName(db, "Robert'); DROP TABLE users;--"), []);
    eq(countUsers(db), 4, 'the table is still standing');
  });
});
