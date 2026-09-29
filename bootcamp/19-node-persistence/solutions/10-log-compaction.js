// ─────────────────────────────────────────────────────────────────────────
//  10 · snapshot + compaction — SOLUTION                     ★★★ stretch
//  run: node 10-log-compaction.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: state = snapshot + replay(log since the snapshot).
//  loadState reads the snapshot for the bulk of the state and replays only
//  what has happened since, so startup cost is bounded by how often you
//  compact, not by how long the store has been alive.
//  compact() is three steps in a deliberate order: compute the current
//  state, write the snapshot ATOMICALLY, then empty the log. Crash after
//  the snapshot but before the truncate and you simply replay a handful of
//  ops onto a snapshot that already contains them — set and delete are
//  idempotent, so the result is identical. Do it the other way round and
//  that same crash silently deletes those ops.
//  The snapshot must be atomic for the same reason: a half-written
//  snapshot next to an emptied log is a store with no state at all.
//  This is Redis (RDB snapshot + AOF log) and SQLite (WAL checkpoint) in
//  miniature. The names differ; the trade is always the same — appends are
//  cheap, replay is not, so fold the log into a snapshot now and then.

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

// Provided: the file layout and the WAL pieces from exercise 09.
export const snapshotPath = (dir, name) => path.join(dir, `${name}.snapshot.json`);
export const logPath = (dir, name) => path.join(dir, `${name}.log`);

export function applyOp(state, op) {
  if (op.op === 'set') state[op.key] = op.value;
  else if (op.op === 'delete') delete state[op.key];
  else throw new Error(`unknown log op: ${op.op}`);
  return state;
}

export async function appendOp(dir, name, op) {
  await fs.appendFile(logPath(dir, name), `${JSON.stringify(op)}\n`, 'utf8');
}

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

// Provided: read a whole file, or null when it is not there.
async function readOrNull(file) {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function loadState(dir, name) {
  const snapshot = await readOrNull(snapshotPath(dir, name));
  const state = snapshot === null ? {} : JSON.parse(snapshot);

  const log = await readOrNull(logPath(dir, name));
  if (log === null) return state;

  const lines = log.split('\n');
  lines.pop(); // '' after a clean append, or a torn record after a crash
  for (const line of lines) {
    if (line.trim() === '') continue;
    let op;
    try {
      op = JSON.parse(line);
    } catch {
      break;
    }
    applyOp(state, op);
  }
  return state;
}

export async function compact(dir, name) {
  const state = await loadState(dir, name);
  // 1. snapshot first, atomically…
  await writeFileAtomic(
    snapshotPath(dir, name),
    `${JSON.stringify(state, null, 2)}\n`
  );
  // 2. …only then throw the log away.
  await fs.writeFile(logPath(dir, name), '');
  return state;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('an empty store loads as empty state', async () => {
  await withTempDir(async (dir) => {
    eq(await loadState(dir, 'kv'), {});
  });
});

test('loadState replays the log when there is no snapshot yet', async () => {
  await withTempDir(async (dir) => {
    await appendOp(dir, 'kv', { op: 'set', key: 'a', value: 1 });
    await appendOp(dir, 'kv', { op: 'set', key: 'b', value: 2 });
    await appendOp(dir, 'kv', { op: 'delete', key: 'a' });
    eq(await loadState(dir, 'kv'), { b: 2 });
  });
});

test('compaction preserves the state exactly', async () => {
  await withTempDir(async (dir) => {
    await appendOp(dir, 'kv', { op: 'set', key: 'theme', value: 'dark' });
    await appendOp(dir, 'kv', { op: 'set', key: 'font', value: 14 });
    const before = await loadState(dir, 'kv');
    eq(await compact(dir, 'kv'), before);
    eq(await loadState(dir, 'kv'), before);
  });
});

test('compaction empties the log and fills the snapshot', async () => {
  await withTempDir(async (dir) => {
    await appendOp(dir, 'kv', { op: 'set', key: 'a', value: 1 });
    await compact(dir, 'kv');
    eq((await fs.stat(logPath(dir, 'kv'))).size, 0);
    eq(JSON.parse(await fs.readFile(snapshotPath(dir, 'kv'), 'utf8')), { a: 1 });
  });
});

test('ops after a compaction land on top of the snapshot', async () => {
  await withTempDir(async (dir) => {
    await appendOp(dir, 'kv', { op: 'set', key: 'a', value: 1 });
    await compact(dir, 'kv');
    await appendOp(dir, 'kv', { op: 'set', key: 'b', value: 2 });
    await appendOp(dir, 'kv', { op: 'delete', key: 'a' });
    eq(await loadState(dir, 'kv'), { b: 2 });
  });
});

test('compacting twice is safe and keeps the log empty', async () => {
  await withTempDir(async (dir) => {
    await appendOp(dir, 'kv', { op: 'set', key: 'a', value: 1 });
    await compact(dir, 'kv');
    await compact(dir, 'kv');
    eq(await loadState(dir, 'kv'), { a: 1 });
    eq((await fs.stat(logPath(dir, 'kv'))).size, 0);
  });
});

test('a compacted store starts up with one line instead of many', async () => {
  await withTempDir(async (dir) => {
    // the same bytes 50 appendOp calls would leave behind, written in one
    // go — 50 round trips to a busy disk is the test being slow, not the
    // code being tested.
    const ops = Array.from({ length: 50 }, (_, i) =>
      JSON.stringify({ op: 'set', key: 'hits', value: i })
    );
    await fs.appendFile(logPath(dir, 'kv'), `${ops.join('\n')}\n`, 'utf8');
    const raw = await readOrNull(logPath(dir, 'kv'));
    ok(raw.split('\n').length > 50, 'the log really is long before compaction');
    await compact(dir, 'kv');
    eq(await loadState(dir, 'kv'), { hits: 49 });
    eq(await readOrNull(logPath(dir, 'kv')), '');
  });
});

test('the snapshot is written atomically — no temp files survive', async () => {
  await withTempDir(async (dir) => {
    await appendOp(dir, 'kv', { op: 'set', key: 'a', value: 1 });
    await compact(dir, 'kv');
    eq((await fs.readdir(dir)).sort(), ['kv.log', 'kv.snapshot.json']);
  });
});
