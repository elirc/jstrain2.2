// ─────────────────────────────────────────────────────────────────────────
//  06 · streaming a big log file                               ★★☆ core
//  concepts: readline · async generators · early exit · cleanup
//  run: node 06-jsonl-stream.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `readFile` on a 4 GB log asks Node for a 4 GB string and dies. The fix
//  is to never hold more than one line at a time: a read stream feeding
//  `node:readline`, wrapped in an async generator so callers can just
//  `for await` over records.
//
//      for await (const rec of streamRecords(file)) { ... }
//
//  Build three things:
//    · streamRecords(file)          async generator, one parsed record at
//                                   a time, blank lines skipped
//    · countWhere(file, predicate)  how many records match
//    · findFirst(file, predicate)   the first match — and STOP reading
//
//  findFirst must not test every record when it finds one early; that is
//  the whole point of streaming. A file that does not exist streams as
//  nothing at all, the same way exercise 05 read it as [].
//
//  hint: createInterface({ input: createReadStream(file), crlfDelay:
//  Infinity }) is async-iterable. Close it in a `finally` so an early
//  `break` cannot leave a file handle open.

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
  throw new Error('TODO');
}

export async function countWhere(file, predicate) {
  throw new Error('TODO');
}

export async function findFirst(file, predicate) {
  throw new Error('TODO');
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
