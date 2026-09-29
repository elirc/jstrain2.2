// ─────────────────────────────────────────────────────────────────────────
//  09 · private state with closures — SOLUTION             ★★☆ core
//  run: node 09-private-state.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the returned object holds behaviour, the closure holds
//  data. Because `balance` is a local variable of createAccount and never
//  becomes a property, `acct.balance = 999999` just adds an unrelated
//  property that nothing reads. Note the methods use `balance` directly
//  rather than `this.balance` — no receiver needed, so they keep working
//  when they are pulled off the object (compare with exercise 06).

import { test, eq, throws } from '../../_lib/check.js';

export function createAccount(initial = 0) {
  let balance = initial;

  return {
    deposit(amount) {
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error('Insufficient funds');
      balance -= amount;
      return balance;
    },
    getBalance() {
      return balance;
    },
  };
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
