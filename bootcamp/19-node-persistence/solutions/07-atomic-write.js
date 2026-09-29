// ─────────────────────────────────────────────────────────────────────────
//  07 · atomic file writes — SOLUTION                        ★★★ stretch
//  run: node 07-atomic-write.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: why rename? A directory entry is a name pointing at an
//  inode. `rename` within one directory rewrites that pointer — one
//  metadata operation the filesystem journals as a unit. There is no
//  moment where the name exists but points at half a file, so a reader
//  either gets the old contents or the new ones, never a truncated mix.
//  `writeFile` has no such property: it opens with O_TRUNC, and the empty
//  window between truncate and write is exactly where crashes live.
//  Two rules make it work: the temp must be in the SAME directory (a
//  rename across filesystems is a copy, and fails with EXDEV), and the
//  temp name must be unique so two writers cannot share one.
//  Note the order in writeJsonAtomic: stringify BEFORE going near the
//  disk. A circular object then throws while the old file is still whole.
//  Serialize-into-the-open-file is how people lose config.
//  You have seen this pattern: npm writes package-lock.json this way,
//  every editor saves this way, and `write-file-atomic` on npm is 100
//  lines of exactly this. Full durability additionally needs an fsync of
//  the file and of its directory — see the README.

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
  const tmp = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(tmp, data);
    await fs.rename(tmp, file);
  } catch (err) {
    await fs.rm(tmp, { force: true, maxRetries: 5 });
    throw err;
  }
  return file;
}

export async function writeJsonAtomic(file, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`; // may throw — before any I/O
  return writeFileAtomic(file, text);
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
