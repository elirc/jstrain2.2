// ─────────────────────────────────────────────────────────────────────────
//  14 · node:sqlite — a real database, no install — SOLUTION     ★★☆ core
//  run: node 14-sqlite-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three calls carry almost everything. `exec` runs SQL that
//  returns no rows (DDL, PRAGMAs). `prepare` compiles a statement once so
//  it can be run many times — that is where the speed comes from, and the
//  `?` placeholders are why it is safe. `run` reports { changes,
//  lastInsertRowid }; `get` returns one row or undefined, `all` an array.
//  `INTEGER PRIMARY KEY` is special in sqlite: it aliases the internal
//  rowid, so leaving it out of the INSERT makes sqlite assign the next
//  one, and `lastInsertRowid` hands it straight back. No sequence table,
//  no SELECT MAX(id) + 1 race.
//  getNote normalising `undefined` to `null` is a small API decision that
//  pays off: "no row" becomes a value you can store, compare and JSON-
//  encode, instead of a hole. The `{ ...row }` matters too — sqlite hands
//  back objects with a NULL PROTOTYPE, so `row.hasOwnProperty`,
//  `instanceof` and deep-equality against a plain literal all misbehave.
//  Spreading once at the boundary keeps that surprise out of your app.
//  Notice what this file does NOT contain: no atomic write, no log, no
//  replay, no index maintenance. sqlite already did all of module 19 for
//  you, and it survives kill -9 in the middle of an INSERT.
//  ':memory:' keeps tests fast and isolated; swap in a path and the exact
//  same code has a durable file.

import { test, eq, ok, throws } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

// Provided: open a database, run your test body, always close it.
function withDb(run) {
  const db = openDb();
  try {
    return run(db);
  } finally {
    db.close();
  }
}

export function openDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE notes (
      id    INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      tag   TEXT NOT NULL
    )
  `);
  return db;
}

export function addNote(db, title, tag) {
  const stmt = db.prepare('INSERT INTO notes (title, tag) VALUES (?, ?)');
  return stmt.run(title, tag).lastInsertRowid;
}

export function getNote(db, id) {
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  return row ? { ...row } : null;
}

export function listNotes(db, tag) {
  return db
    .prepare('SELECT * FROM notes WHERE tag = ? ORDER BY id')
    .all(tag)
    .map((row) => ({ ...row }));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('openDb creates a notes table', () => {
  withDb((db) => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name);
    ok(tables.includes('notes'), `expected a notes table, got ${tables}`);
  });
});

test('addNote returns the id sqlite assigned', () => {
  withDb((db) => {
    eq(addNote(db, 'first', 'work'), 1);
    eq(addNote(db, 'second', 'work'), 2);
  });
});

test('getNote reads a row back as a plain object', () => {
  withDb((db) => {
    const id = addNote(db, 'buy milk', 'home');
    eq(getNote(db, id), { id, title: 'buy milk', tag: 'home' });
  });
});

test('getNote returns null for an id that is not there', () => {
  withDb((db) => {
    addNote(db, 'only', 'work');
    eq(getNote(db, 999), null);
  });
});

test('listNotes filters by tag and keeps insertion order', () => {
  withDb((db) => {
    addNote(db, 'a', 'work');
    addNote(db, 'b', 'home');
    addNote(db, 'c', 'work');
    eq(
      listNotes(db, 'work').map((n) => n.title),
      ['a', 'c']
    );
    eq(listNotes(db, 'nothing'), []);
  });
});

test('NOT NULL is enforced by the database, not by your code', () => {
  withDb((db) => {
    throws(() => addNote(db, null, 'work'), 'NOT NULL');
    eq(listNotes(db, 'work'), []);
  });
});

test('one prepared statement serves many inserts', () => {
  withDb((db) => {
    for (let i = 0; i < 100; i += 1) addNote(db, `note ${i}`, 'bulk');
    eq(listNotes(db, 'bulk').length, 100);
    eq(getNote(db, 100).title, 'note 99');
  });
});

test('raw rows have a null prototype — yours must not', () => {
  withDb((db) => {
    const id = addNote(db, 'typed', 'work');
    const raw = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
    eq(Object.getPrototypeOf(raw), null, 'that is what sqlite hands you');
    eq(typeof raw.id, 'number');
    eq(Object.keys(raw).sort(), ['id', 'tag', 'title']);
    eq(Object.getPrototypeOf(getNote(db, id)), Object.prototype);
  });
});
