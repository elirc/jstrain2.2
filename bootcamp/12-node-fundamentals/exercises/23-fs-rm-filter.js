// ─────────────────────────────────────────────────────────────────────────
//  23 · delete by predicate                                    ★★☆ core
//  concepts: async recursion · fs.rm · predicates
//  run: node 23-fs-rm-filter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "Clean the build output but keep the sourcemaps" is a delete with a
//  filter, and the filter belongs to the caller — a function you pass in,
//  not a hard-coded list of extensions inside the deleter.
//
//      await removeWhere(root, (rel) => rel.endsWith('.tmp'))
//        → ['cache/x.tmp', 'y.tmp']      (what was deleted, sorted)
//      await pruneEmptyDirs(root)   → 2  (directories left empty, gone)
//
//  removeWhere hands the predicate the path RELATIVE to root, joined with
//  '/' on every OS, and returns the deleted paths sorted. It never deletes
//  a directory. pruneEmptyDirs is the follow-up sweep: a directory with
//  nothing left inside it goes, and the root itself always stays.
//
//  hint: pruneEmptyDirs must recurse BEFORE it decides — a directory
//  holding one empty directory only becomes empty once the child is gone.

import { test, eq, spy } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Provided: temp dir per test, a tree builder (string = file contents,
// null = empty directory) and a snapshot for describing what survived.
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
      lines.push(`file ${rel}`);
    }
  }
  return lines;
}

export async function removeWhere(root, predicate) {
  throw new Error('TODO');
}

export async function pruneEmptyDirs(root) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('deletes the files the predicate says yes to', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, { 'a.tmp': '1', 'b.txt': '2' });
    eq(await removeWhere(dir, (rel) => rel.endsWith('.tmp')), ['a.tmp']);
    eq(await snapshot(dir), ['file b.txt']);
  });
});

test('descends into subdirectories, sorted relative paths', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, {
      'y.tmp': '1',
      'cache/x.tmp': '2',
      'cache/keep.txt': '3',
    });
    eq(await removeWhere(dir, (rel) => rel.endsWith('.tmp')), [
      'cache/x.tmp',
      'y.tmp',
    ]);
    eq(await snapshot(dir), ['dir  cache', 'file cache/keep.txt']);
  });
});

test('the predicate sees forward-slash paths relative to the root', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, { 'src/lib/util.js': '', 'top.txt': '' });
    const seen = spy(() => false);
    await removeWhere(dir, seen);
    eq(
      seen.calls.map(([rel]) => rel).sort(),
      ['src/lib/util.js', 'top.txt']
    );
  });
});

test('deletes nothing when the predicate never says yes', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, { 'a.txt': '1', 'sub/b.txt': '2' });
    eq(await removeWhere(dir, () => false), []);
    eq(await snapshot(dir), ['file a.txt', 'dir  sub', 'file sub/b.txt']);
  });
});

test('never deletes a directory, even when everything matches', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, { 'logs': null, 'a.txt': '1' });
    eq(await removeWhere(dir, () => true), ['a.txt']);
    eq(await snapshot(dir), ['dir  logs']);
  });
});

test('an empty tree deletes nothing', async () => {
  await withTempDir(async (dir) => {
    eq(await removeWhere(dir, () => true), []);
  });
});

test('pruneEmptyDirs removes nested directories, deepest first', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, {
      'cache/a.tmp': '1',
      'cache/deep/b.tmp': '2',
      'src/app.js': '3',
    });
    await removeWhere(dir, (rel) => rel.endsWith('.tmp'));
    eq(await pruneEmptyDirs(dir), 2);
    eq(await snapshot(dir), ['dir  src', 'file src/app.js']);
  });
});

test('pruneEmptyDirs keeps the root and every non-empty directory', async () => {
  await withTempDir(async (dir) => {
    await makeTree(dir, { 'src/app.js': '1' });
    eq(await pruneEmptyDirs(dir), 0);
    eq(await snapshot(dir), ['dir  src', 'file src/app.js']);
    eq((await fs.stat(dir)).isDirectory(), true);
  });
});
