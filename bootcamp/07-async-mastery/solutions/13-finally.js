// ─────────────────────────────────────────────────────────────────────────
//  13 · runQuery (.finally cleanup) — SOLUTION             ★★☆ core
//  run: node 13-finally.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `.finally(cb)` runs cb on both paths and then re-emits
//  the original settlement — value stays the value, rejection stays the
//  rejection. That is the promise version of try/finally, and it is the
//  only clean place to release a resource in a chain.
//  Note the two things it deliberately does not do: it does not receive
//  the value (so you cannot inspect it) and it does not replace the
//  result with what cb returns (closeConnection's 'closed!' is dropped).
//  The exception: if cb itself throws or returns a rejecting promise,
//  that failure DOES take over — cleanup errors are not silent.
//  Wrong turn: `.then(close, close)` duplicates the callback and
//  accidentally converts the rejection into a fulfilled value.

import { test, eq, ok, rejects } from '../../_lib/check.js';

export const conn = { opened: 0, closed: 0 };

export function openConnection() {
  conn.opened += 1;
  return 'conn';
}

export function closeConnection() {
  conn.closed += 1;
  return 'closed!';
}

export function execute(sql) {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (sql.startsWith('SELECT')) resolve([{ id: 1 }]);
      else reject(new Error(`bad sql: ${sql}`));
    }, 5)
  );
}

const reset = () => {
  conn.opened = 0;
  conn.closed = 0;
};

export function runQuery(sql) {
  openConnection();
  return execute(sql).finally(() => closeConnection());
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves with the rows', async () => {
  reset();
  eq(await runQuery('SELECT 1'), [{ id: 1 }]);
});

test('opens exactly one connection', async () => {
  reset();
  await runQuery('SELECT 1');
  eq(conn.opened, 1);
});

test('closes the connection on success', async () => {
  reset();
  await runQuery('SELECT 1');
  eq(conn.closed, 1);
});

test('closes the connection on failure too', async () => {
  reset();
  await rejects(runQuery('DROP db'), 'bad sql');
  eq(conn.closed, 1);
});

test('does not swallow the rejection', async () => {
  reset();
  const outcome = await runQuery('DROP db').then(
    () => 'resolved',
    (e) => e.message
  );
  eq(outcome, 'bad sql: DROP db');
});

test('does not replace the value with the cleanup result', async () => {
  reset();
  const rows = await runQuery('SELECT 1');
  ok(rows !== 'closed!', '.finally must not change the resolved value');
});
