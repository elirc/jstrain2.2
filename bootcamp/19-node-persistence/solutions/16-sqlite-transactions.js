// ─────────────────────────────────────────────────────────────────────────
//  16 · transactions: all or nothing — SOLUTION              ★★★ stretch
//  run: node 16-sqlite-transactions.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: withTransaction is the shape, and everything else is
//  detail. BEGIN, run the caller's work, COMMIT as the very last thing in
//  the try. Any throw — a constraint, a bug, a typo in the caller — lands
//  in the catch, which ROLLBACKs and then RETHROWS. Swallowing the error
//  there would be the worst of both worlds: nothing written, and nobody
//  told.
//  Why generic? Because "wrap these writes in a transaction" is not a
//  banking concern, it is a plumbing concern. transfer() then reads as
//  two UPDATEs, and the atomicity lives in one place you can test once.
//  The CHECK constraint is doing real work here. `balance >= 0` is an
//  invariant the DATABASE enforces, so no code path — not a new endpoint,
//  not a migration script, not a psql session at 3am — can leave an
//  account negative. Validating in JavaScript only protects the paths you
//  remembered to route through your validator.
//  The "connection still works afterwards" test is the one that catches
//  the classic bug. Forget the ROLLBACK and sqlite is still inside the
//  failed transaction: the next BEGIN throws "cannot start a transaction
//  within a transaction", and every later request on that connection
//  fails for a reason that has nothing to do with what it was doing.
//  Real systems add a third rule you cannot see here: keep transactions
//  SHORT. No HTTP calls, no user input, no sleeping while holding one —
//  an open transaction holds locks, and locks are how databases stall.

import { test, eq, ok, throws } from '../../_lib/check.js';
import { DatabaseSync } from 'node:sqlite';

// Provided: two accounts, ada with 100 and bob with 50.
function withDb(run) {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE accounts (
      id      TEXT PRIMARY KEY,
      balance INTEGER NOT NULL CHECK (balance >= 0)
    )
  `);
  const insert = db.prepare('INSERT INTO accounts (id, balance) VALUES (?, ?)');
  insert.run('ada', 100);
  insert.run('bob', 50);
  try {
    return run(db);
  } finally {
    db.close();
  }
}

const balanceOf = (db, id) =>
  db.prepare('SELECT balance FROM accounts WHERE id = ?').get(id).balance;
const totalMoney = (db) =>
  db.prepare('SELECT SUM(balance) AS total FROM accounts').get().total;

export function withTransaction(db, run) {
  db.exec('BEGIN');
  try {
    const result = run();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function transfer(db, fromId, toId, amount) {
  return withTransaction(db, () => {
    const move = db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?');
    move.run(-amount, fromId);
    move.run(amount, toId);
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a good transfer moves the money', () => {
  withDb((db) => {
    transfer(db, 'ada', 'bob', 30);
    eq(balanceOf(db, 'ada'), 70);
    eq(balanceOf(db, 'bob'), 80);
  });
});

test('money is neither created nor destroyed', () => {
  withDb((db) => {
    transfer(db, 'ada', 'bob', 30);
    transfer(db, 'bob', 'ada', 10);
    eq(totalMoney(db), 150);
  });
});

test('overdrawing throws — the CHECK constraint fires', () => {
  withDb((db) => {
    throws(() => transfer(db, 'ada', 'bob', 500), 'CHECK');
  });
});

test('a failed transfer leaves BOTH accounts untouched', () => {
  withDb((db) => {
    throws(() => transfer(db, 'ada', 'bob', 500));
    eq(balanceOf(db, 'ada'), 100, 'the debit must have been rolled back');
    eq(balanceOf(db, 'bob'), 50);
    eq(totalMoney(db), 150);
  });
});

test('the connection still works after a failed transfer', () => {
  withDb((db) => {
    throws(() => transfer(db, 'ada', 'bob', 500));
    transfer(db, 'ada', 'bob', 10); // would throw if ROLLBACK was skipped
    eq(balanceOf(db, 'bob'), 60);
  });
});

test('withTransaction returns what the callback returned', () => {
  withDb((db) => {
    const result = withTransaction(db, () => {
      db.prepare('INSERT INTO accounts VALUES (?, ?)').run('cleo', 5);
      return 'done';
    });
    eq(result, 'done');
    eq(balanceOf(db, 'cleo'), 5);
  });
});

test('withTransaction commits many writes as one unit', () => {
  withDb((db) => {
    withTransaction(db, () => {
      const insert = db.prepare('INSERT INTO accounts VALUES (?, ?)');
      insert.run('cleo', 5);
      insert.run('dana', 7);
    });
    eq(totalMoney(db), 162);
  });
});

test('withTransaction undoes every write when one fails', () => {
  withDb((db) => {
    throws(
      () =>
        withTransaction(db, () => {
          db.prepare('INSERT INTO accounts VALUES (?, ?)').run('cleo', 5);
          throw new Error('changed my mind');
        }),
      'changed my mind'
    );
    eq(totalMoney(db), 150);
    ok(!db.prepare('SELECT 1 FROM accounts WHERE id = ?').get('cleo'));
  });
});
