// ─────────────────────────────────────────────────────────────────────────
//  08 · truncating cells                                   ★★☆ core
//  concepts: slicing · off-by-one · not mutating your input
//  run: node 08-truncate-cells.js
// ─────────────────────────────────────────────────────────────────────────
//
//  One commit message with a 300-character subject destroys the table you
//  built in exercise 07. Cut cells down to a budget first — and count the
//  ellipsis, because it takes a column too.
//
//      truncate('javascript', 6)  → 'javas…'   (six characters, total)
//      truncate('hello', 5)       → 'hello'    (fits: untouched)
//      truncate('hi', 1)          → '…'
//      truncate('hi', 0)          → ''
//
//      truncateRow({ sha: 'a1b2c3d', subject: 'a very long subject line' },
//                  { subject: 10 })
//        → { sha: 'a1b2c3d', subject: 'a very lo…' }
//
//  truncateRow returns a NEW object, leaves columns that are not in
//  `limits` alone, and skips values that are not strings — turning a
//  number into a string would break the table's right-alignment.
//
//  hint: '…' is one character; the cut is at max - 1

import { test, eq } from '../../_lib/check.js';

export function truncate(text, max) {
  throw new Error('TODO');
}

export function truncateRow(row, limits) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: the renderer from exercise 07, plus a fixture.
function renderTable(rows) {
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

const COMMITS = [
  { sha: 'a1b2c3d', subject: 'fix the flaky retry in the uploader', files: 3 },
  { sha: '9f8e7d6', subject: 'docs', files: 12 },
];

test('text that fits comes back untouched', () => {
  eq(truncate('short', 20), 'short');
  eq(truncate('', 3), '');
});

test('text exactly at the limit keeps every character', () => {
  eq(truncate('hello', 5), 'hello');
});

test('a long string spends one column on the ellipsis', () => {
  eq(truncate('javascript', 6), 'javas…');
  eq(truncate('javascript', 6).length, 6);
  eq(truncate('hello', 4), 'hel…');
});

test('the degenerate limits do not crash', () => {
  eq(truncate('hi', 1), '…');
  eq(truncate('hi', 0), '');
});

test('truncateRow touches only the listed columns, and copies', () => {
  const row = { sha: 'a1b2c3d', subject: 'a very long subject line' };
  eq(truncateRow(row, { subject: 10 }), {
    sha: 'a1b2c3d',
    subject: 'a very lo…',
  });
  eq(row.subject, 'a very long subject line');
});

test('truncateRow leaves non-strings alone', () => {
  eq(truncateRow({ files: 123456, at: null }, { files: 3, at: 3 }), {
    files: 123456,
    at: null,
  });
});

test('a truncated table still lines up', () => {
  eq(
    renderTable(COMMITS.map((r) => truncateRow(r, { subject: 20 }))),
    [
      'sha      subject               files',
      '-------  --------------------  -----',
      'a1b2c3d  fix the flaky retry…      3',
      '9f8e7d6  docs                     12',
    ].join('\n')
  );
});
