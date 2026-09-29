// ─────────────────────────────────────────────────────────────────────────
//  33 · pivot table                                        ★★★ stretch
//  concepts: rows × columns aggregation · dense grids · margins
//  run: node 33-pivot-table.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A pivot table is a spreadsheet feature you can write in twenty lines:
//  pick a field for the rows, a field for the columns, and an amount to
//  add up in every cell. The hard part is that the grid must be DENSE —
//  a region that billed nothing in Q3 still needs a `0` in that column.
//
//      pivot(INVOICES, { row: 'region', col: 'quarter',
//                        value: (r) => r.amount })
//        → {
//            rows:      ['east', 'north', 'south'],   // sorted, distinct
//            cols:      ['Q1', 'Q2', 'Q3'],           // sorted, distinct
//            cells:     [[0, 950, 0], [1500, 400, 0], [800, 0, 640]],
//            rowTotals: [950, 1900, 1440],
//            colTotals: [2300, 1350, 640],
//            total:     4290,
//          }
//
//  hint: collect the distinct labels first, build an index → position
//  lookup for each axis, then fill a pre-zeroed grid in one pass.

import { test, eq } from '../../_lib/check.js';

const INVOICES = Object.freeze([
  Object.freeze({ id: 'i1', region: 'north', quarter: 'Q1', amount: 1200 }),
  Object.freeze({ id: 'i2', region: 'south', quarter: 'Q1', amount: 800 }),
  Object.freeze({ id: 'i3', region: 'north', quarter: 'Q2', amount: 400 }),
  Object.freeze({ id: 'i4', region: 'north', quarter: 'Q1', amount: 300 }),
  Object.freeze({ id: 'i5', region: 'east',  quarter: 'Q2', amount: 950 }),
  Object.freeze({ id: 'i6', region: 'south', quarter: 'Q3', amount: 640 }),
]);

export function pivot(records, { row, col, value }) {
  throw new Error('TODO');
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
