// ─────────────────────────────────────────────────────────────────────────
//  25 · a du-style size report — SOLUTION                       ★★☆ core
//  run: node 25-fs-du-report.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the walker returns its own total and writes its entry
//  into the shared report, so a parent adds up child totals it already
//  has instead of re-walking each subtree — the difference between O(n)
//  and O(n · depth) once a tree gets deep.
//  Writing `sizes[rel] = total` AFTER the loop is what makes the numbers
//  roll up; do it before and every directory reports 0.
//  stats.size is bytes on disk, which is why the emoji file weighs 4 and
//  not 2 — `contents.length` would have been the character count.
//  formatBytes divides while the value is >= 1024 and stops at the last
//  unit, so a giant number degrades to TB instead of falling off the end
//  of the array.

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
  const sizes = {};

  async function walk(dir, rel) {
    let total = 0;
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const childRel = rel === '.' ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) total += await walk(full, childRel);
      else if (entry.isFile()) total += (await fs.stat(full)).size;
    }
    sizes[rel] = total;
    return total;
  }

  await walk(root, '.');
  return sizes;
}

export function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return unit === 0 ? `${value} B` : `${value.toFixed(1)} ${units[unit]}`;
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
