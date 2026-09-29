// ─────────────────────────────────────────────────────────────────────────
//  48 · the admin table pipeline — SOLUTION                ★★★ stretch
//  run: node 48-table-pipeline.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three stages, and each of the classic bugs is a stage in
//  the wrong place. Slice before you filter and page 2 shows rows that
//  should never have been in the list. Count AFTER slicing and `total` is
//  always ≤ pageSize, so the pager shows one page forever. Sort after
//  slicing and each page is sorted within itself while the table as a whole
//  is not — the bug that survives review because every screenshot looks
//  right. The clamp is the fourth: `page` arrives from a URL, so it can be
//  99 on a list that now has three pages, and `slice(294, 297)` silently
//  returns an empty table. Compute `pageCount` first, clamp into
//  `[1, max(1, pageCount)]`, and let 0 results report `pageCount: 0` while
//  still sitting on page 1. `toSorted` keeps the caller's array intact and
//  the comparator returns 0 for ties, so the engine's stable sort holds the
//  source order — which is what makes a second sort key even possible.

import { test, eq } from '../../_lib/check.js';

const LOANS = Object.freeze([
  Object.freeze({ id: 'l1', title: 'Dune',             member: 'Ada', status: 'out',      days: 14 }),
  Object.freeze({ id: 'l2', title: 'Ficciones',        member: 'Rui', status: 'returned', days: 7 }),
  Object.freeze({ id: 'l3', title: 'Ubik',             member: 'Kai', status: 'out',      days: 21 }),
  Object.freeze({ id: 'l4', title: 'Solaris',          member: 'Ada', status: 'overdue',  days: 30 }),
  Object.freeze({ id: 'l5', title: 'Dubliners',        member: 'Mei', status: 'out',      days: 14 }),
  Object.freeze({ id: 'l6', title: 'The Dispossessed', member: 'Rui', status: 'returned', days: 3 }),
  Object.freeze({ id: 'l7', title: 'Kindred',          member: 'Kai', status: 'out',      days: 9 }),
  Object.freeze({ id: 'l8', title: 'Annihilation',     member: 'Mei', status: 'overdue',  days: 30 }),
]);

const ids = (rows) => rows.map((r) => r.id);

export function tableView(rows, options = {}) {
  const { search = '', status = '', sort = '', page = 1, pageSize = 10 } = options;

  const needle = search.trim().toLowerCase();
  const hit = (row) =>
    row.title.toLowerCase().includes(needle) ||
    row.member.toLowerCase().includes(needle);

  let matched = rows.filter(
    (row) =>
      (needle === '' || hit(row)) && (status === '' || row.status === status)
  );

  if (sort !== '') {
    const descending = sort.startsWith('-');
    const field = descending ? sort.slice(1) : sort;
    matched = matched.toSorted((a, b) => {
      const order = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
      return descending ? -order : order;
    });
  }

  const total = matched.length;
  const pageCount = Math.ceil(total / pageSize);
  const current = Math.min(Math.max(1, page), Math.max(1, pageCount));
  const start = (current - 1) * pageSize;

  return {
    rows: matched.slice(start, start + pageSize),
    total,
    page: current,
    pageCount,
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('with no options you get page 1 of everything', () => {
  const view = tableView(LOANS);
  eq(view.total, 8);
  eq(view.page, 1);
  eq(view.pageCount, 1);
  eq(view.rows.length, 8);
});

test('a status filter shrinks the result and the total', () => {
  const view = tableView(LOANS, { status: 'out' });
  eq(ids(view.rows), ['l1', 'l3', 'l5', 'l7']);
  eq(view.total, 4);
});

test('paging slices what the filter left, not the source', () => {
  const view = tableView(LOANS, { status: 'out', pageSize: 2, page: 2 });
  eq(ids(view.rows), ['l5', 'l7']);
  eq(view.total, 4);
  eq(view.pageCount, 2);
});

test('sorting happens before the slice', () => {
  const view = tableView(LOANS, { sort: '-days', pageSize: 3 });
  eq(ids(view.rows), ['l4', 'l8', 'l3']);
  eq(ids(LOANS).slice(0, 2), ['l1', 'l2']);
});

test('rows tied on the sort field keep their source order', () => {
  const view = tableView(LOANS, { sort: '-days', pageSize: 10 });
  eq(ids(view.rows), ['l4', 'l8', 'l3', 'l1', 'l5', 'l7', 'l2', 'l6']);
});

test('search is case-insensitive and covers title and member', () => {
  const view = tableView(LOANS, { search: 'AD' });
  eq(ids(view.rows), ['l1', 'l4']);
  eq(view.total, 2);
});

test('a page past the end clamps to the last page', () => {
  const view = tableView(LOANS, { page: 99, pageSize: 3 });
  eq(view.page, 3);
  eq(view.pageCount, 3);
  eq(ids(view.rows), ['l7', 'l8']);
});

test('no matches is page 1 of nothing', () => {
  eq(tableView(LOANS, { status: 'lost' }), {
    rows: [],
    total: 0,
    page: 1,
    pageCount: 0,
  });
});
