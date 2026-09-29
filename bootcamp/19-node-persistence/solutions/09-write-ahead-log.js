// ─────────────────────────────────────────────────────────────────────────
//  09 · a write-ahead log — SOLUTION                         ★★★ stretch
//  run: node 09-write-ahead-log.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole idea is that state = replay(log). Nothing is
//  overwritten, so the only failure a crash can cause is losing the tail.
//  The recovery trick is the `lines.pop()`. Splitting on '\n' always
//  produces one more piece than there are complete lines: '' if the file
//  ended on a newline, and the torn half-record if it did not. Dropping
//  that last piece unconditionally is what makes a half-written append
//  harmless — the newline is the commit marker.
//  A parse failure `break`s instead of `continue`s. After a torn write
//  the rest of the file is not trustworthy, and skipping a bad op while
//  applying the ones after it would rebuild a state that never existed.
//  applyOp throwing on an unknown op type is deliberate: a log written by
//  a newer version of your code must fail loudly, not half-apply.
//  This is what a database WAL is, minus the checksums, sequence numbers
//  and fsync. Real ones prefix each record with a CRC so a torn record is
//  detected rather than inferred.

import { test, eq, ok, throws } from '../../_lib/check.js';
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

// Provided: simulate a crash by cutting `bytes` off the end of the file.
async function truncateBy(file, bytes) {
  const { size } = await fs.stat(file);
  await fs.truncate(file, size - bytes);
}

export function applyOp(state, op) {
  if (op.op === 'set') {
    state[op.key] = op.value;
  } else if (op.op === 'delete') {
    delete state[op.key];
  } else {
    throw new Error(`unknown log op: ${op.op}`);
  }
  return state;
}

export async function appendOp(file, op) {
  await fs.appendFile(file, `${JSON.stringify(op)}\n`, 'utf8');
}

export async function replayLog(file) {
  let text;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }

  const lines = text.split('\n');
  lines.pop(); // '' after a clean append, or the torn record after a crash

  const state = {};
  for (const line of lines) {
    if (line.trim() === '') continue;
    let op;
    try {
      op = JSON.parse(line);
    } catch {
      break; // corruption: everything after this point is suspect
    }
    applyOp(state, op);
  }
  return state;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('applyOp writes a key into the state', () => {
  const state = { a: 1 };
  applyOp(state, { op: 'set', key: 'b', value: 2 });
  eq(state, { a: 1, b: 2 });
});

test('applyOp removes a key, and tolerates removing a missing one', () => {
  const state = { a: 1 };
  applyOp(state, { op: 'delete', key: 'a' });
  applyOp(state, { op: 'delete', key: 'ghost' });
  eq(state, {});
});

test('an unknown op type is a bug, not a shrug', () => {
  throws(() => applyOp({}, { op: 'increment', key: 'a' }), 'increment');
});

test('appendOp writes one JSON line per operation', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'wal.jsonl');
    await appendOp(file, { op: 'set', key: 'a', value: 1 });
    await appendOp(file, { op: 'delete', key: 'a' });
    eq(
      await fs.readFile(file, 'utf8'),
      '{"op":"set","key":"a","value":1}\n{"op":"delete","key":"a"}\n'
    );
  });
});

test('replaying a missing log gives empty state', async () => {
  await withTempDir(async (dir) => {
    eq(await replayLog(path.join(dir, 'wal.jsonl')), {});
  });
});

test('replay rebuilds the state, last write winning', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'wal.jsonl');
    await appendOp(file, { op: 'set', key: 'theme', value: 'light' });
    await appendOp(file, { op: 'set', key: 'font', value: 14 });
    await appendOp(file, { op: 'set', key: 'theme', value: 'dark' });
    await appendOp(file, { op: 'delete', key: 'font' });
    eq(await replayLog(file), { theme: 'dark' });
  });
});

test('a crash mid-append costs the last op and nothing else', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'wal.jsonl');
    await appendOp(file, { op: 'set', key: 'a', value: 1 });
    await appendOp(file, { op: 'set', key: 'b', value: 2 });
    await appendOp(file, { op: 'set', key: 'c', value: 3 });
    await truncateBy(file, 12); // the 'c' line is now half-written
    const raw = await fs.readFile(file, 'utf8');
    ok(!raw.endsWith('\n'), 'the fixture must really be torn');
    eq(await replayLog(file), { a: 1, b: 2 });
  });
});

test('the log keeps growing — replay is what collapses it', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'wal.jsonl');
    for (let i = 0; i < 6; i += 1) {
      await appendOp(file, { op: 'set', key: 'hits', value: i });
    }
    const lines = (await fs.readFile(file, 'utf8')).trim().split('\n');
    eq(lines.length, 6); // six writes on disk…
    eq(await replayLog(file), { hits: 5 }); // …one key in memory
  });
});
