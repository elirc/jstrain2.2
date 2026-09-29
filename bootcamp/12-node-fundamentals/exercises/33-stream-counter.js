// ─────────────────────────────────────────────────────────────────────────
//  33 · a counting Transform                                    ★★☆ core
//  concepts: Transform · pass-through · flush · bytes vs characters
//  run: node 33-stream-counter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Not every stage in a pipeline changes the data. A meter passes the
//  bytes through untouched and keeps a tally on the side — that is how
//  progress bars, upload limits and `wc` work.
//
//      const meter = countingStream();
//      await pipeline(input, meter, output);
//      meter.counts     → { bytes: 42, lines: 3 }
//
//  `bytes` is a count of BYTES, not characters — a chunk holding '👋'
//  adds 4. `lines` counts newline-terminated lines plus one final line if
//  the data ends without a newline, so 'a\nb' is 2 lines and 'a\nb\n' is
//  also 2. The data coming out must be byte-for-byte what went in.
//
//  hint: `callback(null, chunk)` both counts and forwards in one step.
//  The last line has to be decided after the source is done — that is
//  what flush() is for. Chunk boundaries land anywhere, so never look at
//  a chunk in isolation to decide whether the STREAM ended on a newline.

import { test, eq, ok } from '../../_lib/check.js';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Provided: push these chunks through YOUR stream and hand back
// everything that came out the other side, as one Buffer.
async function runThrough(chunks, stream) {
  const out = [];
  await pipeline(Readable.from(chunks), stream, async function collect(source) {
    for await (const chunk of source) out.push(Buffer.from(chunk));
  });
  return Buffer.concat(out);
}

export function countingStream() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('it is a Transform that changes nothing', async () => {
  const meter = countingStream();
  ok(meter instanceof Transform);
  const out = await runThrough(['alpha\n', 'beta\n'], meter);
  eq(out.toString('utf8'), 'alpha\nbeta\n');
});

test('counts bytes, not characters', async () => {
  const meter = countingStream();
  await runThrough(['👋'], meter); // 2 characters, 4 bytes
  eq(meter.counts.bytes, 4);
});

test('counts newline-terminated lines', async () => {
  const meter = countingStream();
  await runThrough(['a\nb\nc\n'], meter);
  eq(meter.counts, { bytes: 6, lines: 3 });
});

test('counts a final line with no trailing newline', async () => {
  const meter = countingStream();
  await runThrough(['a\nb'], meter);
  eq(meter.counts, { bytes: 3, lines: 2 });
});

test('an empty stream counts zero of everything', async () => {
  const meter = countingStream();
  eq((await runThrough([], meter)).length, 0);
  eq(meter.counts, { bytes: 0, lines: 0 });
});

test('chunk boundaries do not change the answer', async () => {
  const meter = countingStream();
  const out = await runThrough(['al', 'pha\n', '\n', 'beta'], meter);
  eq(out.toString('utf8'), 'alpha\n\nbeta');
  eq(meter.counts, { bytes: 11, lines: 3 });
});

test('a character split across two chunks stays intact', async () => {
  const meter = countingStream();
  const bytes = Buffer.from('héllo 👋\n', 'utf8');
  const out = await runThrough([bytes.subarray(0, 9), bytes.subarray(9)], meter);
  eq(out.toString('utf8'), 'héllo 👋\n');
  eq(meter.counts, { bytes: Buffer.byteLength('héllo 👋\n'), lines: 1 });
});
