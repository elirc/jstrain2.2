// ─────────────────────────────────────────────────────────────────────────
//  08 · retrofitting an atomic save                         ★★★ stretch
//  concepts: torn writes · tmp + rename · all-or-nothing state
//  run: node 08-atomic-retrofit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Here is a save that has been in production for a year:
//
//      await io.writeFile(dir/config.json, …);   // step 1
//      await io.writeFile(dir/index.json, …);    // step 2
//
//  It is `saveNaive` below, and it has two ways to leave a mixed state:
//  a failure between the steps, and a failure inside either one. You
//  cannot fix that by reordering the steps or adding a try/catch.
//
//  Retrofit it. You saw the pattern in module 19 — now apply it to code
//  that is already shaped wrong.
//
//  1. `saveSnapshot(dir, snapshot, io)` — persist `{ config, index }`
//     so that no failure at any step can leave a reader with a mix of
//     the old and the new. Use `io` for every filesystem call you make;
//     it is what the tests use to fail a step on purpose. Failures
//     propagate: report them, do not swallow them.
//
//  2. `loadSnapshot(dir)` — read it back. A directory that has never
//     been saved to loads as `{ config: {}, index: [] }`.

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Provided: each test gets its own empty directory, deleted afterwards.
const TMP_ROOT = path.join(import.meta.dirname, '..', 'tmp-test');

async function withTempDir(run) {
  const dir = path.join(TMP_ROOT, randomUUID());
  await fs.mkdir(dir, { recursive: true });
  try {
    return await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true, maxRetries: 5 });
    await fs.rmdir(TMP_ROOT).catch(() => {});
  }
}

// Provided: the filesystem, with a fault injector. `failOnCall: 2` makes
// the SECOND writeFile-or-rename fail instead of happening. `rm` is not
// counted and never fails, so cleaning up is always allowed.
export function makeIo({ failOnCall = 0 } = {}) {
  const calls = [];
  const step = (name) => {
    calls.push(name);
    if (calls.length === failOnCall) throw new Error(`crash during ${name}`);
  };
  return {
    calls,
    async writeFile(file, data) {
      step('writeFile');
      return fs.writeFile(file, data, 'utf8');
    },
    async rename(from, to) {
      step('rename');
      return fs.rename(from, to);
    },
    async rm(file) {
      return fs.rm(file, { force: true, maxRetries: 5 });
    },
  };
}

// Provided: the save you are replacing, and its reader.
export async function saveNaive(dir, snapshot, io) {
  await io.writeFile(path.join(dir, 'config.json'), JSON.stringify(snapshot.config));
  await io.writeFile(path.join(dir, 'index.json'), JSON.stringify(snapshot.index));
}

export async function loadNaive(dir) {
  const read = async (name, fallback) => {
    try {
      return JSON.parse(await fs.readFile(path.join(dir, name), 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') return fallback;
      throw err;
    }
  };
  return {
    config: await read('config.json', {}),
    index: await read('index.json', []),
  };
}

export async function saveSnapshot(dir, snapshot, io) {
  throw new Error('TODO');
}

export async function loadSnapshot(dir) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

const V1 = { config: { theme: 'light', fontSize: 14 }, index: ['a'] };
const V2 = { config: { theme: 'dark', fontSize: 18 }, index: ['a', 'b'] };

test('a snapshot round trips', async () => {
  await withTempDir(async (dir) => {
    await saveSnapshot(dir, V1, makeIo());
    eq(await loadSnapshot(dir), V1);
  });
});

test('a directory that was never saved to loads as empty', async () => {
  await withTempDir(async (dir) => {
    eq(await loadSnapshot(dir), { config: {}, index: [] });
  });
});

test('saving again replaces the whole snapshot, leaving one file', async () => {
  await withTempDir(async (dir) => {
    await saveSnapshot(dir, V1, makeIo());
    await saveSnapshot(dir, V2, makeIo());
    eq(await loadSnapshot(dir), V2);
    eq(await fs.readdir(dir), ['snapshot.json'], 'no temp files left behind');
  });
});

test('the two-file save tears — that is the bug you are fixing', async () => {
  await withTempDir(async (dir) => {
    await saveNaive(dir, V1, makeIo());
    await rejects(() => saveNaive(dir, V2, makeIo({ failOnCall: 2 })));
    const torn = await loadNaive(dir);
    eq(torn.config, V2.config, 'the new config landed');
    eq(torn.index, V1.index, '…on top of the old index');
    ok(await loadSnapshot(dir), 'and your version is what replaces it');
  });
});

test('a failure at the same step leaves the previous snapshot whole', async () => {
  await withTempDir(async (dir) => {
    await saveSnapshot(dir, V1, makeIo());
    await rejects(() => saveSnapshot(dir, V2, makeIo({ failOnCall: 2 })));
    eq(await loadSnapshot(dir), V1, 'a reader sees the old state, entire');
  });
});

test('a failure at the first step leaves it whole too', async () => {
  await withTempDir(async (dir) => {
    await saveSnapshot(dir, V1, makeIo());
    await rejects(() => saveSnapshot(dir, V2, makeIo({ failOnCall: 1 })));
    eq(await loadSnapshot(dir), V1);
  });
});

test('a failed save leaves no half-written file lying around', async () => {
  await withTempDir(async (dir) => {
    await saveSnapshot(dir, V1, makeIo());
    await rejects(() => saveSnapshot(dir, V2, makeIo({ failOnCall: 2 })));
    eq(await fs.readdir(dir), ['snapshot.json']);
  });
});

test('a first-ever save that fails leaves nothing to read', async () => {
  await withTempDir(async (dir) => {
    await rejects(() => saveSnapshot(dir, V1, makeIo({ failOnCall: 2 })));
    eq(await loadSnapshot(dir), { config: {}, index: [] });
    eq(await fs.readdir(dir), []);
  });
});
