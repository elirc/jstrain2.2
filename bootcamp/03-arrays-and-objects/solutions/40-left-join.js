// ─────────────────────────────────────────────────────────────────────────
//  40 · left join and anti join — SOLUTION                 ★★★ stretch
//  run: node 40-left-join.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: same hash index as the inner join, one different branch —
//  when the key finds nothing you emit `combine(row, null)` instead of
//  emitting nothing. Passing `null` rather than `undefined` is deliberate:
//  it survives `JSON.stringify`, it reads as "we looked and there was
//  nobody", and it forces the caller to handle the case. The one-to-many
//  test is the point of the whole exercise — people picture a left join as
//  "decorate each row" and are then astonished that three customers turned
//  into four lines and their revenue total double-counted. `antiJoin` needs
//  no index at all, just a Set of the keys that exist; it is the JS spelling
//  of `WHERE NOT EXISTS`, and it is how you hunt down rows whose foreign key
//  points at something that was deleted.

import { test, eq, ok } from '../../_lib/check.js';

const CUSTOMERS = Object.freeze([
  Object.freeze({ id: 'c1', name: 'Northwind', plan: 'pro' }),
  Object.freeze({ id: 'c2', name: 'Umbrella',  plan: 'free' }),
  Object.freeze({ id: 'c3', name: 'Vandelay',  plan: 'pro' }),
]);

const INVOICES = Object.freeze([
  Object.freeze({ id: 'in1', customerId: 'c1', amount: 120 }),
  Object.freeze({ id: 'in2', customerId: 'c9', amount: 40 }),
  Object.freeze({ id: 'in3', customerId: 'c2', amount: 90 }),
  Object.freeze({ id: 'in4', customerId: 'c1', amount: 15 }),
]);

const billed = (invoice, customer) => ({
  invoice: invoice.id,
  customer: customer === null ? null : customer.name,
});

function indexRows(rows, key) {
  const index = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!index.has(value)) index.set(value, []);
    index.get(value).push(row);
  }
  return index;
}

export function leftJoin(left, right, leftKey, rightKey, combine) {
  const index = indexRows(right, rightKey);
  return left.flatMap((row) => {
    const matches = index.get(row[leftKey]);
    return matches === undefined || matches.length === 0
      ? [combine(row, null)]
      : matches.map((match) => combine(row, match));
  });
}

export function antiJoin(left, right, leftKey, rightKey) {
  const known = new Set(right.map((row) => row[rightKey]));
  return left.filter((row) => !known.has(row[leftKey]));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('every left row survives, matched or not', () => {
  const rows = leftJoin(INVOICES, CUSTOMERS, 'customerId', 'id', billed);
  eq(rows.length, 4);
  eq(rows.map((r) => r.invoice), ['in1', 'in2', 'in3', 'in4']);
});

test('an unmatched row is combined with null, not skipped', () => {
  const rows = leftJoin(INVOICES, CUSTOMERS, 'customerId', 'id', billed);
  eq(rows[1], { invoice: 'in2', customer: null });
});

test('a matched row can read the right-hand columns', () => {
  const rows = leftJoin(INVOICES, CUSTOMERS, 'customerId', 'id', billed);
  eq(rows[0], { invoice: 'in1', customer: 'Northwind' });
});

test('an empty right table gives every left row a null partner', () => {
  const rows = leftJoin(INVOICES, [], 'customerId', 'id', billed);
  eq(rows.length, 4);
  ok(rows.every((r) => r.customer === null));
});

test('one-to-many turns 3 customers into 4 rows', () => {
  const rows = leftJoin(
    CUSTOMERS,
    INVOICES,
    'id',
    'customerId',
    (customer, invoice) => ({
      customer: customer.name,
      amount: invoice === null ? null : invoice.amount,
    })
  );
  eq(rows.length, 4);
  eq(rows.map((r) => r.amount), [120, 15, 90, null]);
});

test('antiJoin finds invoices whose customer is gone', () => {
  eq(antiJoin(INVOICES, CUSTOMERS, 'customerId', 'id').map((r) => r.id), ['in2']);
});

test('antiJoin the other way finds customers who never bought', () => {
  eq(antiJoin(CUSTOMERS, INVOICES, 'id', 'customerId').map((r) => r.id), ['c3']);
});

test('antiJoin against an empty table keeps everything', () => {
  eq(antiJoin(INVOICES, [], 'customerId', 'id').length, 4);
  eq(antiJoin([], CUSTOMERS, 'customerId', 'id'), []);
});
