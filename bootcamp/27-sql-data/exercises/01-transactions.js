// ─────────────────────────────────────────────────────────────────────────
//  01 · all or nothing — transactions                           ★★☆ core
//  concepts: transactions · BEGIN/COMMIT/ROLLBACK · atomicity
//  run: node 01-transactions.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A bank transfer is two writes: debit one account, credit another.
//  If the second fails, the first must not survive — a transfer that
//  loses money is worse than one that never ran.
//
//  Build transfer(db, fromId, toId, cents):
//    · wrap both UPDATEs in a transaction (BEGIN … COMMIT)
//    · if the debit would leave a NEGATIVE balance, throw and ROLLBACK
//      so NEITHER account changed
//    · a successful transfer moves the money and commits
//
//  node:sqlite runs statements with db.exec / db.prepare. There is no
//  auto-transaction helper here — you write BEGIN, COMMIT, ROLLBACK
//  yourself, which is the point.
//
//      transfer(db, 1, 2, 3000)   moves 3000 cents, 1 → 2
//      transfer(db, 1, 2, 999999) throws 'insufficient funds', nothing moves
//
//  hint: BEGIN, then the writes in a try; COMMIT at the end of the try,
//  ROLLBACK in the catch, then re-throw so the caller still sees the
//  error.

import { test, eq, throws } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

function withBank(run) {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE accounts (id INTEGER PRIMARY KEY, cents INTEGER NOT NULL);`);
  const stmt = db.prepare('INSERT INTO accounts VALUES (?, ?)');
  stmt.run(1, 5000);
  stmt.run(2, 1000);
  try {
    return run(db);
  } finally {
    db.close();
  }
}

const balance = (db, id) =>
  db.prepare('SELECT cents FROM accounts WHERE id = ?').get(id).cents;

export function transfer(db, fromId, toId, cents) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a valid transfer moves the money', () => {
  withBank((db) => {
    transfer(db, 1, 2, 3000);
    eq(balance(db, 1), 2000);
    eq(balance(db, 2), 4000);
  });
});

test('an overdraw throws and is refused', () => {
  withBank((db) => {
    throws(() => transfer(db, 1, 2, 999999), 'insufficient funds');
  });
});

test('after a refused transfer, BOTH balances are untouched', () => {
  withBank((db) => {
    transfer(db, 2, 1, 500); // a valid transfer first (todo until built)
    const from = balance(db, 1);
    const to = balance(db, 2);
    try { transfer(db, 1, 2, 999999); } catch {}
    eq(balance(db, 1), from);
    eq(balance(db, 2), to);
  });
});

test('the total money in the bank is conserved across a transfer', () => {
  withBank((db) => {
    const before = balance(db, 1) + balance(db, 2);
    transfer(db, 1, 2, 1234);
    eq(balance(db, 1) + balance(db, 2), before);
  });
});

test('a transfer that exactly empties an account is allowed', () => {
  withBank((db) => {
    transfer(db, 1, 2, 5000);
    eq(balance(db, 1), 0);
    eq(balance(db, 2), 6000);
  });
});
