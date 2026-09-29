// ─────────────────────────────────────────────────────────────────────────
//  08 · truncating cells — SOLUTION                        ★★☆ core
//  run: node 08-truncate-cells.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the ellipsis is a character and it costs a column, so the
//  cut is at max - 1, not at max. Off by one here and every "80 column"
//  table is 81 columns wide and wraps on the narrowest terminal in the
//  room — the exact machine you were trying to help.
//  The `text.length <= max` guard comes first so a string that already
//  fits is returned untouched, ellipsis-free. Shortening a 6-character
//  string to 6 characters must be a no-op.
//  truncateRow copies with {...row} instead of assigning into the caller's
//  object: a renderer that mutates its input is a bug waiting for the
//  second caller. It skips non-strings so numbers stay numbers, which is
//  what keeps the table's right-alignment working.

import { test, eq } from '../../_lib/check.js';

export function truncate(text, max) {
  if (max <= 0) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function truncateRow(row, limits) {
  const out = { ...row };
  for (const [key, max] of Object.entries(limits)) {
    if (typeof out[key] === 'string') out[key] = truncate(out[key], max);
  }
  return out;
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
