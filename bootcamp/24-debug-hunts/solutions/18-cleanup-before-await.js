// ─────────────────────────────────────────────────────────────────────────
//  18 · the lock that lets everyone in — SOLUTION               ★★☆ core
//  concepts: bug hunt · try/finally · return await
//  run: node 18-cleanup-before-await.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Bug class: cleanup before the await — `return fn()` inside try/finally.
//  A `finally` runs when the try block finishes, and `return fn()`
//  finishes the block the moment fn HANDS BACK ITS PROMISE — not when the
//  work inside that promise completes. So the lock was released while the
//  job was still running, and the next job walked straight in.
//  The tell: an async wrapper whose try block returns a bare promise. If
//  cleanup must wait for the work, the block has to WAIT for the work —
//  `return await fn()`.
//  The minimal fix is that one word: `return await fn();`. This is the
//  documented exception to the "no return await" lint rule — inside
//  try/catch/finally the await is load-bearing, everywhere else it's
//  noise.
//  In the wild: DB connections returned to the pool mid-query, spinners
//  hidden before the upload finishes, temp dirs deleted under a job that
//  is still writing to them.

import { test, eq, ok } from '../../_lib/check.js';
import { sleep } from '../../_lib/check.js';

export async function withLock(lock, fn) {
  await lock.acquire();
  try {
    return await fn();
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
