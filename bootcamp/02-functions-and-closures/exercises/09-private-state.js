// ─────────────────────────────────────────────────────────────────────────
//  09 · private state with closures                        ★★☆ core
//  concepts: closures · encapsulation
//  run: node 09-private-state.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A closed-over variable is genuinely private: no property to read, no
//  property to overwrite. Build a tiny account whose balance can only be
//  changed through its own methods.
//
//      const acct = createAccount(50);
//      acct.deposit(25)      → 75      (returns the new balance)
//      acct.withdraw(100)    → throws Error('Insufficient funds')
//      acct.getBalance()     → 75
//      acct.balance          → undefined   ← nothing leaks
//
//  createAccount(initial = 0) returns exactly three methods: deposit,
//  withdraw, getBalance. deposit and withdraw return the new balance.
//
//  hint: `let balance = initial;` then never put it on the returned object

import { test, eq, throws } from '../../_lib/check.js';

export function createAccount(initial = 0) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('starts at the opening balance', () => {
  eq(createAccount(50).getBalance(), 50);
  eq(createAccount().getBalance(), 0);
});

test('deposits add to the balance and return it', () => {
  const acct = createAccount(10);
  eq(acct.deposit(15), 25);
  eq(acct.deposit(5), 30);
  eq(acct.getBalance(), 30);
});

test('withdrawals subtract from the balance', () => {
  const acct = createAccount(100);
  eq(acct.withdraw(30), 70);
  eq(acct.getBalance(), 70);
});

test('refuses to overdraw', () => {
  const acct = createAccount(50);
  throws(() => acct.withdraw(51), 'Insufficient funds');
  eq(acct.getBalance(), 50);
});

test('exposes only the three methods', () => {
  const acct = createAccount(50);
  eq(Object.keys(acct).sort(), ['deposit', 'getBalance', 'withdraw']);
  eq(acct.balance, undefined);
});

test('an outside property cannot corrupt the real balance', () => {
  const acct = createAccount(50);
  acct.balance = 999999;
  eq(acct.getBalance(), 50);
  eq(acct.withdraw(50), 0);
});

test('two accounts keep separate balances', () => {
  const a = createAccount(10);
  const b = createAccount(10);
  a.deposit(5);
  eq(a.getBalance(), 15);
  eq(b.getBalance(), 10);
});
