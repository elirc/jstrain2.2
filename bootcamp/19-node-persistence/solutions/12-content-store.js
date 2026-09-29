// ─────────────────────────────────────────────────────────────────────────
//  12 · a content-addressed store — SOLUTION                   ★★☆ core
//  run: node 12-content-store.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the name IS the checksum, and that one decision buys you
//  three properties for free. Dedupe: identical content computes to the
//  same path, so it is stored once. Integrity: you can re-hash a file and
//  compare it to its own name. Immutability: changing content changes the
//  name, so an object at a given key never changes meaning — which is why
//  content-addressed things can be cached forever.
//  Hence the `access` check before writing: if the path exists, the bytes
//  there already hash to this key, so rewriting them is pure cost. Note
//  that it handles only ENOENT and rethrows anything else — a permissions
//  error must not be read as "not stored yet".
//  The two-character fanout keeps directories small. `git` uses exactly
//  this (.git/objects/2c/f24d…) because tens of thousands of entries in
//  one directory turns lookups and listings slow on many filesystems.
//  The trade-off you accept: nothing is ever named, so a content store
//  needs a second index — refs, tags, a manifest — to find anything by a
//  human name.

import { test, eq, ok } from '../../_lib/check.js';
import { createHash, randomUUID } from 'node:crypto';
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
  }
}

// Provided: count every stored object across all fanout directories.
async function countObjects(dir) {
  let n = 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      n += (await fs.readdir(path.join(dir, entry.name))).length;
    }
  }
  return n;
}

const objectPath = (dir, key) => path.join(dir, key.slice(0, 2), key.slice(2));

export async function put(dir, data) {
  const key = createHash('sha256').update(data).digest('hex');
  const file = objectPath(dir, key);

  try {
    await fs.access(file);
    return key; // already stored, and its name proves it is correct
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
  return key;
}

export async function get(dir, key) {
  try {
    return await fs.readFile(objectPath(dir, key), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('put returns the sha256 of the content, in hex', async () => {
  await withTempDir(async (dir) => {
    const key = await put(dir, 'hello');
    eq(key, createHash('sha256').update('hello').digest('hex'));
    eq(key.length, 64);
  });
});

test('get returns exactly what was put', async () => {
  await withTempDir(async (dir) => {
    const key = await put(dir, 'the quick brown fox');
    eq(await get(dir, key), 'the quick brown fox');
  });
});

test('the object lives under a two-character fanout directory', async () => {
  await withTempDir(async (dir) => {
    const key = await put(dir, 'hello');
    const file = path.join(dir, key.slice(0, 2), key.slice(2));
    eq(await fs.readFile(file, 'utf8'), 'hello');
  });
});

test('same content always produces the same key', async () => {
  await withTempDir(async (dir) => {
    eq(await put(dir, 'same'), await put(dir, 'same'));
  });
});

test('different content produces a different key', async () => {
  await withTempDir(async (dir) => {
    const a = await put(dir, 'alpha');
    const b = await put(dir, 'beta');
    ok(a !== b);
    eq(await get(dir, a), 'alpha');
    eq(await get(dir, b), 'beta');
  });
});

test('storing the same content twice stores one file — dedupe', async () => {
  await withTempDir(async (dir) => {
    const key = await put(dir, 'duplicated payload');
    const file = path.join(dir, key.slice(0, 2), key.slice(2));
    await fs.utimes(file, 1000, 1000); // age the file so a rewrite would show

    await put(dir, 'duplicated payload');
    await put(dir, 'duplicated payload');
    eq(await countObjects(dir), 1);
    eq((await fs.stat(file)).mtimeMs, 1000 * 1000, 'it must not rewrite');

    await put(dir, 'something else');
    eq(await countObjects(dir), 2);
  });
});

test('an unknown key reads as null, not an exception', async () => {
  await withTempDir(async (dir) => {
    await put(dir, 'present');
    eq(await get(dir, 'f'.repeat(64)), null);
  });
});

test('multi-byte content survives the round trip', async () => {
  await withTempDir(async (dir) => {
    const text = 'héllo 👋 — naïve';
    eq(await get(dir, await put(dir, text)), text);
  });
});
