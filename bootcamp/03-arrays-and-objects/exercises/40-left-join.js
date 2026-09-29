// ─────────────────────────────────────────────────────────────────────────
//  40 · left join and anti join                            ★★★ stretch
//  concepts: keeping unmatched rows · row multiplication · absences
//  run: node 40-left-join.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An inner join answers "which invoices have a customer". A LEFT join
//  answers "show me every invoice, and the customer if we still have one" —
//  the unmatched ones come through with `null` on the right. An ANTI join
//  keeps only the rows that found nobody, which is how you find orphans.
//
//      leftJoin(INVOICES, CUSTOMERS, 'customerId', 'id', combine)
//        → 4 rows for 4 invoices; in2's combine() gets null
//      antiJoin(INVOICES, CUSTOMERS, 'customerId', 'id')  → [in2]
//      antiJoin(CUSTOMERS, INVOICES, 'id', 'customerId')  → [c3]
//
//  `combine(leftRow, rightRowOrNull)` builds each result row. Careful: when
//  the right side matches more than once, the left row is emitted once per
//  match — a left join can return MORE rows than the left table has.
//  (Module 22 does all of this in SQL; the shape is identical.)
//
//  hint: index the right table by key → array of rows, then decide per left
//  row between "one row with null" and "one row per match".

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

export function leftJoin(left, right, leftKey, rightKey, combine) {
  throw new Error('TODO');
}

export function antiJoin(left, right, leftKey, rightKey) {
  throw new Error('TODO');
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
