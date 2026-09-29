// ─────────────────────────────────────────────────────────────────────────
//  18 · the lock that lets everyone in                          ★★☆ core
//  concepts: bug hunt · try/finally · return await
//  run: node 18-cleanup-before-await.js
// ─────────────────────────────────────────────────────────────────────────
//
//  withLock(lock, fn) is the mutex wrapper the sync jobs run through:
//  take the lock, run the job, ALWAYS hand the lock back — even when the
//  job throws. Jobs wrapped in the same lock must never overlap:
//
//      withLock(lock, syncInvoices)   → 'start … end' before the next
//      withLock(lock, syncPayments)   → 'start … end', strictly after
//
//  Since the wrapper shipped, the nightly sync logs show invoices and
//  payments running interleaved — the exact thing the lock exists to
//  prevent. The lock code itself (makeLock) has been audited and is fine.
//
//  The code below is fully written — and wrong. 2 tests fail. Find the
//  bug, fix it with the smallest change. Don't rewrite.
//
//  hint: add a log line right before `lock.release()` and one at the end
//  of a slow job, then look at which prints first. `finally` runs when
//  the try block FINISHES — the question is what counts as finished.

import { test, eq, ok } from '../../_lib/check.js';
import { sleep } from '../../_lib/check.js';

export async function withLock(lock, fn) {
  await lock.acquire();
  try {
    return fn();
  } finally {
    lock.release();
  }
}

// ── provided: a working FIFO lock (audited — the bug is not in here) ─────
export function makeLock() {
  const waiters = [];
  const lock = {
    held: false,
    async acquire() {
      if (!lock.held) {
        lock.held = true;
        return;
      }
      await new Promise((resolve) => waiters.push(resolve));
    },
    release() {
      const next = waiters.shift();
      if (next) next(); // hand off: the lock stays held by the next waiter
      else lock.held = false;
    },
  };
  return lock;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves with whatever the job returns', async () => {
  const lock = makeLock();
  const value = await withLock(lock, async () => {
    await sleep(5);
    return 42;
  });
  eq(value, 42);
});

test('the lock is held while the job runs', async () => {
  const lock = makeLock();
  await withLock(lock, async () => {
    ok(lock.held, 'expected the lock to be held inside the job');
    await sleep(5);
  });
});

test('two jobs on one lock never overlap', async () => {
  const lock = makeLock();
  const log = [];
  const job = (name, ms) => async () => {
    log.push(`${name}:start`);
    await sleep(ms);
    log.push(`${name}:end`);
  };
  await Promise.all([
    withLock(lock, job('invoices', 30)),
    withLock(lock, job('payments', 5)),
  ]);
  eq(log, ['invoices:start', 'invoices:end', 'payments:start', 'payments:end']);
});

test('the lock is handed back only AFTER the job has finished', async () => {
  const lock = makeLock();
  const log = [];
  const release = lock.release;
  lock.release = () => {
    log.push('released');
    release();
  };
  await withLock(lock, async () => {
    await sleep(20);
    log.push('work done');
  });
  eq(log, ['work done', 'released']);
});

test('a job that throws still hands the lock back', async () => {
  const lock = makeLock();
  await withLock(lock, async () => {
    throw new Error('sync exploded');
  }).catch(() => {});
  await sleep(5);
  eq(lock.held, false);
});
