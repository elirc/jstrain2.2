// ─────────────────────────────────────────────────────────────────────────
//  09 · a write-ahead log                                   ★★★ stretch
//  concepts: append-only logs · replay · crash recovery
//  run: node 09-write-ahead-log.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A store that rewrites its whole state on every change is slow and,
//  worse, is at risk during every single write. Databases do the opposite:
//  they append what they are ABOUT to do to a log first, and rebuild the
//  state by replaying that log. Appends are cheap, and a torn append only
//  costs you the very last operation.
//
//      appendOp(file, { op: 'set', key: 'a', value: 1 })
//      appendOp(file, { op: 'delete', key: 'a' })
//      await replayLog(file)   → {}
//
//  Build three things:
//    · applyOp(state, op)   mutate `state` for one op; throw on an
//                           unknown op type
//    · appendOp(file, op)   one JSON line, appended
//    · replayLog(file)      read the log, apply every op, return the
//                           final state ({} when there is no log)
//
//  The recovery rule: a crash can cut the file mid-line. A final line
//  with no '\n' after it was never fully written — ignore it, and stop
//  there. Everything before it is intact and must survive.
//
//  hint: split on '\n'. If the file ends with '\n' the last piece is '';
//  if it is anything else, that is the torn record.

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
  throw new Error('TODO');
}

export async function appendOp(file, op) {
  throw new Error('TODO');
}

export async function replayLog(file) {
  throw new Error('TODO');
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
