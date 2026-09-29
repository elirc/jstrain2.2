// ─────────────────────────────────────────────────────────────────────────
//  16 · config discovery                                   ★★☆ core
//  concepts: walking up a tree · path.dirname · fs error codes
//  run: node 16-find-config.js
// ─────────────────────────────────────────────────────────────────────────
//
//  How does eslint find .eslintrc from a file five directories down? It
//  walks UP. Start at startDir, look for `filename`, and if it is not
//  there try the parent, and the parent's parent, until you find it or
//  run out of tree.
//
//      findConfig('<tmp>/app/src', '.taskrc')  → '<tmp>/app/.taskrc'
//      findConfig('<tmp>/app/src', 'nope')     → null
//      findConfig(from, 'x', { stopAt: dir })  → stops after searching dir
//
//  Return the absolute path, or null. Three things to get right: the file
//  must be a FILE (a directory called .taskrc is not a config), the walk
//  must terminate at the top of the filesystem, and only ENOENT means
//  "not here" — any other fs error is a real problem and must be
//  rethrown, not swallowed into a silent fallback.
//
//  hint: at the top, path.dirname(dir) returns dir itself — that, not a
//  falsy value, is your stop condition

import { test, eq, ok } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function findConfig(startDir, filename, { stopAt } = {}) {
  throw new Error('TODO');
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
