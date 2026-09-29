// ─────────────────────────────────────────────────────────────────────────
//  01 · the search box that reads the whole table            ★★☆ core
//  concepts: security · SQL injection · parameterized queries
//  run: node 01-sql-injection.js
// ─────────────────────────────────────────────────────────────────────────
//
//  findUsers(db, term) powers a "search users by name" box. It should
//  return only the rows whose name CONTAINS the term:
//
//      findUsers(db, 'ada')   → [{ id: 1, name: 'Ada', role: 'user' }]
//
//  The code works for ordinary searches — and then someone typed
//  a quote into the box and got every row back, admins included.
//
//  The code below is fully written — and a security hole. 2 tests fail:
//  they type SQL into the search term. Find the flaw and fix it with the
//  smallest change. Don't rewrite the query's meaning.
//
//  hint: look at how the term gets INTO the SQL string. A value pasted
//  straight into a query is code, not data. What does the term
//  `' OR 1=1 --` turn the WHERE clause into?

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
               WHERE name LIKE '%${term}%' ORDER BY id`;
  return db.prepare(sql).all();
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
