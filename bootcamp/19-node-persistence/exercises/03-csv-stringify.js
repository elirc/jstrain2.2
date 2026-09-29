// ─────────────────────────────────────────────────────────────────────────
//  03 · writing CSV                                            ★★☆ core
//  concepts: delimited formats · quoting · escaping
//  run: node 03-csv-stringify.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every finance team on earth will ask you for a CSV export. The format
//  is trivial until a value contains a comma, a quote or a newline — then
//  there are exactly three rules, and everybody gets them wrong once.
//
//  escapeCsvField(value):
//    · null / undefined            → ''      (empty field)
//    · contains , " \n or \r       → wrap in "..." and double every "
//    · anything else               → the value as a string, untouched
//
//      escapeCsvField('plain')     → 'plain'
//      escapeCsvField('a,b')       → '"a,b"'
//      escapeCsvField('say "hi"')  → '"say ""hi"""'
//
//  toCsv(rows, columns): a header line + one line per row, every line
//  ended with '\n'. `columns` picks and orders the fields; when it is
//  omitted, use the keys of the first row.
//
//      toCsv([{ name: 'ada', age: 36 }])  → 'name,age\nada,36\n'
//      toCsv([])                          → ''
//
//  hint: a field needs quoting if `/[",\n\r]/.test(text)`.

import { test, eq } from '../../_lib/check.js';

export function escapeCsvField(value) {
  throw new Error('TODO');
}

export function toCsv(rows, columns) {
  throw new Error('TODO');
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
