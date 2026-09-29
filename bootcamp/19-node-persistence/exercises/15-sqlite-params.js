// ─────────────────────────────────────────────────────────────────────────
//  15 · UPDATE, DELETE and why parameters exist                 ★★☆ core
//  concepts: changes counts · placeholders · SQL injection
//  run: node 15-sqlite-params.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `run()` reports how many rows an UPDATE or DELETE actually touched.
//  That number is your feedback loop: 0 means "no such row", and turning
//  it into a 404 instead of a silent success is most of a good API.
//
//      stmt.run('new name', 3)   → { changes: 1, lastInsertRowid: ... }
//      stmt.run('new name', 999) → { changes: 0, ... }
//
//  Build three functions over this table:
//
//      users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL)
//
//    · renameUser(db, id, name)      → rows changed (0 or 1)
//    · deleteUsersByRole(db, role)   → rows deleted
//    · findUsersByName(db, name)     → matching rows, oldest id first
//
//  findUsersByName must use a placeholder. The tests feed it names like
//      "' OR 1 = 1 --"     and     "Robert'); DROP TABLE users;--"
//  which a string-concatenated query would happily execute. With a
//  parameter, the value is never parsed as SQL — it is just a string that
//  matches nobody.
//
//  hint: rows come back with a null prototype; spread them into
//  `{ ...row }` before returning, as in exercise 14.

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
  throw new Error('TODO');
}

export function deleteUsersByRole(db, role) {
  throw new Error('TODO');
}

export function findUsersByName(db, name) {
  throw new Error('TODO');
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
