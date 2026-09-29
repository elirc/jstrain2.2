// ─────────────────────────────────────────────────────────────────────────
//  08 · walk a directory tree                                ★★★ stretch
//  concepts: async recursion · readdir · Dirent
//  run: node 08-fs-walk.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "Find every file under here" is the backbone of linters, bundlers and
//  backup scripts. readdir only shows one level, so you recurse.
//
//  Given a tree:   src/app.js, src/lib/util.js, docs/readme.md
//
//      await walkFiles(root)      → ['docs/readme.md',
//                                    'src/app.js',
//                                    'src/lib/util.js']
//      await countExtensions(root) → { '.md': 1, '.js': 2 }
//
//  walkFiles returns paths RELATIVE to `root`, always joined with '/' so
//  the result reads the same on every OS, and sorted. Directories are not
//  listed — only files. countExtensions is built on walkFiles; a file
//  with no extension is counted under the key ''.
//
//  hint: an inner helper carrying (absoluteDir, relativePrefix) keeps the
//  recursion honest — build the relative path as you descend, not after.

import { test, eq } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Provided: temp dir per test + a tiny tree builder. In the spec object a
// string value means "file with these contents", null means "empty dir".
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

export async function walkFiles(root) {
  throw new Error('TODO');
}

export async function countExtensions(root) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('lists the files at the top level', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, { 'a.txt': 'a', 'b.txt': 'b' });
    eq(await walkFiles(dir), ['a.txt', 'b.txt']);
  });
});

test('descends into subdirectories', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, {
      'src/app.js': '',
      'src/lib/util.js': '',
      'docs/readme.md': '',
    });
    eq(await walkFiles(dir), ['docs/readme.md', 'src/app.js', 'src/lib/util.js']);
  });
});

test('paths are relative to the root and use forward slashes', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, { 'src/lib/util.js': '' });
    eq(await walkFiles(dir), ['src/lib/util.js']);
  });
});

test('directories themselves are never listed', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, { 'empty': null, 'src/deep': null, 'src/app.js': '' });
    eq(await walkFiles(dir), ['src/app.js']);
  });
});

test('an empty directory yields an empty list', async () => {
  await withTempDir(async (dir) => {
    eq(await walkFiles(dir), []);
  });
});

test('handles a three-level tree', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, {
      'a/b/c/deep.txt': 'x',
      'a/b/mid.txt': 'x',
      'a/top.txt': 'x',
    });
    eq(await walkFiles(dir), ['a/b/c/deep.txt', 'a/b/mid.txt', 'a/top.txt']);
  });
});

test('countExtensions tallies the whole tree', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, {
      'src/app.js': '',
      'src/lib/util.js': '',
      'docs/readme.md': '',
      'LICENSE': '',
    });
    eq(await countExtensions(dir), { '.js': 2, '.md': 1, '': 1 });
  });
});
