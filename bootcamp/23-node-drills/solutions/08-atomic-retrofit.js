// ─────────────────────────────────────────────────────────────────────────
//  08 · retrofitting an atomic save — SOLUTION              ★★★ stretch
//  run: node 08-atomic-retrofit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the retrofit is a data-model change wearing a filesystem
//  costume. Two files means two commit points, and no amount of ordering
//  or error handling collapses two commit points into one. Put the state
//  that must change together into ONE file, and the problem becomes the
//  one you already know how to solve.
//  Then rename does the rest. A directory entry is a name pointing at an
//  inode; rename within a directory rewrites that pointer as a single
//  operation the filesystem journals as a unit. There is no instant where
//  snapshot.json exists but holds half a document, so a reader gets the
//  old snapshot or the new one — never `theme: dark` beside last week's
//  index. writeFile has no such property: it opens with O_TRUNC, and that
//  gap between truncate and write is where files die.
//  Two rules keep it honest: the temp lives in the SAME directory (a
//  rename across filesystems is a copy, and fails with EXDEV), and its
//  name is unique so two savers cannot collide on it.
//  Stringify before touching the disk, so an unserialisable value throws
//  while the old file is still whole. And the catch removes the temp:
//  after an injected failure it is litter, and after a real crash it is
//  simply an orphan nobody reads — which is the point, because the temp
//  never holds a name anyone loads from.
//  Wrong turn: writing the two files and adding a "repair on load" step
//  that patches a mismatch. Now recovery logic runs on every boot,
//  guessing which half is right, and it is only tested when it is too
//  late. Atomicity is cheaper than reconciliation.

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

const SNAPSHOT = 'snapshot.json';

export async function saveSnapshot(dir, snapshot, io) {
  const text = `${JSON.stringify(snapshot, null, 2)}\n`; // before any I/O
  const file = path.join(dir, SNAPSHOT);
  const tmp = path.join(dir, `${SNAPSHOT}.${randomUUID()}.tmp`);
  try {
    await io.writeFile(tmp, text); // the live file is untouched
    await io.rename(tmp, file); // one step: old contents → new contents
  } catch (err) {
    await io.rm(tmp);
    throw err;
  }
  return file;
}

export async function loadSnapshot(dir) {
  try {
    const text = await fs.readFile(path.join(dir, SNAPSHOT), 'utf8');
    return JSON.parse(text);
  } catch (err) {
    if (err.code === 'ENOENT') return { config: {}, index: [] };
    throw err; // a permissions bug is not "the file is empty"
  }
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
