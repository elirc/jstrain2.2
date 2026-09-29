// ─────────────────────────────────────────────────────────────────────────
//  02 · insert or update — UPSERT — SOLUTION                    ★★☆ core
//  concepts: UNIQUE constraints · ON CONFLICT · upsert
//  run: node 02-unique-upsert.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The UNIQUE(user_id, key) constraint is what makes upsert possible: it
//  gives ON CONFLICT a target to detect. The single statement
//    INSERT ... VALUES (...) ON CONFLICT(user_id, key)
//                            DO UPDATE SET value = excluded.value
//  inserts when the pair is new and updates when it exists — atomically,
//  in one round trip. `excluded` is the phantom row you tried to insert,
//  so `excluded.value` is the new value.
//  Why not SELECT-then-INSERT-or-UPDATE: between your SELECT and your
//  write, another connection can insert the same pair — now your INSERT
//  throws a constraint error, or two requests both "win". ON CONFLICT
//  pushes the race down into the one place that can resolve it safely.
//  getSetting returns null on a miss by coalescing `.get()`'s undefined:
//  `?? null` keeps the "absent" contract explicit.
//  The classic wrong turn: INSERT OR REPLACE. It works, but it DELETES
//  the old row and inserts a new one — changing the primary key and
//  firing delete triggers / cascading foreign keys you did not intend.
//  ON CONFLICT DO UPDATE edits in place.

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
  db.prepare(
    `INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
     ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`
  ).run(userId, key, value);
}

export function getSetting(db, userId, key) {
  const row = db
    .prepare('SELECT value FROM settings WHERE user_id = ? AND key = ?')
    .get(userId, key);
  return row ? row.value : null;
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
