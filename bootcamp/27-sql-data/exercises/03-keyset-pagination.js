// ─────────────────────────────────────────────────────────────────────────
//  03 · pagination that scales — keyset vs offset                ★★★ stretch
//  concepts: pagination · keyset (seek) · OFFSET's cost
//  run: node 03-keyset-pagination.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `LIMIT n OFFSET k` is the pagination everyone writes first, and it
//  rots: to serve page 5000 the database must count past 5000×n rows
//  every time, and if a row is inserted mid-scroll every later page
//  shifts by one (a duplicate on one page, a skip on the next).
//
//  Keyset (a.k.a. seek) pagination fixes both: instead of "skip k rows",
//  say "give me the rows AFTER the last id I saw". Constant cost, stable
//  under inserts.
//
//  posts have (id, title), id ascending. Build:
//    · pageOffset(db, limit, offset)     the naive version, for contrast
//    · pageKeyset(db, limit, afterId)    rows with id > afterId, `limit`
//                                        of them; afterId = 0 for page 1
//  Both return rows [{ id, title }] in id order.
//
//      pageKeyset(db, 3, 0)   → ids 1,2,3
//      pageKeyset(db, 3, 3)   → ids 4,5,6   (pass the last id you saw)
//
//  hint: keyset is `WHERE id > ? ORDER BY id LIMIT ?`. The caller
//  remembers the last id of the page it just showed and passes it back —
//  no counting, no OFFSET.

import { test, eq } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

function withPosts(run) {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT NOT NULL);`);
  const stmt = db.prepare('INSERT INTO posts VALUES (?, ?)');
  for (let i = 1; i <= 10; i++) stmt.run(i, `post ${i}`);
  try {
    return run(db);
  } finally {
    db.close();
  }
}

export function pageOffset(db, limit, offset) {
  throw new Error('TODO');
}

export function pageKeyset(db, limit, afterId) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('offset page 1 and keyset page 1 agree', () => {
  withPosts((db) => {
    const a = pageOffset(db, 3, 0).map((r) => r.id);
    const b = pageKeyset(db, 3, 0).map((r) => r.id);
    eq(a, [1, 2, 3]);
    eq(b, [1, 2, 3]);
  });
});

test('keyset walks by passing back the last id seen', () => {
  withPosts((db) => {
    eq(pageKeyset(db, 3, 3).map((r) => r.id), [4, 5, 6]);
    eq(pageKeyset(db, 3, 6).map((r) => r.id), [7, 8, 9]);
  });
});

test('the last page returns the remainder, then empty', () => {
  withPosts((db) => {
    eq(pageKeyset(db, 3, 9).map((r) => r.id), [10]);
    eq(pageKeyset(db, 3, 10), []);
  });
});

test('rows carry their data, not just ids', () => {
  withPosts((db) => {
    const row = pageKeyset(db, 1, 0);
    eq(row.length, 1);
    eq(row[0].id, 1);
    eq(row[0].title, 'post 1');
  });
});

test('keyset is stable when a new row is inserted mid-scroll', () => {
  withPosts((db) => {
    // show page 1 (ids 1-3), remember last id = 3
    const page1 = pageKeyset(db, 3, 0).map((r) => r.id);
    // a brand-new post arrives with a LOWER id gap? ids are max+1 → 11
    db.prepare('INSERT INTO posts VALUES (?, ?)').run(11, 'newest');
    // page 2 by keyset is unaffected: still the rows after id 3
    const page2 = pageKeyset(db, 3, 3).map((r) => r.id);
    eq(page1, [1, 2, 3]);
    eq(page2, [4, 5, 6]); // no shift, no skip, no duplicate
  });
});
