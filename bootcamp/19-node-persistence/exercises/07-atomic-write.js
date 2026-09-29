// ─────────────────────────────────────────────────────────────────────────
//  07 · atomic file writes                                  ★★★ stretch
//  concepts: rename · durability · crash safety
//  run: node 07-atomic-write.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `fs.writeFile` on an existing file truncates it to zero bytes and then
//  writes. Crash in between — or run out of disk, or throw while building
//  the string — and the user's config file is now empty. Forever.
//
//  The fix is one line of thinking: never write over live data. Write a
//  temporary file beside it, then RENAME the temp over the target. A
//  rename within one directory swaps the name in one filesystem
//  operation: readers see either the whole old file or the whole new one.
//
//      writeFileAtomic(file, 'v2')   // tmp file → rename → done
//      writeJsonAtomic(file, value)  // stringify FIRST, then write
//
//  Requirements:
//    · the temp file goes in the SAME directory as the target
//    · no temp file is left behind, on success or on failure
//    · if serializing throws, the existing file is untouched
//    · writeFileAtomic returns the target path
//
//  hint: `${file}.${randomUUID()}.tmp` for the temp name, and wrap the
//  write+rename in try/catch so a failure can unlink the temp before it
//  rethrows.

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

export async function writeFileAtomic(file, data) {
  throw new Error('TODO');
}

export async function writeJsonAtomic(file, value) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('creates a file that did not exist', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'config.json');
    eq(await writeFileAtomic(file, 'hello'), file);
    eq(await fs.readFile(file, 'utf8'), 'hello');
  });
});

test('replaces the contents of an existing file', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'config.json');
    await fs.writeFile(file, 'v1', 'utf8');
    await writeFileAtomic(file, 'v2');
    eq(await fs.readFile(file, 'utf8'), 'v2');
  });
});

test('leaves no temp files behind', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'config.json');
    await writeFileAtomic(file, 'a');
    await writeFileAtomic(file, 'b');
    await writeFileAtomic(file, 'c');
    eq(await fs.readdir(dir), ['config.json']);
  });
});

test('writeJsonAtomic round trips a value', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'db.json');
    await writeJsonAtomic(file, { users: ['ada'], hits: 2 });
    eq(JSON.parse(await fs.readFile(file, 'utf8')), { users: ['ada'], hits: 2 });
  });
});

test('a value that cannot be serialized rejects', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'db.json');
    const circular = { name: 'loop' };
    circular.self = circular;
    await rejects(() => writeJsonAtomic(file, circular));
  });
});

test('a failed write leaves the previous file byte-for-byte intact', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'db.json');
    await writeJsonAtomic(file, { good: true });
    const before = await fs.readFile(file, 'utf8');
    const circular = { name: 'loop' };
    circular.self = circular;
    await rejects(() => writeJsonAtomic(file, circular));
    eq(await fs.readFile(file, 'utf8'), before);
    ok(before.length > 0, 'the old file must not be truncated');
  });
});

test('a failed write leaves no temp file either', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'db.json');
    await writeJsonAtomic(file, { good: true });
    const circular = {};
    circular.self = circular;
    await rejects(() => writeJsonAtomic(file, circular));
    eq(await fs.readdir(dir), ['db.json']);
  });
});

test('writes into a directory that does not exist reject loudly', async () => {
  await withTempDir(async (dir) => {
    await rejects(() => writeFileAtomic(path.join(dir, 'nope', 'a.txt'), 'x'));
    eq(await fs.readdir(dir), []);
  });
});
