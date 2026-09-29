// ─────────────────────────────────────────────────────────────────────────
//  05 · a record stream, in objectMode — SOLUTION            ★★★ stretch
//  run: node 05-object-mode-records.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `readableObjectMode: true` with the writable side left in
//  byte mode is the shape you want for a parser — it takes whatever the
//  filesystem or socket hands it and emits one whole thing at a time.
//  Turning on full `objectMode` instead would make the WRITABLE side
//  object mode too, and then a 64 KB read is one "object" and your
//  high-water mark stops meaning anything.
//  Two pieces of state survive between chunks, and both are the point.
//  `leftover` holds the tail that has not been terminated yet: append the
//  chunk, split, and pop the last piece back into it. Because '\r' stays
//  in leftover until the next bytes arrive, a boundary between '\r' and
//  '\n' costs nothing. `index` survives too, which is why a stateless
//  per-chunk implementation cannot produce this output at all.
//  flush() is the only place the final unterminated line can be emitted —
//  and skipping it silently drops the last record of every file that does
//  not end in a newline. That bug ships constantly.
//  Note that blank lines are dropped BEFORE the index is spent, so index
//  numbers records, not lines. Deciding which one you mean is the sort of
//  detail that later shows up as an off-by-one in an error message
//  pointing at the wrong row.
//  Wrong turn: `chunk.toString()` per chunk without the leftover, which
//  works on every test file you own — because they all fit in one chunk —
//  and then splits a record in half the first time a real file arrives.

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
  let leftover = '';
  let index = 0;

  const emit = (stream, line) => {
    if (line.trim() === '') return null; // blank lines spend no index
    const at = line.indexOf('=');
    if (at === -1) return new Error(`bad record: ${line.trim()}`);
    stream.push({
      index: index++,
      name: line.slice(0, at).trim(),
      score: Number(line.slice(at + 1).trim()),
    });
    return null;
  };

  return new Transform({
    readableObjectMode: true, // objects out, bytes in

    transform(chunk, encoding, callback) {
      leftover += chunk.toString('utf8');
      const pieces = leftover.split(/\r?\n/);
      leftover = pieces.pop(); // '' or the half-arrived tail
      for (const line of pieces) {
        const err = emit(this, line);
        if (err) return callback(err);
      }
      callback();
    },

    flush(callback) {
      const err = emit(this, leftover);
      callback(err);
    },
  });
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
