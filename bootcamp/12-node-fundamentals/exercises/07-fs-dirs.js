// ─────────────────────────────────────────────────────────────────────────
//  07 · directories                                           ★★☆ core
//  concepts: mkdir recursive · stat vs access · readdir withFileTypes
//  run: node 07-fs-dirs.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three chores that show up in every script that touches the disk.
//
//      await pathExists(p)             → true / false, never throws for
//                                        a plain "not there"
//      await ensureDir('a/b/c')        → creates the whole chain, returns
//                                        the dir, fine to call twice
//      await listByExtension(dir, 'txt')
//                                      → ['notes.txt', 'todo.txt'] sorted
//
//  listByExtension takes 'txt' or '.txt', ignores case ('README.TXT'
//  counts), returns file NAMES not full paths, and skips directories —
//  including a directory that happens to be called 'archive.txt'.
//
//  hint: readdir(dir, { withFileTypes: true }) gives you Dirent objects
//  with .name and .isFile(); one call instead of a stat per entry.

import { test, eq } from '../../_lib/check.js';
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
    await fs.rm(dir, { recursive: true, force: true, maxRetries: 3 });
    await fs.rmdir(TMP_ROOT).catch(() => {});
  }
}

export async function pathExists(target) {
  throw new Error('TODO');
}

export async function ensureDir(dir) {
  throw new Error('TODO');
}

export async function listByExtension(dir, ext) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('pathExists is false for something that is not there', async () => {
  await withTempDir(async (dir) => {
    eq(await pathExists(path.join(dir, 'nope.txt')), false);
  });
});

test('pathExists is true for a file and for a directory', async () => {
  await withTempDir(async (dir) => {
    await fs.writeFile(path.join(dir, 'a.txt'), 'x', 'utf8');
    eq(await pathExists(path.join(dir, 'a.txt')), true);
    eq(await pathExists(dir), true);
  });
});

test('ensureDir creates a nested chain in one call', async () => {
  await withTempDir(async (dir) => {
    const deep = path.join(dir, 'a', 'b', 'c');
    eq(await ensureDir(deep), deep);
    const stats = await fs.stat(deep);
    eq(stats.isDirectory(), true);
  });
});

test('ensureDir on an existing directory is a no-op', async () => {
  await withTempDir(async (dir) => {
    const target = path.join(dir, 'cache');
    await ensureDir(target);
    await fs.writeFile(path.join(target, 'keep.txt'), 'x', 'utf8');
    await ensureDir(target);
    eq(await fs.readFile(path.join(target, 'keep.txt'), 'utf8'), 'x');
  });
});

test('listByExtension returns matching names, sorted', async () => {
  await withTempDir(async (dir) => {
    await fs.writeFile(path.join(dir, 'todo.txt'), '', 'utf8');
    await fs.writeFile(path.join(dir, 'notes.txt'), '', 'utf8');
    await fs.writeFile(path.join(dir, 'app.js'), '', 'utf8');
    eq(await listByExtension(dir, '.txt'), ['notes.txt', 'todo.txt']);
  });
});

test('listByExtension skips directories, even file-shaped ones', async () => {
  await withTempDir(async (dir) => {
    await fs.writeFile(path.join(dir, 'real.txt'), '', 'utf8');
    await fs.mkdir(path.join(dir, 'archive.txt'));
    eq(await listByExtension(dir, '.txt'), ['real.txt']);
  });
});

test('listByExtension ignores case and an optional leading dot', async () => {
  await withTempDir(async (dir) => {
    await fs.writeFile(path.join(dir, 'README.TXT'), '', 'utf8');
    await fs.writeFile(path.join(dir, 'a.txt'), '', 'utf8');
    eq(await listByExtension(dir, 'txt'), ['README.TXT', 'a.txt']);
    eq(await listByExtension(dir, '.TXT'), ['README.TXT', 'a.txt']);
  });
});
