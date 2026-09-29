// ─────────────────────────────────────────────────────────────────────────
//  09 · copy a directory tree — SOLUTION                     ★★★ stretch
//  run: node 09-fs-copy-tree.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: mkdir(dest, { recursive: true }) is the first line of
//  every level, which buys three things at once — the top-level dest is
//  created, deep parents are created, and empty source directories get
//  reproduced because the recursive call still runs its own mkdir.
//  The count is returned by each level and summed by its caller, so the
//  number bubbles up without a shared mutable counter.
//  copyFile overwrites by default; pass fs.constants.COPYFILE_EXCL if you
//  ever want it to refuse instead. The classic wrong turn is readFile +
//  writeFile with an encoding — that corrupts every binary file you copy;
//  copyFile moves bytes and never guesses at text.

import { test, eq } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Provided: temp dir per test, a tree builder (string = file contents,
// null = empty directory) and a snapshot for comparing two trees.
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

async function makeTree(dir, spec) {
  for (const [rel, contents] of Object.entries(spec)) {
    const full = path.join(dir, ...rel.split('/'));
    await fs.mkdir(path.dirname(full), { recursive: true });
    if (contents === null) await fs.mkdir(full, { recursive: true });
    else await fs.writeFile(full, contents, 'utf8');
  }
}

async function snapshot(dir, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => (a.name < b.name ? -1 : 1));
  const lines = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      lines.push(`dir  ${rel}`);
      lines.push(...(await snapshot(full, rel)));
    } else {
      lines.push(`file ${rel} = ${await fs.readFile(full, 'utf8')}`);
    }
  }
  return lines;
}

export async function copyTree(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  let copied = 0;
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copied += await copyTree(from, to);
    } else if (entry.isFile()) {
      await fs.copyFile(from, to);
      copied += 1;
    }
  }
  return copied;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('copies a single top-level file', async () => {
  await withTempDir(async (dir) => {
    const src = path.join(dir, 'src');
    const dest = path.join(dir, 'dest');
    await makeTree(src, { 'a.txt': 'alpha' });
    await copyTree(src, dest);
    eq(await fs.readFile(path.join(dest, 'a.txt'), 'utf8'), 'alpha');
  });
});

test('creates the destination directory when it is missing', async () => {
  await withTempDir(async (dir) => {
    const src = path.join(dir, 'src');
    const dest = path.join(dir, 'nested', 'dest');
    await makeTree(src, { 'a.txt': 'alpha' });
    await copyTree(src, dest);
    eq((await fs.stat(dest)).isDirectory(), true);
  });
});

test('reproduces a nested tree exactly', async () => {
  await withTempDir(async (dir) => {
    const src = path.join(dir, 'src');
    const dest = path.join(dir, 'dest');
    await makeTree(src, {
      'app.js': 'main',
      'lib/util.js': 'helper',
      'lib/deep/core.js': 'core',
    });
    await copyTree(src, dest);
    eq(await snapshot(dest), await snapshot(src));
  });
});

test('keeps UTF-8 content intact', async () => {
  await withTempDir(async (dir) => {
    const src = path.join(dir, 'src');
    const dest = path.join(dir, 'dest');
    await makeTree(src, { 'hi.txt': 'café 👋 naïve' });
    await copyTree(src, dest);
    eq(await fs.readFile(path.join(dest, 'hi.txt'), 'utf8'), 'café 👋 naïve');
  });
});

test('returns the number of files copied', async () => {
  await withTempDir(async (dir) => {
    const src = path.join(dir, 'src');
    const dest = path.join(dir, 'dest');
    await makeTree(src, {
      'a.txt': '1',
      'sub/b.txt': '2',
      'sub/deeper/c.txt': '3',
      'sub/empty': null,
    });
    eq(await copyTree(src, dest), 3);
  });
});

test('copies empty directories too', async () => {
  await withTempDir(async (dir) => {
    const src = path.join(dir, 'src');
    const dest = path.join(dir, 'dest');
    await makeTree(src, { 'logs': null, 'keep/me': null });
    eq(await copyTree(src, dest), 0);
    eq(await snapshot(dest), ['dir  keep', 'dir  keep/me', 'dir  logs']);
  });
});

test('overwrites a file that already exists in the destination', async () => {
  await withTempDir(async (dir) => {
    const src = path.join(dir, 'src');
    const dest = path.join(dir, 'dest');
    await makeTree(src, { 'a.txt': 'new' });
    await makeTree(dest, { 'a.txt': 'old', 'own.txt': 'mine' });
    await copyTree(src, dest);
    eq(await fs.readFile(path.join(dest, 'a.txt'), 'utf8'), 'new');
    eq(await fs.readFile(path.join(dest, 'own.txt'), 'utf8'), 'mine');
  });
});
