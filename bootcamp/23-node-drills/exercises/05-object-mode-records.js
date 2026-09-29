// ─────────────────────────────────────────────────────────────────────────
//  05 · a record stream, in objectMode                      ★★★ stretch
//  concepts: Transform · objectMode · leftover buffering · flush
//  run: node 05-object-mode-records.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Module 12 had you split bytes into line strings. This is the version
//  you actually ship: bytes in, parsed records out.
//
//  Build `parseRecords()` — a Transform whose writable side takes text
//  chunks and whose readable side emits objects:
//
//      'ada=7\nbo=12\n'  →  { index: 0, name: 'ada', score: 7 }
//                           { index: 1, name: 'bo',  score: 12 }
//
//  The rules:
//    · a record is one line, `name=score`; score comes out a Number
//    · spaces around the name or the score are not part of them
//    · blank lines are skipped, and do not consume an index
//    · `index` counts emitted records, from 0, across the whole stream
//    · '\n' and '\r\n' both end a line, wherever the chunk boundary falls
//    · a final line with no newline after it is still a record
//    · a line with no '=' fails the stream: `bad record: <line>`

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Provided: feed these chunks through YOUR parseRecords() and collect
// the records it emits.
async function recordsFrom(chunks) {
  const records = [];
  await pipeline(Readable.from(chunks), parseRecords(), async function collect(out) {
    for await (const record of out) records.push(record);
  });
  return records;
}

export function parseRecords() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('parseRecords is a Transform that emits objects, not bytes', async () => {
  ok(parseRecords() instanceof Transform);
  const records = await recordsFrom(['ada=7\n']);
  eq(records, [{ index: 0, name: 'ada', score: 7 }]);
});

test('parses several lines out of one chunk, numbering them', async () => {
  eq(await recordsFrom(['ada=7\nbo=12\ncy=3\n']), [
    { index: 0, name: 'ada', score: 7 },
    { index: 1, name: 'bo', score: 12 },
    { index: 2, name: 'cy', score: 3 },
  ]);
});

test('does not care where the chunk boundaries fall', async () => {
  eq(await recordsFrom(['ad', 'a=7\nb', 'o=1', '2\n']), [
    { index: 0, name: 'ada', score: 7 },
    { index: 1, name: 'bo', score: 12 },
  ]);
});

test('flush emits the final line even without a trailing newline', async () => {
  eq(await recordsFrom(['ada=7\nbo=12']), [
    { index: 0, name: 'ada', score: 7 },
    { index: 1, name: 'bo', score: 12 },
  ]);
  eq(await recordsFrom([]), []);
  eq(await recordsFrom(['solo=1']), [{ index: 0, name: 'solo', score: 1 }]);
});

test('blank lines are skipped and do not consume an index', async () => {
  eq(await recordsFrom(['ada=7\n\n\nbo=12\n']), [
    { index: 0, name: 'ada', score: 7 },
    { index: 1, name: 'bo', score: 12 },
  ]);
});

test('surrounding whitespace is not part of the data', async () => {
  eq(await recordsFrom(['  ada  =  7  \n']), [
    { index: 0, name: 'ada', score: 7 },
  ]);
});

test('handles \\r\\n, including a chunk boundary between the two', async () => {
  eq(await recordsFrom(['ada=7\r\nbo=12\r\n']), [
    { index: 0, name: 'ada', score: 7 },
    { index: 1, name: 'bo', score: 12 },
  ]);
  eq(await recordsFrom(['ada=7\r', '\nbo=12']), [
    { index: 0, name: 'ada', score: 7 },
    { index: 1, name: 'bo', score: 12 },
  ]);
});

test('a line that is not a record fails the stream', async () => {
  await rejects(() => recordsFrom(['ada=7\nnonsense\n']), 'bad record: nonsense');
  await rejects(() => recordsFrom(['ada=7\nnonsense']), 'bad record: nonsense');
});
