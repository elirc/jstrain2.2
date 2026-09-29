// ─────────────────────────────────────────────────────────────────────────
//  17 · scaffolding                                        ★★☆ core
//  concepts: recursion over data · mkdir recursive · path containment
//  run: node 17-write-tree.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `create-something-app` in two functions. A spec is a nested object:
//  a string value is a FILE with that content, an object value is a
//  DIRECTORY.
//
//      await writeTree(dir, {
//        'package.json': '{ "name": "demo" }\n',
//        src: { 'index.js': 'console.log(1);\n' },
//        docs: {},                       // an empty directory
//      })
//        → ['package.json', 'src/index.js']
//
//      await readTree(dir)   → the same object again
//
//  writeTree resolves with the relative paths of the FILES it wrote,
//  sorted, always with '/' separators so the log reads the same on every
//  OS. A key may contain a separator of its own ('a/b/c.txt').
//
//  And the security bit: a key must never write outside baseDir. Refuse
//  '../evil.txt' and absolute paths by throwing, before writing anything.
//
//  hint: path.relative(base, target) — if it starts with '..' or comes
//  back absolute, the target escaped. (baseDir.startsWith checks do not
//  work: '/tmp/app-evil' starts with '/tmp/app'.)

import { test, eq, rejects } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeTree(baseDir, spec) {
  throw new Error('TODO');
}

export async function readTree(dir) {
  throw new Error('TODO');
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
