// ─────────────────────────────────────────────────────────────────────────
//  25 · a du-style size report                                 ★★☆ core
//  concepts: stat().size · roll-up recursion · formatting
//  run: node 25-fs-du-report.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `du` answers "where did my disk go?" by charging every file to every
//  directory above it. The recursion returns a number so each level can
//  add up its children instead of walking the tree again per directory.
//
//      await dirSizes(root)
//        → { '.': 4200, 'src': 3000, 'src/lib': 1200, 'docs': 1200 }
//
//      formatBytes(512)      → '512 B'
//      formatBytes(1536)     → '1.5 KB'
//      formatBytes(1048576)  → '1.0 MB'
//
//  Every directory in the tree gets a key — the root is '.', the rest are
//  relative paths joined with '/'. The number is the total bytes of every
//  file underneath, however deep. formatBytes steps through B, KB, MB, GB
//  in 1024s: under 1024 it prints a whole number of bytes, above it one
//  decimal place.
//
//  hint: have the walker RETURN the bytes it found and write to the
//  report on the way back up — one pass, no second walk per directory.

import { test, eq } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Provided: temp dir per test + a tree builder (string = file contents,
// null = empty directory). Contents are written as UTF-8, so the byte
// count of a file is Buffer.byteLength of its string.
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

export async function dirSizes(root) {
  throw new Error('TODO');
}

export function formatBytes(bytes) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('totals the files sitting in the root', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, { 'a.txt': 'aaa', 'b.txt': 'bb' });
    eq(await dirSizes(dir), { '.': 5 });
  });
});

test('reports every directory by its relative path', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, { 'src/app.js': 'xxxx', 'docs/readme.md': 'yy' });
    eq(await dirSizes(dir), { '.': 6, 'docs': 2, 'src': 4 });
  });
});

test('child bytes roll up through every level', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, {
      'top.txt': 'a',
      'src/mid.txt': 'bb',
      'src/lib/deep.txt': 'cccc',
    });
    eq(await dirSizes(dir), { '.': 7, 'src': 6, 'src/lib': 4 });
  });
});

test('an empty directory is reported as 0', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, { 'logs': null, 'a.txt': 'aa' });
    eq(await dirSizes(dir), { '.': 2, 'logs': 0 });
  });
});

test('an empty tree is just the root at 0', async () => {
  await withTempDir(async (dir) => {
    eq(await dirSizes(dir), { '.': 0 });
  });
});

test('counts bytes, not characters', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, { 'hi.txt': '👋' }); // 2 chars, 4 bytes
    eq(await dirSizes(dir), { '.': 4 });
  });
});

test('formatBytes keeps small sizes in whole bytes', () => {
  eq(formatBytes(0), '0 B');
  eq(formatBytes(512), '512 B');
  eq(formatBytes(1023), '1023 B');
});

test('formatBytes steps up in 1024s with one decimal', () => {
  eq(formatBytes(1024), '1.0 KB');
  eq(formatBytes(1536), '1.5 KB');
  eq(formatBytes(1024 * 1024), '1.0 MB');
  eq(formatBytes(3.5 * 1024 * 1024 * 1024), '3.5 GB');
});
