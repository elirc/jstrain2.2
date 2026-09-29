// ─────────────────────────────────────────────────────────────────────────
//  53 · dedupe: first wins or last wins — SOLUTION         ★☆☆ warm-up
//  run: node 53-dedupe-first-vs-last.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: first-wins is a `Set` of keys you have already emitted plus
//  a `filter` — one pass, and the order falls out of the filter. Last-wins
//  is a `Map` you overwrite as you go, because `map.set` on an existing key
//  replaces the VALUE and keeps the key's original position; that is what
//  makes "freshest record, first-seen order" a one-liner instead of a
//  reverse-dedupe-reverse dance. Which one you want is a product question,
//  not a style question: first-wins preserves history (the original shelf,
//  the first signup), last-wins reflects the current truth (where the book
//  is now). `Object.values(keyBy(items, keyOf))` is the same last-wins
//  behaviour by accident — worth recognising when you meet it in a codebase
//  that never decided on purpose.

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
  const seen = new Set();
  return items.filter((item) => {
    const key = keyOf(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function dedupeLast(items, keyOf) {
  const latest = new Map();
  for (const item of items) latest.set(keyOf(item), item);
  return [...latest.values()];
}

export function duplicates(items, keyOf) {
  const counts = items.reduce(
    (tally, item) => tally.set(keyOf(item), (tally.get(keyOf(item)) ?? 0) + 1),
    new Map()
  );
  return [...counts]
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
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
