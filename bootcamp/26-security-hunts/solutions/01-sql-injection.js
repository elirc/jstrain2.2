// ─────────────────────────────────────────────────────────────────────────
//  01 · the search box that reads the whole table — SOLUTION  ★★☆ core
//  concepts: security · SQL injection · parameterized queries
//  run: node 01-sql-injection.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Vulnerability: SQL injection. The term was pasted into the query
//  text, so `' OR 1=1 --` closed the string literal, added an
//  always-true clause, and commented out the rest — the WHERE now
//  matches every row. The user's data became part of the program.
//  The tell: a query built with template interpolation (`${term}`) or
//  string `+`. The database driver has one job the string never can —
//  keeping data and code apart — and a `${}` in SQL throws that away.
//  The minimal fix: a placeholder, and bind the term as a VALUE. The
//  wildcards go on the JavaScript side of the boundary so the whole
//  bound string is treated as data:
//      const sql = `SELECT ... WHERE name LIKE ? ORDER BY id`;
//      return db.prepare(sql).all(`%${term}%`);
//  Now `' OR 1=1 --` is searched for literally and matches nobody.
//  In the wild: `WHERE id = ${req.query.id}`, ORDER BY built from a
//  user-chosen column, LIMIT from a raw param. The rule is total —
//  parameterize every value, always, even the "obviously safe" ones.
//  (When you must interpolate an identifier like a column name, it
//  cannot be a parameter — allowlist it against known-good names.)

import { test, eq } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

function withDb(run) {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);`);
  const stmt = db.prepare('INSERT INTO users VALUES (?, ?, ?)');
  stmt.run(1, 'Ada', 'user');
  stmt.run(2, 'Adam', 'user');
  stmt.run(3, 'Root', 'admin');
  try {
    return run(db);
  } finally {
    db.close();
  }
}

export function findUsers(db, term) {
  const sql = `SELECT id, name, role FROM users
               WHERE name LIKE ? ORDER BY id`;
  return db.prepare(sql).all(`%${term}%`);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('an ordinary search matches by substring', () => {
  withDb((db) => {
    eq(findUsers(db, 'Ada').map((r) => r.name), ['Ada', 'Adam']);
  });
});

test('a search that matches nothing returns nothing', () => {
  withDb((db) => {
    eq(findUsers(db, 'zzz'), []);
  });
});

test("a term with a quote is data, not code — it matches no one", () => {
  withDb((db) => {
    // classic injection: close the string, OR a always-true clause
    eq(findUsers(db, "' OR 1=1 --"), []);
  });
});

test('a term with a quote cannot leak the admin row', () => {
  withDb((db) => {
    const names = findUsers(db, "xyz' OR role='admin' --").map((r) => r.name);
    eq(names.includes('Root'), false);
  });
});
