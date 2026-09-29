// ─────────────────────────────────────────────────────────────────────────
//  34 · laying text out in columns                               ★★☆ core
//  concepts: padEnd · column widths · trimEnd
//  run: node 34-text-layout.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Terminal output is a grid, and the only tool you need is padEnd. Two
//  layouts that come up constantly: a two-column block, and a markdown
//  table generated from records.
//
//      twoColumn(['name', 'age'], ['Ada', '36'], 8)
//        → ['name      Ada',
//           'age       36']
//
//  The left column is padded to leftWidth, then `gap` spaces (default 2),
//  then the right line. Either side may run out first — the shorter one
//  is treated as blank lines — and a line must never end in spaces.
//
//      markdownTable([{ name: 'ada', lang: 'js' },
//                     { name: 'grace', lang: 'cobol' }])
//        → ['| name  | lang  |',
//           '| ----- | ----- |',
//           '| ada   | js    |',
//           '| grace | cobol |']
//
//  Columns come from the keys of the FIRST row. Every column is as wide
//  as its widest cell (header included), cells are stringified, and a key
//  a later row is missing shows up as an empty cell. Both functions
//  return an array of lines.
//
//  hint: compute the widths in one pass before you build any line —
//  Math.max(...cells.map((c) => c.length)) per column — and trimEnd() the
//  finished line rather than trying to predict when the right side is
//  empty.

import { test, eq } from '../../_lib/check.js';

export function twoColumn(leftLines, rightLines, leftWidth, gap = 2) {
  throw new Error('TODO');
}

export function markdownTable(rows) {
  throw new Error('TODO');
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
