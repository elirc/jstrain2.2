// ─────────────────────────────────────────────────────────────────────────
//  01 · paginate                                             ★☆☆ warm-up
//  concepts: slice bounds · 1-based pages · off-by-one
//  run: node 01-off-by-one-pagination.js
// ─────────────────────────────────────────────────────────────────────────
//
//  paginate(items, page, perPage) cuts a list into pages. Pages are
//  1-BASED — page 1 is the first perPage items — and a page number outside
//  the range is clamped to the nearest real page.
//
//      paginate(ROWS, 1, 5).items → rows 1–5    (ROWS.slice(0, 5))
//      paginate(ROWS, 3, 5).items → rows 11–13  (the short last page)
//      paginate(ROWS, 99, 5).page → 3           (clamped)
//
//  The code below is fully written — and wrong: 3 tests fail. Find the
//  planted bug and fix it with the smallest change that turns everything
//  green. It is one of the classic bug families; WHERE is the exercise.

import { test, eq } from '../../_lib/check.js';

const ROWS = Array.from({ length: 13 }, (_, i) => `row-${i + 1}`);

export function paginate(items, page, perPage) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const current = Math.min(Math.max(1, Math.trunc(page)), totalPages);
  const start = (current - 1) * perPage;
  const end = start + perPage - 1;

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
