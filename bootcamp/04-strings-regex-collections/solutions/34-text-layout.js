// ─────────────────────────────────────────────────────────────────────────
//  34 · laying text out in columns — SOLUTION                    ★★☆ core
//  run: node 34-text-layout.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both layouts are "measure everything, then draw". In
//  twoColumn the measurement is given (leftWidth), so the loop runs to
//  the LONGER of the two arrays and uses '' for the side that ran out —
//  reading past the end of an array gives undefined, which would print as
//  the word 'undefined', so the ?? '' is doing real work.
//  trimEnd() at the end of each line is the cheap way to keep trailing
//  spaces out of the output: a line whose right side is empty is just
//  padding, and padding you cannot see still shows up in a diff.
//  markdownTable measures first too: one pass to collect the column keys
//  from the first row, one to find each column's widest cell, then the
//  drawing pass. Building the header before knowing the widths is the
//  wrong turn — you would have to go back and re-pad it.
//  The cells are read with `row[key] ?? ''` and passed through String(),
//  so a number becomes '22' and a missing key becomes an empty cell
//  instead of 'undefined'.

import { test, eq } from '../../_lib/check.js';

export function twoColumn(leftLines, rightLines, leftWidth, gap = 2) {
  const height = Math.max(leftLines.length, rightLines.length);
  const lines = [];

  for (let i = 0; i < height; i += 1) {
    const left = leftLines[i] ?? '';
    const right = rightLines[i] ?? '';
    lines.push((left.padEnd(leftWidth) + ' '.repeat(gap) + right).trimEnd());
  }
  return lines;
}

export function markdownTable(rows) {
  if (rows.length === 0) return [];

  const keys = Object.keys(rows[0]);
  const cell = (row, key) => String(row[key] ?? '');
  const widths = keys.map((key) =>
    Math.max(key.length, ...rows.map((row) => cell(row, key).length))
  );

  const line = (cells) =>
    '| ' + cells.map((text, i) => text.padEnd(widths[i])).join(' | ') + ' |';

  return [
    line(keys),
    line(widths.map((w) => '-'.repeat(w))),
    ...rows.map((row) => line(keys.map((key) => cell(row, key)))),
  ];
}

// ──────────────────────────── tests ──────────────────────────────────────

test('twoColumn pads the left column and inserts the gap', () => {
  eq(twoColumn(['name', 'age'], ['Ada', '36'], 8), [
    'name      Ada',
    'age       36',
  ]);
});

test('twoColumn keeps the right column aligned when the left runs out', () => {
  eq(twoColumn(['one'], ['a', 'b'], 5), ['one    a', '       b']);
});

test('twoColumn leaves no trailing spaces when the right runs out', () => {
  eq(twoColumn(['a', 'b'], ['x'], 4), ['a     x', 'b']);
});

test('twoColumn honours a custom gap', () => {
  eq(twoColumn(['a'], ['x'], 3, 1), ['a   x']);
});

test('markdownTable writes a header, a rule and one row per record', () => {
  eq(markdownTable([{ name: 'ada', lang: 'js' }, { name: 'grace', lang: 'cobol' }]), [
    '| name  | lang  |',
    '| ----- | ----- |',
    '| ada   | js    |',
    '| grace | cobol |',
  ]);
});

test('markdownTable stringifies values that are not strings', () => {
  eq(markdownTable([{ n: 1 }, { n: 22 }]), [
    '| n  |',
    '| -- |',
    '| 1  |',
    '| 22 |',
  ]);
});

test('markdownTable leaves a missing key blank', () => {
  eq(markdownTable([{ a: 'x', b: 'y' }, { a: 'zz' }]), [
    '| a  | b |',
    '| -- | - |',
    '| x  | y |',
    '| zz |   |',
  ]);
});

test('markdownTable of no records is no lines', () => {
  eq(markdownTable([]), []);
});
