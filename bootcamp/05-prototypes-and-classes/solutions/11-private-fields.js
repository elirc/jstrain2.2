// ─────────────────────────────────────────────────────────────────────────
//  11 · private fields — SOLUTION                          ★★☆ core
//  run: node 11-private-fields.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: #balance is not a property with a funny name — it is a
//  separate slot the engine attaches to instances created by THIS class
//  body. That is why Object.keys, getOwnPropertyNames and JSON.stringify
//  all come up empty: there is nothing there to enumerate.
//
//  #assert is a private METHOD, so it does not appear on the prototype
//  either; both public entry points funnel through it, which is how one
//  rule stays one rule.
//
//  `static isAccount` uses the ergonomic brand check `#balance in value`.
//  Reading `value.#balance` on a foreign object would THROW, so this
//  operator exists to ask the question safely. It still needs an object
//  on the right-hand side, hence the typeof guard — `#x in null` is a
//  TypeError, exactly like the plain `in` operator.
//
//  The cost: private names are not inherited-friendly for outside code
//  and cannot be reached from a subclass. Use `_underscore` when you want
//  a soft hint, `#` when you want a guarantee.

import { test, eq, ok, throws } from '../../_lib/check.js';

export class BankAccount {
  #balance = 0;

  constructor(owner, opening = 0) {
    this.owner = owner;
    this.#balance = opening;
  }

  get balance() {
    return this.#balance;
  }

  deposit(amount) {
    this.#assert(amount);
    this.#balance += amount;
    return this.#balance;
  }

  withdraw(amount) {
    this.#assert(amount);
    if (amount > this.#balance) throw new RangeError('insufficient funds');
    this.#balance -= amount;
    return this.#balance;
  }

  #assert(amount) {
    const bad = typeof amount !== 'number' || !Number.isFinite(amount);
    if (bad || amount <= 0) {
      throw new TypeError('amount must be a positive number');
    }
  }

  static isAccount(value) {
    const isObject = typeof value === 'object' && value !== null;
    return isObject && #balance in value;
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
