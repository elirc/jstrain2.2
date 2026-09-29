// ─────────────────────────────────────────────────────────────────────────
//  05 · JSON Lines, append-only — SOLUTION                     ★★☆ core
//  run: node 05-jsonl-append.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the format is one line = one JSON value, and it works
//  precisely because JSON.stringify escapes '\n' inside strings as '\\n'.
//  A raw newline can never appear inside a record, so '\n' is a safe
//  record separator. That single property is why JSONL beats "a JSON
//  array we keep rewriting".
//  appendRecords builds the whole block first and appends once: one
//  syscall instead of N, and — more importantly — one atomic-ish write
//  instead of N chances to be interrupted between records.
//  readRecords handles exactly one error code and rethrows the rest. A
//  bare `catch { return [] }` would report a permissions failure as "the
//  log is empty", and then you would happily append on top of data you
//  could not read.

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

export async function appendRecord(file, record) {
  await fs.appendFile(file, `${JSON.stringify(record)}\n`, 'utf8');
}

export async function appendRecords(file, records) {
  if (records.length === 0) return;
  const block = records.map((r) => `${JSON.stringify(r)}\n`).join('');
  await fs.appendFile(file, block, 'utf8');
}

export async function readRecords(file) {
  let text;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('writes one JSON object per line, each ending in a newline', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'events.jsonl');
    await appendRecord(file, { id: 1 });
    await appendRecord(file, { id: 2 });
    eq(await fs.readFile(file, 'utf8'), '{"id":1}\n{"id":2}\n');
  });
});

test('reads the records back in append order', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'events.jsonl');
    await appendRecord(file, { id: 1, kind: 'open' });
    await appendRecord(file, { id: 2, kind: 'close' });
    eq(await readRecords(file), [
      { id: 1, kind: 'open' },
      { id: 2, kind: 'close' },
    ]);
  });
});

test('a missing file reads as an empty log, not an error', async () => {
  await withTempDir(async (dir) => {
    eq(await readRecords(path.join(dir, 'nope.jsonl')), []);
  });
});

test('blank lines are skipped', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'events.jsonl');
    await fs.writeFile(file, '{"id":1}\n\n   \n{"id":2}\n', 'utf8');
    eq(await readRecords(file), [{ id: 1 }, { id: 2 }]);
  });
});

test('appendRecords writes the whole batch in a single call', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'events.jsonl');
    await appendRecords(file, [{ id: 1 }, { id: 2 }, { id: 3 }]);
    eq(await readRecords(file), [{ id: 1 }, { id: 2 }, { id: 3 }]);
    eq(await fs.readFile(file, 'utf8'), '{"id":1}\n{"id":2}\n{"id":3}\n');
  });
});

test('appending never rewrites what is already there', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'events.jsonl');
    await appendRecords(file, [{ id: 1 }]);
    const before = await fs.readFile(file, 'utf8');
    await appendRecord(file, { id: 2 });
    const after = await fs.readFile(file, 'utf8');
    ok(after.startsWith(before), 'the old bytes must still be at the front');
  });
});

test('a newline inside a string does not break the format', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'events.jsonl');
    await appendRecord(file, { note: 'two\nlines' });
    await appendRecord(file, { note: 'after' });
    eq(await fs.readFile(file, 'utf8'), '{"note":"two\\nlines"}\n{"note":"after"}\n');
    eq(await readRecords(file), [{ note: 'two\nlines' }, { note: 'after' }]);
  });
});

test('an empty batch leaves the file alone', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'events.jsonl');
    await appendRecords(file, []);
    eq(await readRecords(file), []);
  });
});
