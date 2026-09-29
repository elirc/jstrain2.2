// ─────────────────────────────────────────────────────────────────────────
//  04 · parsing CSV                                         ★★★ stretch
//  concepts: state machines · quoting · parsing by hand
//  run: node 04-csv-parse.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `text.split('\n').map(l => l.split(','))` handles about 80% of real
//  CSV files and silently mangles the other 20%. A quoted field may hold
//  commas, doubled quotes and whole newlines. You need a character-by-
//  character state machine with exactly one piece of state: "am I inside
//  quotes right now?"
//
//      parseCsvRows('a,b\n1,2\n')      → [['a','b'], ['1','2']]
//      parseCsvRows('"x,y",z')         → [['x,y', 'z']]
//      parseCsvRows('"a""b"')          → [['a"b']]
//      parseCsvRows('"two\nlines",z')  → [['two\nlines', 'z']]
//
//  parseCsv(text) builds objects, using the first row as the keys:
//
//      parseCsv('name,age\nada,36\n') → [{ name: 'ada', age: '36' }]
//
//  Rules: '\r\n' and '\n' both end a row. A final newline at the very end
//  of the text does NOT create an extra empty row. Every value stays a
//  string — CSV has no types.
//
//  hint: walk the string with an index you advance yourself, so a '""'
//  pair can consume two characters at once.

import { test, eq } from '../../_lib/check.js';

export function parseCsvRows(text) {
  throw new Error('TODO');
}

export function parseCsv(text) {
  throw new Error('TODO');
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
