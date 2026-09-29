// ─────────────────────────────────────────────────────────────────────────
//  06 · a JSON file as a database                             ★★☆ core
//  concepts: fs/promises · JSON · read-modify-write · error codes
//  run: node 06-fs-json-db.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Half the small tools you write keep their state in one JSON file. The
//  pattern is always read → modify → write, and the interesting part is
//  what happens when the file is not there yet.
//
//      await readJson(file, { users: [] })  → the parsed object, or the
//                                             fallback if file is MISSING
//      await writeJson(file, value)         → 2-space pretty JSON + '\n'
//      await updateJson(file, (db) => ({ ...db, hits: (db.hits ?? 0) + 1 }))
//                                          → writes + returns the new value
//
//  A missing file is normal (err.code === 'ENOENT') and gets the
//  fallback. A file full of broken JSON is a bug — let that one throw.
//  updateJson starts from {} when there is nothing on disk yet.
//
//  hint: fs errors are exceptions carrying a `.code` — catch, inspect
//  `err.code`, and rethrow anything you did not mean to handle.

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
    await fs.rm(dir, { recursive: true, force: true, maxRetries: 3 });
    await fs.rmdir(TMP_ROOT).catch(() => {});
  }
}

export async function readJson(file, fallback) {
  throw new Error('TODO');
}

export async function writeJson(file, value) {
  throw new Error('TODO');
}

export async function updateJson(file, update) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('round trips an object through the file', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'db.json');
    await writeJson(file, { users: ['ada'], hits: 1 });
    eq(await readJson(file, null), { users: ['ada'], hits: 1 });
  });
});

test('writes pretty JSON ending in a newline', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'db.json');
    await writeJson(file, { hits: 1 });
    const raw = await fs.readFile(file, 'utf8');
    eq(raw, '{\n  "hits": 1\n}\n');
  });
});

test('returns the fallback when the file does not exist', async () => {
  await withTempDir(async (dir) => {
    eq(await readJson(path.join(dir, 'missing.json'), { users: [] }), { users: [] });
  });
});

test('invalid JSON rejects instead of falling back', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'db.json');
    await writeJson(file, { ok: true });
    await fs.writeFile(file, '{ not json at all', 'utf8');
    await rejects(() => readJson(file, { ok: false }));
  });
});

test('updateJson creates the file on the first call', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'db.json');
    await updateJson(file, (db) => ({ ...db, hits: (db.hits ?? 0) + 1 }));
    eq(await readJson(file, null), { hits: 1 });
  });
});

test('updateJson feeds the previous value to the updater', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'db.json');
    const bump = (db) => ({ ...db, hits: (db.hits ?? 0) + 1 });
    await updateJson(file, bump);
    await updateJson(file, bump);
    await updateJson(file, bump);
    eq(await readJson(file, null), { hits: 3 });
  });
});

test('updateJson returns exactly what it wrote', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'db.json');
    const returned = await updateJson(file, (db) => ({
      ...db,
      users: [...(db.users ?? []), 'ada'],
    }));
    eq(returned, { users: ['ada'] });
    eq(await readJson(file, null), returned);
    ok(typeof returned === 'object');
  });
});
