// ─────────────────────────────────────────────────────────────────────────
//  02 · insert or update — UPSERT                               ★★☆ core
//  concepts: UNIQUE constraints · ON CONFLICT · upsert
//  run: node 02-unique-upsert.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A settings table has one row per (user_id, key). Saving a setting is
//  "insert it, or if that pair already exists, overwrite its value" —
//  the classic UPSERT. Doing it as SELECT-then-INSERT-or-UPDATE races;
//  the database can do it in one atomic statement.
//
//  The table is created for you WITH a UNIQUE(user_id, key) constraint.
//  Build:
//    · saveSetting(db, userId, key, value)  insert-or-replace the value
//    · getSetting(db, userId, key)          the current value, or null
//
//      saveSetting(db, 1, 'theme', 'dark')   inserts
//      saveSetting(db, 1, 'theme', 'light')  updates the same row
//      getSetting(db, 1, 'theme')            → 'light'
//
//  hint: `INSERT INTO settings (...) VALUES (...) ON CONFLICT(user_id,
//  key) DO UPDATE SET value = excluded.value`. `excluded` is the row you
//  tried to insert.

import { test, eq } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

function withDb(run) {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE settings (
      id      INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      key     TEXT NOT NULL,
      value   TEXT NOT NULL,
      UNIQUE (user_id, key)
    );
  `);
  try {
    return run(db);
  } finally {
    db.close();
  }
}

const rowCount = (db) =>
  db.prepare('SELECT COUNT(*) AS n FROM settings').get().n;

export function saveSetting(db, userId, key, value) {
  throw new Error('TODO');
}

export function getSetting(db, userId, key) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a new setting is inserted', () => {
  withDb((db) => {
    saveSetting(db, 1, 'theme', 'dark');
    eq(getSetting(db, 1, 'theme'), 'dark');
  });
});

test('saving the same key again updates, not duplicates', () => {
  withDb((db) => {
    saveSetting(db, 1, 'theme', 'dark');
    saveSetting(db, 1, 'theme', 'light');
    eq(getSetting(db, 1, 'theme'), 'light');
    eq(rowCount(db), 1); // still one row, not two
  });
});

test('different users keep independent values for the same key', () => {
  withDb((db) => {
    saveSetting(db, 1, 'theme', 'dark');
    saveSetting(db, 2, 'theme', 'light');
    eq(getSetting(db, 1, 'theme'), 'dark');
    eq(getSetting(db, 2, 'theme'), 'light');
    eq(rowCount(db), 2);
  });
});

test('a missing setting reads back as null', () => {
  withDb((db) => {
    eq(getSetting(db, 1, 'nope'), null);
  });
});

test('many saves of one key leave exactly one row', () => {
  withDb((db) => {
    for (const v of ['a', 'b', 'c', 'd']) saveSetting(db, 7, 'lang', v);
    eq(getSetting(db, 7, 'lang'), 'd');
    eq(rowCount(db), 1);
  });
});
