// ─────────────────────────────────────────────────────────────────────────
//  08 · a JsonStore you would actually ship                     ★★☆ core
//  concepts: classes · load-on-open · dirty tracking
//  run: node 08-json-store.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Read-modify-write on every `set` is how small tools become slow: N
//  writes for N changes, and N chances to be interrupted. The standard
//  shape instead is load once, mutate in memory, save deliberately —
//  with a dirty flag so `save()` on unchanged data costs nothing.
//
//      const store = await JsonStore.open(file);   // {} if no file yet
//      store.set('theme', 'dark');                 // memory only
//      store.dirty                                 → true
//      await store.save();                         // one atomic write
//      store.dirty                                 → false
//
//  Build the class:
//    · static async open(file)  read+parse the file, or start from {}
//    · get(key) / set(key, value) / delete(key) / has(key)
//    · size            how many keys
//    · dirty           true when memory differs from disk
//    · toObject()      a COPY of the data (callers must not mutate you)
//    · async save()    atomic write; a no-op when not dirty
//
//  hint: delete(key) should only mark the store dirty if the key was
//  actually there — `delete` returning a boolean is doing you a favour.

import { test, eq, ok } from '../../_lib/check.js';
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
  }
}

// Provided: your atomic writer from exercise 07. Use it in save().
async function writeFileAtomic(file, data) {
  const tmp = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(tmp, data);
    await fs.rename(tmp, file);
  } catch (err) {
    await fs.rm(tmp, { force: true, maxRetries: 5 });
    throw err;
  }
  return file;
}

export class JsonStore {
  static async open(file) {
    throw new Error('TODO');
  }

  get(key) {
    throw new Error('TODO');
  }

  has(key) {
    throw new Error('TODO');
  }

  set(key, value) {
    throw new Error('TODO');
  }

  delete(key) {
    throw new Error('TODO');
  }

  get size() {
    throw new Error('TODO');
  }

  get dirty() {
    throw new Error('TODO');
  }

  toObject() {
    throw new Error('TODO');
  }

  async save() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('opening a file that does not exist starts empty and clean', async () => {
  await withTempDir(async (dir) => {
    const store = await JsonStore.open(path.join(dir, 'settings.json'));
    eq(store.size, 0);
    eq(store.dirty, false);
    eq(store.get('theme'), undefined);
  });
});

test('set and get work in memory before any save', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'settings.json');
    const store = await JsonStore.open(file);
    store.set('theme', 'dark');
    store.set('fontSize', 14);
    eq(store.get('theme'), 'dark');
    eq(store.size, 2);
    ok(store.has('fontSize'));
    eq(await fs.readdir(dir), [], 'nothing is on disk until save()');
  });
});

test('save writes JSON a fresh open reads back', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'settings.json');
    const store = await JsonStore.open(file);
    store.set('theme', 'dark');
    await store.save();

    const reopened = await JsonStore.open(file);
    eq(reopened.get('theme'), 'dark');
    eq(reopened.dirty, false);
  });
});

test('dirty flips on change and clears on save', async () => {
  await withTempDir(async (dir) => {
    const store = await JsonStore.open(path.join(dir, 'settings.json'));
    eq(store.dirty, false);
    store.set('a', 1);
    eq(store.dirty, true);
    await store.save();
    eq(store.dirty, false);
  });
});

test('delete removes a key and marks the store dirty', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'settings.json');
    const store = await JsonStore.open(file);
    store.set('a', 1);
    await store.save();
    eq(store.delete('a'), true);
    eq(store.has('a'), false);
    eq(store.dirty, true);
    await store.save();
    eq((await JsonStore.open(file)).size, 0);
  });
});

test('deleting a key that is not there changes nothing', async () => {
  await withTempDir(async (dir) => {
    const store = await JsonStore.open(path.join(dir, 'settings.json'));
    eq(store.delete('ghost'), false);
    eq(store.dirty, false);
  });
});

test('save on a clean store does not touch the file', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'settings.json');
    const store = await JsonStore.open(file);
    store.set('a', 1);
    await store.save();

    // somebody else edits the file; a no-op save must not clobber it
    await fs.writeFile(file, '{"a":1,"edited":true}', 'utf8');
    await store.save();
    eq(await fs.readFile(file, 'utf8'), '{"a":1,"edited":true}');
  });
});

test('toObject hands back a copy, not the internals', async () => {
  await withTempDir(async (dir) => {
    const store = await JsonStore.open(path.join(dir, 'settings.json'));
    store.set('a', 1);
    const snapshot = store.toObject();
    eq(snapshot, { a: 1 });
    snapshot.a = 999;
    eq(store.get('a'), 1);
  });
});
