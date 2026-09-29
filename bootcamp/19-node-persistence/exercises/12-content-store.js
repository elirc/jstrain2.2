// ─────────────────────────────────────────────────────────────────────────
//  12 · a content-addressed store                              ★★☆ core
//  concepts: sha256 · immutability · directory fanout
//  run: node 12-content-store.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Stop naming files. Hash the content and let the hash BE the name. Then
//  identical content is automatically stored once, a file can never be
//  silently modified behind its name, and syncing is "do you have this
//  hash?". This is git's object store, Docker layers, and every CDN's
//  cache key.
//
//      const key = await put(dir, 'hello');   // 64 hex chars
//      await get(dir, key)                    → 'hello'
//      await put(dir, 'hello')                → the SAME key, no new file
//
//  Layout — split the key so no directory ends up with a million entries
//  (some filesystems get very slow, and `ls` becomes unusable):
//
//      <dir>/2c/f24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e730433629
//            ^^ first 2 chars   ^^ the remaining 62 (shortened here)
//
//  Build put(dir, data) → key and get(dir, key) → string or null.
//  Storing content that is already there must not rewrite the file.
//
//  hint: createHash('sha256').update(data).digest('hex'), and check
//  existence before writing — an object that exists is already correct,
//  because its name is its checksum.

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

export async function put(dir, data) {
  throw new Error('TODO');
}

export async function get(dir, key) {
  throw new Error('TODO');
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
