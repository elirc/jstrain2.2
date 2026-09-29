// ─────────────────────────────────────────────────────────────────────────
//  48 · the admin table pipeline                           ★★★ stretch
//  concepts: filter → sort → paginate · totals · clamping
//  run: node 48-table-pipeline.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every internal tool has this function, and it is wrong in a surprising
//  number of them. The order is fixed: FILTER, then SORT, then SLICE — and
//  `total` is the count after filtering, before slicing, because that is
//  the number the pager needs.
//
//      tableView(LOANS, { status: 'out', pageSize: 2, page: 2 })
//        → { rows: [l5, l7], total: 4, page: 2, pageCount: 2 }
//
//  Options, all optional: `search` (case-insensitive, over title AND
//  member), `status`, `sort` ('days' or '-days' for descending), `page`
//  (1-based, default 1), `pageSize` (default 10). A page past the end
//  clamps to the last one — users bookmark page 9 of a list that shrank.
//
//  hint: sort with `toSorted` so the frozen input survives, and return 0
//  for `pageCount` when nothing matched — but never page 0.

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
  throw new Error('TODO');
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
