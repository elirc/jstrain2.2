// ─────────────────────────────────────────────────────────────────────────
//  07 · aligned table                                      ★★☆ core
//  concepts: two-pass rendering · padStart/padEnd · column widths
//  run: node 07-render-table.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Turn an array of objects into the thing `docker ps` prints. Columns
//  come from the keys of the first row, in that order.
//
//      renderTable([{ name: 'apple', qty: 3,  price: 1.25 },
//                   { name: 'kiwi',  qty: 12, price: 0.4 }])
//        →
//      name   qty  price
//      -----  ---  -----
//      apple    3   1.25
//      kiwi    12    0.4
//
//  Rules: a column is as wide as the longest of its header and its cells;
//  columns are joined by two spaces; the separator is one '-' per
//  character of the column; a column whose values are all numbers (holes
//  allowed) is right-aligned, everything else is left-aligned — headers
//  follow their column. null and undefined render as ''. No line may end
//  in a space, and an empty array renders as ''.
//
//  hint: measure first, render second — you cannot print row 1 until you
//  have seen the last row

import { test, eq } from '../../_lib/check.js';

export function renderTable(rows) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided fixture.
const FRUIT = [
  { name: 'apple', qty: 3, price: 1.25 },
  { name: 'kiwi', qty: 12, price: 0.4 },
];

test('an empty table is an empty string', () => {
  eq(renderTable([]), '');
});

test('renders header, separator and rows', () => {
  eq(
    renderTable(FRUIT),
    [
      'name   qty  price',
      '-----  ---  -----',
      'apple    3   1.25',
      'kiwi    12    0.4',
    ].join('\n')
  );
});

test('text pads on the right, numbers pad on the left', () => {
  eq(
    renderTable([{ id: 7, label: 'a' }, { id: 100, label: 'bb' }]),
    [' id  label', '---  -----', '  7  a', '100  bb'].join('\n')
  );
});

test('the separator is exactly as wide as its column', () => {
  eq(renderTable(FRUIT).split('\n')[1], '-----  ---  -----');
});

test('a header wider than every value sets the width', () => {
  eq(
    renderTable([{ quantity: 1 }]),
    ['quantity', '--------', '       1'].join('\n')
  );
});

test('missing cells are blank and no line ends in a space', () => {
  const out = renderTable([{ name: 'a', note: 'x' }, { name: 'bb', note: null }]);
  eq(out, ['name  note', '----  ----', 'a     x', 'bb'].join('\n'));
  eq(out.split('\n').filter((l) => l !== l.trimEnd()), []);
});

test('a hole in a numeric column keeps it right-aligned', () => {
  eq(
    renderTable([{ n: 1 }, { n: null }, { n: 20 }]),
    [' n', '--', ' 1', '', '20'].join('\n')
  );
});
