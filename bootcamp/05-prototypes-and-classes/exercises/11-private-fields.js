// ─────────────────────────────────────────────────────────────────────────
//  11 · private fields                                     ★★☆ core
//  concepts: #private fields · private methods · brand checks
//  run: node 11-private-fields.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `_balance` is a polite request. `#balance` is a locked door: it is not
//  a property at all, so nothing outside the class body can name it.
//
//  Build a BankAccount with a #balance nobody can touch:
//
//      const a = new BankAccount('Ada', 100);
//      a.balance            → 100      (getter only — no setter)
//      a.deposit(50)        → 150      (returns the new balance)
//      a.withdraw(500)      → throws RangeError 'insufficient funds'
//      a.deposit(-1)        → throws TypeError 'positive number'
//      Object.keys(a)       → ['owner']
//      a.balance = 999      → throws (there is no setter)
//
//  Validate deposits and withdrawals in ONE private method, #assert.
//  Then add `static isAccount(value)` — return true only for real
//  accounts, using the brand check `#balance in value`.
//
//  hint: `#x in value` is the one place a private name may appear
//  outside a member access; it is false for a look-alike plain object,
//  but it still needs an object — guard against primitives yourself

import { test, eq, ok, throws } from '../../_lib/check.js';

export class BankAccount {
  constructor(owner, opening = 0) {
    throw new Error('TODO');
  }

  get balance() {
    throw new Error('TODO');
  }

  deposit(amount) {
    throw new Error('TODO');
  }

  withdraw(amount) {
    throw new Error('TODO');
  }

  static isAccount(value) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the opening balance is readable through the getter', () => {
  const a = new BankAccount('Ada', 100);
  eq(a.owner, 'Ada');
  eq(a.balance, 100);
  eq(new BankAccount('Bob').balance, 0);
});

test('deposit and withdraw return the new balance', () => {
  const a = new BankAccount('Ada', 100);
  eq(a.deposit(50), 150);
  eq(a.withdraw(20), 130);
  eq(a.balance, 130);
});

test('withdrawing more than you have is refused', () => {
  const a = new BankAccount('Ada', 100);
  throws(() => a.withdraw(500), 'insufficient funds');
  eq(a.balance, 100, 'a refused withdrawal must not change anything');
});

test('the shared validator rejects junk amounts', () => {
  const a = new BankAccount('Ada', 100);
  throws(() => a.deposit(-1), 'positive number');
  throws(() => a.deposit(0), 'positive number');
  throws(() => a.withdraw('10'), 'positive number');
  eq(a.balance, 100);
});

test('the balance is invisible from outside the class', () => {
  const a = new BankAccount('Ada', 100);
  eq(Object.keys(a), ['owner']);
  eq(Object.getOwnPropertyNames(a), ['owner']);
  eq(JSON.stringify(a), '{"owner":"Ada"}');
});

test('and unwritable — the getter has no setter', () => {
  const a = new BankAccount('Ada', 100);
  throws(() => {
    a.balance = 999;
  });
  eq(a.balance, 100);
});

test('the brand check recognises real accounts only', () => {
  const a = new BankAccount('Ada', 100);
  eq(BankAccount.isAccount(a), true);
  eq(BankAccount.isAccount({ owner: 'Ada', balance: 100 }), false);
  eq(BankAccount.isAccount(null), false);
  eq(BankAccount.isAccount(42), false);
});

test('two accounts hold two separate balances', () => {
  const a = new BankAccount('Ada', 100);
  const b = new BankAccount('Bob', 100);
  a.deposit(1);
  eq(b.balance, 100);
  ok(a.deposit === b.deposit, 'the method itself is still shared');
});
