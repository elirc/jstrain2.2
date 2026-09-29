// ─────────────────────────────────────────────────────────────────────────
//  01 · all or nothing — transactions — SOLUTION                ★★☆ core
//  concepts: transactions · BEGIN/COMMIT/ROLLBACK · atomicity
//  run: node 01-transactions.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  A transaction makes several statements atomic: BEGIN opens it, COMMIT
//  makes everything permanent at once, ROLLBACK throws all of it away.
//  The transfer does the debit and credit between BEGIN and COMMIT, and
//  checks the balance BEFORE committing — if it would go negative we
//  ROLLBACK and re-throw, so the caller sees the error AND the database
//  is exactly as it was.
//  The shape to memorize: BEGIN in a try, COMMIT at the end of the try,
//  ROLLBACK in the catch, re-throw. Without the try/catch, a throw
//  between BEGIN and COMMIT leaves the connection stuck in an open
//  transaction — the classic leak.
//  Why check-then-write is safe here: the whole thing is one
//  transaction, so no other writer can slip between the check and the
//  UPDATE. Doing the two UPDATEs WITHOUT a transaction is the bug this
//  teaches — a crash after the debit and before the credit vaporizes
//  money.
//  The classic wrong turn: catching the error, rolling back, and then
//  swallowing it — now the caller thinks the transfer succeeded.

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
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE accounts SET cents = cents - ? WHERE id = ?').run(cents, fromId);
    db.prepare('UPDATE accounts SET cents = cents + ? WHERE id = ?').run(cents, toId);
    if (balance(db, fromId) < 0) {
      throw new Error(`insufficient funds in account ${fromId}`);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
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
