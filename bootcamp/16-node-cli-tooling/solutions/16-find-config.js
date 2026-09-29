// ─────────────────────────────────────────────────────────────────────────
//  16 · config discovery — SOLUTION                        ★★☆ core
//  run: node 16-find-config.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `path.dirname(dir) === dir` is the only correct way to
//  stop. At the top of the tree dirname('/') is '/' and dirname('C:\\')
//  is 'C:\\' — the path stops changing instead of becoming empty or
//  null, so a loop that waits for a falsy value never ends. Counting
//  slashes is not a substitute; UNC paths and drive letters differ.
//  stat + isFile() rather than existsSync: a DIRECTORY called .taskrc is
//  not a config file, and the walk must continue past it. Only ENOENT
//  means "not here" — every other errno is a real problem and is
//  rethrown, because swallowing EACCES here would silently fall back to
//  defaults on a machine with a permissions problem.
//  resolve() up front normalises the start, so the returned path is
//  absolute and the stopAt comparison is string-safe.

import { test, eq, ok } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function findConfig(startDir, filename, { stopAt } = {}) {
  let dir = path.resolve(startDir);
  const boundary = stopAt ? path.resolve(stopAt) : null;

  for (;;) {
    const candidate = path.join(dir, filename);
    try {
      if ((await fs.stat(candidate)).isFile()) return candidate;
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    if (boundary && dir === boundary) return null;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: a throwaway fixture tree, deleted again in a finally.
//
//   <tmp>/.taskrc            (file)      <tmp>/only-root.json  (file)
//   <tmp>/app/.taskrc        (file)      <tmp>/app/src/        (empty)
//   <tmp>/lonely/deep/       (empty)     <tmp>/shadow/.taskrc/ (DIRECTORY)
const TMP_ROOT = path.join(import.meta.dirname, '..', 'tmp-test');

async function withFixture(run) {
  const dir = path.join(TMP_ROOT, randomUUID());
  await fs.mkdir(path.join(dir, 'app', 'src'), { recursive: true });
  await fs.mkdir(path.join(dir, 'lonely', 'deep'), { recursive: true });
  await fs.mkdir(path.join(dir, 'shadow', '.taskrc'), { recursive: true });
  await fs.writeFile(path.join(dir, '.taskrc'), 'root', 'utf8');
  await fs.writeFile(path.join(dir, 'only-root.json'), '{}', 'utf8');
  await fs.writeFile(path.join(dir, 'app', '.taskrc'), 'app', 'utf8');
  try {
    return await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true, maxRetries: 3 });
    await fs.rmdir(TMP_ROOT).catch(() => {});
  }
}

test('finds the file in the starting directory', async () => {
  await withFixture(async (dir) => {
    eq(await findConfig(dir, '.taskrc'), path.join(dir, '.taskrc'));
  });
});

test('walks up to the nearest ancestor that has it', async () => {
  await withFixture(async (dir) => {
    eq(
      await findConfig(path.join(dir, 'app', 'src'), '.taskrc'),
      path.join(dir, 'app', '.taskrc')
    );
  });
});

test('keeps walking past directories that do not have it', async () => {
  await withFixture(async (dir) => {
    eq(
      await findConfig(path.join(dir, 'lonely', 'deep'), '.taskrc'),
      path.join(dir, '.taskrc')
    );
  });
});

test('a directory with the right name is not a config file', async () => {
  await withFixture(async (dir) => {
    eq(
      await findConfig(path.join(dir, 'shadow'), '.taskrc'),
      path.join(dir, '.taskrc')
    );
  });
});

test('returns null instead of looping at the top of the tree', async () => {
  await withFixture(async (dir) => {
    const missing = '.no-such-config-9f3a2b.json';
    eq(await findConfig(path.join(dir, 'app', 'src'), missing), null);
  });
});

test('stopAt is a boundary the walk does not cross', async () => {
  await withFixture(async (dir) => {
    const from = path.join(dir, 'app', 'src');
    ok((await findConfig(from, 'only-root.json')) === path.join(dir, 'only-root.json'));
    eq(
      await findConfig(from, 'only-root.json', { stopAt: path.join(dir, 'app') }),
      null
    );
  });
});

test('the boundary directory itself is still searched', async () => {
  await withFixture(async (dir) => {
    eq(
      await findConfig(path.join(dir, 'app', 'src'), '.taskrc', {
        stopAt: path.join(dir, 'app'),
      }),
      path.join(dir, 'app', '.taskrc')
    );
  });
});
