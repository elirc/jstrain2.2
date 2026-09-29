// ─────────────────────────────────────────────────────────────────────────
//  04 · parsing CSV — SOLUTION                               ★★★ stretch
//  run: node 04-csv-parse.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: why `split(',')` cannot work — the meaning of a comma
//  depends on characters that came BEFORE it. `"Bond, James"` contains a
//  comma that is data; `a,b` contains one that is structure. Splitting is
//  a context-free operation, and CSV is not context-free. The moment you
//  reach for a regex to patch it you are writing a worse state machine.
//  So write the good one: three accumulators (field, row, rows), one flag
//  (inQuotes), and an index you advance yourself so a '""' pair can eat
//  two characters in a single step.
//  The last-row rule is the other classic bug. After the loop there may
//  be an unterminated final row; flush it only if something is actually
//  pending, otherwise a trailing '\n' invents a phantom empty row.
//  Real-world note: this is ~40 lines. A dependency for it is a choice,
//  not a necessity — though a real one also does BOM, custom delimiters
//  and streaming.

import { test, eq } from '../../_lib/check.js';

export function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 2;
      } else if (ch === '"') {
        inQuotes = false;
        i += 1;
      } else {
        field += ch;
        i += 1;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
    } else if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += ch === '\r' && text[i + 1] === '\n' ? 2 : 1;
    } else {
      field += ch;
      i += 1;
    }
  }

  if (field !== '' || row.length > 0 || inQuotes) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function parseCsv(text) {
  const [header, ...rows] = parseCsvRows(text);
  if (!header) return [];
  return rows.map((row) =>
    Object.fromEntries(header.map((key, i) => [key, row[i] ?? '']))
  );
}

// ──────────────────────────── tests ──────────────────────────────────────

test('splits plain rows and fields', () => {
  eq(parseCsvRows('a,b\n1,2\n'), [
    ['a', 'b'],
    ['1', '2'],
  ]);
});

test('a trailing newline does not add an empty row', () => {
  eq(parseCsvRows('only\n'), [['only']]);
  eq(parseCsvRows(''), []);
});

test('empty fields survive, including at the end of a row', () => {
  eq(parseCsvRows('a,,c\n'), [['a', '', 'c']]);
  eq(parseCsvRows('a,\n'), [['a', '']]);
});

test('a comma inside quotes is data, not a separator', () => {
  eq(parseCsvRows('"Bond, James",007\n'), [['Bond, James', '007']]);
});

test('doubled quotes decode to one quote', () => {
  eq(parseCsvRows('"say ""hi""",x\n'), [['say "hi"', 'x']]);
  eq(parseCsvRows('""\n'), [['']]);
});

test('a newline inside quotes stays inside the field', () => {
  eq(parseCsvRows('"two\nlines",z\n'), [['two\nlines', 'z']]);
});

test('handles Windows CRLF row endings', () => {
  eq(parseCsvRows('a,b\r\n1,2\r\n'), [
    ['a', 'b'],
    ['1', '2'],
  ]);
});

test('parseCsv maps the header row onto objects', () => {
  eq(parseCsv('name,note\nada,"a,b"\ngrace,"said ""no"""\n'), [
    { name: 'ada', note: 'a,b' },
    { name: 'grace', note: 'said "no"' },
  ]);
  eq(parseCsv(''), []);
});
