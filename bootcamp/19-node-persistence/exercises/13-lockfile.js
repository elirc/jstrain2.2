// ─────────────────────────────────────────────────────────────────────────
//  13 · an exclusive lockfile                               ★★★ stretch
//  concepts: O_EXCL · mutual exclusion · stale locks · injected clock
//  run: node 13-lockfile.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two copies of your CLI compacting the same log at once will corrupt
//  it. You cannot fix that with `if (exists) throw` — between the check
//  and the write, the other process runs. You need one operation that
//  both tests and creates, and the filesystem has one: the `wx` flag
//  (O_CREAT | O_EXCL) fails with EEXIST if the file already exists.
//
//      await acquireLock(dir)   → the lock file's path
//      await acquireLock(dir)   → throws: already held by pid 1234
//      await releaseLock(dir)   → gone, next acquire succeeds
//
//  A crashed process leaves its lock behind forever, so the file records
//  { pid, at } and a lock older than `staleMs` may be stolen.
//
//  acquireLock(dir, options) — every option has a default:
//      pid      the process id to record            (default process.pid)
//      now      () => milliseconds, injectable      (default Date.now)
//      staleMs  how old a lock may get before it is stealable (30000)
//
//  The error thrown when the lock is held must name the holding pid —
//  "resource busy" at 2am is not a debuggable message.
//
//  hint: fs.writeFile(file, data, { flag: 'wx' }) and catch err.code ===
//  'EEXIST'. On a stale lock, remove the file and try to create it once
//  more — do not just overwrite it.

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Provided: each test gets its own empty directory, deleted afterwards.
const TMP_ROOT = path.join(import.meta.dirname, '..', 'tmp-test');

async function withTempDir(run) {
  const dir = path.join(TMP_ROOT, randomUUID());
  await fs.mkdir(dir, { recursive: true });
  try {
    return await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true, maxRetries: 5 });
  }
}

// Provided: where the lock lives, and how to read it.
export const lockPath = (dir) => path.join(dir, '.lock');

export async function readLock(dir) {
  try {
    return JSON.parse(await fs.readFile(lockPath(dir), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function acquireLock(dir, options = {}) {
  throw new Error('TODO');
}

export async function releaseLock(dir) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('acquiring writes a lock file holding the pid and the time', async () => {
  await withTempDir(async (dir) => {
    const file = await acquireLock(dir, { pid: 4242, now: () => 1_000 });
    eq(file, lockPath(dir));
    eq(await readLock(dir), { pid: 4242, at: 1_000 });
  });
});

test('a second acquire while held rejects', async () => {
  await withTempDir(async (dir) => {
    await acquireLock(dir, { pid: 4242, now: () => 1_000 });
    await rejects(() => acquireLock(dir, { pid: 7, now: () => 1_100 }));
  });
});

test('the error names the process that is holding it', async () => {
  await withTempDir(async (dir) => {
    await acquireLock(dir, { pid: 4242, now: () => 1_000 });
    await rejects(() => acquireLock(dir, { pid: 7, now: () => 1_100 }), '4242');
  });
});

test('a held lock is never overwritten by the loser', async () => {
  await withTempDir(async (dir) => {
    await acquireLock(dir, { pid: 4242, now: () => 1_000 });
    await rejects(() => acquireLock(dir, { pid: 7, now: () => 1_100 }));
    eq(await readLock(dir), { pid: 4242, at: 1_000 });
  });
});

test('releasing lets the next process in', async () => {
  await withTempDir(async (dir) => {
    await acquireLock(dir, { pid: 4242, now: () => 1_000 });
    await releaseLock(dir);
    eq(await readLock(dir), null);
    await acquireLock(dir, { pid: 7, now: () => 2_000 });
    eq((await readLock(dir)).pid, 7);
  });
});

test('releasing when nothing is locked is not an error', async () => {
  await withTempDir(async (dir) => {
    await releaseLock(dir);
    eq(await readLock(dir), null);
  });
});

test('a lock older than staleMs can be stolen', async () => {
  await withTempDir(async (dir) => {
    await acquireLock(dir, { pid: 4242, now: () => 1_000, staleMs: 30_000 });
    const file = await acquireLock(dir, {
      pid: 7,
      now: () => 1_000 + 30_001,
      staleMs: 30_000,
    });
    eq(file, lockPath(dir));
    eq(await readLock(dir), { pid: 7, at: 31_001 });
  });
});

test('a lock that is merely recent is not stolen', async () => {
  await withTempDir(async (dir) => {
    await acquireLock(dir, { pid: 4242, now: () => 1_000, staleMs: 30_000 });
    await rejects(
      () => acquireLock(dir, { pid: 7, now: () => 29_000, staleMs: 30_000 }),
      '4242'
    );
    ok((await readLock(dir)).pid === 4242);
  });
});
