// ─────────────────────────────────────────────────────────────────────────
//  08 · a JsonStore you would actually ship — SOLUTION          ★★☆ core
//  run: node 08-json-store.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the constructor cannot be async, so the loading lives in
//  a static factory — `JsonStore.open(file)` — and the constructor just
//  takes already-loaded data. That is the standard escape hatch for "I
//  need to await something before the object exists".
//  Private fields (`#data`) are not decoration here: `toObject()` returns
//  a shallow copy so a caller cannot reach in and mutate the store behind
//  the dirty flag's back. A flag that can be bypassed is worse than none.
//  `delete` only dirties when it actually removed something, which is why
//  it returns the boolean from the `delete` operator.
//  The `if (!this.#dirty) return;` in save() is what makes "save on every
//  keystroke" cheap, and it is why the no-op save cannot clobber a file
//  somebody else edited.
//  The classic wrong turn is writing the file on every set(). It is N
//  times slower and gives a crash N chances to catch you mid-write.

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
  #file;
  #data;
  #dirty = false;

  constructor(file, data = {}) {
    this.#file = file;
    this.#data = data;
  }

  static async open(file) {
    let text;
    try {
      text = await fs.readFile(file, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return new JsonStore(file, {});
      throw err;
    }
    return new JsonStore(file, JSON.parse(text));
  }

  get(key) {
    return this.#data[key];
  }

  has(key) {
    return Object.hasOwn(this.#data, key);
  }

  set(key, value) {
    this.#data[key] = value;
    this.#dirty = true;
    return this;
  }

  delete(key) {
    if (!Object.hasOwn(this.#data, key)) return false;
    delete this.#data[key];
    this.#dirty = true;
    return true;
  }

  get size() {
    return Object.keys(this.#data).length;
  }

  get dirty() {
    return this.#dirty;
  }

  toObject() {
    return { ...this.#data };
  }

  async save() {
    if (!this.#dirty) return this.#file;
    await writeFileAtomic(this.#file, `${JSON.stringify(this.#data, null, 2)}\n`);
    this.#dirty = false;
    return this.#file;
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
