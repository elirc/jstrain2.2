// ─────────────────────────────────────────────────────────────────────────
//  06 · streaming a big log file — SOLUTION                    ★★☆ core
//  run: node 06-jsonl-stream.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `readline` already solves the hard part — chunks from a
//  file land mid-line, and it buffers the leftovers for you. Wrapping it
//  in an async generator turns "events and callbacks" into a plain
//  `for await` loop, and memory use becomes one line instead of one file.
//  Two details make it production-grade. `crlfDelay: Infinity` stops a
//  '\r\n' split across chunks from being read as two line breaks. The
//  `finally` matters more than it looks: when a caller `break`s out of
//  the loop, the generator is closed at that point, `finally` runs, and
//  the file handle is released. Without it, early exit leaks handles —
//  invisible on a laptop, fatal in a long-running server.
//  findFirst returns from inside the loop, which is exactly that early
//  exit: on a 4 GB file it reads only as far as the answer.

import { test, eq, spy } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
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

// Provided: write records to a .jsonl file.
async function writeLog(file, records) {
  await fs.writeFile(file, records.map((r) => `${JSON.stringify(r)}\n`).join(''), 'utf8');
}

export async function* streamRecords(file) {
  const stream = createReadStream(file, 'utf8');
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  try {
    for await (const line of rl) {
      if (line.trim() === '') continue;
      yield JSON.parse(line);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  } finally {
    rl.close();
    stream.destroy();
  }
}

export async function countWhere(file, predicate) {
  let n = 0;
  for await (const record of streamRecords(file)) {
    if (predicate(record)) n += 1;
  }
  return n;
}

export async function findFirst(file, predicate) {
  for await (const record of streamRecords(file)) {
    if (predicate(record)) return record;
  }
  return undefined;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('yields every record, in file order', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'events.jsonl');
    await writeLog(file, [{ id: 1 }, { id: 2 }, { id: 3 }]);
    const seen = [];
    for await (const rec of streamRecords(file)) seen.push(rec);
    eq(seen, [{ id: 1 }, { id: 2 }, { id: 3 }]);
  });
});

test('skips blank lines and tolerates a missing final newline', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'events.jsonl');
    await fs.writeFile(file, '{"id":1}\n\n{"id":2}', 'utf8');
    const seen = [];
    for await (const rec of streamRecords(file)) seen.push(rec);
    eq(seen, [{ id: 1 }, { id: 2 }]);
  });
});

test('countWhere counts the matching records', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'events.jsonl');
    await writeLog(file, [
      { level: 'info' },
      { level: 'error' },
      { level: 'error' },
      { level: 'warn' },
    ]);
    eq(await countWhere(file, (r) => r.level === 'error'), 2);
    eq(await countWhere(file, () => false), 0);
  });
});

test('handles a log far bigger than the number of lines you can eyeball', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'big.jsonl');
    await writeLog(
      file,
      Array.from({ length: 2000 }, (_, i) => ({ id: i, even: i % 2 === 0 }))
    );
    eq(await countWhere(file, (r) => r.even), 1000);
  });
});

test('findFirst returns the first matching record', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'events.jsonl');
    await writeLog(file, [{ id: 1 }, { id: 2 }, { id: 3 }]);
    eq(await findFirst(file, (r) => r.id > 1), { id: 2 });
  });
});

test('findFirst stops reading as soon as it matches', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'events.jsonl');
    await writeLog(file, Array.from({ length: 50 }, (_, i) => ({ id: i })));
    const pred = spy((r) => r.id === 1);
    eq(await findFirst(file, pred), { id: 1 });
    eq(pred.callCount, 2, 'it must not look at records after the match');
  });
});

test('findFirst returns undefined when nothing matches', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'events.jsonl');
    await writeLog(file, [{ id: 1 }]);
    eq(await findFirst(file, () => false), undefined);
  });
});

test('a missing file streams as nothing at all', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'nope.jsonl');
    eq(await countWhere(file, () => true), 0);
  });
});
