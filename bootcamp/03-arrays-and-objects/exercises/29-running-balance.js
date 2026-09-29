// ─────────────────────────────────────────────────────────────────────────
//  29 · running balances                                   ★★☆ core
//  concepts: reduce · accumulating a list · immutability
//  run: node 29-running-balance.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A billing ledger is useless as a list of amounts — what the customer
//  wants to see is the balance after every line. A charge adds, a payment
//  subtracts, and the account starts at zero.
//
//      runningBalance(LEDGER)   → [120, 70, 100, -100, -25]
//      withBalances(LEDGER)[3]  → { …entry, balance: -100 }
//      lowestPoint(LEDGER)      → -100
//
//  `lowestPoint` is the deepest the balance ever got, never above 0 —
//  the account starts there.
//
//  hint: the accumulator can be the array you are building. Each step
//  needs the PREVIOUS balance, not the raw amount.

import { test, eq, ok } from '../../_lib/check.js';

const LEDGER = Object.freeze([
  Object.freeze({ id: 'e1', kind: 'charge',  amount: 120 }),
  Object.freeze({ id: 'e2', kind: 'payment', amount: 50 }),
  Object.freeze({ id: 'e3', kind: 'charge',  amount: 30 }),
  Object.freeze({ id: 'e4', kind: 'payment', amount: 200 }),
  Object.freeze({ id: 'e5', kind: 'charge',  amount: 75 }),
]);

export function runningBalance(entries) {
  throw new Error('TODO');
}

export function withBalances(entries) {
  throw new Error('TODO');
}

export function lowestPoint(entries) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('runningBalance reports one balance per entry', () => {
  eq(runningBalance(LEDGER), [120, 70, 100, -100, -25]);
});

test('a payment before any charge goes straight negative', () => {
  eq(runningBalance([{ id: 'x', kind: 'payment', amount: 10 }]), [-10]);
});

test('an empty ledger has no balances', () => {
  eq(runningBalance([]), []);
});

test('withBalances attaches the balance to a copy of each entry', () => {
  eq(withBalances(LEDGER)[3], {
    id: 'e4',
    kind: 'payment',
    amount: 200,
    balance: -100,
  });
});

test('withBalances leaves the frozen entries alone', () => {
  withBalances(LEDGER);
  ok(!('balance' in LEDGER[0]));
});

test('lowestPoint finds the deepest dip', () => {
  eq(lowestPoint(LEDGER), -100);
});

test('lowestPoint of a ledger that never dips is 0', () => {
  eq(lowestPoint([{ id: 'x', kind: 'charge', amount: 40 }]), 0);
});

test('lowestPoint of an empty ledger is 0', () => {
  eq(lowestPoint([]), 0);
});
