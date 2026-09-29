// ─────────────────────────────────────────────────────────────────────────
//  53 · dedupe: first wins or last wins                    ★☆☆ warm-up
//  concepts: Set vs Map · which duplicate to keep
//  run: node 53-dedupe-first-vs-last.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A shelf scanner emits a row per scan, so the same book shows up twice
//  when a volunteer re-shelves it. "Remove duplicates" is not a complete
//  instruction: the first scan has the original shelf, the last one has the
//  current shelf, and only one of those is the answer you want.
//
//      dedupeFirst(SCANS, s => s.isbn)  → scans 1, 2, 4   (oldest wins)
//      dedupeLast(SCANS, s => s.isbn)   → scans 3, 5, 4   (freshest wins)
//      duplicates(SCANS, s => s.isbn)   → ['978-0', '978-1']
//
//  Both keep the keys in FIRST-seen order — the freshest record for a key
//  stays where that key first appeared.
//
//  hint: a Set of seen keys does first-wins in one `filter`. For
//  last-wins, remember that `map.set` on an existing key overwrites the
//  value and leaves the position alone.

import { test, eq, ok } from '../../_lib/check.js';

const SCANS = Object.freeze([
  Object.freeze({ scanId: 1, isbn: '978-0', title: 'Dune',    shelf: 'A1' }),
  Object.freeze({ scanId: 2, isbn: '978-1', title: 'Ubik',    shelf: 'B2' }),
  Object.freeze({ scanId: 3, isbn: '978-0', title: 'Dune',    shelf: 'C3' }),
  Object.freeze({ scanId: 4, isbn: '978-2', title: 'Solaris', shelf: 'A1' }),
  Object.freeze({ scanId: 5, isbn: '978-1', title: 'Ubik',    shelf: 'D4' }),
]);

const isbnOf = (s) => s.isbn;
const scanIds = (rows) => rows.map((s) => s.scanId);

export function dedupeFirst(items, keyOf) {
  throw new Error('TODO');
}

export function dedupeLast(items, keyOf) {
  throw new Error('TODO');
}

export function duplicates(items, keyOf) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('dedupeFirst keeps the earliest scan of each book', () => {
  eq(scanIds(dedupeFirst(SCANS, isbnOf)), [1, 2, 4]);
  eq(dedupeFirst(SCANS, isbnOf)[0].shelf, 'A1');
});

test('dedupeLast keeps the freshest scan of each book', () => {
  eq(scanIds(dedupeLast(SCANS, isbnOf)), [3, 5, 4]);
  eq(dedupeLast(SCANS, isbnOf)[0].shelf, 'C3');
});

test('both keep the keys in first-seen order', () => {
  const keys = (rows) => rows.map(isbnOf);
  eq(keys(dedupeFirst(SCANS, isbnOf)), ['978-0', '978-1', '978-2']);
  eq(keys(dedupeLast(SCANS, isbnOf)), ['978-0', '978-1', '978-2']);
});

test('a list with no repeats comes back whole, either way', () => {
  const clean = [SCANS[0], SCANS[1], SCANS[3]];
  eq(scanIds(dedupeFirst(clean, isbnOf)), [1, 2, 4]);
  eq(scanIds(dedupeLast(clean, isbnOf)), [1, 2, 4]);
});

test('duplicates lists only the keys that repeat', () => {
  eq(duplicates(SCANS, isbnOf), ['978-0', '978-1']);
  eq(duplicates([SCANS[0], SCANS[1]], isbnOf), []);
});

test('the scans themselves are passed through, not copied', () => {
  ok(dedupeFirst(SCANS, isbnOf)[0] === SCANS[0]);
  ok(dedupeLast(SCANS, isbnOf)[0] === SCANS[2]);
});

test('a composite key keeps rows that differ in either part', () => {
  const key = (s) => `${s.isbn}|${s.shelf}`;
  eq(dedupeFirst(SCANS, key).length, 5);
  eq(duplicates(SCANS, key), []);
});

test('an empty list is empty three ways', () => {
  eq(dedupeFirst([], isbnOf), []);
  eq(dedupeLast([], isbnOf), []);
  eq(duplicates([], isbnOf), []);
});
