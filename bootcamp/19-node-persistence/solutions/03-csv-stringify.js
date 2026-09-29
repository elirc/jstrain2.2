// ─────────────────────────────────────────────────────────────────────────
//  03 · writing CSV — SOLUTION                                 ★★☆ core
//  run: node 03-csv-stringify.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: quoting is a two-step rule and the order matters — double
//  the quotes FIRST, then wrap the whole thing. Do it the other way round
//  and you escape the wrapper you just added.
//  `toCsv` never touches commas itself; it joins already-escaped fields.
//  That separation is what keeps delimited writers correct: one function
//  decides how a single value is spelled, the other only glues.
//  Two details worth stealing: `row[col] ?? ''` so a missing key becomes
//  an empty field instead of the text 'undefined', and deriving columns
//  from the first row so callers usually pass nothing.
//  RFC 4180 actually specifies CRLF line endings; '\n' is what every tool
//  in practice accepts, and it keeps the tests readable.

import { test, eq } from '../../_lib/check.js';

export function escapeCsvField(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(rows, columns) {
  const cols = columns ?? (rows.length > 0 ? Object.keys(rows[0]) : []);
  if (cols.length === 0) return '';
  const lines = [cols.map(escapeCsvField).join(',')];
  for (const row of rows) {
    lines.push(cols.map((col) => escapeCsvField(row[col])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('leaves an ordinary field alone', () => {
  eq(escapeCsvField('plain'), 'plain');
  eq(escapeCsvField(36), '36');
});

test('quotes a field containing a comma', () => {
  eq(escapeCsvField('Bond, James'), '"Bond, James"');
});

test('doubles the quotes inside a quoted field', () => {
  eq(escapeCsvField('say "hi"'), '"say ""hi"""');
});

test('quotes a field containing a newline', () => {
  eq(escapeCsvField('line1\nline2'), '"line1\nline2"');
  eq(escapeCsvField('line1\r\nline2'), '"line1\r\nline2"');
});

test('null and undefined become empty fields', () => {
  eq(escapeCsvField(null), '');
  eq(escapeCsvField(undefined), '');
  eq(escapeCsvField(''), '');
});

test('writes a header from the first row and one line per row', () => {
  eq(
    toCsv([
      { name: 'ada', age: 36 },
      { name: 'grace', age: 45 },
    ]),
    'name,age\nada,36\ngrace,45\n'
  );
});

test('an explicit column list picks and orders the fields', () => {
  const rows = [{ name: 'ada', age: 36, secret: 'x' }];
  eq(toCsv(rows, ['age', 'name']), 'age,name\n36,ada\n');
  eq(toCsv([], ['age', 'name']), 'age,name\n');
});

test('missing keys and nasty values still line up', () => {
  eq(
    toCsv([{ name: 'a,b', note: 'he said "no"' }, { name: 'solo' }]),
    'name,note\n"a,b","he said ""no"""\nsolo,\n'
  );
  eq(toCsv([]), '');
});
