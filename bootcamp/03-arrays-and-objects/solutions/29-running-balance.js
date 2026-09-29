// ─────────────────────────────────────────────────────────────────────────
//  29 · running balances — SOLUTION                        ★★☆ core
//  run: node 29-running-balance.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a running total is the one fold where each step needs the
//  step before it, so the accumulator is the OUTPUT ARRAY and the previous
//  balance is just its last element. `map` cannot do this honestly — you
//  would need a mutable variable in the closure, which works but hides the
//  dependency between iterations. `withBalances` reuses `runningBalance`
//  instead of folding twice: compute the numbers once, then zip them onto
//  copies with a spread. Note the seed of `0` in `lowestPoint`: the account
//  opens at zero, so a ledger that only ever collects money still bottoms
//  out at 0 rather than at its smallest positive balance.

import { test, eq, ok } from '../../_lib/check.js';

const LEDGER = Object.freeze([
  Object.freeze({ id: 'e1', kind: 'charge',  amount: 120 }),
  Object.freeze({ id: 'e2', kind: 'payment', amount: 50 }),
  Object.freeze({ id: 'e3', kind: 'charge',  amount: 30 }),
  Object.freeze({ id: 'e4', kind: 'payment', amount: 200 }),
  Object.freeze({ id: 'e5', kind: 'charge',  amount: 75 }),
]);

const delta = (entry) =>
  entry.kind === 'payment' ? -entry.amount : entry.amount;

export function runningBalance(entries) {
  return entries.reduce((balances, entry) => {
    const previous = balances.length === 0 ? 0 : balances[balances.length - 1];
    balances.push(previous + delta(entry));
    return balances;
  }, []);
}

export function withBalances(entries) {
  const balances = runningBalance(entries);
  return entries.map((entry, i) => ({ ...entry, balance: balances[i] }));
}

export function lowestPoint(entries) {
  return runningBalance(entries).reduce((low, b) => Math.min(low, b), 0);
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
