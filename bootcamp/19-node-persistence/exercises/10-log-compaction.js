// ─────────────────────────────────────────────────────────────────────────
//  10 · snapshot + compaction                               ★★★ stretch
//  concepts: snapshots · log truncation · startup cost
//  run: node 10-log-compaction.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A write-ahead log never stops growing. Ten million appends later,
//  startup means replaying ten million operations to learn that `hits`
//  is 10000000. The fix is compaction: write the CURRENT state to a
//  snapshot, then truncate the log to nothing. Same state, empty log.
//
//      state = snapshot  +  replay(everything since the snapshot)
//
//  The store lives in two files:
//      <name>.snapshot.json   the state as of the last compaction
//      <name>.log             ops appended since then
//
//  Build two things:
//    · loadState(dir, name)   snapshot (or {}) with the log replayed on
//                             top of it
//    · compact(dir, name)     atomically write the current state to the
//                             snapshot, then empty the log — and return
//                             the state it snapshotted
//
//  Order matters. Snapshot first, truncate second: if you crash between
//  them you replay a few ops twice, which is harmless because set and
//  delete are idempotent. Truncate first and a crash loses them forever.
//
//  hint: `fs.writeFile(log, '')` empties the log (and creates it if it
//  was never there). appendOp, applyOp, readOrNull and writeFileAtomic
//  are all provided below.

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
  throw new Error('TODO');
}

export async function compact(dir, name) {
  throw new Error('TODO');
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
