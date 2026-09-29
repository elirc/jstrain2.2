// ─────────────────────────────────────────────────────────────────────────
//  11 · csv import — SOLUTION                                   ★★☆ core
//  run: node 11-swallowed-error.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: bug class — swallowed error. The catch classifies the
//  error, handles the case it knows about, and then falls off the end.
//  Every other error — a TypeError from a broken coercer, a currency the
//  caller's code refuses — is silently converted into "row skipped, no
//  errors, ok: true". A total failure reports a clean import.
//
//  The tell: a catch block whose body is an `if` with no `else`. Read
//  every catch as a question: "what happens to an error that does not
//  match this condition?" If the answer is "nothing", you found it. The
//  comment underneath was true about ROW errors and quietly grew to
//  cover everything — comments describe intent, not behaviour.
//
//  The minimal fix: one line, `else throw err;`. Handle what you named,
//  rethrow the rest. That is the whole discipline: a catch is allowed to
//  be narrow, it is not allowed to be a wildcard with a shrug.
//
//  The classic wild variant: `catch {}` with no binding at all, or
//  `.catch(() => [])` on a promise chain, which turns a 500 from your
//  database into an empty results page and a support ticket nobody can
//  reproduce. Same shape, same six hours lost.

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
      // keep going: one bad row should not sink a 40,000 row import
      if (err.name === 'RowError') {
        errors.push({ line: i + 1, message: err.message });
      } else {
        throw err;
      }
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
