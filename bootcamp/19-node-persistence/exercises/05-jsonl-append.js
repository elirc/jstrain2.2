// ─────────────────────────────────────────────────────────────────────────
//  05 · JSON Lines, append-only                                ★★☆ core
//  concepts: JSONL · appendFile · ENOENT · line formats
//  run: node 05-jsonl-append.js
// ─────────────────────────────────────────────────────────────────────────
//
//  One big JSON array on disk means rewriting the whole file to add one
//  record. JSON Lines (`.jsonl`) fixes that: one complete JSON value per
//  line, so a new record is an append — O(1) writes, and every log
//  pipeline on earth can read it.
//
//      appendRecord(file, { id: 1 })   // writes '{"id":1}\n' at the end
//      readRecords(file)               → [{ id: 1 }]
//      readRecords('nope.jsonl')       → []        (missing file is empty)
//
//  Build three things:
//    · appendRecord(file, record)    one line, ending in '\n'
//    · appendRecords(file, records)  many lines in ONE write call
//    · readRecords(file)             parse every non-blank line, in order
//
//  hint: fs.appendFile creates the file if it does not exist. For reading,
//  handle err.code === 'ENOENT' and rethrow everything else.

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
  throw new Error('TODO');
}

export async function appendRecords(file, records) {
  throw new Error('TODO');
}

export async function readRecords(file) {
  throw new Error('TODO');
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
