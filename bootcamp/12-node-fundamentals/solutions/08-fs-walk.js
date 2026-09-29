// ─────────────────────────────────────────────────────────────────────────
//  08 · walk a directory tree — SOLUTION                     ★★★ stretch
//  run: node 08-fs-walk.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the recursion carries two things — where we are on disk
//  (an absolute path, built with path.join so it is valid on Windows) and
//  where we are logically (a '/'-joined prefix for the result). Keeping
//  them separate is what makes the output platform-independent without a
//  cleanup pass at the end.
//  `await` inside a for...of loop is deliberate here: it walks one branch
//  at a time and keeps the output order predictable. The classic wrong
//  turn is `entries.forEach(async ...)` — forEach ignores the promises,
//  so the function returns an empty array before any of them finish.
//  Only entry.isFile() is pushed; a symlink or a socket is neither file
//  nor directory and is skipped rather than silently listed.

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
  const found = [];

  async function visit(dir, prefix) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await visit(path.join(dir, entry.name), rel);
      else if (entry.isFile()) found.push(rel);
    }
  }

  await visit(root, '');
  return found.sort();
}

export async function countExtensions(root) {
  const counts = {};
  for (const rel of await walkFiles(root)) {
    const ext = path.extname(rel).toLowerCase();
    counts[ext] = (counts[ext] ?? 0) + 1;
  }
  return counts;
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
