// ─────────────────────────────────────────────────────────────────────────
//  07 · aligned table — SOLUTION                           ★★☆ core
//  run: node 07-render-table.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two passes. The first measures — every column's width is
//  the longest of its header and its cells — and the second renders. You
//  cannot print row one until you have seen row nine, which is exactly why
//  a table renderer takes an array and not a stream.
//  Alignment is decided per column, not per cell: a column is numeric if
//  it holds at least one number and nothing that is not a number, so a
//  hole (null) does not knock the column back to left-aligned and make
//  the decimal points wander.
//  trimEnd() on every line kills the invisible trailing spaces that a
//  left-aligned last column would otherwise emit — they show up in diffs,
//  in `git add -p`, and in the reviewer's mood.

import { test, eq } from '../../_lib/check.js';

export function renderTable(rows) {
  if (rows.length === 0) return '';

  const keys = Object.keys(rows[0]);
  const text = (v) => (v === null || v === undefined ? '' : String(v));

  const numeric = keys.map(
    (k) =>
      rows.some((r) => typeof r[k] === 'number') &&
      rows.every((r) => r[k] == null || typeof r[k] === 'number')
  );

  const widths = keys.map((k) =>
    Math.max(k.length, ...rows.map((r) => text(r[k]).length))
  );

  const line = (cells) =>
    cells
      .map((c, i) => (numeric[i] ? c.padStart(widths[i]) : c.padEnd(widths[i])))
      .join('  ')
      .trimEnd();

  return [
    line(keys),
    widths.map((w) => '-'.repeat(w)).join('  '),
    ...rows.map((r) => line(keys.map((k) => text(r[k])))),
  ].join('\n');
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
