// ─────────────────────────────────────────────────────────────────────────
//  13 · an exclusive lockfile — SOLUTION                     ★★★ stretch
//  run: node 13-lockfile.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole lock is one flag. `wx` is O_CREAT | O_EXCL, and
//  the kernel guarantees that among any number of racing processes exactly
//  one creation succeeds — the others get EEXIST. `if (exists) write()` is
//  the broken version of this: two processes can both pass the check
//  before either writes. Check-then-act is not atomic; create-or-fail is.
//  Storing { pid, at } is what makes the lock diagnosable and recoverable.
//  A crashed holder never releases, so without a staleness rule your tool
//  is bricked until someone deletes a hidden file. With it, a lock older
//  than staleMs is removed and re-created — note that the re-create still
//  uses `wx`, so if two processes both spot the stale lock, only one wins
//  the steal.
//  `now` being injectable is the only reason the stale test can run
//  instantly instead of sleeping 30 seconds. Take the clock as a
//  parameter whenever time is part of the logic — it is the cheapest
//  testability win there is.
//  This is package-manager and editor behaviour: npm's own lock, .git/
//  index.lock, and `proper-lockfile` on npm are all this pattern. The
//  real limit: locks are advisory. They only work if every writer agrees
//  to ask.

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
  const { pid = process.pid, now = Date.now, staleMs = 30_000 } = options;
  const file = lockPath(dir);
  const payload = JSON.stringify({ pid, at: now() });

  try {
    await fs.writeFile(file, payload, { flag: 'wx' }); // create-or-fail
    return file;
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  const held = await readLock(dir);
  const age = held === null ? Infinity : now() - held.at;
  if (age <= staleMs) {
    throw new Error(
      `lock ${file} is held by pid ${held.pid} (${age}ms old); ` +
        'wait for it, or remove the file if that process is gone'
    );
  }

  // stale: drop it and race for the lock again, still exclusively
  await fs.rm(file, { force: true, maxRetries: 5 });
  await fs.writeFile(file, payload, { flag: 'wx' });
  return file;
}

export async function releaseLock(dir) {
  await fs.rm(lockPath(dir), { force: true, maxRetries: 5 });
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
