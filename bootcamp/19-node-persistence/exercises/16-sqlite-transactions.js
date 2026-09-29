// ─────────────────────────────────────────────────────────────────────────
//  16 · transactions: all or nothing                        ★★★ stretch
//  concepts: BEGIN/COMMIT/ROLLBACK · invariants · atomicity
//  run: node 16-sqlite-transactions.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A transfer is two writes: take 100 from A, give 100 to B. If the
//  second one fails, the first must not stand — money cannot evaporate
//  because a CHECK constraint fired halfway through. That guarantee has a
//  name and three keywords:
//
//      db.exec('BEGIN');       // everything after this is provisional
//      ...writes...
//      db.exec('COMMIT');      // all of it, at once
//      db.exec('ROLLBACK');    // none of it, ever
//
//  Build two things over accounts(id TEXT PRIMARY KEY, balance INTEGER
//  NOT NULL CHECK (balance >= 0)):
//
//    · withTransaction(db, run)          BEGIN, run(), COMMIT — and on any
//                                        throw, ROLLBACK and rethrow.
//                                        Returns whatever run() returned.
//    · transfer(db, from, to, amount)    debit then credit, inside one
//                                        transaction
//
//  The rollback is not optional politeness. Leave a transaction open and
//  the NEXT BEGIN on that connection fails with "cannot start a
//  transaction within a transaction" — one bad request poisons every
//  request after it.
//
//  hint: try / catch / rethrow. Put the COMMIT as the last line of the
//  try block, and nothing else after it.

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
  throw new Error('TODO');
}

export function transfer(db, fromId, toId, amount) {
  throw new Error('TODO');
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
