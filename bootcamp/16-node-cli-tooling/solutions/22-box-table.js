// ─────────────────────────────────────────────────────────────────────────
//  22 · bordered table — SOLUTION                          ★★★ stretch
//  run: node 22-box-table.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three passes now, not two. Wrap every cell first, THEN
//  measure, then draw — because a column's width is the widest line it
//  ends up with, which you only know after wrapping. Measuring before
//  wrapping is the bug that pads a 7-character column out to maxWidth and
//  leaves a corridor of spaces down the middle of the table.
//  Once cells are arrays of lines a row is a block, not a line: its height
//  is the tallest cell and the short ones are filled with `''`. Every
//  physical line is built the same way, so the borders stay vertical no
//  matter how ragged the content is.
//  The rules and the content lines are built by the same two helpers with
//  different corner characters, which is why the pluses always land over
//  the pipes: `w + 2` in the rule matches the one space of padding either
//  side of a cell. Hand-counting those two spaces somewhere else is how a
//  table ends up one character out on the last column only.
//  wrapText hard-splits a word longer than the column instead of letting
//  it stick out — a URL in a table blows the border off otherwise.

import { test, eq } from '../../_lib/check.js';

export function wrapText(text, width) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines = [];
  let line = '';

  for (let word of words) {
    while (word.length > width) {
      if (line !== '') {
        lines.push(line);
        line = '';
      }
      lines.push(word.slice(0, width));
      word = word.slice(width);
    }
    if (line === '') line = word;
    else if (line.length + 1 + word.length <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}

export function boxTable(headers, rows, { maxWidth = Infinity } = {}) {
  const grid = [headers, ...rows].map((row) =>
    headers.map((_, i) =>
      wrapText(row[i] === null || row[i] === undefined ? '' : String(row[i]), maxWidth)
    )
  );

  const widths = headers.map((_, i) =>
    Math.max(...grid.map((row) => Math.max(...row[i].map((line) => line.length))))
  );

  const rule = (left, join, right) =>
    left + widths.map((w) => '─'.repeat(w + 2)).join(join) + right;

  const block = (row) => {
    const height = Math.max(...row.map((cell) => cell.length));
    return Array.from(
      { length: height },
      (_, n) =>
        `│${row.map((cell, i) => ` ${(cell[n] ?? '').padEnd(widths[i])} `).join('│')}│`
    );
  };

  return [
    rule('┌', '┬', '┐'),
    ...block(grid[0]),
    ...(rows.length ? [rule('├', '┼', '┤'), ...grid.slice(1).flatMap(block)] : []),
    rule('└', '┴', '┘'),
  ].join('\n');
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
