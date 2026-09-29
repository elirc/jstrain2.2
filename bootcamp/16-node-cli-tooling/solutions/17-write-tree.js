// ─────────────────────────────────────────────────────────────────────────
//  17 · scaffolding — SOLUTION                             ★★☆ core
//  run: node 17-write-tree.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: recursion mirrors the shape of the data — a string is a
//  file, an object is a directory, and there is no third case. mkdir with
//  { recursive: true } both builds the whole chain and stays quiet when
//  the directory is already there, which is what makes an empty object a
//  one-liner.
//  The containment check is the part that matters. `create a project from
//  this template` is exactly the shape of bug that lets a downloaded
//  template write '../../.ssh/authorized_keys' — resolve the target, ask
//  path.relative what it is from the base, and refuse anything that comes
//  back starting with '..' or absolute (a different Windows drive).
//  startsWith(base) is NOT the same check: '/tmp/app-evil' starts with
//  '/tmp/app'.
//  Returned paths are normalised to '/' so the same scaffold prints the
//  same log on every OS.

import { test, eq, rejects } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeTree(baseDir, spec) {
  const base = path.resolve(baseDir);
  const written = [];

  const walk = async (dir, node) => {
    await fs.mkdir(dir, { recursive: true });
    for (const [name, value] of Object.entries(node)) {
      const target = path.resolve(dir, name);
      const rel = path.relative(base, target);
      if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
        throw new Error(`refusing to write outside the base: ${name}`);
      }
      if (typeof value === 'string') {
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, value, 'utf8');
        written.push(rel.split(path.sep).join('/'));
      } else {
        await walk(target, value);
      }
    }
  };

  await walk(base, spec);
  return written.sort();
}

export async function readTree(dir) {
  const tree = {};
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const full = path.join(dir, entry.name);
    tree[entry.name] = entry.isDirectory()
      ? await readTree(full)
      : await fs.readFile(full, 'utf8');
  }
  return tree;
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: an empty throwaway directory, deleted again in a finally.
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

const SPEC = {
  'package.json': '{ "name": "demo" }\n',
  src: {
    'index.js': 'console.log(1);\n',
    lib: { 'util.js': 'export const x = 1;\n' },
  },
  docs: {},
};

test('writes a file and reports its path', async () => {
  await withTempDir(async (dir) => {
    eq(await writeTree(dir, { 'README.md': '# hi\n' }), ['README.md']);
    eq(await fs.readFile(path.join(dir, 'README.md'), 'utf8'), '# hi\n');
  });
});

test('creates the directories a nested file needs', async () => {
  await withTempDir(async (dir) => {
    await writeTree(dir, { src: { lib: { 'util.js': 'x\n' } } });
    eq(await fs.readFile(path.join(dir, 'src', 'lib', 'util.js'), 'utf8'), 'x\n');
  });
});

test('an empty object is an empty directory', async () => {
  await withTempDir(async (dir) => {
    eq(await writeTree(dir, { docs: {} }), []);
    eq((await fs.stat(path.join(dir, 'docs'))).isDirectory(), true);
  });
});

test('a key may carry its own path separator', async () => {
  await withTempDir(async (dir) => {
    eq(await writeTree(dir, { 'a/b/c.txt': 'deep\n' }), ['a/b/c.txt']);
    eq(await fs.readFile(path.join(dir, 'a', 'b', 'c.txt'), 'utf8'), 'deep\n');
  });
});

test('reading the tree back gives the spec again', async () => {
  await withTempDir(async (dir) => {
    await writeTree(dir, SPEC);
    eq(await readTree(dir), SPEC);
  });
});

test('the reported paths are relative, posix and sorted', async () => {
  await withTempDir(async (dir) => {
    eq(await writeTree(dir, { b: { 'z.txt': '', 'a.txt': '' }, 'a.txt': '' }), [
      'a.txt',
      'b/a.txt',
      'b/z.txt',
    ]);
  });
});

test('a key that climbs out of the base is refused', async () => {
  await withTempDir(async (dir) => {
    await rejects(() => writeTree(dir, { '../evil.txt': 'x' }), 'refusing');
    eq(await fs.readdir(dir), []);
  });
});

test('an absolute key is refused too', async () => {
  await withTempDir(async (dir) => {
    const escape = path.join(path.resolve(dir, '..'), 'also-evil.txt');
    await rejects(() => writeTree(dir, { [escape]: 'x' }), 'refusing');
    eq(await fs.readdir(dir), []);
  });
});
