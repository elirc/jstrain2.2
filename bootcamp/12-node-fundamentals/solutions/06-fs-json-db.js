// ─────────────────────────────────────────────────────────────────────────
//  06 · a JSON file as a database — SOLUTION                  ★★☆ core
//  run: node 06-fs-json-db.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the shape to internalise is a try/catch that handles ONE
//  error code and rethrows the rest. `catch { return fallback; }` is the
//  classic wrong turn — it turns a typo'd path, a permission problem and
//  a corrupt file into "looks empty, carry on", and you lose the data.
//  Note where the try block ends: only the readFile is inside it, so a
//  JSON.parse failure is never mistaken for a missing file.
//  updateJson is read → transform → write. It reads with a {} fallback so
//  the first run works, and returns the new value so callers do not have
//  to read the file again.

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
  let text;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw err;
  }
  return JSON.parse(text);
}

export async function writeJson(file, value) {
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function updateJson(file, update) {
  const current = await readJson(file, {});
  const next = update(current);
  await writeJson(file, next);
  return next;
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
