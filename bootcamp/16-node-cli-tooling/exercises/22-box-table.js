// ─────────────────────────────────────────────────────────────────────────
//  22 · bordered table                                     ★★★ stretch
//  concepts: word wrapping · two-pass rendering · box drawing
//  run: node 22-box-table.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 07 aligned columns with spaces. This one draws the box — and
//  a box has to hold, so a cell too wide for its column wraps instead of
//  bursting through the border.
//
//      wrapText('the quick brown fox', 9)  → ['the quick', 'brown fox']
//      wrapText('supercalifragilistic', 8) → ['supercal', 'ifragili', 'stic']
//      wrapText('', 5)                     → ['']
//
//      boxTable(['name', 'qty'], [['apple', '3'], ['kiwi', '12']])
//
//      ┌───────┬─────┐
//      │ name  │ qty │
//      ├───────┼─────┤
//      │ apple │ 3   │
//      │ kiwi  │ 12  │
//      └───────┴─────┘
//
//  One space of padding either side of every cell, so a rule segment is
//  the column width plus 2. `maxWidth` caps a column, and a column that
//  needs less than the cap keeps less. A wrapped cell makes its whole row
//  taller; the other cells in that row go blank for the extra lines.
//  A missing cell is blank, and `rows: []` leaves the header box alone.
//
//  hint: wrap every cell FIRST, then measure the widest line that came
//  out — measuring before wrapping pads every column out to maxWidth

import { test, eq } from '../../_lib/check.js';

export function wrapText(text, width) {
  throw new Error('TODO');
}

export function boxTable(headers, rows, { maxWidth = Infinity } = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: a dependency listing, and the box-drawing characters.
const HEADERS = ['name', 'qty'];
const ROWS = [
  ['apple', '3'],
  ['kiwi', '12'],
];

test('wrapText breaks between words and never exceeds the width', () => {
  eq(wrapText('the quick brown fox', 9), ['the quick', 'brown fox']);
  eq(wrapText('a very fast bundler', 9), ['a very', 'fast', 'bundler']);
});

test('wrapText hard-splits a word wider than the column', () => {
  eq(wrapText('supercalifragilistic', 8), ['supercal', 'ifragili', 'stic']);
});

test('wrapText of nothing is one empty line, not zero lines', () => {
  eq(wrapText('', 5), ['']);
  eq(wrapText('   ', 5), ['']);
});

test('a table is a header block between three rules', () => {
  eq(
    boxTable(HEADERS, ROWS),
    [
      '┌───────┬─────┐',
      '│ name  │ qty │',
      '├───────┼─────┤',
      '│ apple │ 3   │',
      '│ kiwi  │ 12  │',
      '└───────┴─────┘',
    ].join('\n')
  );
});

test('the rules are two wider than the column, for the padding', () => {
  const lines = boxTable(['id'], [['7']]).split('\n');
  eq(lines[0], '┌────┐');
  eq(lines[1], '│ id │');
  eq(lines[3], '│ 7  │');
});

test('a cell past maxWidth wraps and its row grows taller', () => {
  eq(
    boxTable(['pkg', 'note'], [['esbuild', 'a very fast bundler']], {
      maxWidth: 9,
    }),
    [
      '┌─────────┬─────────┐',
      '│ pkg     │ note    │',
      '├─────────┼─────────┤',
      '│ esbuild │ a very  │',
      '│         │ fast    │',
      '│         │ bundler │',
      '└─────────┴─────────┘',
    ].join('\n')
  );
});

test('a column narrower than maxWidth is not padded out to it', () => {
  const lines = boxTable(['id'], [['7']], { maxWidth: 40 }).split('\n');
  eq(lines[0], '┌────┐');
});

test('missing and empty cells keep their column, and no rows means no body', () => {
  eq(
    boxTable(['a', 'b'], [['x']]),
    ['┌───┬───┐', '│ a │ b │', '├───┼───┤', '│ x │   │', '└───┴───┘'].join('\n')
  );
  eq(boxTable(['id'], []), ['┌────┐', '│ id │', '└────┘'].join('\n'));
});
