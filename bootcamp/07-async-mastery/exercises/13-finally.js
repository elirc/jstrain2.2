// ─────────────────────────────────────────────────────────────────────────
//  13 · runQuery (.finally cleanup)                        ★★☆ core
//  concepts: .finally · cleanup · pass-through semantics
//  run: node 13-finally.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Cleanup that must happen whether the work succeeded or blew up.
//
//      await runQuery('SELECT 1')  → [{ id: 1 }]   and the conn is closed
//      await runQuery('DROP db')   → rejects       and the conn is closed
//
//  Open a connection, run execute(sql), and close the connection in a
//  .finally. Do not swallow the error and do not change the value:
//  .finally is for side effects only. Its handler gets no arguments, and
//  whatever it returns is ignored — the original outcome passes through.
//
//  hint: `.finally(() => closeConnection())` sits at the end of the chain

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
  throw new Error('TODO');
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
