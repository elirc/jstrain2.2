// ─────────────────────────────────────────────────────────────────────────
//  24 · diff two directory trees                            ★★★ stretch
//  concepts: stat · size + mtime · set arithmetic
//  run: node 24-fs-dir-diff.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Backup tools, deploy scripts and file watchers all ask the same
//  question: what is different between these two trees? Hashing every
//  byte is correct but slow, so the cheap answer everyone ships is
//  "same size AND same mtime = unchanged".
//
//      await diffTrees(oldDir, newDir)
//        → { added:     ['docs/new.md'],
//            removed:   ['old.txt'],
//            changed:   ['src/app.js'],
//            unchanged: ['README.md'] }
//
//  Every list holds paths RELATIVE to its root, joined with '/', sorted.
//  A file is `added` when only the right tree has it, `removed` when only
//  the left does, `changed` when both have it but the size or the mtime
//  differs, `unchanged` otherwise. Compare files only — directories never
//  appear in any list.
//
//  hint: build one Map of rel → { size, mtimeMs } per tree first, then
//  the diff is set arithmetic over two Maps instead of two walks.

import { test, eq, ok } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Provided: temp dir per test, plus a tree builder (string = file
// contents, null = empty directory) that stamps every file it writes
// with a fixed mtime — otherwise "now" would differ per machine and the
// tests could not talk about mtimes at all.
const TMP_ROOT = path.join(import.meta.dirname, '..', 'tmp-test');
const T0 = 1_700_000_000; // seconds since the epoch

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

async function makeTree(dir, spec, mtime = T0) {
  for (const [rel, contents] of Object.entries(spec)) {
    const full = path.join(dir, ...rel.split('/'));
    await fs.mkdir(path.dirname(full), { recursive: true });
    if (contents === null) {
      await fs.mkdir(full, { recursive: true });
    } else {
      await fs.writeFile(full, contents, 'utf8');
      await fs.utimes(full, mtime, mtime);
    }
  }
}

export async function diffTrees(leftRoot, rightRoot) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('identical trees are all unchanged', async () => {
  await withTempDir(async (dir) => {
    const left = path.join(dir, 'left');
    const right = path.join(dir, 'right');
    await makeTree(left, { 'README.md': 'hi', 'src/app.js': 'x' });
    await makeTree(right, { 'README.md': 'hi', 'src/app.js': 'x' });
    eq(await diffTrees(left, right), {
      added: [],
      removed: [],
      changed: [],
      unchanged: ['README.md', 'src/app.js'],
    });
  });
});

test('a file only on the right is added', async () => {
  await withTempDir(async (dir) => {
    const left = path.join(dir, 'left');
    const right = path.join(dir, 'right');
    await makeTree(left, { 'a.txt': '1' });
    await makeTree(right, { 'a.txt': '1', 'docs/new.md': '2' });
    const diff = await diffTrees(left, right);
    eq(diff.added, ['docs/new.md']);
    eq(diff.removed, []);
  });
});

test('a file only on the left is removed', async () => {
  await withTempDir(async (dir) => {
    const left = path.join(dir, 'left');
    const right = path.join(dir, 'right');
    await makeTree(left, { 'a.txt': '1', 'old.txt': '2' });
    await makeTree(right, { 'a.txt': '1' });
    const diff = await diffTrees(left, right);
    eq(diff.removed, ['old.txt']);
    eq(diff.added, []);
  });
});

test('same size but a newer mtime counts as changed', async () => {
  await withTempDir(async (dir) => {
    const left = path.join(dir, 'left');
    const right = path.join(dir, 'right');
    await makeTree(left, { 'app.js': 'aaa' });
    await makeTree(right, { 'app.js': 'bbb' }, T0 + 500);
    const diff = await diffTrees(left, right);
    eq(diff.changed, ['app.js']);
    eq(diff.unchanged, []);
  });
});

test('same mtime but a different size counts as changed', async () => {
  await withTempDir(async (dir) => {
    const left = path.join(dir, 'left');
    const right = path.join(dir, 'right');
    await makeTree(left, { 'app.js': 'short' });
    await makeTree(right, { 'app.js': 'much longer contents' });
    eq((await diffTrees(left, right)).changed, ['app.js']);
  });
});

test('nested paths are relative and use forward slashes', async () => {
  await withTempDir(async (dir) => {
    const left = path.join(dir, 'left');
    const right = path.join(dir, 'right');
    await makeTree(left, { 'src/lib/util.js': 'v1' });
    await makeTree(right, { 'src/lib/util.js': 'v2 longer' });
    eq((await diffTrees(left, right)).changed, ['src/lib/util.js']);
  });
});

test('directories never show up in the diff', async () => {
  await withTempDir(async (dir) => {
    const left = path.join(dir, 'left');
    const right = path.join(dir, 'right');
    await makeTree(left, { 'keep': null });
    await makeTree(right, { 'keep': null, 'logs': null });
    eq(await diffTrees(left, right), {
      added: [],
      removed: [],
      changed: [],
      unchanged: [],
    });
  });
});

test('every file lands in exactly one bucket', async () => {
  await withTempDir(async (dir) => {
    const left = path.join(dir, 'left');
    const right = path.join(dir, 'right');
    await makeTree(left, { 'same.txt': 'x', 'gone.txt': 'y', 'edit.txt': 'a' });
    await makeTree(right, { 'same.txt': 'x', 'new.txt': 'z' });
    await makeTree(right, { 'edit.txt': 'a' }, T0 + 60);
    const diff = await diffTrees(left, right);
    eq(diff, {
      added: ['new.txt'],
      removed: ['gone.txt'],
      changed: ['edit.txt'],
      unchanged: ['same.txt'],
    });
    const all = [...diff.added, ...diff.removed, ...diff.changed, ...diff.unchanged];
    ok(new Set(all).size === all.length);
  });
});
