// ─────────────────────────────────────────────────────────────────────────
//  11 · csv import                                              ★★☆ core
//  concepts: bug hunt · try/catch · error classification
//  run: node 11-swallowed-error.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A CSV importer for a product feed. One bad ROW must not sink the
//  import: it is collected in `errors` with its line number and the
//  other rows still land. Anything else that goes wrong is a bug in the
//  importer or in the caller's coercer, and must reach the caller.
//
//      importCsv(clean).rows.length          → 3
//      importCsv(clean).ok                   → true
//      importCsv(ragged).errors
//        → [{ line: 3, message: 'expected 3 columns, got 2' }]
//      importCsv(text, coercerThatThrows)    → throws, does not report ok
//
//  The code below is fully written — and wrong. 2 tests fail. Find the
//  bug, fix it with the smallest change. Don't rewrite.
//
//  hint: when a function reports success on input you know is broken,
//  the evidence is being eaten somewhere. Put a `console.log(err)` as
//  the first line of every catch block in the file and re-run: the one
//  that prints something you did not expect is your bug.

import { test, eq, ok, throws } from '../../_lib/check.js';

export class RowError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RowError';
  }
}

export function splitCsv(line) {
  return line.split(',').map((cell) => cell.trim());
}

export function coerceCell(header, raw) {
  if (header === 'qty') {
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) {
      throw new RowError(`bad qty: ${raw}`);
    }
    return value;
  }
  if (header === 'price') {
    const value = Number(raw);
    if (Number.isNaN(value)) throw new RowError(`bad price: ${raw}`);
    return Math.round(value * 100);
  }
  return raw;
}

export function parseRow(line, headers, coerce) {
  const cells = splitCsv(line);
  if (cells.length !== headers.length) {
    throw new RowError(
      `expected ${headers.length} columns, got ${cells.length}`
    );
  }
  const row = {};
  headers.forEach((header, i) => {
    row[header] = coerce(header, cells[i]);
  });
  if (row.sku === '') throw new RowError('sku is required');
  return row;
}

export function importCsv(text, coerce = coerceCell) {
  const lines = text.trim().split('\n');
  const headers = splitCsv(lines[0]);
  const rows = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;
    try {
      rows.push(parseRow(line, headers, coerce));
    } catch (err) {
      if (err.name === 'RowError') {
        errors.push({ line: i + 1, message: err.message });
      }
      // keep going: one bad row should not sink a 40,000 row import
    }
  }

  return { headers, rows, errors, ok: errors.length === 0 };
}

const CLEAN = [
  'sku,qty,price',
  'desk-01,2,19.99',
  'chair-7,1,89.50',
  '',
  'lamp-3,4,12.00',
].join('\n');

const RAGGED = [
  'sku,qty,price',
  'desk-01,2,19.99',
  'chair-7,89.50',
  'lamp-3,many,12.00',
].join('\n');

const PRICED_IN_GBP = [
  'sku,qty,price',
  'desk-01,2,19.99 USD',
  'lamp-3,4,12.00 GBP',
].join('\n');

// a caller-supplied coercer: prices may carry a currency suffix
function coerceWithCurrency(header, raw) {
  if (header !== 'price') return coerceCell(header, raw);
  const [amount, currency = 'USD'] = raw.split(' ');
  if (currency !== 'USD') throw new Error(`no such currency: ${currency}`);
  return Math.round(Number(amount) * 100);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a clean file becomes typed rows and reports ok', () => {
  const report = importCsv(CLEAN);
  eq(report.headers, ['sku', 'qty', 'price']);
  eq(report.rows.length, 3);
  eq(report.rows[0], { sku: 'desk-01', qty: 2, price: 1999 });
  eq(report.ok, true);
  eq(report.errors, []);
});

test('blank lines are skipped without becoming errors', () => {
  eq(importCsv(CLEAN).errors, []);
  eq(importCsv(CLEAN).rows.at(-1), { sku: 'lamp-3', qty: 4, price: 1200 });
});

test('a ragged row is reported with its line number, not thrown', () => {
  const report = importCsv(RAGGED);
  eq(report.errors[0], { line: 3, message: 'expected 3 columns, got 2' });
  eq(report.ok, false);
});

test('a cell that fails to coerce is reported too', () => {
  const report = importCsv(RAGGED);
  eq(report.errors.length, 2);
  eq(report.errors[1], { line: 4, message: 'bad qty: many' });
});

test('rows that failed never show up as successes', () => {
  const report = importCsv(RAGGED);
  eq(report.rows.map((row) => row.sku), ['desk-01']);
});

test('a failure the importer does not recognise is not swallowed', () => {
  throws(() => importCsv(PRICED_IN_GBP, coerceWithCurrency),
    'no such currency: GBP');
});

test('a broken coercer fails loudly instead of importing nothing', () => {
  throws(() => importCsv(CLEAN, null), 'not a function');
  const report = importCsv(CLEAN);
  ok(report.rows.length > 0, 'the clean file still imports normally');
});
