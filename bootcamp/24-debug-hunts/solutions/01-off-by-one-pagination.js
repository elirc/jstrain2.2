// ─────────────────────────────────────────────────────────────────────────
//  01 · paginate — SOLUTION                                  ★☆☆ warm-up
//  run: node 01-off-by-one-pagination.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: an off-by-one — the oldest bug there is.
//
//  The tell: `const end = start + perPage - 1;`. slice() takes an
//  EXCLUSIVE end — the index one PAST the last item you want — so the -1
//  is a correction for a problem slice does not have. Every page comes
//  back one row short.
//
//  The fix: `const end = start + perPage;`. Nothing else moves. The
//  1-based → 0-based conversion in `start` was already right, which is
//  what makes this one worth reading twice: `(current - 1)` looks like the
//  suspicious arithmetic and is innocent.
//
//  Why the last page looked fine: slice clamps an end past the array
//  length, so page 3 of 13 rows returned all three leftovers and the bug
//  hid. That is the classic field report too — pagination that silently
//  drops one row per page while the last page is perfect, so nobody
//  notices until a customer says "record 5 is missing from the export".

import { test, eq } from '../../_lib/check.js';

const ROWS = Array.from({ length: 13 }, (_, i) => `row-${i + 1}`);

export function paginate(items, page, perPage) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const current = Math.min(Math.max(1, Math.trunc(page)), totalPages);
  const start = (current - 1) * perPage;
  const end = start + perPage;

  return {
    items: items.slice(start, end),
    page: current,
    perPage,
    totalItems,
    totalPages,
    hasPrev: current > 1,
    hasNext: current < totalPages,
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('page 1 is the first slice, not the second', () => {
  eq(paginate(ROWS, 1, 5).items, ROWS.slice(0, 5));
});

test('page 2 starts exactly where page 1 stopped', () => {
  eq(paginate(ROWS, 2, 5).items, ROWS.slice(5, 10));
});

test('the last page holds the remainder', () => {
  const last = paginate(ROWS, 3, 5);
  eq(last.items, ['row-11', 'row-12', 'row-13']);
  eq(last.hasNext, false);
});

test('totalPages rounds up and totals ignore the page asked for', () => {
  eq(paginate(ROWS, 1, 5).totalPages, 3);
  eq(paginate(ROWS, 1, 13).totalPages, 1);
  eq(paginate(ROWS, 1, 4).totalPages, 4);
  eq(paginate(ROWS, 2, 5).totalItems, 13);
});

test('page numbers outside the range are clamped', () => {
  eq(paginate(ROWS, 0, 5).page, 1);
  eq(paginate(ROWS, 99, 5).page, 3);
  eq(paginate(ROWS, 0, 5).hasPrev, false);
  eq(paginate(ROWS, 99, 5).hasNext, false);
});

test('walking every page visits every row exactly once', () => {
  const seen = [];
  const pages = paginate(ROWS, 1, 5).totalPages;
  for (let p = 1; p <= pages; p++) {
    seen.push(...paginate(ROWS, p, 5).items);
  }
  eq(seen, ROWS);
});

test('a perPage bigger than the list gives one full page', () => {
  eq(paginate(ROWS, 1, 50).items, ROWS);
  eq(paginate([], 1, 5).items, []);
  eq(paginate([], 1, 5).totalPages, 1);
});
