// ─────────────────────────────────────────────────────────────────────────
//  14 · node:sqlite — a real database, no install                ★★☆ core
//  concepts: node:sqlite · DDL · prepared statements · parameters
//  run: node 14-sqlite-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Everything you have built so far — atomic writes, a log, replay, an
//  index — is what an embedded database already does, tested by millions
//  of installs. Node ships one: `node:sqlite`. No npm, no server, no
//  connection string. (It prints an ExperimentalWarning on stderr; the
//  API below is stable enough to learn on.)
//
//      const db = new DatabaseSync(':memory:');   // or a file path
//      db.exec('CREATE TABLE ...');               // statements with no rows
//      const stmt = db.prepare('INSERT INTO notes (title) VALUES (?)');
//      stmt.run('hi')            → { changes: 1, lastInsertRowid: 1 }
//      db.prepare('SELECT * FROM notes WHERE id = ?').get(1)  → row|undef
//      db.prepare('SELECT * FROM notes').all()                → row[]
//
//  Build four things against this schema:
//
//      notes(id INTEGER PRIMARY KEY, title TEXT NOT NULL, tag TEXT NOT NULL)
//
//    · openDb()                  a :memory: db with the table created
//    · addNote(db, title, tag)   insert one row, return its new id
//    · getNote(db, id)           one row, or null when there is none
//    · listNotes(db, tag)        rows with that tag, oldest id first
//
//  INTEGER PRIMARY KEY makes sqlite fill the id in for you — pass only
//  title and tag. Two normalisations your API owes its callers: `get()`
//  returns undefined for no match (make it null), and rows arrive with a
//  NULL PROTOTYPE — spread them into `{ ...row }` so they behave like
//  ordinary objects.
//
//  hint: never build SQL with template literals; the `?` placeholders are
//  what keep exercise 15 from happening to you.

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
  throw new Error('TODO');
}

export function addNote(db, title, tag) {
  throw new Error('TODO');
}

export function getNote(db, id) {
  throw new Error('TODO');
}

export function listNotes(db, tag) {
  throw new Error('TODO');
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
