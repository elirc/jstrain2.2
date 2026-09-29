// ─────────────────────────────────────────────────────────────────────────
//  03 · pagination that scales — keyset vs offset — SOLUTION     ★★★ stretch
//  concepts: pagination · keyset (seek) · OFFSET's cost
//  run: node 03-keyset-pagination.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Offset pagination asks the database to produce and then DISCARD the
//  first `offset` rows — O(offset) work that grows with the page number,
//  and unstable: insert a row near the front and every subsequent page
//  slides by one, duplicating one row and skipping another.
//  Keyset pagination remembers the last id it showed and asks for rows
//  AFTER it: `WHERE id > ? ORDER BY id LIMIT ?`. With an index on the
//  ordering column that is O(log n) to seek plus the page — constant in
//  the page number — and stable, because "after id 3" means the same
//  thing no matter what was inserted elsewhere.
//  The price: you can only go next/prev from a known row, not jump to
//  "page 500" by number, and the cursor column must be unique and
//  ordered (id works; a non-unique `created_at` needs a tiebreaker like
//  `(created_at, id)`). That trade is why infinite-scroll and APIs use
//  keyset while numbered pagers use offset.
//  The classic wrong turn: keyset on a non-unique sort key, which skips
//  or repeats rows that share the boundary value.

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
  return db
    .prepare('SELECT id, title FROM posts ORDER BY id LIMIT ? OFFSET ?')
    .all(limit, offset);
}

export function pageKeyset(db, limit, afterId) {
  return db
    .prepare('SELECT id, title FROM posts WHERE id > ? ORDER BY id LIMIT ?')
    .all(afterId, limit);
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
