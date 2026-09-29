// ─────────────────────────────────────────────────────────────────────────
//  33 · pivot table — SOLUTION                             ★★★ stretch
//  run: node 33-pivot-table.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three phases, and mixing them up is what makes people call
//  this hard. (1) Discover the axes — distinct labels via a Set, sorted so
//  the report is stable run to run. (2) Build `label → position` lookups so
//  the fill pass is O(1) per record instead of an `indexOf` scan. (3) Fill
//  a pre-zeroed grid with `Array.from({ length: rows }, () => new Array(cols)
//  .fill(0))` — the shortcut `new Array(rows).fill(new Array(cols).fill(0))`
//  puts the SAME row array in every slot, so writing one cell writes a whole
//  column. Margins come free from the same pass; recomputing them with more
//  loops is how the totals drift out of sync with the cells.

import { test, eq } from '../../_lib/check.js';

const INVOICES = Object.freeze([
  Object.freeze({ id: 'i1', region: 'north', quarter: 'Q1', amount: 1200 }),
  Object.freeze({ id: 'i2', region: 'south', quarter: 'Q1', amount: 800 }),
  Object.freeze({ id: 'i3', region: 'north', quarter: 'Q2', amount: 400 }),
  Object.freeze({ id: 'i4', region: 'north', quarter: 'Q1', amount: 300 }),
  Object.freeze({ id: 'i5', region: 'east',  quarter: 'Q2', amount: 950 }),
  Object.freeze({ id: 'i6', region: 'south', quarter: 'Q3', amount: 640 }),
]);

const distinctSorted = (records, field) =>
  [...new Set(records.map((r) => r[field]))].sort();

const positions = (labels) => new Map(labels.map((label, i) => [label, i]));

export function pivot(records, { row, col, value }) {
  const rows = distinctSorted(records, row);
  const cols = distinctSorted(records, col);
  const rowAt = positions(rows);
  const colAt = positions(cols);

  const cells = Array.from({ length: rows.length }, () =>
    new Array(cols.length).fill(0)
  );
  const rowTotals = new Array(rows.length).fill(0);
  const colTotals = new Array(cols.length).fill(0);
  let total = 0;

  for (const record of records) {
    const r = rowAt.get(record[row]);
    const c = colAt.get(record[col]);
    const amount = value(record);
    cells[r][c] += amount;
    rowTotals[r] += amount;
    colTotals[c] += amount;
    total += amount;
  }

  return { rows, cols, cells, rowTotals, colTotals, total };
}

// ──────────────────────────── tests ──────────────────────────────────────

const SPEC = { row: 'region', col: 'quarter', value: (r) => r.amount };

test('the axes are the distinct labels, sorted', () => {
  const table = pivot(INVOICES, SPEC);
  eq(table.rows, ['east', 'north', 'south']);
  eq(table.cols, ['Q1', 'Q2', 'Q3']);
});

test('cells is a rows × cols grid', () => {
  const table = pivot(INVOICES, SPEC);
  eq(table.cells.length, 3);
  eq(table.cells.map((r) => r.length), [3, 3, 3]);
});

test('a cell adds up every record in that row and column', () => {
  const table = pivot(INVOICES, SPEC);
  eq(table.cells[1][0], 1500);
});

test('a combination nobody billed is 0, not undefined', () => {
  const table = pivot(INVOICES, SPEC);
  eq(table.cells[0][0], 0);
  eq(table.cells[2][1], 0);
});

test('the margins add up along each axis', () => {
  const table = pivot(INVOICES, SPEC);
  eq(table.rowTotals, [950, 1900, 1440]);
  eq(table.colTotals, [2300, 1350, 640]);
});

test('the grand total agrees with both sets of margins', () => {
  const table = pivot(INVOICES, SPEC);
  const sum = (ns) => ns.reduce((a, n) => a + n, 0);
  eq(table.total, 4290);
  eq(sum(table.rowTotals), table.total);
  eq(sum(table.colTotals), table.total);
});

test('a value function of () => 1 counts instead of summing', () => {
  const table = pivot(INVOICES, { row: 'region', col: 'quarter', value: () => 1 });
  eq(table.cells[1], [2, 1, 0]);
  eq(table.total, 6);
});

test('no records means an empty table, not a crash', () => {
  eq(pivot([], SPEC), {
    rows: [],
    cols: [],
    cells: [],
    rowTotals: [],
    colTotals: [],
    total: 0,
  });
});
